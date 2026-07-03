/**
 * A Yatri's earned certificates.
 *
 * Certificates are publicly verifiable by serial, so the table is world
 * readable; here we simply scope to the signed-in user's id to list their own.
 * Nothing is exposed but the serial (a share link) and the display fields.
 * Never throws.
 */

import { supabase } from "@/lib/supabase";

export interface MyCertificate {
    /** Public serial, e.g. YC-CERT-20260703-AB12CD. Used in the verify link. */
    serial: string;
    kind: "training" | "event";
    kindLabel: string;
    title: string;
    recipientName: string;
    issuedAt: string;
}

export async function getMyCertificates(): Promise<MyCertificate[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
        .from("certificates")
        .select("serial, kind, title, recipient_name, issued_at")
        .eq("user_id", user.id)
        .order("issued_at", { ascending: false });
    if (error || !Array.isArray(data)) return [];
    return data.map((r: any) => ({
        serial: String(r.serial || ""),
        kind: (r.kind === "event" ? "event" : "training") as "training" | "event",
        kindLabel: r.kind === "event" ? "Event attendance" : "Training completion",
        title: String(r.title || "Certificate"),
        recipientName: String(r.recipient_name || ""),
        issuedAt: String(r.issued_at || ""),
    }));
}
