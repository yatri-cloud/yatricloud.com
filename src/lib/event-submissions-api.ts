// Event Submissions API — Supabase backend.
// Handles venue, speaker, and sponsor submissions for upcoming events.
// Writes to the `event_submissions` table (kind = 'venue' | 'speaker' | 'sponsor').

import { supabase } from "@/lib/supabase";

export interface VenueSubmission {
    id: string;
    eventId: string;
    eventName: string;
    venueName: string;
    address: string;
    capacity: number;
    facilities: string;
    contactName: string;
    contactEmail: string;
    contactPhone?: string;
    pricingTerms?: string;
    googleMapsLink?: string;
    additionalNotes?: string;
    submittedAt: string;
    status: 'pending' | 'approved' | 'rejected';
}

export interface SpeakerSubmission {
    id: string;
    eventId: string;
    eventName: string;
    fullName: string;
    email: string;
    linkedinWebsite?: string;
    bio: string;
    talkTitle: string;
    talkDescription: string;
    talkDuration?: string;
    topicCategory?: string;
    previousExperience?: string;
    submittedAt: string;
    status: 'pending' | 'approved' | 'rejected';
}

export interface SponsorSubmission {
    id: string;
    eventId: string;
    eventName: string;
    companyName: string;
    contactName: string;
    contactEmail: string;
    contactPhone?: string;
    sponsorshipTier?: string;
    sponsorshipBudget?: string;
    sponsorshipAreas: string[];
    additionalNotes?: string;
    submittedAt: string;
    status: 'pending' | 'approved' | 'rejected';
}

type SubmissionKind = 'venue' | 'speaker' | 'sponsor';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// event_registrations / events use real UUIDs. We only attach event_id when it
// resolves to a real UUID; otherwise keep it null and fall back to eventName in details.
function resolveEventId(eventId?: string): string | null {
    return eventId && UUID_RE.test(eventId) ? eventId : null;
}

// The full submission payload is stored in `details` (jsonb) so we can rebuild
// the rich frontend shape on read; the standard columns mirror key fields.
function rowToVenue(row: Record<string, any>): VenueSubmission {
    const d = row.details || {};
    return {
        ...d,
        id: row.id,
        eventId: row.event_id || d.eventId || "",
        eventName: d.eventName || "",
        submittedAt: row.created_at,
        status: row.status,
    };
}

function rowToSpeaker(row: Record<string, any>): SpeakerSubmission {
    const d = row.details || {};
    return {
        ...d,
        id: row.id,
        eventId: row.event_id || d.eventId || "",
        eventName: d.eventName || "",
        submittedAt: row.created_at,
        status: row.status,
    };
}

function rowToSponsor(row: Record<string, any>): SponsorSubmission {
    const d = row.details || {};
    return {
        ...d,
        id: row.id,
        eventId: row.event_id || d.eventId || "",
        eventName: d.eventName || "",
        sponsorshipAreas: d.sponsorshipAreas || [],
        submittedAt: row.created_at,
        status: row.status,
    };
}

async function insertSubmission(
    kind: SubmissionKind,
    eventId: string | undefined,
    columns: {
        name: string;
        email?: string;
        phone?: string;
        organization?: string;
        title?: string;
        bio?: string;
        links?: Record<string, unknown>;
    },
    details: Record<string, unknown>
) {
    const { data, error } = await supabase
        .from("event_submissions")
        .insert({
            event_id: resolveEventId(eventId),
            kind,
            name: columns.name,
            email: columns.email || null,
            phone: columns.phone || null,
            organization: columns.organization || null,
            title: columns.title || null,
            bio: columns.bio || null,
            links: columns.links || {},
            details,
            status: "pending",
        })
        .select("*")
        .single();
    if (error) {
        console.error("[event-submissions-api] insert", error.message);
        throw error;
    }
    return data;
}

export async function submitVenue(
    data: Omit<VenueSubmission, 'id' | 'submittedAt' | 'status'>
): Promise<VenueSubmission> {
    const row = await insertSubmission(
        "venue",
        data.eventId,
        {
            name: data.venueName,
            email: data.contactEmail,
            phone: data.contactPhone,
            organization: data.venueName,
            title: data.venueName,
            bio: data.facilities,
            links: data.googleMapsLink ? { googleMapsLink: data.googleMapsLink } : {},
        },
        data
    );
    return rowToVenue(row);
}

export async function getVenueSubmissions(eventId?: string): Promise<VenueSubmission[]> {
    let query = supabase.from("event_submissions").select("*").eq("kind", "venue");
    if (eventId && UUID_RE.test(eventId)) query = query.eq("event_id", eventId);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) {
        console.error("[event-submissions-api] getVenueSubmissions", error.message);
        return [];
    }
    return (data || []).map(rowToVenue);
}

export async function submitSpeaker(
    data: Omit<SpeakerSubmission, 'id' | 'submittedAt' | 'status'>
): Promise<SpeakerSubmission> {
    const row = await insertSubmission(
        "speaker",
        data.eventId,
        {
            name: data.fullName,
            email: data.email,
            title: data.talkTitle,
            bio: data.bio,
            links: data.linkedinWebsite ? { linkedinWebsite: data.linkedinWebsite } : {},
        },
        data
    );
    return rowToSpeaker(row);
}

export async function getSpeakerSubmissions(eventId?: string): Promise<SpeakerSubmission[]> {
    let query = supabase.from("event_submissions").select("*").eq("kind", "speaker");
    if (eventId && UUID_RE.test(eventId)) query = query.eq("event_id", eventId);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) {
        console.error("[event-submissions-api] getSpeakerSubmissions", error.message);
        return [];
    }
    return (data || []).map(rowToSpeaker);
}

export async function submitSponsor(
    data: Omit<SponsorSubmission, 'id' | 'submittedAt' | 'status'>
): Promise<SponsorSubmission> {
    const row = await insertSubmission(
        "sponsor",
        data.eventId,
        {
            name: data.companyName,
            email: data.contactEmail,
            phone: data.contactPhone,
            organization: data.companyName,
            title: data.sponsorshipTier,
            bio: data.additionalNotes,
        },
        data
    );
    return rowToSponsor(row);
}

export async function getSponsorSubmissions(eventId?: string): Promise<SponsorSubmission[]> {
    let query = supabase.from("event_submissions").select("*").eq("kind", "sponsor");
    if (eventId && UUID_RE.test(eventId)) query = query.eq("event_id", eventId);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) {
        console.error("[event-submissions-api] getSponsorSubmissions", error.message);
        return [];
    }
    return (data || []).map(rowToSponsor);
}

export async function updateSubmissionStatus(
    _type: SubmissionKind,
    id: string,
    status: 'approved' | 'rejected'
): Promise<boolean> {
    const { error } = await supabase
        .from("event_submissions")
        .update({ status })
        .eq("id", id);
    if (error) {
        console.error("[event-submissions-api] updateSubmissionStatus", error.message);
        return false;
    }
    return true;
}

// Get all submissions for an event
export async function getAllSubmissionsForEvent(eventId: string): Promise<{
    venues: VenueSubmission[];
    speakers: SpeakerSubmission[];
    sponsors: SponsorSubmission[];
}> {
    const [venues, speakers, sponsors] = await Promise.all([
        getVenueSubmissions(eventId),
        getSpeakerSubmissions(eventId),
        getSponsorSubmissions(eventId),
    ]);
    return { venues, speakers, sponsors };
}
