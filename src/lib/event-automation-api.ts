/**
 * Event Automation API — Supabase edition.
 *
 * The legacy Google Apps Script / Drive / Sheets automation is gone. Events now
 * live entirely in the `events` table, so structure creation is a no-op and media
 * uploads go to Supabase Storage ("product-images", `events/` prefix).
 */

import { uploadEventMediaFile } from "@/lib/events-api";

export interface EventCreationData {
    eventName: string;
    eventDate?: string;
    state: string;
    city: string;
    location?: string;
    description?: string;
    aboutEvent?: string;
    communityLink?: string;
    pricingType?: 'free' | 'paid';
    price?: number;
    capacity?: number;
    registrationDeadline?: string;
    organizerName?: string;
    organizerEmail?: string;
    organizerPhone?: string;
    speakers?: {
        name: string;
        role: string;
        company: string;
        bio?: string;
        email?: string;
        phone?: string;
        imageUrl?: string;
        linkedinUrl?: string;
    }[];
    sponsors?: {
        name: string;
        tier: string;
        website?: string;
        logo?: string;
    }[];
}

export interface EventCreationResponse {
    success: boolean;
    error?: string;
}

/**
 * No-op: events are stored in the `events` table (see events-api.saveEvent).
 * We no longer create Drive folders or spreadsheets.
 */
export async function createEventStructure(
    _eventData: EventCreationData
): Promise<EventCreationResponse> {
    return { success: true };
}

/**
 * No-op: there is no external Drive folder to delete anymore.
 */
export async function deleteEventFolder(
    _eventFolderId?: string
): Promise<{ success: boolean; error?: string }> {
    return { success: true };
}

/**
 * Upload a media file to Supabase Storage under the `events/` prefix.
 */
export async function uploadEventMedia(
    fileName: string,
    fileData: File | Blob,
    mimeType: string
): Promise<{ success: boolean; fileUrl?: string; error?: string }> {
    return uploadEventMediaFile(fileName, fileData, mimeType);
}
