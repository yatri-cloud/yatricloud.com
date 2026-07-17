/**
 * Newsletter CRUD + send functions for Yatri Cloud.
 *
 * Tables (migration 078):
 *   subscribers      — public insert, admin all
 *   newsletters      — admin all
 *   newsletter_sends — admin all (cascade delete from newsletters)
 */

import { supabase } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";
import { getNewsletterEmail, getSubscriberWelcomeEmail } from "@/lib/email-templates";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  status: string;
  unsubscribed_at: string | null;
  unsubscribe_token: string;
  created_at: string;
}

export interface Newsletter {
  id: string;
  title: string;
  subject: string;
  body_html: string;
  status: string;
  sent_at: string | null;
  sent_by: string | null;
  recipient_count: number;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewsletterSend {
  id: string;
  newsletter_id: string;
  subscriber_id: string;
  status: string;
  sent_at: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Public (anon) functions
// ---------------------------------------------------------------------------

/**
 * Subscribe from the public form (uses anon key + public insert RLS).
 * Duplicate emails are treated as success so the UI can show a friendly
 * "already subscribed" message instead of an error.
 */
export async function subscribeToNewsletter(
  email: string,
  name?: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("subscribers")
    .insert({ email: email.toLowerCase().trim(), name: name || null });

  if (error) {
    // Duplicate unique constraint — already subscribed
    if (error.message.includes("duplicate")) return { ok: true };
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Unsubscribe by token (public page, no auth required).
 */
export async function unsubscribeByToken(
  token: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("subscribers")
    .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
    .eq("unsubscribe_token", token)
    .eq("status", "active");

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Look up a subscriber by their unsubscribe token.
 * Used by the /unsubscribe page to check validity before prompting.
 */
export async function getSubscriberByToken(
  token: string
): Promise<Subscriber | null> {
  const { data, error } = await supabase
    .from("subscribers")
    .select("*")
    .eq("unsubscribe_token", token)
    .single();

  if (error || !data) return null;
  return data as Subscriber;
}

// ---------------------------------------------------------------------------
// Admin — Subscribers
// ---------------------------------------------------------------------------

/**
 * List subscribers with optional search across email and name.
 */
export async function fetchSubscribers(
  search?: string
): Promise<Subscriber[]> {
  let query = supabase
    .from("subscribers")
    .select("*")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) return [];
  return (data || []) as Subscriber[];
}

/**
 * Count subscribers grouped by status.
 */
export async function countSubscribers(): Promise<{
  active: number;
  unsubscribed: number;
  total: number;
}> {
  const { data } = await supabase.from("subscribers").select("status");
  if (!data) return { active: 0, unsubscribed: 0, total: 0 };

  const active = data.filter((s: any) => s.status === "active").length;
  const unsubscribed = data.length - active;
  return { active, unsubscribed, total: data.length };
}

/**
 * Delete a subscriber by ID.
 */
export async function deleteSubscriber(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("subscribers").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Admin — Newsletters CRUD
// ---------------------------------------------------------------------------

/**
 * List all newsletters, optionally filtered by search.
 */
export async function fetchNewsletters(
  search?: string
): Promise<Newsletter[]> {
  let query = supabase
    .from("newsletters")
    .select("*")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`title.ilike.%${search}%,subject.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) return [];
  return (data || []) as Newsletter[];
}

/**
 * Get a single newsletter by ID.
 */
export async function getNewsletter(id: string): Promise<Newsletter | null> {
  const { data, error } = await supabase
    .from("newsletters")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as Newsletter;
}

/**
 * Create a newsletter (always starts as draft).
 */
export async function createNewsletter(data: {
  title: string;
  subject: string;
  body_html: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const { data: row, error } = await supabase
    .from("newsletters")
    .insert({ title: data.title, subject: data.subject, body_html: data.body_html })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, id: row.id };
}

/**
 * Update an existing newsletter (drafts only — sending/sent ones should
 * not be edited, but we enforce that in the UI, not here).
 */
export async function updateNewsletter(
  id: string,
  data: { title?: string; subject?: string; body_html?: string }
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("newsletters")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Delete a newsletter. Cascade will remove associated newsletter_sends.
 */
export async function deleteNewsletter(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("newsletters").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Admin — Send newsletter
// ---------------------------------------------------------------------------

/**
 * Send a newsletter to all active subscribers.
 *
 * Flow:
 *   1. Fetch the newsletter, bail if not found or already sent
 *   2. Fetch all active subscribers
 *   3. Mark the newsletter as "sending"
 *   4. For each subscriber: build personalised HTML, call sendEmail,
 *      and record a newsletter_send row (sent or failed)
 *   5. Mark the newsletter as "sent" with recipient_count = success count
 *
 * @param newsletterId  UUID of the newsletter to send
 * @param onProgress   Optional callback (sent+failed count, total) for UI progress
 */
export async function sendNewsletter(
  newsletterId: string,
  onProgress?: (sent: number, total: number) => void
): Promise<{ ok: boolean; sent: number; failed: number; error?: string }> {
  // 1. Fetch the newsletter
  const nl = await getNewsletter(newsletterId);
  if (!nl)
    return { ok: false, sent: 0, failed: 0, error: "Newsletter not found" };
  if (nl.status === "sent")
    return { ok: false, sent: 0, failed: 0, error: "Already sent" };

  // 2. Fetch active subscribers
  const subscribers = await fetchSubscribers();
  const activeSubscribers = subscribers.filter((s) => s.status === "active");
  if (activeSubscribers.length === 0)
    return { ok: false, sent: 0, failed: 0, error: "No active subscribers" };

  // 3. Mark as sending
  await supabase
    .from("newsletters")
    .update({ status: "sending" })
    .eq("id", newsletterId);

  // 4. Send to each subscriber
  let sent = 0;
  let failed = 0;

  for (const sub of activeSubscribers) {
    const unsubscribeUrl = `https://www.yatricloud.com/unsubscribe?token=${sub.unsubscribe_token}`;
    const html = getNewsletterEmail(
      nl.subject,
      nl.body_html,
      unsubscribeUrl,
      sub.name || undefined,
      newsletterId,
      sub.id
    );

    try {
      const emailResult = await sendEmail({ to: sub.email, subject: nl.subject, html });
      if (!emailResult.success) {
        throw new Error(emailResult.error || "Email send failed");
      }

      try {
        await supabase.from("newsletter_sends").insert({
          newsletter_id: newsletterId,
          subscriber_id: sub.id,
          status: "sent",
          sent_at: new Date().toISOString(),
        });
      } catch {
        // Non-blocking: continue even if tracking row write fails.
      }

      sent++;
    } catch {
      try {
        await supabase.from("newsletter_sends").insert({
          newsletter_id: newsletterId,
          subscriber_id: sub.id,
          status: "failed",
        });
      } catch {
        // Non-blocking: continue even if tracking row write fails.
      }
      failed++;
    }

    onProgress?.(sent + failed, activeSubscribers.length);
  }

  // 5. Mark as sent with final counts (best-effort; don't let tracking issues block the UI)
  try {
    const { error } = await supabase
      .from("newsletters")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        recipient_count: sent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", newsletterId);

    if (error) {
      console.error("[newsletter] failed to mark newsletter as sent", error);
    }
  } catch (error) {
    console.error("[newsletter] failed to mark newsletter as sent", error);
  }

  return { ok: true, sent, failed };
}

// ---------------------------------------------------------------------------
// Admin — Export
// ---------------------------------------------------------------------------

/**
 * Export a subscriber list as a CSV string.
 * Caller provides the array (from fetchSubscribers) so this stays
 * purely synchronous and testable.
 */
export function exportSubscribersCsv(subscribers: Subscriber[]): string {
  const header = "Email,Name,Status,Subscribed,Unsubscribed";
  const rows = subscribers.map((s) =>
    [
      s.email,
      s.name || "",
      s.status,
      new Date(s.created_at).toLocaleDateString(),
      s.unsubscribed_at
        ? new Date(s.unsubscribed_at).toLocaleDateString()
        : "",
    ]
      .map((v) => `"${v.replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header, ...rows].join("\n");
}

// ---------------------------------------------------------------------------
// Admin — Schedule
// ---------------------------------------------------------------------------

/**
 * Schedule a newsletter for later sending.
 * Only draft newsletters can be scheduled.
 */
export async function scheduleNewsletter(
  id: string,
  scheduledAt: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("newsletters")
    .update({ scheduled_at: scheduledAt, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "draft");
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Fetch newsletters that are due to be sent (for cron/worker).
 * Returns draft newsletters whose scheduled_at has passed.
 */
export async function fetchDueNewsletters(): Promise<Newsletter[]> {
  const { data, error } = await supabase
    .from("newsletters")
    .select("*")
    .eq("status", "draft")
    .not("scheduled_at", "is", null)
    .lte("scheduled_at", new Date().toISOString());
  if (error) return [];
  return (data || []) as Newsletter[];
}

// ---------------------------------------------------------------------------
// Tracking URL helpers
// ---------------------------------------------------------------------------

// Build a tracking pixel URL for open tracking
export function getTrackingPixelUrl(newsletterId: string, subscriberId: string): string {
  const base = typeof window !== "undefined" ? window.location.origin : "https://www.yatricloud.com";
  return `${base}/api/send-email?type=open&nl=${newsletterId}&sub=${subscriberId}`;
}

// Build a click-tracking redirect URL
export function getTrackingClickUrl(newsletterId: string, subscriberId: string, targetUrl: string): string {
  const base = typeof window !== "undefined" ? window.location.origin : "https://www.yatricloud.com";
  return `${base}/api/send-email?type=click&nl=${newsletterId}&sub=${subscriberId}&url=${encodeURIComponent(targetUrl)}`;
}
