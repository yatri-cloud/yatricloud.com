/**
 * Yatris Users API — now backed by Supabase Auth + RLS-protected `profiles`
 * and `certifications` tables. Legacy function signatures are preserved so
 * all 13 consumer files keep working; the internals are fully modern:
 *  - real JWT sessions with auto-refresh (no tokens in spreadsheets)
 *  - no hardcoded test-credential backdoor (removed for security)
 *  - single-query certification lookups (no localStorage cache gymnastics)
 */

import {
  signUpWithPassword, signInWithPassword, signInWithGoogleIdToken,
  signOut, hasSession, getCachedUser, fetchMyProfile, updateMyProfile,
  changePassword as authChangePassword, changeEmail as authChangeEmail,
  type YatriUser,
} from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const API_URL_EVENTS = '/api/yatris/events';

/** Display provider name → DB enum. */
const PROVIDER_TO_ENUM: Record<string, string> = {
  AWS: 'AWS', Azure: 'AZURE', GCP: 'GCP', GitHub: 'GITHUB', Oracle: 'ORACLE',
  Salesforce: 'SALESFORCE', ServiceNow: 'SERVICENOW', OpenAI: 'OPENAI',
  HashiCorp: 'HASHICORP', Kubernetes: 'KUBERNETES',
};
const ENUM_TO_PROVIDER: Record<string, string> = Object.fromEntries(
  Object.entries(PROVIDER_TO_ENUM).map(([k, v]) => [v, k])
);

interface User {
  email: string;
  fullName: string;
  linkedinUrl?: string;
  photoUrl?: string;
  country?: string;
  stateProvince?: string;
  city?: string;
  countryCode?: string;
  phoneNumber?: string;
}

interface LoginResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
  message?: string;
}

interface RegisterResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
  message?: string;
}

/**
 * Register a new user
 */
export async function registerUser(data: {
  email: string;
  password: string;
  fullName: string;
  linkedinUrl?: string;
  photoUrl?: string;
  country?: string;
  stateProvince?: string;
  city?: string;
  countryCode?: string;
  phoneNumber?: string;
}): Promise<RegisterResponse> {
  const { user, error, needsEmailConfirm } = await signUpWithPassword(data);
  if (error) return { success: false, error };
  if (needsEmailConfirm) {
    return {
      success: true,
      message: 'Check your inbox to confirm your email, then sign in.',
    };
  }
  return { success: true, token: 'supabase-session', user: user ?? undefined };
}

/**
 * Login user
 */
export async function loginUser(
  email: string,
  password: string
): Promise<LoginResponse> {
  const { user, error } = await signInWithPassword(email, password);
  if (error) return { success: false, error };
  return { success: true, token: 'supabase-session', user: user ?? undefined };
}

/**
 * Login or Register with Google
 */
export async function googleLogin(userProfile: {
  email: string;
  fullName: string;
  photoUrl: string;
  /** Raw Google ID token (JWT credential) — required for secure verification. */
  idToken?: string;
}): Promise<LoginResponse> {
  if (!userProfile.idToken) {
    return {
      success: false,
      error: 'Google sign-in needs a fresh credential — please try again.',
    };
  }
  const { user, error } = await signInWithGoogleIdToken(userProfile.idToken);
  if (error) return { success: false, error };
  // Enrich profile with Google data on first login (photo/name may be empty)
  if (user && (!user.photoUrl || !user.fullName)) {
    await updateMyProfile({
      fullName: user.fullName || userProfile.fullName,
      photoUrl: user.photoUrl || userProfile.photoUrl,
    });
  }
  return { success: true, token: 'supabase-session', user: (await fetchMyProfile()) ?? undefined };
}

/**
 * Get current user from token
 */
export async function getCurrentUser(): Promise<User | null> {
  return await fetchMyProfile();
}

/**
 * Get user certifications from all provider sheets
 * Fetches from separate provider sheets (AWS, Azure, GCP, etc.) and filters by user email
 * Uses caching for immediate loading
 */
export async function getUserCertifications(): Promise<any[]> {
  // One indexed query replaces 10+ webhook fetches + localStorage caching.
  const user = getCachedUser();
  if (!user?.email) return [];
  const { data, error } = await supabase
    .from('certifications')
    .select('*')
    .eq('email', user.email.toLowerCase())
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Get user certifications error:', error.message);
    return [];
  }
  return (data || []).map((c) => ({
    id: c.id,
    fullName: c.full_name,
    email: c.email,
    certificationProvider: ENUM_TO_PROVIDER[c.provider] ?? c.provider,
    certificationName: c.certification_name,
    examCode: c.exam_code || '',
    certificationDate: c.certification_date || '',
    linkedinUrl: c.linkedin_url || '',
    verifiedCredential: c.verified_credential_url || '',
    country: c.country || '',
    stateProvince: c.state_province || '',
    city: c.city || '',
    countryCode: c.country_code || '',
    phoneNumber: c.phone_number || '',
    photoUrl: c.photo_url || '',
    additionalNotes: c.additional_notes || '',
  }));
}

/**
 * Submit certification
 */
export async function submitCertification(data: {
  certificationProvider: string;
  certificationName: string;
  examCode: string;
  certificationDate: string;
  verifiedCredential?: string;
  additionalNotes?: string;
}): Promise<{ success: boolean; error?: string; message?: string }> {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const profile = getCachedUser();
  if (!authUser || !profile) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase.from('certifications').insert({
    user_id: authUser.id,
    email: profile.email.toLowerCase(),
    full_name: profile.fullName,
    provider: PROVIDER_TO_ENUM[data.certificationProvider] ?? 'OTHER',
    certification_name: data.certificationName,
    exam_code: data.examCode || null,
    certification_date: data.certificationDate || null,
    verified_credential_url: data.verifiedCredential || null,
    additional_notes: data.additionalNotes || null,
    linkedin_url: profile.linkedinUrl || null,
    photo_url: profile.photoUrl || null,
    country: profile.country || null,
    state_province: profile.stateProvince || null,
    city: profile.city || null,
    country_code: profile.countryCode || null,
    phone_number: profile.phoneNumber || null,
  });
  if (error) {
    console.error('Submit certification error:', error.message);
    return { success: false, error: 'Submission failed — please try again.' };
  }
  return { success: true, message: 'Certification submitted!' };
}

/**
 * Update user profile
 */
export async function updateProfile(data: {
  fullName?: string;
  linkedinUrl?: string;
  photoUrl?: string;
  country?: string;
  stateProvince?: string;
  city?: string;
  countryCode?: string;
  phoneNumber?: string;
}): Promise<{ success: boolean; error?: string; message?: string }> {
  const { error } = await updateMyProfile(data);
  if (error) return { success: false, error };
  return { success: true, message: 'Profile updated!' };
}

/**
 * Logout user
 */
export function logout(): void {
  // Clear legacy keys too so pre-migration sessions can't linger
  localStorage.removeItem('yatris_token');
  localStorage.removeItem('yatris_user');
  void signOut();
}

/**
 * Check if user is authenticated (live Supabase session mirror)
 */
export function isAuthenticated(): boolean {
  return hasSession();
}

/**
 * Update certification
 */
export async function updateCertification(
  certificationId: number | string,
  data: {
    certificationProvider?: string;
    certificationName?: string;
    examCode?: string;
    certificationDate?: string;
    verifiedCredential?: string;
    additionalNotes?: string;
  }
): Promise<{ success: boolean; error?: string; message?: string }> {
  if (!hasSession()) return { success: false, error: 'Not authenticated' };
  const patch: Record<string, unknown> = {};
  if (data.certificationProvider !== undefined) patch.provider = PROVIDER_TO_ENUM[data.certificationProvider] ?? 'OTHER';
  if (data.certificationName !== undefined) patch.certification_name = data.certificationName;
  if (data.examCode !== undefined) patch.exam_code = data.examCode || null;
  if (data.certificationDate !== undefined) patch.certification_date = data.certificationDate || null;
  if (data.verifiedCredential !== undefined) patch.verified_credential_url = data.verifiedCredential || null;
  if (data.additionalNotes !== undefined) patch.additional_notes = data.additionalNotes || null;

  // RLS guarantees users can only update their own rows.
  const { error } = await supabase.from('certifications').update(patch).eq('id', String(certificationId));
  if (error) {
    console.error('Update certification error:', error.message);
    return { success: false, error: 'Update failed — please try again.' };
  }
  return { success: true, message: 'Certification updated!' };
}

/**
 * Delete certification
 */
export async function deleteCertification(
  certificationId: number | string
): Promise<{ success: boolean; error?: string; message?: string }> {
  if (!hasSession()) return { success: false, error: 'Not authenticated' };
  // RLS guarantees users can only delete their own rows.
  const { error } = await supabase.from('certifications').delete().eq('id', String(certificationId));
  if (error) {
    console.error('Delete certification error:', error.message);
    return { success: false, error: 'Delete failed — please try again.' };
  }
  return { success: true, message: 'Certification deleted.' };
}

/**
 * Change password
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  const user = getCachedUser();
  if (!user) return { success: false, error: 'Not authenticated' };
  // Re-authenticate first so a stolen open session can't silently change the password.
  const { error: reauthError } = await signInWithPassword(user.email, currentPassword);
  if (reauthError) return { success: false, error: 'Current password is incorrect.' };
  const { error } = await authChangePassword(newPassword);
  if (error) return { success: false, error };
  return { success: true, message: 'Password changed!' };
}

/**
 * Change email
 */
export async function changeEmail(
  currentPassword: string,
  newEmail: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  const user = getCachedUser();
  if (!user) return { success: false, error: 'Not authenticated' };
  const { error: reauthError } = await signInWithPassword(user.email, currentPassword);
  if (reauthError) return { success: false, error: 'Current password is incorrect.' };
  const { error } = await authChangeEmail(newEmail);
  if (error) return { success: false, error };
  return { success: true, message: 'Confirmation links sent to both email addresses.' };
}

/**
 * Get stored user
 */
export function getStoredUser(): User | null {
  return getCachedUser();
}

/**
 * Check if user profile has all mandatory fields filled
 * Google login users will have incomplete profiles (missing linkedin, country, phone, etc.)
 */
export function isProfileComplete(user: User | null): boolean {
  if (!user) return false;
  return !!(
    user.linkedinUrl &&
    user.country &&
    user.stateProvince &&
    user.city &&
    user.phoneNumber
  );
}

// Event Registration Types
export interface Attendee {
  name: string;
  email: string;
  phone?: string;
  ticketId: string;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  eventSlug?: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  eventImage: string;
  registrationDate: string;
  attendees: Attendee[];
  totalAmount: number;
  status: 'confirmed' | 'cancelled';
}

/**
 * Register for an event
 * Stores registration in localStorage for persistence
 */
export async function registerForEvent(
  event: { id: string; name: string; date: string; location: any; imageUrl: string },
  attendees: Omit<Attendee, 'ticketId'>[]
): Promise<{ success: boolean; message?: string; registrationId?: string }> {
  const user = getCachedUser();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!user || !authUser) {
    return { success: false, message: 'You must be logged in to register.' };
  }

  const code = () =>
    'EVT-' + Math.random().toString(36).slice(2, 6).toUpperCase() +
    Math.floor(1000 + Math.random() * 9000);

  const people = attendees.length
    ? attendees
    : [{ name: user.fullName, email: user.email, phone: user.phoneNumber }];

  const rows = people.map((a) => ({
    event_id: event.id,
    user_id: authUser.id,
    registration_code: code(),
    name: a.name || user.fullName,
    email: (a.email || user.email).toLowerCase(),
    phone: a.phone || user.phoneNumber || null,
    city: user.city || null,
    state: user.stateProvince || null,
    country: user.country || null,
    linkedin_url: user.linkedinUrl || null,
  }));

  const { data, error } = await supabase
    .from('event_registrations')
    .insert(rows)
    .select('registration_code');

  if (error) {
    const msg = error.message.includes('duplicate')
      ? "You're already registered for this event, Yatri!"
      : 'Registration failed — please try again.';
    console.error('Registration error:', error.message);
    return { success: false, message: msg };
  }
  return { success: true, registrationId: data?.[0]?.registration_code, message: 'Registered!' };
}

/**
 * Get registered events for current user
 */
export async function getRegisteredEvents(): Promise<EventRegistration[]> {
  if (!hasSession()) return [];
  const { data, error } = await supabase
    .from('event_registrations')
    .select('id,registration_code,name,email,phone,status,created_at,events(id,slug,name,event_date,location,city,country,image_url)')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching registrations:', error.message);
    return [];
  }
  return (data || []).map((r: any) => ({
    id: r.id,
    eventId: r.events?.id ?? '',
    eventSlug: r.events?.slug,
    eventName: r.events?.name ?? '',
    eventDate: r.events?.event_date ?? '',
    eventLocation: [r.events?.location, r.events?.city, r.events?.country].filter(Boolean).join(', '),
    eventImage: r.events?.image_url ?? '',
    registrationDate: r.created_at,
    attendees: [{ name: r.name, email: r.email, phone: r.phone || undefined, ticketId: r.registration_code }],
    totalAmount: 0,
    status: r.status === 'cancelled' ? 'cancelled' : 'confirmed',
  }));
}

/**
 * Fetch all published events from Google Sheets API
 */
export async function fetchPublishedEvents(): Promise<any[]> {
  // RLS exposes published + archived (past) events to everyone.
  const { data, error } = await supabase
    .from('events')
    .select('id,slug,name,description,event_date,location,city,country,capacity,ticket_type,price_inr,image_url,meet_link,status')
    .order('event_date', { ascending: false });
  if (error) {
    console.error('Error fetching published events:', error.message);
    return [];
  }
  return (data || []).map((e) => ({
    id: e.id,
    slug: e.slug,
    name: e.name,
    description: e.description || '',
    imageUrl: e.image_url || '',
    date: e.event_date || '',
    timezone: 'Asia/Kolkata',
    location: {
      type: e.meet_link && !e.location ? 'online' : 'offline',
      venue: e.location || undefined,
      city: e.city || undefined,
      country: e.country || undefined,
    },
    category: 'Community',
    price: Number(e.price_inr ?? 0),
    seatsAvailable: e.capacity ?? undefined,
    isPast: e.status === 'archived',
  }));
}
