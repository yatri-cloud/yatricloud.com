export interface Event {
    id: string;
    slug?: string; // URL-friendly name
    name: string;
    description?: string;
    fullDescription?: string;
    imageUrl: string;
    date: string; // ISO 8601 format - Start Date
    endDate?: string; // ISO 8601 format - End Date
    timezone: string;
    location: {
        type: 'online' | 'offline';
        venue?: string;
        mapLink?: string;
        city?: string;
        state?: string;
        country?: string;
    };
    category: string;
    status: 'upcoming' | 'past' | 'draft';

    // Collaboration flags for upcoming events
    isUpcoming?: boolean; // Published as upcoming event needing community help
    lookingForVenue?: boolean;
    lookingForSpeakers?: boolean;
    lookingForSponsors?: boolean;
    spreadsheetId?: string; // Google Sheet ID for storing submissions

    price?: string | number;
    registrationDeadline?: string;
    seatsAvailable?: number;
    communityLink?: string;
    organizer?: {
        name: string;
        logo?: string;
        email?: string;
        phone?: string;
    };
    techStack?: string[];
    requiresLogin?: boolean;
    sponsors?: Sponsor[];
    speakers?: EventSpeaker[];
    tickets?: Ticket[];
    attendees?: Attendee[];
    gallery?: GalleryAlbum[];
    driveFolderId?: string; // Root event folder ID in Google Drive
}

export interface Ticket {
    id: string;
    type: string;
    price: string | number;
    description: string;
    available: boolean;
    capacity?: number;
    benefits?: string[];
}

export interface Attendee {
    id: string;
    name: string;
    role: string;
    company?: string;
    imageUrl: string;
    registrationCode?: string;
    status?: 'registered' | 'attended' | 'cancelled';
}

export interface EventSpeaker {
    id: string;
    fullName: string;
    email?: string;
    linkedinUrl?: string;
    profileImage?: string; // Data URL or URL
    companyName?: string;
    about: string; // Summary/Bio
    country?: string;
    phone?: string;
    state?: string;
    city?: string;

    // Session Details
    sessionName?: string;
    sessionDescription?: string;
    sessionTopics?: string[];
    sessionStartTime?: string; // HH:mm
    sessionEndTime?: string; // HH:mm
}

export interface GalleryMedia {
    id: string;
    type: 'photo' | 'video';
    url: string;
    driveFileId?: string;
    thumbnailUrl?: string;
    caption?: string;
    uploadedAt: string;
}

export interface GalleryAlbum {
    id: string;
    name: string;
    driveFolderId?: string; // Google Drive folder ID for this album
    media: GalleryMedia[];
    createdAt: string;
}

export interface Sponsor {
    name: string;
    tier: 'Platinum' | 'Gold' | 'Silver' | 'Bronze' | 'Partner';
    website?: string;
    logo?: string;
}

// Initial Mock Data
export const INITIAL_MOCK_EVENTS: Event[] = [];

const STORAGE_KEY = 'yatris_events_v1';

export function getAllEvents(): Event[] {
    try {
        const storedEventsStr = localStorage.getItem(STORAGE_KEY);
        const storedEvents: Event[] = storedEventsStr ? JSON.parse(storedEventsStr) : [];
        return [...INITIAL_MOCK_EVENTS, ...storedEvents];
    } catch (e) {
        console.error("Error fetching events", e);
        return INITIAL_MOCK_EVENTS;
    }
}

export function getEventBySlug(slug: string): Event | undefined {
    try {
        const events = getAllEvents();
        return events.find(e => e.slug === slug || e.id === slug);
    } catch (e) {
        return undefined;
    }
}

export function getEventById(id: string): Event | undefined {
    try {
        const events = getAllEvents();
        return events.find(e => e.id === id);
    } catch (e) {
        return undefined;
    }
}

export function saveEvent(event: Event): void {
    try {
        const storedEventsStr = localStorage.getItem(STORAGE_KEY);
        const storedEvents: Event[] = storedEventsStr ? JSON.parse(storedEventsStr) : [];

        // Check if updating or creating
        const index = storedEvents.findIndex(e => e.id === event.id);
        if (index >= 0) {
            storedEvents[index] = event;
        } else {
            storedEvents.push(event);
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(storedEvents));
    } catch (e) {
        console.error("Error saving event", e);
    }
}

export function deleteEvent(id: string): void {
    try {
        const storedEventsStr = localStorage.getItem(STORAGE_KEY);
        const storedEvents: Event[] = storedEventsStr ? JSON.parse(storedEventsStr) : [];
        const filteredEvents = storedEvents.filter(e => e.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredEvents));
    } catch (e) {
        console.error("Error deleting event", e);
    }
}

// Helper to determine status based on date
export function getEventStatus(event: Event): 'upcoming' | 'past' | 'draft' {
    if (event.status === 'draft') return 'draft';
    const now = new Date();
    const eventDate = new Date(event.date);
    return eventDate > now ? 'upcoming' : 'past';
}
