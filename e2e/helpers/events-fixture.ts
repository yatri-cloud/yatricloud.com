import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Throwaway-event fixtures for the events e2e suites.
 *
 * Creates uniquely-named, `visibility: "private"` events via the service role
 * (so they never appear in public listings while the suite runs) and deletes
 * them afterwards — registrations and waitlist rows are removed by the
 * `on delete cascade` FKs. Same throwaway-row contract the CI e2e job
 * documents in .github/workflows/ci.yml.
 *
 * Needs SUPABASE_URL (or VITE_SUPABASE_URL) + SUPABASE_SERVICE_ROLE_KEY in the
 * environment (.env locally via playwright.config's dotenv import; repo
 * secrets in CI). Suites should skip when `fixturesAvailable` is false.
 */

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const fixturesAvailable = Boolean(url && serviceKey);

let client: SupabaseClient | null = null;
function admin(): SupabaseClient {
  if (!client) client = createClient(url, serviceKey);
  return client;
}

export interface FixtureEvent {
  id: string;
  slug: string;
  name: string;
}

export async function createFixtureEvent(opts: {
  when: "upcoming" | "past";
  capacity?: number;
  /** Extra `details` jsonb fields (e.g. isUpcoming/lookingForVenue for submission flows). */
  extraDetails?: Record<string, unknown>;
}): Promise<FixtureEvent> {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const { data, error } = await admin()
    .from("events")
    .insert({
      slug: `e2e-throwaway-${stamp}`,
      name: `E2E Throwaway Event ${stamp}`,
      description: "Throwaway event created by the e2e suite. Safe to delete.",
      details: {
        __yc: true,
        locationType: "online",
        category: "Workshop",
        ...(opts.extraDetails ?? {}),
      },
      event_date: new Date(
        Date.now() + (opts.when === "upcoming" ? weekMs : -weekMs)
      ).toISOString(),
      capacity: opts.capacity ?? 50,
      ticket_type: "free",
      price_inr: 0,
      status: "published",
      visibility: "private",
    })
    .select("id, slug, name")
    .single();
  if (error) throw new Error(`fixture event insert failed: ${error.message}`);
  return data as FixtureEvent;
}

/** Fills a seat directly in the DB (e.g. to make a capacity-1 event sold out). */
export async function seedRegistration(
  eventId: string,
  email: string,
  userId?: string
): Promise<string> {
  const code = `E2E${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const { error } = await admin().from("event_registrations").insert({
    event_id: eventId,
    registration_code: code,
    name: "E2E Seat Filler",
    email,
    status: "registered",
    ...(userId ? { user_id: userId } : {}),
  });
  if (error) throw new Error(`fixture registration insert failed: ${error.message}`);
  return code;
}

/** Look up a profile id by email (e.g. the e2e admin, to own a registration). */
export async function getUserIdByEmail(email: string): Promise<string | undefined> {
  const { data } = await admin().from("profiles").select("id").eq("email", email).maybeSingle();
  return (data as { id?: string } | null)?.id;
}

/** Remove polymorphic reviews left on a fixture entity (no FK — explicit cleanup). */
export async function deleteEntityReviewsFor(entityId: string | undefined): Promise<void> {
  if (!entityId) return;
  await admin().from("entity_reviews").delete().eq("entity_id", entityId);
}

export interface FixtureProduct {
  id: string;
  title: string;
}

/** A published throwaway store product for review-flow tests. */
export async function createFixtureProduct(): Promise<FixtureProduct> {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const { data, error } = await admin()
    .from("products")
    .insert({
      title: `E2E Throwaway Voucher ${stamp}`,
      provider: "AWS",
      level: "Associate",
      original_price_inr: 1000,
      discounted_price_inr: 500,
      description: "Throwaway product created by the e2e suite. Safe to delete.",
      status: "published",
    })
    .select("id, title")
    .single();
  if (error) throw new Error(`fixture product insert failed: ${error.message}`);
  return data as FixtureProduct;
}

export async function deleteFixtureProduct(id: string | undefined): Promise<void> {
  if (!id) return;
  await admin().from("products").delete().eq("id", id);
}

export async function deleteFixtureEvent(id: string | undefined): Promise<void> {
  if (!id) return;
  await admin().from("events").delete().eq("id", id);
}
