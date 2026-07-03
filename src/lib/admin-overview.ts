/**
 * Numbers for the admin overview landing.
 *
 * Counts use head-only queries (no rows pulled). Revenue sums the invoices the
 * payment flow writes, grouped by currency so international amounts are never
 * added together. Admins read every row via RLS. Never throws — a failed piece
 * simply comes back as zero so the page still renders.
 */

import { supabase } from "@/lib/supabase";

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
