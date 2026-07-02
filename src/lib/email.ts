
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
        // Relative path: served by the Vercel serverless function in prod and
        // by the Vite dev proxy → server.js in local dev. No hardcoded hosts.
        const response = await fetch('/api/send-email', {
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
