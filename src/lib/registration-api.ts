/**
 * Attendee check-in — Supabase `event_registrations` table.
 * Used by the admin Attendees tool to verify a registration code and
 * mark attendance. (Registration itself lives in events-api.ts.)
 */

import { supabase } from "@/lib/supabase";

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
 * Verify an attendee by registration code (admin — enforced by RLS).
 */
export async function verifyAttendee(code: string): Promise<VerifyAttendeeResponse> {
    const { data, error } = await supabase
        .from('event_registrations')
        .select('registration_code,name,email,phone,city,state,country,linkedin_url,status,attended_at,created_at,event_id,events(name)')
        .eq('registration_code', code.trim())
        .maybeSingle();

    if (error) {
        console.error('Error verifying attendee:', error.message);
        return { success: false, error: 'Could not verify the code — please try again.' };
    }
    if (!data) {
        return { success: false, error: 'No registration found for this code.' };
    }

    const eventName = (data.events as unknown as { name?: string } | null)?.name || '';
    return {
        success: true,
        attendee: {
            code: data.registration_code,
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            city: data.city || '',
            state: data.state || '',
            country: data.country || '',
            linkedIn: data.linkedin_url || undefined,
            eventName,
            eventId: data.event_id,
            registeredAt: data.created_at,
            status: data.status,
            attendedAt: data.attended_at || undefined,
        },
    };
}

/**
 * Mark an attendee as attended (admin — enforced by RLS).
 */
export async function confirmAttendance(code: string): Promise<ConfirmAttendanceResponse> {
    const { data, error } = await supabase
        .from('event_registrations')
        .update({ status: 'attended', attended_at: new Date().toISOString() })
        .eq('registration_code', code.trim())
        .select('id');

    if (error) {
        console.error('Error confirming attendance:', error.message);
        return { success: false, error: 'Could not confirm attendance — please try again.' };
    }
    if (!data || data.length === 0) {
        return { success: false, error: 'No registration found for this code.' };
    }
    return { success: true, message: 'Attendance confirmed.' };
}
