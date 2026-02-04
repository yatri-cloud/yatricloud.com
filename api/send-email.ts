import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    // Enable CORS
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { to, subject, html } = request.body;

        if (!to || !subject || !html) {
            return response.status(400).json({ error: 'Missing required fields: to, subject, html' });
        }

        const EMAIL_USER = process.env.EMAIL_USER;
        const EMAIL_PASS = process.env.EMAIL_PASS;
        const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.office365.com';
        const EMAIL_PORT = process.env.EMAIL_PORT || 587;
        const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || "Yatri Cloud";

        if (!EMAIL_USER || !EMAIL_PASS) {
            console.error('❌ Email credentials missing in env');
            return response.status(500).json({ error: 'Email configuration missing on server' });
        }

        const transporter = nodemailer.createTransport({
            host: EMAIL_HOST,
            port: Number(EMAIL_PORT),
            secure: false, // TLS
            auth: {
                user: EMAIL_USER,
                pass: EMAIL_PASS,
            },
            tls: {
                ciphers: 'SSLv3'
            }
        });

        const info = await transporter.sendMail({
            from: `"${EMAIL_FROM_NAME}" <${EMAIL_USER}>`,
            to,
            subject,
            html,
        });

        console.log('✅ Email sent:', info.messageId);
        return response.status(200).json({ success: true, messageId: info.messageId });

    } catch (error: any) {
        console.error('❌ Error sending email:', error);
        return response.status(500).json({ error: 'Failed to send email', details: error.message });
    }
}
