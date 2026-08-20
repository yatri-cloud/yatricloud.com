/**
 * Email Logs API
 * CRUD helpers for the email_logs table (admin-only via RLS).
 */

import { supabase } from "@/lib/supabase";

export interface EmailLog {
  id: string;
  to_email: string;
  subject: string;
  template_key: string | null;
  status: "sent" | "failed";
  error: string | null;
  metadata: Record<string, unknown>;
  sent_at: string;
  created_at: string;
}

export interface EmailLogFilters {
  status?: "sent" | "failed";
  templateKey?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

/** Insert a log row — call after every sendEmail(). Non-blocking on error. */
export async function logEmail(params: {
  to: string;
  subject: string;
  templateKey?: string;
  status: "sent" | "failed";
  error?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await (supabase as any)
      .from("email_logs")
      .insert({
        to_email: params.to,
        subject: params.subject,
        template_key: params.templateKey ?? null,
        status: params.status,
        error: params.error ?? null,
        metadata: params.metadata ?? {},
      });
  } catch (e) {
    // Non-fatal — logging should never break the main flow
    console.warn("[email-logs] Failed to insert log:", e);
  }
}

/** Fetch logs with optional filters for the admin table. */
export async function fetchEmailLogs(
  filters: EmailLogFilters = {},
  limit = 200
): Promise<EmailLog[]> {
  let query = (supabase as any)
    .from("email_logs")
    .select("*")
    .order("sent_at", { ascending: false })
    .limit(limit);

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.templateKey) query = query.eq("template_key", filters.templateKey);
  if (filters.dateFrom) query = query.gte("sent_at", filters.dateFrom);
  if (filters.dateTo) query = query.lte("sent_at", filters.dateTo);
  if (filters.search) {
    query = query.or(
      `to_email.ilike.%${filters.search}%,subject.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error("fetchEmailLogs error:", error.message);
    return [];
  }
  return (data ?? []) as EmailLog[];
}

/** Count logs grouped by status. */
export async function countEmailLogs(): Promise<{
  total: number;
  sent: number;
  failed: number;
}> {
  const { data, error } = await (supabase as any)
    .from("email_logs")
    .select("status");
  if (error || !data) return { total: 0, sent: 0, failed: 0 };
  const sent = data.filter((r: any) => r.status === "sent").length;
  const failed = data.filter((r: any) => r.status === "failed").length;
  return { total: data.length, sent, failed };
}

/** Distinct template keys for the filter dropdown. */
export async function listEmailLogTemplates(): Promise<string[]> {
  const { data } = await (supabase as any)
    .from("email_logs")
    .select("template_key")
    .not("template_key", "is", null);
  if (!data) return [];
  const set = new Set<string>(data.map((r: any) => r.template_key).filter(Boolean));
  return Array.from(set).sort();
}

/** Delete a single log row. */
export async function deleteEmailLog(id: string): Promise<void> {
  await (supabase as any).from("email_logs").delete().eq("id", id);
}

/** Delete all logs. */
export async function clearEmailLogs(): Promise<void> {
  await (supabase as any).from("email_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
}
