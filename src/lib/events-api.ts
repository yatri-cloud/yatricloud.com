// Events data-access layer — Supabase backend.
//
// Replaces the legacy localStorage store (events-store.ts) and the Google
// Apps Script flows. The rich frontend `Event` shape is mapped to/from the
// flat `events` table: primitive fields go into real columns (event_date,
// location/city/country, price_inr, image_url, meet_link, ticket_type,
// status, slug, name) and the remaining nested data (speakers, sponsors,
// tickets, gallery, organizer, techStack, timezone, collaboration flags, …)
// is JSON-encoded into the `description` column and rebuilt on read.

import { supabase } from "@/lib/supabase";
import type { Event } from "@/lib/events-store";
import type { EventRegistration } from "@/lib/registration-store";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type EventRow = Record<string, any>;

// ---------- mapping helpers ----------
function isPaidPrice(price: Event["price"]): boolean {
    if (price === undefined || price === null) return false;
    const s = String(price).trim();
    if (s === "" || s.toLowerCase() === "free") return false;
    const n = typeof price === "number" ? price : parseFloat(s);
    return !Number.isNaN(n) && n > 0;
}

function eventToRow(event: Event): EventRow {
    const paid = isPaidPrice(event.price);
    const priceNum = paid
        ? (typeof event.price === "number" ? event.price : parseFloat(String(event.price)))
        : null;

    // Everything the flat columns can't hold — round-tripped on read.
    const ext = {
        __yc: 1,
        description: event.description ?? "",
        fullDescription: event.fullDescription,
        timezone: event.timezone,
        endDate: event.endDate,
        category: event.category,
        techStack: event.techStack,
        registrationDeadline: event.registrationDeadline,
        communityLink: event.communityLink,
        organizer: event.organizer,
        sponsors: event.sponsors,
        speakers: event.speakers,
        tickets: event.tickets,
        gallery: event.gallery,
        attendees: event.attendees,
        isUpcoming: event.isUpcoming,
        lookingForVenue: event.lookingForVenue,
        lookingForSpeakers: event.lookingForSpeakers,
        lookingForSponsors: event.lookingForSponsors,
        requiresLogin: event.requiresLogin,
        locationType: event.location?.type,
        venue: event.location?.venue,
        mapLink: event.location?.mapLink,
        state: event.location?.state,
        priceLabel: paid ? undefined : "Free",
    };

    const row: EventRow = {
        slug: event.slug || null,
        name: event.name || "Untitled Event",
        description: JSON.stringify(ext),
        event_date: event.date ? new Date(event.date).toISOString() : null,
        location: event.location?.venue || null,
        city: event.location?.city || null,
        country: event.location?.country || null,
        capacity: event.seatsAvailable ?? null,
        ticket_type: paid ? "paid" : "free",
        price_inr: priceNum,
        image_url: event.imageUrl || null,
        meet_link: event.communityLink || event.location?.mapLink || null,
        status: event.status === "draft" ? "draft" : "published",
    };
    // Preserve the app-generated UUID so upserts by id keep working.
    if (event.id && UUID_RE.test(event.id)) row.id = event.id;
    return row;
}

function rowToEvent(row: EventRow): Event {
    let ext: any = {};
    let plainDescription: string | undefined;
    if (typeof row.description === "string") {
        try {
            const parsed = JSON.parse(row.description);
            if (parsed && parsed.__yc) ext = parsed;
            else plainDescription = row.description;
        } catch {
            plainDescription = row.description;
        }
    }

    const computedStatus: Event["status"] =
        row.status === "draft"
            ? "draft"
            : row.event_date && new Date(row.event_date) > new Date()
                ? "upcoming"
                : "past";

    const price =
        row.ticket_type === "paid"
            ? (row.price_inr ?? undefined)
            : "Free";

    return {
        id: row.id,
        slug: row.slug || undefined,
        name: row.name || "",
        description: ext.description ?? plainDescription ?? "",
        fullDescription: ext.fullDescription,
        imageUrl: row.image_url || "",
        date: row.event_date || "",
        endDate: ext.endDate,
        timezone: ext.timezone || "IST",
        location: {
            type: ext.locationType || "offline",
            venue: ext.venue ?? row.location ?? undefined,
            mapLink: ext.mapLink,
            city: row.city ?? undefined,
            state: ext.state,
            country: row.country ?? undefined,
        },
        category: ext.category || "",
        status: computedStatus,
        isUpcoming: ext.isUpcoming,
        lookingForVenue: ext.lookingForVenue,
        lookingForSpeakers: ext.lookingForSpeakers,
        lookingForSponsors: ext.lookingForSponsors,
        price: price as Event["price"],
        registrationDeadline: ext.registrationDeadline,
        seatsAvailable: row.capacity ?? undefined,
        communityLink: ext.communityLink ?? row.meet_link ?? undefined,
        organizer: ext.organizer,
        techStack: ext.techStack,
        requiresLogin: ext.requiresLogin,
        sponsors: ext.sponsors,
        speakers: ext.speakers,
        tickets: ext.tickets,
        attendees: ext.attendees,
        gallery: ext.gallery,
    };
}

// ---------- event reads ----------
export async function getAllEvents(): Promise<Event[]> {
    // RLS: an admin session returns every row; anon returns published only.
    const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: false });
    if (error) {
        console.error("[events-api] getAllEvents", error.message);
        return [];
    }
    return (data || []).map(rowToEvent);
}

export async function getPublishedEvents(): Promise<Event[]> {
    const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("status", "published")
        .order("event_date", { ascending: false });
    if (error) {
        console.error("[events-api] getPublishedEvents", error.message);
        return [];
    }
    return (data || []).map(rowToEvent);
}

export async function getEventBySlug(slug: string): Promise<Event | undefined> {
    if (!slug) return undefined;
    // Try slug first.
    const bySlug = await supabase.from("events").select("*").eq("slug", slug).limit(1);
    if (!bySlug.error && bySlug.data && bySlug.data.length > 0) {
        return rowToEvent(bySlug.data[0]);
    }
    // Fall back to id (only when the param looks like a UUID).
    if (UUID_RE.test(slug)) {
        const byId = await supabase.from("events").select("*").eq("id", slug).limit(1);
        if (!byId.error && byId.data && byId.data.length > 0) {
            return rowToEvent(byId.data[0]);
        }
    }
    return undefined;
}

export async function getEventById(id: string): Promise<Event | undefined> {
    if (!id || !UUID_RE.test(id)) return undefined;
    const { data, error } = await supabase.from("events").select("*").eq("id", id).limit(1);
    if (error || !data || data.length === 0) return undefined;
    return rowToEvent(data[0]);
}

// ---------- event writes ----------
export async function saveEvent(event: Event): Promise<Event | undefined> {
    const row = eventToRow(event);
    const { data, error } = await supabase
        .from("events")
        .upsert(row, { onConflict: "id" })
        .select("*")
        .limit(1);
    if (error) {
        console.error("[events-api] saveEvent", error.message);
        throw new Error(error.message);
    }
    return data && data.length > 0 ? rowToEvent(data[0]) : undefined;
}

export const createEvent = saveEvent;
export const updateEvent = saveEvent;

export async function deleteEvent(id: string): Promise<void> {
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) {
        console.error("[events-api] deleteEvent", error.message);
        throw new Error(error.message);
    }
}

// ---------- registrations ----------
export interface CreateRegistrationInput {
    eventId: string;
    userId?: string | null;
    codePrefix?: string;
    userDetails: {
        name: string;
        email: string;
        phone?: string;
        city?: string;
        state?: string;
        country?: string;
        linkedIn?: string;
    };
    paymentId?: string;
}

function generateRegistrationCode(prefix?: string): string {
    const clean = (prefix || "YC").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().substring(0, 10) || "YC";
    return `${clean}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function regRowToRegistration(row: EventRow): EventRegistration {
    return {
        id: row.id,
        userId: row.user_id || "",
        eventId: row.event_id,
        eventSlug: "",
        eventName: "",
        registrationCode: row.registration_code,
        registeredAt: row.created_at,
        status: row.status,
        attendedAt: row.attended_at || undefined,
        userDetails: {
            name: row.name,
            email: row.email,
            phone: row.phone || "",
            city: row.city || "",
            state: row.state || "",
            country: row.country || "",
            linkedIn: row.linkedin_url || undefined,
        },
        ticketType: row.payment_id ? "paid" : "free",
        paymentStatus: row.payment_id ? "completed" : undefined,
        paymentId: row.payment_id || undefined,
    };
}

export async function createRegistration(
    input: CreateRegistrationInput
): Promise<{ registrationCode: string; id: string }> {
    const registrationCode = generateRegistrationCode(input.codePrefix);
    const { data, error } = await supabase
        .from("event_registrations")
        .insert({
            event_id: input.eventId,
            user_id: input.userId || null,
            registration_code: registrationCode,
            name: input.userDetails.name,
            email: input.userDetails.email,
            phone: input.userDetails.phone || null,
            city: input.userDetails.city || null,
            state: input.userDetails.state || null,
            country: input.userDetails.country || null,
            linkedin_url: input.userDetails.linkedIn || null,
            status: "registered",
            payment_id: input.paymentId || null,
        })
        .select("id, registration_code")
        .single();
    if (error) {
        console.error("[events-api] createRegistration", error.message);
        throw error;
    }
    return { registrationCode: data.registration_code, id: data.id };
}

export async function getEventRegistrations(eventId: string): Promise<EventRegistration[]> {
    if (!eventId) return [];
    const { data, error } = await supabase
        .from("event_registrations")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
    if (error) {
        console.error("[events-api] getEventRegistrations", error.message);
        return [];
    }
    return (data || []).map(regRowToRegistration);
}

export async function cancelRegistration(id: string): Promise<boolean> {
    const { error } = await supabase
        .from("event_registrations")
        .update({ status: "cancelled" })
        .eq("id", id);
    if (error) {
        console.error("[events-api] cancelRegistration", error.message);
        return false;
    }
    return true;
}

export async function updateRegistrationDetails(
    id: string,
    updates: Partial<EventRegistration["userDetails"]>
): Promise<boolean> {
    const patch: Record<string, unknown> = {};
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.email !== undefined) patch.email = updates.email;
    if (updates.phone !== undefined) patch.phone = updates.phone;
    if (updates.city !== undefined) patch.city = updates.city;
    if (updates.state !== undefined) patch.state = updates.state;
    if (updates.country !== undefined) patch.country = updates.country;
    if (updates.linkedIn !== undefined) patch.linkedin_url = updates.linkedIn;
    const { error } = await supabase.from("event_registrations").update(patch).eq("id", id);
    if (error) {
        console.error("[events-api] updateRegistrationDetails", error.message);
        return false;
    }
    return true;
}

// ---------- media upload (Supabase Storage) ----------
export async function uploadEventMediaFile(
    fileName: string,
    fileData: File | Blob,
    mimeType: string
): Promise<{ success: boolean; fileUrl?: string; error?: string }> {
    try {
        const safeName = fileName.replace(/[^\w.-]+/g, "_");
        const path = `events/${Date.now()}-${safeName}`;
        const { error } = await supabase.storage
            .from("product-images")
            .upload(path, fileData, { upsert: true, contentType: mimeType });
        if (error) throw error;
        const fileUrl = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
        return { success: true, fileUrl };
    } catch (error: any) {
        console.error("[events-api] uploadEventMediaFile", error?.message);
        return { success: false, error: error?.message || "Upload failed" };
    }
}
