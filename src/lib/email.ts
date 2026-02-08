
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
        // Determine API URL with strict production check
        // In PROD: Always use relative path to hit Vercel functions
        // In DEV: Use env var or default to localhost
        const API_BASE = import.meta.env.PROD
            ? ""
            : (import.meta.env.VITE_API_URL || "http://localhost:3001");

        const targetUrl = `${API_BASE}/api/send-email`;

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
