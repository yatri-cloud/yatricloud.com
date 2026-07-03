/**
 * Client for the admin Razorpay gateway (api/razorpay/admin.ts).
 *
 * Every call carries the signed-in admin's Supabase access token; the server
 * verifies the admin role before talking to Razorpay. These helpers never see
 * the Razorpay secret. They throw an Error with a friendly message on failure
 * so callers can toast it.
 */

import { supabase } from "@/lib/supabase";

export interface RazorpayInvoice {
  id: string;
  invoice_number: string | null;
  status: string; // draft | issued | partially_paid | paid | cancelled | expired
  amount: number; // smallest unit
  amount_paid: number;
  currency: string;
  short_url: string | null;
  description: string | null;
  date: number | null; // unix seconds (created)
  paid_at?: number | null; // unix seconds (when marked paid), if paid
  customer_details?: { name?: string; email?: string; contact?: string } | null;
}

export interface RazorpayPayment {
  id: string;
  amount: number; // smallest unit
  amount_refunded: number; // smallest unit
  currency: string;
  status: string; // created | authorized | captured | refunded | failed
  method: string | null;
  email: string | null;
  contact: string | null;
  description?: string | null;
  created_at: number | null;
}

async function accessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Please sign in again.");
  return token;
}

/**
 * RFC 10008: list actions are safe, idempotent queries with a request body,
 * so they go over the HTTP QUERY method (semantically correct, keeps the
 * token and params out of URLs and logs, and lets caches/retries treat them
 * as safe). Mutations always use POST. If anything between the browser and
 * the function rejects QUERY, we learn that once and fall back to POST for
 * the rest of the session — behavior never breaks.
 */
const QUERY_ACTIONS = new Set(["invoices.list", "payments.list"]);
let queryMethodBroken = false;

async function call<T>(action: string, params: Record<string, unknown> = {}): Promise<T> {
  const access_token = await accessToken();
  const body = JSON.stringify({ action, access_token, ...params });
  const headers = { "Content-Type": "application/json" };
  const useQuery = QUERY_ACTIONS.has(action) && !queryMethodBroken;

  let res: Response;
  try {
    res = await fetch("/api/razorpay/admin", { method: useQuery ? "QUERY" : "POST", headers, body });
  } catch (err) {
    // A network-level rejection of the method itself — remember and retry POST.
    if (!useQuery) throw err;
    queryMethodBroken = true;
    res = await fetch("/api/razorpay/admin", { method: "POST", headers, body });
  }

  let data = await res.json().catch(() => ({} as Record<string, unknown>));

  // Method-level failures (proxy/platform not passing QUERY through, or the
  // body not reaching the handler) — not auth or action errors.
  const methodFailure =
    useQuery &&
    (res.status === 405 || res.status === 501 || res.status === 415 ||
      (res.status === 400 && String((data as any)?.message || "").startsWith("Missing action")));
  if (methodFailure) {
    queryMethodBroken = true;
    res = await fetch("/api/razorpay/admin", { method: "POST", headers, body });
    data = await res.json().catch(() => ({} as Record<string, unknown>));
  }

  if (!res.ok || !(data as any)?.ok) throw new Error((data as any)?.message || "Something went wrong.");
  return data as T;
}

export async function listRazorpayInvoices(count = 50, skip = 0): Promise<RazorpayInvoice[]> {
  const data = await call<{ items: RazorpayInvoice[] }>("invoices.list", { count, skip });
  return data.items || [];
}

export async function createRazorpayInvoice(input: {
  customer: { name: string; email: string; contact?: string };
  description?: string;
  item_name: string;
  amount: number;
  currency: string;
  notify?: boolean;
}): Promise<{ id: string; status: string; short_url: string | null; amount: number; currency: string }> {
  const data = await call<{ invoice: { id: string; status: string; short_url: string | null; amount: number; currency: string } }>(
    "invoices.create",
    input as unknown as Record<string, unknown>,
  );
  return data.invoice;
}

export async function cancelRazorpayInvoice(invoice_id: string): Promise<string> {
  const data = await call<{ status: string }>("invoices.cancel", { invoice_id });
  return data.status;
}

export async function listRazorpayPayments(count = 50, skip = 0): Promise<RazorpayPayment[]> {
  const data = await call<{ items: RazorpayPayment[] }>("payments.list", { count, skip });
  return data.items || [];
}

/** Refund a captured payment. Omit amount for a full refund; pass major units for partial. */
export async function refundPayment(input: {
  payment_id: string;
  amount?: number;
  currency?: string;
}): Promise<{ id: string; amount: number; currency: string; status: string }> {
  const data = await call<{ refund: { id: string; amount: number; currency: string; status: string } }>(
    "payments.refund",
    input as unknown as Record<string, unknown>,
  );
  return data.refund;
}
