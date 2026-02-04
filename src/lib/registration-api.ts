const EVENT_AUTOMATION_SCRIPT_URL = import.meta.env.VITE_EVENT_AUTOMATION_SCRIPT_URL;

export interface RegistrationRequest {
    eventId: string;
    eventSlug: string;
    eventName: string;
    userId: string;
    registrationCode: string;
    spreadsheetId?: string;
    userDetails: {
        name: string;
        email: string;
        phone: string;
        city: string;
        state: string;
        country: string;
        linkedIn?: string;
    };
    // Payment fields
    ticketType?: 'free' | 'paid';
    ticketPrice?: number;
    paymentStatus?: 'pending' | 'completed' | 'failed';
    paymentId?: string;
    paymentAmount?: number;
    paymentTimestamp?: string;
    orderId?: string;
    currency?: string;
    codePrefix?: string; // e.g. AWS, REACT, etc.
}

export interface RegistrationResponse {
    success: boolean;
    registrationCode?: string;
    message?: string;
    error?: string;
}

export interface AttendeeDetails {
    code: string;
    name: string;
    email: string;
    phone: string;
    city: string;
    state: string;
    country: string;
    linkedIn?: string;
    eventName: string;
    eventId: string;
    registeredAt: string;
    status: 'registered' | 'attended' | 'cancelled';
    attendedAt?: string;
}

export interface VerifyAttendeeResponse {
    success: boolean;
    attendee?: AttendeeDetails;
    error?: string;
}

export interface ConfirmAttendanceResponse {
    success: boolean;
    message?: string;
    error?: string;
}

/**
 * Register user for an event
 */
export async function registerForEvent(
    data: RegistrationRequest
): Promise<RegistrationResponse> {
    if (!EVENT_AUTOMATION_SCRIPT_URL) {
        console.warn('VITE_EVENT_AUTOMATION_SCRIPT_URL is not configured');
        return {
            success: false,
            error: 'Event registration is not configured. Please contact administrator.',
        };
    }

    try {
        const response = await fetch(EVENT_AUTOMATION_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({
                action: 'registerEvent',
                ...data,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error: any) {
        console.error('Error registering for event:', error);
        return {
            success: false,
            error: error.message || 'Failed to register for event',
        };
    }
}

/**
 * Verify attendee by registration code
 */
export async function verifyAttendee(
    code: string
): Promise<VerifyAttendeeResponse> {
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
                action: 'verifyAttendee',
                code: code,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error: any) {
        console.error('Error verifying attendee:', error);
        return {
            success: false,
            error: error.message || 'Failed to verify attendee',
        };
    }
}

/**
 * Confirm attendee attendance
 */
export async function confirmAttendance(
    code: string
): Promise<ConfirmAttendanceResponse> {
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
                action: 'confirmAttendance',
                code: code,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error: any) {
        console.error('Error confirming attendance:', error);
        return {
            success: false,
            error: error.message || 'Failed to confirm attendance',
        };
    }
}
