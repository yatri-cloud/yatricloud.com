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
  customer_details?: { name?: string; email?: string; contact?: string } | null;
}

export interface RazorpayPayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string | null;
  email: string | null;
  contact: string | null;
  created_at: number | null;
}

async function accessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Please sign in again.");
  return token;
}

async function call<T>(action: string, params: Record<string, unknown> = {}): Promise<T> {
  const access_token = await accessToken();
  const res = await fetch("/api/razorpay/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, access_token, ...params }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) throw new Error(data?.message || "Something went wrong.");
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
