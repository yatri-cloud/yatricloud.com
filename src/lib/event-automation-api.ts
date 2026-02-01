/**
 * Event Automation API
 * Handles communication with Google Apps Script for automated event creation
 */

const EVENT_AUTOMATION_SCRIPT_URL = import.meta.env.VITE_EVENT_AUTOMATION_SCRIPT_URL || '';

export interface EventCreationData {
    eventName: string;
    eventDate?: string;
    state: string; // State name
    city: string; // City name
    location?: string;
    description?: string;
    aboutEvent?: string; // Detailed about section
    communityLink?: string;
    // Pricing
    pricingType?: 'free' | 'paid';
    price?: number; // Price in INR
    // Registration details
    capacity?: number;
    registrationDeadline?: string;
    // Organizer information
    organizerName?: string;
    organizerEmail?: string;
    organizerPhone?: string;
}

export interface EventCreationResponse {
    success: boolean;
    eventFolderId?: string;
    eventFolderUrl?: string;
    spreadsheetId?: string;
    spreadsheetUrl?: string;
    subfolders?: {
        gallery: string;
        speakers: string;
        media: string;
    };
    error?: string;
}

/**
 * Create event folder and spreadsheet structure
 */
export async function createEventStructure(
    eventData: EventCreationData
): Promise<EventCreationResponse> {
    if (!EVENT_AUTOMATION_SCRIPT_URL) {
        console.warn('VITE_EVENT_AUTOMATION_SCRIPT_URL is not configured');
        return {
            success: false,
            error: 'Event automation is not configured. Please contact administrator.',
        };
    }

    try {
        const response = await fetch(EVENT_AUTOMATION_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({
                action: 'createEvent',
                ...eventData,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error: any) {
        console.error('Error creating event structure:', error);
        return {
            success: false,
            error: error.message || 'Failed to create event structure',
        };
    }
}

