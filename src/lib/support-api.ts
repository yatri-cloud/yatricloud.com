import { supabase } from "@/lib/supabase";
import { getCachedUser } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { BASE_TEMPLATE } from "@/lib/email-templates";

/**
 * Support tickets (migration 076) — threaded tickets between Yatris and the
 * admin team, with automatic email notifications on every meaningful touch:
 * confirmation on open, admin replies, resolution, and reopen-on-reply.
 * RLS is the boundary: owners see their tickets, admins see the queue.
 */

export type TicketStatus = "open" | "pending" | "resolved" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  pending: "Waiting on you",
  resolved: "Resolved",
  closed: "Closed",
};

export const ADMIN_STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  pending: "Waiting on Yatri",
  resolved: "Resolved",
  closed: "Closed",
};

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  name: string;
  email: string;
  category: string;
  subject: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  lastActivityAt: string;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  sender: "user" | "admin";
  body: string;
  isInternal: boolean;
  createdAt: string;
}

const SUPPORT_INBOX = "info@yatricloud.com";

function rowToTicket(row: any): SupportTicket {
  return {
    id: row.id,
    ticketNumber: row.ticket_number,
    userId: row.user_id,
    name: row.name || "",
    email: row.email || "",
    category: row.category || "other",
    subject: row.subject || "",
    priority: row.priority || "normal",
    status: row.status || "open",
    createdAt: row.created_at,
    lastActivityAt: row.last_activity_at,
  };
}

function rowToMessage(row: any): SupportMessage {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    sender: row.sender,
    body: row.body || "",
    isInternal: row.is_internal || false,
    createdAt: row.created_at,
  };
}

/* ---------------- emails (best-effort, never block the flow) ---------------- */

function ticketUrl(ticketNumber: string): string {
  return `https://www.yatricloud.com/support/${ticketNumber}`;
}

async function emailQuietly(to: string, subject: string, html: string) {
  try {
    await sendEmail({ to, subject, html });
  } catch (e) {
    console.error("[support] email failed", e);
  }
}

function ticketEmail(title: string, bodyHtml: string, ticketNumber: string): string {
  const content = `
    <h2 style="margin:0 0 16px;">${title}</h2>
    ${bodyHtml}
    <p style="text-align:center;margin:28px 0 8px;">
      <a href="${ticketUrl(ticketNumber)}" style="display:inline-block;padding:12px 24px;background:#007CFF;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">
        View ticket ${ticketNumber}
      </a>
    </p>`;
  return BASE_TEMPLATE(content, title);
}

/* ---------------- user side ---------------- */

export async function createTicket(input: {
  category: string;
  subject: string;
  message: string;
}): Promise<{ ticket: SupportTicket | null; error: string | null }> {
  const user = getCachedUser();
  if (!user?.id) return { ticket: null, error: "Please sign in to open a ticket." };

  const { data, error } = await supabase
    .from("support_tickets")
    .insert({
      user_id: user.id,
      name: user.fullName || user.email?.split("@")[0] || "A Yatri",
      email: user.email,
      category: input.category,
      subject: input.subject.trim(),
    })
    .select("*")
    .single();
  if (error || !data) {
    console.error("[support] createTicket", error?.message);
    return { ticket: null, error: "We could not open your ticket. Please try again." };
  }
  const ticket = rowToTicket(data);

  const { error: msgErr } = await supabase.from("support_messages").insert({
    ticket_id: ticket.id,
    sender: "user",
    author_id: user.id,
    body: input.message.trim(),
  });
  if (msgErr) console.error("[support] first message", msgErr.message);

  // Auto-confirmation to the Yatri + heads-up to the support inbox.
  void emailQuietly(
    ticket.email,
    `We got your ticket ${ticket.ticketNumber}: ${ticket.subject}`,
    ticketEmail(
      "Your ticket is in, Yatri",
      `<p>Thanks for reaching out. Our team has your ticket <strong>${ticket.ticketNumber}</strong> — <em>${ticket.subject}</em> — and will reply by email and on your ticket page. You can add details any time.</p>`,
      ticket.ticketNumber
    )
  );
  void emailQuietly(
    SUPPORT_INBOX,
    `New support ticket ${ticket.ticketNumber}: ${ticket.subject}`,
    ticketEmail(
      "New support ticket",
      `<p><strong>${ticket.name}</strong> (${ticket.email}) opened <strong>${ticket.ticketNumber}</strong> in <em>${ticket.category}</em>:</p><p style="white-space:pre-line;border-left:3px solid #007CFF;padding-left:12px;">${input.message.trim()}</p>`,
      ticket.ticketNumber
    )
  );

  return { ticket, error: null };
}

export async function listMyTickets(): Promise<SupportTicket[]> {
  const uid = getCachedUser()?.id;
  if (!uid) return [];
  const { data, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("user_id", uid)
    .order("last_activity_at", { ascending: false });
  if (error) {
    console.error("[support] listMyTickets", error.message);
    return [];
  }
  return (data || []).map(rowToTicket);
}

export async function getTicketByNumber(ticketNumber: string): Promise<SupportTicket | null> {
  if (!ticketNumber) return null;
  const { data } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("ticket_number", ticketNumber)
    .maybeSingle();
  return data ? rowToTicket(data) : null;
}

export async function listMessages(ticketId: string): Promise<SupportMessage[]> {
  const { data, error } = await supabase
    .from("support_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[support] listMessages", error.message);
    return [];
  }
  return (data || []).map(rowToMessage);
}

/** Yatri replies: adds the message, reopens resolved/pending tickets. */
export async function replyAsUser(
  ticket: SupportTicket,
  body: string
): Promise<{ ok: boolean; error: string | null }> {
  const uid = getCachedUser()?.id;
  if (!uid) return { ok: false, error: "Please sign in first." };
  const { error } = await supabase.from("support_messages").insert({
    ticket_id: ticket.id,
    sender: "user",
    author_id: uid,
    body: body.trim(),
  });
  if (error) {
    console.error("[support] replyAsUser", error.message);
    return { ok: false, error: "Your reply did not send. Please try again." };
  }
  // A user reply always puts the ball back in support's court.
  await supabase
    .from("support_tickets")
    .update({ status: "open", last_activity_at: new Date().toISOString(), resolved_at: null })
    .eq("id", ticket.id);

  void emailQuietly(
    SUPPORT_INBOX,
    `Reply on ${ticket.ticketNumber}: ${ticket.subject}`,
    ticketEmail(
      "A Yatri replied",
      `<p><strong>${ticket.name}</strong> replied on <strong>${ticket.ticketNumber}</strong>:</p><p style="white-space:pre-line;border-left:3px solid #007CFF;padding-left:12px;">${body.trim()}</p>`,
      ticket.ticketNumber
    )
  );
  return { ok: true, error: null };
}

/** Yatri marks their own ticket solved. */
export async function closeMyTicket(ticket: SupportTicket): Promise<boolean> {
  const { error } = await supabase
    .from("support_tickets")
    .update({ status: "closed", closed_at: new Date().toISOString(), last_activity_at: new Date().toISOString() })
    .eq("id", ticket.id);
  if (error) console.error("[support] closeMyTicket", error.message);
  return !error;
}

/* ---------------- admin side ---------------- */

export async function listAllTickets(): Promise<SupportTicket[]> {
  const { data, error } = await supabase
    .from("support_tickets")
    .select("*")
    .order("last_activity_at", { ascending: false });
  if (error) {
    console.error("[support] listAllTickets", error.message);
    return [];
  }
  return (data || []).map(rowToTicket);
}

/** Admin reply (or internal note). Replies email the Yatri and set 'pending'. */
export async function replyAsAdmin(
  ticket: SupportTicket,
  body: string,
  isInternal: boolean
): Promise<{ ok: boolean; error: string | null }> {
  const uid = getCachedUser()?.id;
  const { error } = await supabase.from("support_messages").insert({
    ticket_id: ticket.id,
    sender: "admin",
    author_id: uid || null,
    body: body.trim(),
    is_internal: isInternal,
  });
  if (error) {
    console.error("[support] replyAsAdmin", error.message);
    return { ok: false, error: "The reply did not save. Please try again." };
  }
  if (!isInternal) {
    await supabase
      .from("support_tickets")
      .update({ status: "pending", last_activity_at: new Date().toISOString() })
      .eq("id", ticket.id);
    void emailQuietly(
      ticket.email,
      `Re: [${ticket.ticketNumber}] ${ticket.subject}`,
      ticketEmail(
        "Yatri Cloud support replied",
        `<p style="white-space:pre-line;">${body.trim()}</p><p style="color:#667085;">Reply on your ticket page and we will pick it right up.</p>`,
        ticket.ticketNumber
      )
    );
  } else {
    await supabase
      .from("support_tickets")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", ticket.id);
  }
  return { ok: true, error: null };
}

export async function setTicketStatus(ticket: SupportTicket, status: TicketStatus): Promise<boolean> {
  const patch: Record<string, unknown> = { status, last_activity_at: new Date().toISOString() };
  if (status === "resolved") patch.resolved_at = new Date().toISOString();
  if (status === "closed") patch.closed_at = new Date().toISOString();
  const { error } = await supabase.from("support_tickets").update(patch).eq("id", ticket.id);
  if (error) {
    console.error("[support] setTicketStatus", error.message);
    return false;
  }
  if (status === "resolved") {
    void emailQuietly(
      ticket.email,
      `Resolved: [${ticket.ticketNumber}] ${ticket.subject}`,
      ticketEmail(
        "Your ticket is resolved",
        `<p>We believe <strong>${ticket.ticketNumber}</strong> — <em>${ticket.subject}</em> — is sorted. If anything still feels off, just reply on the ticket and it reopens automatically.</p>`,
        ticket.ticketNumber
      )
    );
  }
  return true;
}

export async function setTicketPriority(ticketId: string, priority: TicketPriority): Promise<boolean> {
  const { error } = await supabase.from("support_tickets").update({ priority }).eq("id", ticketId);
  if (error) console.error("[support] setTicketPriority", error.message);
  return !error;
}
