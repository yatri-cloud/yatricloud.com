/**
 * Mentorship data layer — canonical types + Supabase fetchers.
 *
 * Follows the site-content.ts discipline: read-only catalog fetchers are
 * cached once per session (every consumer shares the in-flight promise),
 * while anything booking related is always fetched fresh. RLS is the
 * security boundary: these queries only ever see what the signed-in
 * session is allowed to see.
 */

import { supabase } from "@/lib/supabase";
import type { DateOverride } from "@/lib/mentorship-slots";
import { loadRazorpay } from "@/lib/third-party";

/* ------------------------------------------------------------------ */
/* Canonical types (other agents import these)                         */
/* ------------------------------------------------------------------ */

export type ContentStatus = "draft" | "published" | "archived" | "cancelled";

export interface Mentor {
  id: string;
  user_id: string | null;
  slug: string;
  name: string;
  headline: string;
  bio: string;
  photo_url: string | null;
  linkedin_url: string | null;
  expertise: string[];
  languages: string[];
  timezone: string;
  notice_hours: number;
  booking_window_days: number;
  buffer_min: number;
  avg_rating: number;
  review_count: number;
  is_featured: boolean;
  sort_order: number;
  status: ContentStatus;
  /** Razorpay Route linked account (acc_...) for commission payouts; null until connected. */
  razorpay_account_id?: string | null;
  /** Per mentor commission override percent; null uses the platform default. */
  commission_percent?: number | null;
  created_at: string;
  updated_at: string;
}

export type MentorshipServiceType = "call" | "package" | "digital" | "webinar";

export interface ServiceQuestion {
  label: string;
  required: boolean;
  type: "text";
}

export interface MentorshipService {
  id: string;
  mentor_id: string;
  slug: string;
  type: MentorshipServiceType;
  title: string;
  short_description: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  currency: string;
  duration_min: number | null;
  sessions_count: number;
  webinar_start_at: string | null;
  capacity: number | null;
  cta_label: string;
  badge: "Popular" | "Best Seller" | null;
  cover_url: string | null;
  questions: ServiceQuestion[];
  sort_order: number;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityRule {
  id: string;
  mentor_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  active: boolean;
  updated_at: string;
}

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "refunded";

export interface BookingAnswer {
  label: string;
  answer: string;
}

export interface MentorshipBooking {
  id: string;
  service_id: string;
  mentor_id: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  answers: BookingAnswer[];
  slot_start: string | null;
  slot_end: string | null;
  buyer_timezone: string;
  amount: number;
  currency: string;
  status: BookingStatus;
  order_id: string | null;
  payment_id: string | null;
  meeting_link: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MentorReview {
  id: string;
  mentor_id: string;
  service_id: string | null;
  booking_id: string | null;
  user_id: string | null;
  name: string;
  rating: number;
  review: string;
  is_public: boolean;
  created_at: string;
}

/** MyMentorshipBookings row: booking + embedded service and mentor. */
export interface MentorshipBookingWithRefs extends MentorshipBooking {
  service: Pick<
    MentorshipService,
    "title" | "slug" | "type" | "duration_min" | "sessions_count"
  > | null;
  mentor: Pick<Mentor, "name" | "slug" | "photo_url"> | null;
}

/** Row shape used by generateSlots to exclude taken slots. */
export interface BookedSlotRow {
  slot_start: string | null;
  slot_end: string | null;
  status: string;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/* Row mappers (coerce numerics and json defensively)                  */
/* ------------------------------------------------------------------ */

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((v) => String(v)) : [];
}

function mapMentor(row: any): Mentor {
  return {
    id: String(row.id),
    user_id: row.user_id ?? null,
    slug: String(row.slug ?? ""),
    name: String(row.name ?? ""),
    headline: String(row.headline ?? ""),
    bio: String(row.bio ?? ""),
    photo_url: row.photo_url ?? null,
    linkedin_url: row.linkedin_url ?? null,
    expertise: asStringArray(row.expertise),
    languages: asStringArray(row.languages),
    timezone: String(row.timezone ?? "Asia/Kolkata"),
    notice_hours: Number(row.notice_hours ?? 12),
    booking_window_days: Number(row.booking_window_days ?? 30),
    buffer_min: Number(row.buffer_min ?? 15),
    avg_rating: Number(row.avg_rating ?? 0),
    review_count: Number(row.review_count ?? 0),
    is_featured: Boolean(row.is_featured),
    sort_order: Number(row.sort_order ?? 0),
    status: (row.status ?? "published") as ContentStatus,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

function mapQuestions(value: unknown): ServiceQuestion[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((q) => q && typeof q === "object" && (q as any).label)
    .map((q: any) => ({
      label: String(q.label),
      required: Boolean(q.required),
      type: "text" as const,
    }));
}

function mapService(row: any): MentorshipService {
  return {
    id: String(row.id),
    mentor_id: String(row.mentor_id),
    slug: String(row.slug ?? ""),
    type: (row.type ?? "call") as MentorshipServiceType,
    title: String(row.title ?? ""),
    short_description: String(row.short_description ?? ""),
    description: String(row.description ?? ""),
    price: Number(row.price ?? 0),
    compare_at_price:
      row.compare_at_price === null || row.compare_at_price === undefined
        ? null
        : Number(row.compare_at_price),
    currency: String(row.currency ?? "INR"),
    duration_min:
      row.duration_min === null || row.duration_min === undefined
        ? null
        : Number(row.duration_min),
    sessions_count: Number(row.sessions_count ?? 1),
    webinar_start_at: row.webinar_start_at ?? null,
    capacity:
      row.capacity === null || row.capacity === undefined
        ? null
        : Number(row.capacity),
    cta_label: String(row.cta_label ?? "Book Now"),
    badge: (row.badge ?? null) as MentorshipService["badge"],
    cover_url: row.cover_url ?? null,
    questions: mapQuestions(row.questions),
    sort_order: Number(row.sort_order ?? 0),
    status: (row.status ?? "published") as ContentStatus,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

function mapRule(row: any): AvailabilityRule {
  return {
    id: String(row.id),
    mentor_id: String(row.mentor_id),
    weekday: Number(row.weekday ?? 0),
    start_time: String(row.start_time ?? "00:00"),
    end_time: String(row.end_time ?? "00:00"),
    active: Boolean(row.active),
    updated_at: String(row.updated_at ?? ""),
  };
}

function mapReview(row: any): MentorReview {
  return {
    id: String(row.id),
    mentor_id: String(row.mentor_id),
    service_id: row.service_id ?? null,
    booking_id: row.booking_id ?? null,
    user_id: row.user_id ?? null,
    name: String(row.name ?? ""),
    rating: Number(row.rating ?? 0),
    review: String(row.review ?? ""),
    is_public: Boolean(row.is_public),
    created_at: String(row.created_at ?? ""),
  };
}

function mapAnswers(value: unknown): BookingAnswer[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((a) => a && typeof a === "object")
    .map((a: any) => ({
      label: String(a.label ?? ""),
      answer: String(a.answer ?? ""),
    }));
}

function mapBooking(row: any): MentorshipBooking {
  return {
    id: String(row.id),
    service_id: String(row.service_id),
    mentor_id: String(row.mentor_id),
    user_id: String(row.user_id),
    customer_name: String(row.customer_name ?? ""),
    customer_email: String(row.customer_email ?? ""),
    customer_phone: row.customer_phone ?? null,
    answers: mapAnswers(row.answers),
    slot_start: row.slot_start ?? null,
    slot_end: row.slot_end ?? null,
    buyer_timezone: String(row.buyer_timezone ?? "Asia/Kolkata"),
    amount: Number(row.amount ?? 0),
    currency: String(row.currency ?? "INR"),
    status: (row.status ?? "pending") as BookingStatus,
    order_id: row.order_id ?? null,
    payment_id: row.payment_id ?? null,
    meeting_link: row.meeting_link ?? null,
    admin_notes: row.admin_notes ?? null,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

/* ------------------------------------------------------------------ */
/* Catalog fetchers (session cached)                                   */
/* ------------------------------------------------------------------ */

let mentorsPromise: Promise<Mentor[]> | null = null;

/** All published mentors, featured first then by sort order. */
export function getMentors(): Promise<Mentor[]> {
  if (!mentorsPromise) {
    mentorsPromise = (async () => {
      try {
        const { data, error } = await supabase
          .from("mentors")
          .select("*")
          .eq("status", "published")
          .order("is_featured", { ascending: false })
          .order("sort_order", { ascending: true });
        if (error || !data) return [];
        return data.map(mapMentor);
      } catch {
        return [];
      }
    })();
  }
  return mentorsPromise;
}

const mentorBySlugPromises: Record<string, Promise<Mentor | null>> = {};

/** One published mentor by slug (null when not found). */
export function getMentorBySlug(slug: string): Promise<Mentor | null> {
  if (!mentorBySlugPromises[slug]) {
    mentorBySlugPromises[slug] = (async () => {
      try {
        const { data, error } = await supabase
          .from("mentors")
          .select("*")
          .eq("slug", slug)
          .eq("status", "published")
          .limit(1);
        if (error || !data || data.length === 0) return null;
        return mapMentor(data[0]);
      } catch {
        return null;
      }
    })();
  }
  return mentorBySlugPromises[slug];
}

let allServicesPromise: Promise<MentorshipService[]> | null = null;

/** Every published service across mentors (directory pricing + filters). */
export function getAllServices(): Promise<MentorshipService[]> {
  if (!allServicesPromise) {
    allServicesPromise = (async () => {
      try {
        const { data, error } = await supabase
          .from("mentorship_services")
          .select("*")
          .eq("status", "published")
          .order("sort_order", { ascending: true });
        if (error || !data) return [];
        return data.map(mapService);
      } catch {
        return [];
      }
    })();
  }
  return allServicesPromise;
}

/** Published services for one mentor, in sort order. */
export async function getMentorServices(
  mentorId: string
): Promise<MentorshipService[]> {
  const all = await getAllServices();
  return all.filter((s) => s.mentor_id === mentorId);
}

/** One published service by mentor id + service slug. */
export async function getServiceBySlug(
  mentorId: string,
  serviceSlug: string
): Promise<MentorshipService | null> {
  const services = await getMentorServices(mentorId);
  return services.find((s) => s.slug === serviceSlug) ?? null;
}

const availabilityPromises: Record<string, Promise<AvailabilityRule[]>> = {};

/** Active weekly availability rules for a mentor. */
export function getMentorAvailability(
  mentorId: string
): Promise<AvailabilityRule[]> {
  if (!availabilityPromises[mentorId]) {
    availabilityPromises[mentorId] = (async () => {
      try {
        const { data, error } = await supabase
          .from("mentor_availability")
          .select("*")
          .eq("mentor_id", mentorId)
          .eq("active", true);
        if (error || !data) return [];
        return data.map(mapRule);
      } catch {
        return [];
      }
    })();
  }
  return availabilityPromises[mentorId];
}

/* ------------------------------------------------------------------ */
/* Date specific availability overrides                                */
/*                                                                     */
/* Weekly rules set the recurring shape; overrides bend a single day:  */
/* block the whole day, block a window, or open an extra window. Public */
/* read (the slot picker needs them); owner mentor and admin write.    */
/* Always fetched fresh so the picker reflects the latest edits.       */
/* ------------------------------------------------------------------ */

/** Normalises a Postgres date/timestamp value to "YYYY-MM-DD". */
function normalizeOverrideDate(value: unknown): string {
  return String(value ?? "").slice(0, 10);
}

/**
 * Date specific overrides for a mentor, mapped to the pure DateOverride the
 * slot generator consumes. Fresh read, never throws (empty list on any error).
 */
export async function getMentorDateOverrides(
  mentorId: string
): Promise<DateOverride[]> {
  try {
    const { data, error } = await supabase
      .from("mentor_date_overrides")
      .select("date, kind, start_time, end_time")
      .eq("mentor_id", mentorId);
    if (error || !data) return [];
    return data.map((row: any) => ({
      date: normalizeOverrideDate(row.date),
      kind: row.kind === "open" ? "open" : "blocked",
      start_time: row.start_time ?? null,
      end_time: row.end_time ?? null,
    }));
  } catch {
    return [];
  }
}

export interface DateOverrideInput {
  date: string;
  kind: "blocked" | "open";
  start_time: string | null;
  end_time: string | null;
  note: string | null;
}

/** Adds a date override. Owner write (RLS: the mentor's own rows or admin). */
export async function addDateOverride(
  mentorId: string,
  input: DateOverrideInput
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("mentor_date_overrides").insert({
    mentor_id: mentorId,
    date: input.date,
    kind: input.kind,
    start_time: input.start_time,
    end_time: input.end_time,
    note: input.note,
  });
  if (error) {
    return { error: "This date override could not be saved. Please try again." };
  }
  return { error: null };
}

/** Deletes a date override by id. Owner write (RLS: own rows or admin). */
export async function deleteDateOverride(
  id: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("mentor_date_overrides")
    .delete()
    .eq("id", id);
  if (error) {
    return { error: "This date override could not be removed. Please try again." };
  }
  return { error: null };
}

/* ------------------------------------------------------------------ */
/* Reviews (always fresh: they change after a booking completes)       */
/* ------------------------------------------------------------------ */

/** Public reviews for a mentor, newest first. */
export async function getMentorReviews(
  mentorId: string
): Promise<MentorReview[]> {
  try {
    const { data, error } = await supabase
      .from("mentor_reviews")
      .select("*")
      .eq("mentor_id", mentorId)
      .eq("is_public", true)
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data.map(mapReview);
  } catch {
    return [];
  }
}

/** My own reviews (used to hide the review form once submitted). */
export async function getMyReviews(): Promise<MentorReview[]> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return [];
    const { data, error } = await supabase
      .from("mentor_reviews")
      .select("*")
      .eq("user_id", auth.user.id);
    if (error || !data) return [];
    return data.map(mapReview);
  } catch {
    return [];
  }
}

/** Leaves a verified review for a completed booking. */
export async function submitReview(input: {
  mentorId: string;
  serviceId: string | null;
  bookingId: string | null;
  name: string;
  rating: number;
  review: string;
}): Promise<{ error: string | null }> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Please sign in to leave a review." };
  const { error } = await supabase.from("mentor_reviews").insert({
    mentor_id: input.mentorId,
    service_id: input.serviceId,
    booking_id: input.bookingId,
    user_id: auth.user.id,
    name: input.name,
    rating: input.rating,
    review: input.review,
  });
  if (error) {
    if (error.code === "23505") {
      return { error: "You already reviewed this session. Thank you!" };
    }
    return { error: "Your review could not be saved. Please try again." };
  }
  return { error: null };
}

/* ------------------------------------------------------------------ */
/* Bookings (always fresh)                                             */
/* ------------------------------------------------------------------ */

/**
 * Slot blocking rows for a mentor. RLS limits what a visitor can read,
 * so this is best effort: the unique DB index is the real double
 * booking guard, surfaced to the UI as a 23505 on insert.
 */
export async function getMentorBookedSlots(
  mentorId: string
): Promise<BookedSlotRow[]> {
  try {
    const { data, error } = await supabase
      .from("mentorship_bookings")
      .select("slot_start, slot_end, status, created_at")
      .eq("mentor_id", mentorId)
      .not("slot_start", "is", null)
      .in("status", ["pending", "confirmed", "completed"]);
    if (error || !data) return [];
    return data as BookedSlotRow[];
  } catch {
    return [];
  }
}

/** The signed-in Yatri's bookings, newest first, with service + mentor. */
export async function getMyBookings(): Promise<MentorshipBookingWithRefs[]> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return [];
    const { data, error } = await supabase
      .from("mentorship_bookings")
      .select(
        "*, mentorship_services(title, slug, type, duration_min, sessions_count), mentors(name, slug, photo_url)"
      )
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data.map((row: any) => ({
      ...mapBooking(row),
      service: row.mentorship_services
        ? {
            title: String(row.mentorship_services.title ?? ""),
            slug: String(row.mentorship_services.slug ?? ""),
            type: (row.mentorship_services.type ?? "call") as MentorshipServiceType,
            duration_min:
              row.mentorship_services.duration_min === null ||
              row.mentorship_services.duration_min === undefined
                ? null
                : Number(row.mentorship_services.duration_min),
            sessions_count: Number(row.mentorship_services.sessions_count ?? 1),
          }
        : null,
      mentor: row.mentors
        ? {
            name: String(row.mentors.name ?? ""),
            slug: String(row.mentors.slug ?? ""),
            photo_url: row.mentors.photo_url ?? null,
          }
        : null,
    }));
  } catch {
    return [];
  }
}

export interface CreateBookingInput {
  serviceId: string;
  mentorId: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  answers: BookingAnswer[];
  slotStart: string | null;
  slotEnd: string | null;
  buyerTimezone: string;
  amount: number;
  currency: string;
  /** "pending" for paid flows, "confirmed" for free services. */
  status: "pending" | "confirmed";
  orderId: string | null;
}

/**
 * Inserts a booking. A 23505 unique violation means another Yatri took
 * the slot first: the caller shows a friendly toast and refreshes slots.
 */
export async function createBooking(
  input: CreateBookingInput
): Promise<{
  booking: MentorshipBooking | null;
  slotTaken: boolean;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("mentorship_bookings")
    .insert({
      service_id: input.serviceId,
      mentor_id: input.mentorId,
      user_id: input.userId,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      customer_phone: input.customerPhone,
      answers: input.answers,
      slot_start: input.slotStart,
      slot_end: input.slotEnd,
      buyer_timezone: input.buyerTimezone,
      amount: input.amount,
      currency: input.currency,
      status: input.status,
      order_id: input.orderId,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { booking: null, slotTaken: true, error: null };
    }
    return {
      booking: null,
      slotTaken: false,
      error: "Your booking could not be created. Please try again.",
    };
  }
  return { booking: mapBooking(data), slotTaken: false, error: null };
}

/** Cancels one of my pending bookings (RLS: pending to cancelled only). */
export async function cancelPendingBooking(
  bookingId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("mentorship_bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .eq("status", "pending");
  if (error) {
    return { error: "This booking could not be cancelled. Please try again." };
  }
  return { error: null };
}

/**
 * Cancels a booking through the server endpoint, which also starts a Razorpay
 * refund when the session was paid. Works for the mentee, the mentor, or an
 * admin: the server re checks who is asking. Never trust the browser to
 * refund; this only asks the server to do it.
 */
export async function cancelBooking(
  bookingId: string,
  reason?: string
): Promise<{ ok: boolean; refunded: boolean; message: string }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      return {
        ok: false,
        refunded: false,
        message: "Please sign in again to cancel this booking.",
      };
    }
    const res = await fetch("/api/mentorship/cancel-booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        booking_id: bookingId,
        access_token: accessToken,
        cancel_reason: reason ?? null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      return {
        ok: false,
        refunded: false,
        message:
          data.message || "This booking could not be cancelled. Please try again.",
      };
    }
    return {
      ok: true,
      refunded: Boolean(data.refunded),
      message: data.message || "Your session was cancelled.",
    };
  } catch {
    return {
      ok: false,
      refunded: false,
      message: "This booking could not be cancelled. Please try again.",
    };
  }
}

/**
 * Moves an upcoming booking to a new slot. Row level security does not let a
 * mentee change a confirmed booking, so this runs on the server with the
 * service role after verifying the caller. The unique slot index is the real
 * double booking guard, surfaced here as a friendly "slot taken".
 */
export async function rescheduleBooking(
  bookingId: string,
  newSlotStart: string,
  newSlotEnd: string
): Promise<{ error: string | null; slotTaken: boolean }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) {
      return { error: "Please sign in again to reschedule this booking.", slotTaken: false };
    }
    const res = await fetch("/api/mentorship/reschedule-booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        booking_id: bookingId,
        access_token: accessToken,
        slot_start: newSlotStart,
        slot_end: newSlotEnd,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.ok) {
      return {
        error: data?.message || "This session could not be rescheduled. Please try again.",
        slotTaken: Boolean(data?.slotTaken),
      };
    }
    return { error: null, slotTaken: false };
  } catch {
    return { error: "This session could not be rescheduled. Please try again.", slotTaken: false };
  }
}

/**
 * Upcoming pending and confirmed bookings for a mentor, earliest first, for
 * the calendar view. RLS scopes rows to the mentor's own.
 */
export async function getMentorUpcomingBookings(
  mentorId: string
): Promise<MentorshipBooking[]> {
  try {
    const { data, error } = await supabase
      .from("mentorship_bookings")
      .select("*")
      .eq("mentor_id", mentorId)
      .in("status", ["pending", "confirmed"])
      .not("slot_start", "is", null)
      .order("slot_start", { ascending: true });
    if (error || !data) return [];
    return data.map(mapBooking);
  } catch {
    return [];
  }
}

/** Creates our orders row (kind mentorship) and returns its id. */
export async function createMentorshipOrder(input: {
  userId: string;
  email: string;
  amount: number;
  currency: string;
  items: unknown[];
}): Promise<{ orderId: string | null; error: string | null }> {
  const { data, error } = await supabase
    .from("orders")
    .insert({
      user_id: input.userId,
      email: input.email,
      kind: "mentorship",
      items: input.items,
      amount: input.amount,
      currency: input.currency,
    })
    .select("id")
    .single();
  if (error || !data) {
    return { orderId: null, error: "We could not start your order. Please try again." };
  }
  return { orderId: String(data.id), error: null };
}

/* ------------------------------------------------------------------ */
/* Mentor applications (always fresh; RLS: own rows only)              */
/* ------------------------------------------------------------------ */

export type MentorApplicationStatus = "pending" | "approved" | "rejected";

export interface MentorApplication {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  headline: string;
  bio: string;
  expertise: string[];
  linkedin_url: string | null;
  photo_url: string | null;
  experience_years: string;
  motivation: string;
  links: Record<string, unknown>;
  status: MentorApplicationStatus;
  admin_notes: string | null;
  mentor_id: string | null;
  created_at: string;
  updated_at: string;
}

function mapMentorApplication(row: any): MentorApplication {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    phone: row.phone ?? null,
    headline: String(row.headline ?? ""),
    bio: String(row.bio ?? ""),
    expertise: asStringArray(row.expertise),
    linkedin_url: row.linkedin_url ?? null,
    photo_url: row.photo_url ?? null,
    experience_years: String(row.experience_years ?? ""),
    motivation: String(row.motivation ?? ""),
    links:
      row.links && typeof row.links === "object" && !Array.isArray(row.links)
        ? (row.links as Record<string, unknown>)
        : {},
    status: (row.status ?? "pending") as MentorApplicationStatus,
    admin_notes: row.admin_notes ?? null,
    mentor_id: row.mentor_id ?? null,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

/** The signed-in Yatri's latest mentor application (null when none). */
export async function getMyMentorApplication(): Promise<MentorApplication | null> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return null;
    const { data, error } = await supabase
      .from("mentor_applications")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false })
      .limit(1);
    if (error || !data || data.length === 0) return null;
    return mapMentorApplication(data[0]);
  } catch {
    return null;
  }
}

export interface SubmitMentorApplicationInput {
  name: string;
  email: string;
  phone: string | null;
  headline: string;
  bio: string;
  expertise: string[];
  linkedin_url: string | null;
  photo_url: string | null;
  experience_years: string;
  motivation: string;
}

/** Inserts a fresh mentor application for the signed-in Yatri. */
export async function submitMentorApplication(
  input: SubmitMentorApplicationInput
): Promise<{ application: MentorApplication | null; error: string | null }> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return { application: null, error: "Please sign in to apply." };
  }
  const { data, error } = await supabase
    .from("mentor_applications")
    .insert({
      user_id: auth.user.id,
      name: input.name,
      email: input.email,
      phone: input.phone,
      headline: input.headline,
      bio: input.bio,
      expertise: input.expertise,
      linkedin_url: input.linkedin_url,
      photo_url: input.photo_url,
      experience_years: input.experience_years,
      motivation: input.motivation,
      links: {},
    })
    .select("*")
    .single();
  if (error || !data) {
    return {
      application: null,
      error: "Your application could not be submitted. Please try again.",
    };
  }
  return { application: mapMentorApplication(data), error: null };
}

/* ------------------------------------------------------------------ */
/* Service secrets (RLS: buyers with confirmed or completed bookings)  */
/* ------------------------------------------------------------------ */

export interface ServiceSecret {
  service_id: string;
  delivery_url: string | null;
  meeting_link: string | null;
}

/** Secrets for services I have access to (per RLS). */
export async function getServiceSecrets(
  serviceIds: string[]
): Promise<ServiceSecret[]> {
  if (serviceIds.length === 0) return [];
  try {
    const { data, error } = await supabase
      .from("mentorship_service_secrets")
      .select("service_id, delivery_url, meeting_link")
      .in("service_id", serviceIds);
    if (error || !data) return [];
    return data.map((row: any) => ({
      service_id: String(row.service_id),
      delivery_url: row.delivery_url ?? null,
      meeting_link: row.meeting_link ?? null,
    }));
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/* Razorpay checkout (mentorship flavour: verify carries booking_id)   */
/* ------------------------------------------------------------------ */

export interface MentorshipCheckoutInput {
  /** Razorpay order id from createRazorpayOrder. */
  razorpayOrderId: string;
  /** Amount in paise. */
  amountPaise: number;
  serviceTitle: string;
  bookingId: string;
  /** Our orders.id row. */
  orderId: string;
  customer: { name: string; email: string; phone: string };
  onSuccess: (paymentId: string) => void;
  onFailure: (message: string) => void;
}

/**
 * Opens Razorpay checkout for a mentorship booking. Mirrors the flow in
 * src/lib/razorpay.ts but sends booking_id to /api/razorpay/verify so
 * the server flips the pending booking to confirmed after the HMAC check.
 */
export async function openMentorshipCheckout(input: MentorshipCheckoutInput): Promise<void> {
  const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
  if (!key) {
    input.onFailure("Payments are not configured yet. Please contact support.");
    return;
  }
  // checkout.js loads on demand — it is no longer on every page.
  await loadRazorpay();
  const RazorpayCtor = (window as any).Razorpay;
  if (!RazorpayCtor) {
    input.onFailure("The payment system did not load. Please refresh and try again.");
    return;
  }

  const options = {
    key,
    amount: input.amountPaise,
    currency: "INR",
    name: "Yatri Cloud",
    description: input.serviceTitle,
    order_id: input.razorpayOrderId,
    image:
      "https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/Logo/yatricloud-round-transparent.png",
    handler: async (response: any) => {
      // Server side signature verification is the only source of truth.
      try {
        const verifyRes = await fetch("/api/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            amount: input.amountPaise,
            currency: "INR",
            order_id: input.orderId,
            booking_id: input.bookingId,
          }),
        });
        const verdict = await verifyRes.json().catch(() => ({}));
        if (!verifyRes.ok || !verdict.verified) {
          input.onFailure(
            "Your payment could not be verified. If money was deducted it will be refunded automatically. Please contact support."
          );
          return;
        }
      } catch {
        input.onFailure(
          "Payment verification failed. Please contact support with your payment id."
        );
        return;
      }
      input.onSuccess(response.razorpay_payment_id);
    },
    prefill: {
      name: input.customer.name,
      email: input.customer.email,
      contact: input.customer.phone,
    },
    notes: { booking_id: input.bookingId },
    theme: { color: "#3B82F6" },
    modal: {
      ondismiss: () => {
        input.onFailure(
          "Payment was cancelled. Your slot is held for 30 minutes if you want to finish checkout from My Bookings."
        );
      },
    },
  };

  try {
    const instance = new RazorpayCtor(options);
    instance.on("payment.failed", (response: any) => {
      input.onFailure(response?.error?.description || "Payment failed. Please try again.");
    });
    instance.open();
  } catch {
    input.onFailure("The payment window could not be opened. Please try again.");
  }
}

/* ------------------------------------------------------------------ */
/* Formatting helpers                                                  */
/* ------------------------------------------------------------------ */

/** Visitor timezone (falls back to IST when unavailable). */
export function visitorTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
  } catch {
    return "Asia/Kolkata";
  }
}

/** "Free" or a rupee amount without decimals. */
export function formatServicePrice(price: number): string {
  if (!price || price <= 0) return "Free";
  return `₹${Math.round(price).toLocaleString("en-IN")}`;
}

/** Human meta line for a service type. */
export function serviceMeta(service: MentorshipService): string {
  switch (service.type) {
    case "call":
      return service.duration_min
        ? `${service.duration_min} minute video call`
        : "Video call";
    case "package":
      return service.sessions_count > 1
        ? `${service.sessions_count} sessions${
            service.duration_min ? ` of ${service.duration_min} minutes each` : ""
          }`
        : "Session package";
    case "digital":
      return "Digital product, delivered instantly";
    case "webinar":
      return "Live webinar";
    default:
      return "";
  }
}

/** Formats an instant in the given timezone, e.g. "Sat, 5 Jul, 6:00 PM". */
export function formatInstant(iso: string | Date, timeZone: string): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  try {
    return new Intl.DateTimeFormat("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      timeZone,
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

/* ------------------------------------------------------------------ */
/* Calendar helpers (dependency free so the server can mirror them)    */
/* ------------------------------------------------------------------ */

/** ISO timestamp to UTC basic format YYYYMMDDTHHMMSSZ used by calendars. */
function toCalendarUtc(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

/** Escapes a value for an ICS text field (commas, semicolons, newlines). */
function icsEscape(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/** Builds a Google Calendar "add event" URL (UTC basic format, all encoded). */
export function googleCalendarUrl(input: {
  title: string;
  startISO: string;
  endISO: string;
  details?: string;
  location?: string;
}): string {
  const dates = `${toCalendarUtc(input.startISO)}/${toCalendarUtc(input.endISO)}`;
  const params = [
    "action=TEMPLATE",
    `text=${encodeURIComponent(input.title)}`,
    `dates=${dates}`,
    `details=${encodeURIComponent(input.details ?? "")}`,
    `location=${encodeURIComponent(input.location ?? "")}`,
  ].join("&");
  return `https://calendar.google.com/calendar/render?${params}`;
}

/** Builds a valid single event VCALENDAR string with UTC Z times. */
export function buildIcs(input: {
  uid: string;
  title: string;
  startISO: string;
  endISO: string;
  description?: string;
  location?: string;
}): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Yatri Cloud//Mentorship//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${input.uid}`,
    `DTSTAMP:${toCalendarUtc(new Date().toISOString())}`,
    `DTSTART:${toCalendarUtc(input.startISO)}`,
    `DTEND:${toCalendarUtc(input.endISO)}`,
    `SUMMARY:${icsEscape(input.title)}`,
    `DESCRIPTION:${icsEscape(input.description ?? "")}`,
    `LOCATION:${icsEscape(input.location ?? "")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/** Wraps an ICS string as a downloadable data URI. */
export function icsDataUri(ics: string): string {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}

/* ------------------------------------------------------------------ */
/* Buyer confirmation email (sent client side, existing pattern)       */
/* ------------------------------------------------------------------ */

/** Inline-styled buyer confirmation email for a mentorship booking. */
export function buildBookingConfirmationEmail(input: {
  name: string;
  serviceTitle: string;
  mentorName: string;
  amountLabel: string;
  slotLabel: string | null;
  isDigital: boolean;
}): string {
  const detailRows = [
    `<p style="margin: 5px 0;"><strong>Session:</strong> ${input.serviceTitle}</p>`,
    `<p style="margin: 5px 0;"><strong>Mentor:</strong> ${input.mentorName}</p>`,
    input.slotLabel
      ? `<p style="margin: 5px 0;"><strong>When:</strong> ${input.slotLabel}</p>`
      : "",
    `<p style="margin: 5px 0;"><strong>Amount:</strong> ${input.amountLabel}</p>`,
  ].join("");

  const nextStep = input.isDigital
    ? "Your product is ready. Open My Bookings on Yatri Cloud to access your download."
    : "Your mentor will share the meeting link before your session. You can always find your booking under My Bookings on Yatri Cloud.";

  const content = `
    <h2 style="color: #1e3a8a; margin-top: 0;">Your booking is confirmed</h2>
    <p>Hello ${input.name},</p>
    <p>Great news. Your mentorship booking with <strong>${input.mentorName}</strong> is confirmed.</p>
    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 25px 0; border-radius: 4px;">
      ${detailRows}
    </div>
    <p>${nextStep}</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://www.yatricloud.com/mentorship/bookings" style="background-color: #3b82f6; color: white; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">View my bookings</a>
    </div>
    <p>Best regards,<br>Team Yatri Cloud</p>
  `;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking confirmed</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.6;">
    <div style="background-color: #1e3a8a; padding: 30px; text-align: center; border-radius: 0 0 20px 20px;">
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">Yatri Cloud</h1>
    </div>
    <div style="background-color: #ffffff; padding: 40px; margin: 20px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      ${content}
    </div>
    <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
      <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Yatri Cloud. All rights reserved.</p>
      <p style="margin: 5px 0;">Empowering your cloud journey.</p>
    </div>
  </div>
</body>
</html>
`;
}

/* ------------------------------------------------------------------ */
/* Analytics (read only; session cached; never throw)                  */
/*                                                                     */
/* Earnings and platform numbers are derived on the client from the    */
/* booking rows RLS already lets the caller read: a mentor sees only    */
/* their own rows, an admin sees everything. Gross revenue counts       */
/* confirmed and completed bookings (money that actually cleared).      */
/* Payout falls back to the full amount when mentor_payout is null,     */
/* since Razorpay Route may not be enabled yet.                         */
/* ------------------------------------------------------------------ */

/** Statuses that represent money that cleared. */
const PAID_STATUSES: BookingStatus[] = ["confirmed", "completed"];

const zeroByStatus = (): Record<BookingStatus, number> => ({
  pending: 0,
  confirmed: 0,
  completed: 0,
  cancelled: 0,
  refunded: 0,
});

/** mentor_payout when present, otherwise the full amount (Route off). */
function payoutOf(row: { amount?: unknown; mentor_payout?: unknown }): number {
  const payout = row.mentor_payout;
  if (payout !== null && payout !== undefined) return Number(payout) || 0;
  return Number(row.amount ?? 0) || 0;
}

interface MonthBucket {
  key: string;
  label: string;
}

/** The last six calendar months, oldest first, as YYYY-MM keys + labels. */
function lastSixMonths(): MonthBucket[] {
  const out: MonthBucket[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-IN", { month: "short", year: "numeric" });
    out.push({ key, label });
  }
  return out;
}

/** YYYY-MM bucket key for an ISO timestamp (empty string when unparseable). */
function monthKey(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export interface MonthlyRevenue {
  key: string;
  label: string;
  revenue: number;
}

export interface RecentPaidBooking {
  id: string;
  amount: number;
  payout: number;
  status: BookingStatus;
  slot_start: string | null;
  created_at: string;
}

export interface MentorEarnings {
  bookingsByStatus: Record<BookingStatus, number>;
  totalBookings: number;
  grossRevenue: number;
  payout: number;
  platformFees: number;
  completed: number;
  upcoming: number;
  avgRating: number;
  reviewCount: number;
  revenueByMonth: MonthlyRevenue[];
  recentPaid: RecentPaidBooking[];
}

const emptyMentorEarnings = (): MentorEarnings => ({
  bookingsByStatus: zeroByStatus(),
  totalBookings: 0,
  grossRevenue: 0,
  payout: 0,
  platformFees: 0,
  completed: 0,
  upcoming: 0,
  avgRating: 0,
  reviewCount: 0,
  revenueByMonth: lastSixMonths().map((m) => ({ ...m, revenue: 0 })),
  recentPaid: [],
});

const mentorEarningsPromises: Record<string, Promise<MentorEarnings>> = {};

/** Earnings summary for one mentor. RLS scopes rows to the mentor's own. */
export function getMentorEarnings(mentorId: string): Promise<MentorEarnings> {
  if (!mentorEarningsPromises[mentorId]) {
    mentorEarningsPromises[mentorId] = (async () => {
      try {
        const [bookingsRes, mentorRes] = await Promise.all([
          supabase
            .from("mentorship_bookings")
            .select("id, amount, status, platform_fee, mentor_payout, slot_start, created_at")
            .eq("mentor_id", mentorId)
            .order("created_at", { ascending: false }),
          supabase
            .from("mentors")
            .select("avg_rating, review_count")
            .eq("id", mentorId)
            .maybeSingle(),
        ]);

        const rows = bookingsRes.error || !bookingsRes.data ? [] : bookingsRes.data;

        const result = emptyMentorEarnings();
        const bookingsByStatus = zeroByStatus();
        const months = lastSixMonths();
        const revenueByMonth = new Map<string, number>(months.map((m) => [m.key, 0]));
        const now = Date.now();
        const recent: RecentPaidBooking[] = [];

        for (const row of rows as any[]) {
          const status = (row.status ?? "pending") as BookingStatus;
          bookingsByStatus[status] = (bookingsByStatus[status] ?? 0) + 1;
          const amount = Number(row.amount ?? 0) || 0;
          const paid = PAID_STATUSES.includes(status);

          if (paid) {
            result.grossRevenue += amount;
            result.payout += payoutOf(row);
            result.platformFees += Number(row.platform_fee ?? 0) || 0;
            const key = monthKey(row.created_at);
            if (revenueByMonth.has(key)) {
              revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + amount);
            }
            if (recent.length < 8) {
              recent.push({
                id: String(row.id),
                amount,
                payout: payoutOf(row),
                status,
                slot_start: row.slot_start ?? null,
                created_at: String(row.created_at ?? ""),
              });
            }
          }

          if (status === "completed") result.completed += 1;
          if (
            (status === "pending" || status === "confirmed") &&
            (row.slot_start == null || new Date(row.slot_start).getTime() >= now)
          ) {
            result.upcoming += 1;
          }
        }

        result.bookingsByStatus = bookingsByStatus;
        result.totalBookings = rows.length;
        result.revenueByMonth = months.map((m) => ({
          ...m,
          revenue: revenueByMonth.get(m.key) ?? 0,
        }));
        result.recentPaid = recent;
        if (mentorRes.data) {
          result.avgRating = Number((mentorRes.data as any).avg_rating ?? 0) || 0;
          result.reviewCount = Number((mentorRes.data as any).review_count ?? 0) || 0;
        }
        return result;
      } catch {
        return emptyMentorEarnings();
      }
    })();
  }
  return mentorEarningsPromises[mentorId];
}

export interface TopMentor {
  mentorId: string;
  name: string;
  bookings: number;
  revenue: number;
  rating: number;
}

export interface MentorshipPlatformStats {
  totalBookings: number;
  grossRevenue: number;
  platformFees: number;
  activeMentors: number;
  topMentors: TopMentor[];
  revenueByMonth: MonthlyRevenue[];
}

const emptyPlatformStats = (): MentorshipPlatformStats => ({
  totalBookings: 0,
  grossRevenue: 0,
  platformFees: 0,
  activeMentors: 0,
  topMentors: [],
  revenueByMonth: lastSixMonths().map((m) => ({ ...m, revenue: 0 })),
});

let platformStatsPromise: Promise<MentorshipPlatformStats> | null = null;

/** Platform wide mentorship analytics for admins (RLS: admin reads all). */
export function getMentorshipPlatformStats(): Promise<MentorshipPlatformStats> {
  if (!platformStatsPromise) {
    platformStatsPromise = (async () => {
      try {
        const [bookingsRes, mentorsRes] = await Promise.all([
          supabase
            .from("mentorship_bookings")
            .select("mentor_id, amount, status, platform_fee, created_at"),
          supabase.from("mentors").select("id, name, avg_rating, status"),
        ]);

        const rows = bookingsRes.error || !bookingsRes.data ? [] : bookingsRes.data;
        const mentors = mentorsRes.error || !mentorsRes.data ? [] : mentorsRes.data;

        const nameOf = new Map<string, string>();
        const ratingOf = new Map<string, number>();
        let activeMentors = 0;
        for (const m of mentors as any[]) {
          nameOf.set(String(m.id), String(m.name ?? "Mentor"));
          ratingOf.set(String(m.id), Number(m.avg_rating ?? 0) || 0);
          if ((m.status ?? "") === "published") activeMentors += 1;
        }

        const result = emptyPlatformStats();
        result.activeMentors = activeMentors;
        result.totalBookings = rows.length;

        const months = lastSixMonths();
        const revenueByMonth = new Map<string, number>(months.map((m) => [m.key, 0]));
        const perMentor = new Map<string, { bookings: number; revenue: number }>();

        for (const row of rows as any[]) {
          const status = (row.status ?? "pending") as BookingStatus;
          const amount = Number(row.amount ?? 0) || 0;
          const mentorId = String(row.mentor_id ?? "");
          const bucket = perMentor.get(mentorId) ?? { bookings: 0, revenue: 0 };
          bucket.bookings += 1;

          if (PAID_STATUSES.includes(status)) {
            result.grossRevenue += amount;
            result.platformFees += Number(row.platform_fee ?? 0) || 0;
            bucket.revenue += amount;
            const key = monthKey(row.created_at);
            if (revenueByMonth.has(key)) {
              revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + amount);
            }
          }
          perMentor.set(mentorId, bucket);
        }

        result.revenueByMonth = months.map((m) => ({
          ...m,
          revenue: revenueByMonth.get(m.key) ?? 0,
        }));

        result.topMentors = Array.from(perMentor.entries())
          .map(([mentorId, agg]) => ({
            mentorId,
            name: nameOf.get(mentorId) ?? "Mentor",
            bookings: agg.bookings,
            revenue: agg.revenue,
            rating: ratingOf.get(mentorId) ?? 0,
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 8);

        return result;
      } catch {
        return emptyPlatformStats();
      }
    })();
  }
  return platformStatsPromise;
}
