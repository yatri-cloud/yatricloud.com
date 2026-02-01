export interface Event {
    id: string;
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
    category: 'Concert' | 'Conference' | 'Hackathon' | 'Marathon' | 'Workshop' | 'Meetup';
    status: 'upcoming' | 'past' | 'draft';
    price?: string | number;
    registrationDeadline?: string;
    seatsAvailable?: number;
    organizer?: {
        name: string;
        logo?: string;
        email?: string;
        phone?: string;
    };
    techStack?: string[];
    communityLink?: string;
    requiresLogin?: boolean;
    sponsors?: Sponsor[];
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
