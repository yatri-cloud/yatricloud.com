
/**
 * Email Utility functions
 */

import { logEmail } from "@/lib/email-logs-api";

interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
    /** Optional override for the FROM address (e.g. info@yatricloud.com instead of noreply) */
    from?: string;
    /** Optional: name of the template used — stored in email_logs for auditing. */
    templateKey?: string;
    /** Optional extra metadata to store alongside the log (e.g. user_id, event_id). */
    metadata?: Record<string, unknown>;
}

/**
 * Send an email using the backend API.
 * Every attempt (success or failure) is automatically logged to the email_logs table.
 */
export async function sendEmail({ to, subject, html, from, templateKey, metadata }: SendEmailParams): Promise<{ success: boolean; error?: string }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        // Relative path: served by the Vercel serverless function in prod and
        // by the Vite dev proxy → server.js in local dev. No hardcoded hosts.
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ to, subject, html, from }),
            signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to send email');
        }

        // Log success (fire-and-forget)
        void logEmail({ to, subject, templateKey, status: "sent", metadata });

        return { success: true };
    } catch (error: any) {
        const errMsg = error?.name === 'AbortError' ? 'Email send timed out' : error.message;

        // Log failure (fire-and-forget)
        void logEmail({ to, subject, templateKey, status: "failed", error: errMsg, metadata });

        console.error('❌ Failed to send email:', error);
        return { success: false, error: errMsg };
    } finally {
        clearTimeout(timeoutId);
    }
}
