/**
 * Numbers for the admin overview landing.
 *
 * Counts use head-only queries (no rows pulled). Revenue sums the invoices the
 * payment flow writes, grouped by currency so international amounts are never
 * added together. Admins read every row via RLS. Never throws — a failed piece
 * simply comes back as zero so the page still renders.
 */

import { supabase } from "@/lib/supabase";
import { startOfMonth, subMonths } from "date-fns";

export interface AdminOverview {
    yatris: number;
    events: number;
    trainings: number;
    enrollments: number;
    eventRegistrations: number;
    mentorshipBookings: number;
    receipts: number;
    inrRevenue: number;
    otherRevenue: Record<string, number>; // currency -> summed amount (non INR)
}

async function countOf(table: string): Promise<number> {
    try {
        const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
        if (error) return 0;
        return count ?? 0;
    } catch {
        return 0;
    }
}

async function revenue(): Promise<{ receipts: number; inr: number; other: Record<string, number> }> {
    try {
        const { data, error } = await supabase.from("invoices").select("amount, currency").limit(5000);
        if (error || !Array.isArray(data)) return { receipts: 0, inr: 0, other: {} };
        let inr = 0;
        const other: Record<string, number> = {};
        for (const row of data as Array<{ amount: number; currency: string }>) {
            const cur = String(row.currency || "INR").toUpperCase();
            const amt = Number(row.amount) || 0;
            if (cur === "INR") inr += amt;
            else other[cur] = (other[cur] || 0) + amt;
        }
        return { receipts: data.length, inr, other };
    } catch {
        return { receipts: 0, inr: 0, other: {} };
    }
}

export interface RecentReceipt {
    number: string;
    label: string; // item or kind
    amount: number;
    currency: string;
    createdAt: string;
}

export interface RecentYatri {
    name: string;
    email: string;
    createdAt: string;
}

export interface RecentActivity {
    receipts: RecentReceipt[];
    yatris: RecentYatri[];
}

/** Latest receipts and newest Yatris for the overview. Never throws. */
export async function getRecentActivity(limit = 6): Promise<RecentActivity> {
    const receiptsQ = supabase
        .from("invoices")
        .select("invoice_number, kind, buyer_name, items, amount, currency, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
    const yatrisQ = supabase
        .from("profiles")
        .select("full_name, email, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);

    const [rRes, yRes] = await Promise.all([receiptsQ, yatrisQ]);

    const receipts: RecentReceipt[] = Array.isArray(rRes.data)
        ? rRes.data.map((r: any) => {
              const items = Array.isArray(r.items) ? r.items : [];
              const first = items[0];
              const itemName = typeof first === "string" ? first : first?.name || first?.title || "";
              return {
                  number: String(r.invoice_number || ""),
                  label: itemName || String(r.kind || "Purchase"),
                  amount: Number(r.amount) || 0,
                  currency: String(r.currency || "INR").toUpperCase(),
                  createdAt: String(r.created_at || ""),
              };
          })
        : [];

    const yatris: RecentYatri[] = Array.isArray(yRes.data)
        ? yRes.data.map((p: any) => ({
              name: String(p.full_name || "").trim() || "Yatri",
              email: String(p.email || ""),
              createdAt: String(p.created_at || ""),
          }))
        : [];

    return { receipts, yatris };
}

export interface Trend {
    thisMonth: number;
    lastMonth: number;
}

export interface GrowthTrends {
    yatris: Trend;
    inrRevenue: Trend;
    receipts: Trend;
}

async function countBetween(table: string, fromIso: string, toIso: string): Promise<number> {
    try {
        const { count, error } = await supabase
            .from(table)
            .select("*", { count: "exact", head: true })
            .gte("created_at", fromIso)
            .lt("created_at", toIso);
        return error ? 0 : count ?? 0;
    } catch {
        return 0;
    }
}

/** Sum INR invoice revenue and count receipts in a window. Never throws. */
async function invoicesBetween(fromIso: string, toIso: string): Promise<{ inr: number; receipts: number }> {
    try {
        const { data, error } = await supabase
            .from("invoices")
            .select("amount, currency, created_at")
            .gte("created_at", fromIso)
            .lt("created_at", toIso);
        if (error || !Array.isArray(data)) return { inr: 0, receipts: 0 };
        let inr = 0;
        for (const r of data as Array<{ amount: number; currency: string }>) {
            if (String(r.currency || "INR").toUpperCase() === "INR") inr += Number(r.amount) || 0;
        }
        return { inr, receipts: data.length };
    } catch {
        return { inr: 0, receipts: 0 };
    }
}

/** This month vs last month for Yatris, INR revenue and receipts. Never throws. */
export async function getGrowthTrends(): Promise<GrowthTrends> {
    const now = new Date();
    const thisStart = startOfMonth(now).toISOString();
    const lastStart = startOfMonth(subMonths(now, 1)).toISOString();
    const nextStart = startOfMonth(subMonths(now, -1)).toISOString();

    const [yThis, yLast, iThis, iLast] = await Promise.all([
        countBetween("profiles", thisStart, nextStart),
        countBetween("profiles", lastStart, thisStart),
        invoicesBetween(thisStart, nextStart),
        invoicesBetween(lastStart, thisStart),
    ]);

    return {
        yatris: { thisMonth: yThis, lastMonth: yLast },
        inrRevenue: { thisMonth: iThis.inr, lastMonth: iLast.inr },
        receipts: { thisMonth: iThis.receipts, lastMonth: iLast.receipts },
    };
}

export async function getAdminOverview(): Promise<AdminOverview> {
    const [
        yatris, events, trainings, enrollments, eventRegistrations, mentorshipBookings, rev,
    ] = await Promise.all([
        countOf("profiles"),
        countOf("events"),
        countOf("trainings"),
        countOf("training_enrollments"),
        countOf("event_registrations"),
        countOf("mentorship_bookings"),
        revenue(),
    ]);

    return {
        yatris,
        events,
        trainings,
        enrollments,
        eventRegistrations,
        mentorshipBookings,
        receipts: rev.receipts,
        inrRevenue: rev.inr,
        otherRevenue: rev.other,
    };
}
