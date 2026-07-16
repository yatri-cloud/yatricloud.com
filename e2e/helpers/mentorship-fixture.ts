import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Throwaway mentor + service fixtures for the mentorship e2e suites, created
 * with the service role and removed afterwards (children first — bookings
 * reference mentors/services without relying on cascade everywhere).
 *
 * A published mentor with a FREE `digital` service is the zero-payment path:
 * no slot picker, no Razorpay — a signed-in user can book fully through the
 * UI (RLS allows inserting own bookings with status 'confirmed' when
 * amount = 0). A free `call` service plus availability rows exercises the
 * SlotPicker path.
 */

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const fixturesAvailable = Boolean(url && serviceKey);

let client: SupabaseClient | null = null;
function admin(): SupabaseClient {
  if (!client) client = createClient(url, serviceKey);
  return client;
}

export interface FixtureMentor {
  id: string;
  slug: string;
  name: string;
}

export interface FixtureService {
  id: string;
  slug: string;
  title: string;
}

export async function createFixtureMentor(): Promise<FixtureMentor> {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const { data, error } = await admin()
    .from("mentors")
    .insert({
      slug: `e2e-mentor-${stamp}`,
      name: `E2E Mentor ${stamp}`,
      headline: "Throwaway mentor created by the e2e suite. Safe to delete.",
      expertise: ["AWS", "E2E Testing"],
      status: "published",
    })
    .select("id, slug, name")
    .single();
  if (error) throw new Error(`fixture mentor insert failed: ${error.message}`);
  return data as FixtureMentor;
}

export async function createFixtureService(
  mentorId: string,
  type: "digital" | "call"
): Promise<FixtureService> {
  const stamp = Math.random().toString(36).slice(2, 8);
  const title = type === "digital" ? `E2E Free Guide ${stamp}` : `E2E Free Call ${stamp}`;
  const { data, error } = await admin()
    .from("mentorship_services")
    .insert({
      mentor_id: mentorId,
      slug: `e2e-${type}-${stamp}`,
      type,
      title,
      short_description: "Throwaway service created by the e2e suite.",
      description: "Throwaway service created by the e2e suite. Safe to delete.",
      price: 0,
      status: "published",
      cta_label: "Book Now",
      ...(type === "call" ? { duration_min: 30 } : {}),
    })
    .select("id, slug, title")
    .single();
  if (error) throw new Error(`fixture service insert failed: ${error.message}`);
  return data as FixtureService;
}

/** Open every weekday all day so the SlotPicker always has slots to show. */
export async function addFixtureAvailability(mentorId: string): Promise<void> {
  const rows = Array.from({ length: 7 }, (_, weekday) => ({
    mentor_id: mentorId,
    weekday,
    start_time: "00:00",
    end_time: "23:59",
    active: true,
  }));
  const { error } = await admin().from("mentor_availability").insert(rows);
  if (error) throw new Error(`fixture availability insert failed: ${error.message}`);
}

/** Delete the mentor and everything hanging off it, children first. */
export async function deleteFixtureMentor(mentorId: string | undefined): Promise<void> {
  if (!mentorId) return;
  const db = admin();
  await db.from("mentor_reviews").delete().eq("mentor_id", mentorId);
  await db.from("mentorship_bookings").delete().eq("mentor_id", mentorId);
  await db.from("mentor_availability").delete().eq("mentor_id", mentorId);
  await db.from("mentorship_services").delete().eq("mentor_id", mentorId);
  await db.from("mentor_private").delete().eq("mentor_id", mentorId);
  await db.from("mentors").delete().eq("id", mentorId);
}
