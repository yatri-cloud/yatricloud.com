// Event Submissions API
// Handles venue, speaker, and sponsor submissions for upcoming events

import { Event, getAllEvents, saveEvent } from "./events-store";

// Use the same script URL as the event automation API
const EVENT_AUTOMATION_SCRIPT_URL = import.meta.env.VITE_EVENT_AUTOMATION_SCRIPT_URL || '';

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

// Local storage keys (still used for caching/admin view speed)
const VENUE_SUBMISSIONS_KEY = 'event_venue_submissions';
const SPEAKER_SUBMISSIONS_KEY = 'event_speaker_submissions';
const SPONSOR_SUBMISSIONS_KEY = 'event_sponsor_submissions';

// Helper to get local submissions
function getLocalSubmissions<T>(key: string): T[] {
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
}

// Helper to save local submissions
function saveLocalSubmissions<T>(key: string, data: T[]) {
    localStorage.setItem(key, JSON.stringify(data));
}

// Helper to submit to Google Apps Script
async function submitToSheet(eventId: string, type: 'venue' | 'speaker' | 'sponsor', submission: any) {
    if (!EVENT_AUTOMATION_SCRIPT_URL) {
        console.warn('Google Sheets API URL not configured. Saving locally only.');
        return false;
    }

    const events = getAllEvents();
    const event = events.find(e => e.id === eventId);

    if (!event || !event.spreadsheetId) {
        console.warn(`Event ${eventId} not found or missing spreadsheetId. Saving locally only.`);
        return false;
    }

    try {
        const response = await fetch(EVENT_AUTOMATION_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'submitProposal',
                spreadsheetId: event.spreadsheetId,
                type: type,
                submission: submission
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('Error submitting to Google Sheet:', error);
        return false;
    }
}

export async function submitVenue(data: Omit<VenueSubmission, 'id' | 'submittedAt' | 'status'>): Promise<VenueSubmission> {
    const submission: VenueSubmission = {
        ...data,
        id: crypto.randomUUID(),
        submittedAt: new Date().toISOString(),
        status: 'pending'
    };

    // Save locally
    const existing = getLocalSubmissions<VenueSubmission>(VENUE_SUBMISSIONS_KEY);
    existing.push(submission);
    saveLocalSubmissions(VENUE_SUBMISSIONS_KEY, existing);

    // Sync to Sheet (fire and forget or await if critical)
    await submitToSheet(data.eventId, 'venue', submission);

    return submission;
}

export function getVenueSubmissions(): VenueSubmission[] {
    return getLocalSubmissions<VenueSubmission>(VENUE_SUBMISSIONS_KEY);
}

export async function submitSpeaker(data: Omit<SpeakerSubmission, 'id' | 'submittedAt' | 'status'>): Promise<SpeakerSubmission> {
    const submission: SpeakerSubmission = {
        ...data,
        id: crypto.randomUUID(),
        submittedAt: new Date().toISOString(),
        status: 'pending'
    };

    const existing = getLocalSubmissions<SpeakerSubmission>(SPEAKER_SUBMISSIONS_KEY);
    existing.push(submission);
    saveLocalSubmissions(SPEAKER_SUBMISSIONS_KEY, existing);

    await submitToSheet(data.eventId, 'speaker', submission);

    return submission;
}

export function getSpeakerSubmissions(): SpeakerSubmission[] {
    return getLocalSubmissions<SpeakerSubmission>(SPEAKER_SUBMISSIONS_KEY);
}

export async function submitSponsor(data: Omit<SponsorSubmission, 'id' | 'submittedAt' | 'status'>): Promise<SponsorSubmission> {
    const submission: SponsorSubmission = {
        ...data,
        id: crypto.randomUUID(),
        submittedAt: new Date().toISOString(),
        status: 'pending'
    };

    const existing = getLocalSubmissions<SponsorSubmission>(SPONSOR_SUBMISSIONS_KEY);
    existing.push(submission);
    saveLocalSubmissions(SPONSOR_SUBMISSIONS_KEY, existing);

    await submitToSheet(data.eventId, 'sponsor', submission);

    return submission;
}

export function getSponsorSubmissions(): SponsorSubmission[] {
    return getLocalSubmissions<SponsorSubmission>(SPONSOR_SUBMISSIONS_KEY);
}

export function updateSubmissionStatus(type: 'venue' | 'speaker' | 'sponsor', id: string, status: 'approved' | 'rejected') {
    if (type === 'venue') {
        const items = getVenueSubmissions();
        const item = items.find(i => i.id === id);
        if (item) {
            item.status = status;
            saveLocalSubmissions(VENUE_SUBMISSIONS_KEY, items);
            // TODO: Update status in Google Sheet as well (requires another API action)
            return true;
        }
    } else if (type === 'speaker') {
        const items = getSpeakerSubmissions();
        const item = items.find(i => i.id === id);
        if (item) {
            item.status = status;
            saveLocalSubmissions(SPEAKER_SUBMISSIONS_KEY, items);
            return true;
        }
    } else if (type === 'sponsor') {
        const items = getSponsorSubmissions();
        const item = items.find(i => i.id === id);
        if (item) {
            item.status = status;
            saveLocalSubmissions(SPONSOR_SUBMISSIONS_KEY, items);
            return true;
        }
    }
    return false;
}

// Get all submissions for an event
export function getAllSubmissionsForEvent(eventId: string) {
    const venues = getVenueSubmissions().filter(s => s.eventId === eventId);
    const speakers = getSpeakerSubmissions().filter(s => s.eventId === eventId);
    const sponsors = getSponsorSubmissions().filter(s => s.eventId === eventId);

    return { venues, speakers, sponsors };
}

export async function deleteEventFolder(folderId: string): Promise<boolean> {
    if (!EVENT_AUTOMATION_SCRIPT_URL) {
        console.warn('Google Sheets API URL not configured.');
        return false;
    }

    try {
        const response = await fetch(EVENT_AUTOMATION_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'deleteEvent',
                folderId: folderId
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('Error deleting event folder:', error);
        return false;
    }
}
