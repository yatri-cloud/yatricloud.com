/**
 * Yatri Cloud Auth — modern auth core on Supabase Auth.
 *
 * Design goals (vs the legacy sheet-token system):
 *  - Real JWT access+refresh tokens, auto-refreshed by supabase-js (no 30-day
 *    token strings stored in a spreadsheet).
 *  - Profile data lives in `public.profiles` (auto-created by DB trigger on
 *    signup) and is protected by RLS: users read/update only their own row.
 *  - Google sign-in via ID-token exchange (works with the existing
 *    @react-oauth/google flow; enable the Google provider + client ID in
 *    Supabase Dashboard → Auth → Providers).
 *  - A synchronous in-memory/localStorage mirror of the signed-in profile so
 *    legacy synchronous call-sites (isAuthenticated/getStoredUser) keep
 *    working without a refactor of 13 consumer files.
 */

import { supabase } from "@/lib/supabase";

/** Legacy-compatible user shape used across the app. */
export interface YatriUser {
  id?: string;
  email: string;
  fullName: string;
  linkedinUrl?: string;
  photoUrl?: string;
  country?: string;
  stateProvince?: string;
  city?: string;
  countryCode?: string;
  phoneNumber?: string;
  role?: "yatri" | "trainer" | "admin";
}

const MIRROR_KEY = "yatri:user";

// ---------- synchronous mirror ----------
let currentUser: YatriUser | null = (() => {
  try { return JSON.parse(localStorage.getItem(MIRROR_KEY) || "null"); }
  catch { return null; }
})();

function setMirror(user: YatriUser | null) {
  currentUser = user;
  try {
    if (user) localStorage.setItem(MIRROR_KEY, JSON.stringify(user));
    else localStorage.removeItem(MIRROR_KEY);
  } catch { /* storage unavailable — in-memory only */ }
}

/** Synchronous: last-known signed-in user (kept fresh by onAuthStateChange). */
export function getCachedUser(): YatriUser | null {
  return currentUser;
}

/** Synchronous: is there a live session (per the mirror)? */
export function hasSession(): boolean {
  return currentUser !== null;
}

// ---------- profile helpers ----------
function rowToUser(row: Record<string, unknown>): YatriUser {
  return {
    id: row.id as string,
    email: (row.email as string) || "",
    fullName: (row.full_name as string) || "",
    linkedinUrl: (row.linkedin_url as string) || undefined,
    photoUrl: (row.photo_url as string) || undefined,
    country: (row.country as string) || undefined,
    stateProvince: (row.state_province as string) || undefined,
    city: (row.city as string) || undefined,
    countryCode: (row.country_code as string) || undefined,
    phoneNumber: (row.phone_number as string) || undefined,
    role: (row.role as YatriUser["role"]) || "yatri",
  };
}

/** Fetch my profile row (RLS: own row only). Refreshes the mirror. */
export async function fetchMyProfile(): Promise<YatriUser | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { setMirror(null); return null; }
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (error || !data) return currentUser; // keep last-known on transient errors
  const u = rowToUser(data);
  setMirror(u);
  return u;
}

// ---------- auth actions ----------
export async function signUpWithPassword(input: {
  email: string; password: string; fullName: string;
  linkedinUrl?: string; country?: string; stateProvince?: string; city?: string;
  countryCode?: string; phoneNumber?: string; photoUrl?: string;
}): Promise<{ user: YatriUser | null; error: string | null; needsEmailConfirm?: boolean }> {
  const email = input.email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: { data: { full_name: input.fullName } },
  });
  if (error) return { user: null, error: friendly(error.message) };

  // If email confirmation is enabled there is no session yet.
  if (!data.session) return { user: null, error: null, needsEmailConfirm: true };

  // Profile row was auto-created by the DB trigger; enrich it.
  await supabase.from("profiles").update({
    full_name: input.fullName,
    linkedin_url: input.linkedinUrl ?? null,
    country: input.country ?? null,
    state_province: input.stateProvince ?? null,
    city: input.city ?? null,
    country_code: input.countryCode ?? null,
    phone_number: input.phoneNumber ?? null,
    photo_url: input.photoUrl ?? null,
  }).eq("id", data.user!.id);

  const user = await fetchMyProfile();
  return { user, error: null };
}

export async function signInWithPassword(email: string, password: string):
  Promise<{ user: YatriUser | null; error: string | null }> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) return { user: null, error: friendly(error.message) };
  const user = await fetchMyProfile();
  return { user, error: null };
}

/**
 * Google sign-in using an ID token from @react-oauth/google.
 * Requires: Supabase Dashboard → Auth → Providers → Google → add the same
 * client ID used by VITE_GOOGLE_CLIENT_ID.
 */
export async function signInWithGoogleIdToken(idToken: string):
  Promise<{ user: YatriUser | null; error: string | null }> {
  const { error } = await supabase.auth.signInWithIdToken({ provider: "google", token: idToken });
  if (error) return { user: null, error: friendly(error.message) };
  const user = await fetchMyProfile();
  return { user, error: null };
}

export async function signOut(): Promise<void> {
  setMirror(null);
  await supabase.auth.signOut();
}

export async function sendPasswordReset(email: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { error: error ? friendly(error.message) : null };
}

export async function changePassword(newPassword: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { error: error ? friendly(error.message) : null };
}

/** Sends confirmation links to both addresses (secure email change). */
export async function changeEmail(newEmail: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.updateUser({ email: newEmail.trim().toLowerCase() });
  return { error: error ? friendly(error.message) : null };
}

export async function updateMyProfile(fields: Partial<Omit<YatriUser, "id" | "email" | "role">>):
  Promise<{ user: YatriUser | null; error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, error: "Not signed in" };
  const { error } = await supabase.from("profiles").update({
    ...(fields.fullName !== undefined && { full_name: fields.fullName }),
    ...(fields.linkedinUrl !== undefined && { linkedin_url: fields.linkedinUrl }),
    ...(fields.photoUrl !== undefined && { photo_url: fields.photoUrl }),
    ...(fields.country !== undefined && { country: fields.country }),
    ...(fields.stateProvince !== undefined && { state_province: fields.stateProvince }),
    ...(fields.city !== undefined && { city: fields.city }),
    ...(fields.countryCode !== undefined && { country_code: fields.countryCode }),
    ...(fields.phoneNumber !== undefined && { phone_number: fields.phoneNumber }),
  }).eq("id", user.id);
  if (error) return { user: currentUser, error: friendly(error.message) };
  const fresh = await fetchMyProfile();
  return { user: fresh, error: null };
}

// ---------- session lifecycle ----------
/** Human error messages (never leak internals). */
function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Incorrect email or password. If you had an account before our upgrade, use “Forgot password” to set a new one.";
  if (m.includes("already registered")) return "This email already has an account — try signing in instead.";
  if (m.includes("rate limit")) return "Too many attempts — please wait a minute and try again.";
  return message;
}

// Keep the mirror in sync with real session state (login/logout/refresh/expiry)
supabase.auth.onAuthStateChange((event, session) => {
  if (event === "PASSWORD_RECOVERY") {
    // The user clicked a reset link in their email. Supabase may land them on
    // any whitelisted page (often the site root), so always take them to the
    // set new password screen.
    if (!window.location.pathname.startsWith("/reset-password")) {
      window.location.replace("/reset-password");
    }
    return;
  }
  if (event === "SIGNED_OUT" || !session) {
    setMirror(null);
  } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
    // fire-and-forget profile refresh; mirror updates when it lands
    void fetchMyProfile();
  }
});
