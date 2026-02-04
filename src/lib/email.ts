
/**
 * Email Utility functions
 */

interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
}

/**
 * Send an email using the backend API
 */
export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<{ success: boolean; error?: string }> {
    try {
        // Determine the API URL
        // In dev: http://localhost:3001/api/send-email (if using separate server) or relative /api/send-email
        // In prod: /api/send-email

        // We'll use the relative path, assuming the proxy or same-domain API
        const API_URL = '/api/send-email';

        // If we're strictly in dev running separately, we might need absolute URL, but let's try relative first
        // assuming the vite proxy is set up or the server is on the same port in prod

        // Fallback for local testing if needed
        const targetUrl = import.meta.env.VITE_API_URL
            ? `${import.meta.env.VITE_API_URL}/api/send-email`
            : (window.location.hostname === 'localhost' ? 'http://localhost:3001/api/send-email' : '/api/send-email');

        console.log('📧 Sending email to:', to);

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ to, subject, html }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to send email');
        }

        console.log('✅ Email sent successfully:', data.messageId);
        return { success: true };
    } catch (error: any) {
        console.error('❌ Failed to send email:', error);
        return { success: false, error: error.message };
    }
}
