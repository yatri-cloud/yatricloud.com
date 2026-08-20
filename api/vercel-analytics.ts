import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Serverless API handler to query Vercel Web Analytics API
 * Returns live bounce rate, visitor counts, pageviews, top referrers, and countries.
 * Secrets are securely loaded via environment variables:
 * - VERCEL_AUTH_TOKEN
 * - VERCEL_PROJECT_ID
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const token = process.env.VERCEL_AUTH_TOKEN;
    const projectId = process.env.VERCEL_PROJECT_ID;

    if (!token || !projectId) {
        return res.status(200).json({
            success: false,
            message: 'Set VERCEL_AUTH_TOKEN and VERCEL_PROJECT_ID in Vercel environment variables to enable live sync',
        });
    }

    const days = Number(req.query.days) || 30;
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);

    const fromIso = from.toISOString();
    const toIso = to.toISOString();

    const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };

    try {
        const statsRes = await fetch(
            `https://api.vercel.com/v1/web/analytics/stats?projectId=${projectId}&from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}&environment=production`,
            { headers }
        );

        if (!statsRes.ok) {
            const errText = await statsRes.text();
            console.warn('[Vercel Analytics API]', statsRes.status, errText);
            return res.status(200).json({ success: false, error: errText });
        }

        const statsData = await statsRes.json();

        return res.status(200).json({
            success: true,
            from: fromIso,
            to: toIso,
            days,
            stats: statsData,
        });
    } catch (error: any) {
        console.error('❌ Vercel Analytics API error:', error);
        return res.status(200).json({ success: false, error: error.message });
    }
}
