import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

/* ── Shared helpers ────────────────────────────────────────────────── */

/** Best-effort HTML → plain text for the email's text/plain alternative. */
function htmlToText(html: string): string {
    return String(html || '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<head[\s\S]*?<\/head>/gi, '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(p|div|h[1-6]|li|tr|table)>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&#39;/gi, "'")
        .replace(/&quot;/gi, '"')
        .replace(/\n[ \t]+/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]{2,}/g, ' ')
        .trim();
}

/** Lazy-initialized Supabase service-role client for tracking writes. */
let _sb: ReturnType<typeof createClient> | null = null;
function sb() {
    if (!_sb) {
        _sb = createClient(
            process.env.SUPABASE_URL || '',
            process.env.SUPABASE_SERVICE_ROLE_KEY || ''
        );
    }
    return _sb;
}

// 1×1 transparent GIF for open tracking
const PIXEL = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
);

/* ── Newsletter tracking (GET /api/send-email?type=open|click) ────── */

async function handleTracking(req: VercelRequest, res: VercelResponse) {
    const { type, nl, sub, url } = req.query;
    if (!nl || !sub || typeof nl !== 'string' || typeof sub !== 'string') {
        return res.status(400).end();
    }

    if (type === 'open') {
        // Record open — fire-and-forget insert + counter bump
        sb().from('newsletter_opens').insert({
            newsletter_id: nl,
            subscriber_id: sub,
            user_agent: req.headers['user-agent'] || '',
        }).then();
        const { data } = await sb().from('newsletters').select('open_count').eq('id', nl).single();
        if (data) {
            await sb().from('newsletters').update({ open_count: (data.open_count || 0) + 1 }).eq('id', nl);
        }
        res.setHeader('Content-Type', 'image/gif');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        return res.status(200).send(PIXEL);
    }

    if (type === 'click') {
        const targetUrl = Array.isArray(url) ? url[0] : url || 'https://www.yatricloud.com';
        sb().from('newsletter_clicks').insert({
            newsletter_id: nl,
            subscriber_id: sub,
            url: targetUrl,
        }).then();
        const { data } = await sb().from('newsletters').select('click_count').eq('id', nl).single();
        if (data) {
            await sb().from('newsletters').update({ click_count: (data.click_count || 0) + 1 }).eq('id', nl);
        }
        res.setHeader('Cache-Control', 'no-store');
        return res.redirect(302, targetUrl);
    }

    return res.status(400).end();
}

/* ── Email sending (POST /api/send-email) ─────────────────────────── */

async function handleSendEmail(req: VercelRequest, res: VercelResponse) {
    const { to, subject, html } = req.body;
    if (!to || !subject || !html) {
        return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
    }

    const EMAIL_USER = process.env.EMAIL_USER;
    const EMAIL_PASS = process.env.EMAIL_PASS;
    const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.office365.com';
    const EMAIL_PORT = process.env.EMAIL_PORT || 587;
    const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Yatri Cloud';

    if (!EMAIL_USER || !EMAIL_PASS) {
        console.error('❌ Email credentials missing in env');
        return res.status(500).json({ error: 'Email configuration missing on server' });
    }

    const transporter = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: Number(EMAIL_PORT),
        secure: false,
        auth: { user: EMAIL_USER, pass: EMAIL_PASS },
        tls: { ciphers: 'SSLv3' },
    });

    const info = await transporter.sendMail({
        from: `"${EMAIL_FROM_NAME}" <${EMAIL_USER}>`,
        to,
        subject,
        html,
        text: (req.body?.text as string) || htmlToText(html),
    });

    console.log('✅ Email sent:', info.messageId);
    return res.status(200).json({ success: true, messageId: info.messageId });
}

/* ── Router ────────────────────────────────────────────────────────── */

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    // Enable CORS
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    try {
        // GET with tracking query params → newsletter open/click tracking
        if (request.method === 'GET' && request.query.type) {
            return await handleTracking(request, response);
        }

        // POST → send email
        if (request.method === 'POST') {
            return await handleSendEmail(request, response);
        }

        return response.status(405).json({ error: 'Method not allowed' });
    } catch (error: any) {
        console.error('❌ Error:', error);
        return response.status(500).json({ error: 'Internal error', details: error.message });
    }
}
