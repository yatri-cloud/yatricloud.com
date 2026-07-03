import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Issue an event certificate of attendance.
 *
 * Body: { event_id, access_token }
 *
 * The caller proves who they are with a Supabase access token. We then check,
 * with the service role, that they have a registration for that event marked
 * attended. Only then do we issue a certificate. This is the only writer of
 * event certificates, so attendance cannot be faked from the browser.
 * Idempotent: an existing certificate is returned unchanged.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Method Not Allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ ok: false, message: 'The server is not configured to issue certificates yet.' });
  }
  const h = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' };

  try {
    const { event_id, access_token } = req.body || {};
    if (!event_id || !access_token) {
      return res.status(400).json({ ok: false, message: 'This request is missing some details.' });
    }

    // Who is asking?
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${access_token}` },
    });
    if (!userRes.ok) return res.status(401).json({ ok: false, message: 'Please sign in again.' });
    const authUser = await userRes.json().catch(() => null);
    const uid = authUser?.id;
    if (!uid) return res.status(401).json({ ok: false, message: 'Please sign in again.' });

    // Already issued? Return it.
    const existingRes = await fetch(
      `${supabaseUrl}/rest/v1/certificates?user_id=eq.${uid}&event_id=eq.${encodeURIComponent(event_id)}&select=serial&limit=1`,
      { headers: h }
    );
    const existing = await existingRes.json().catch(() => []);
    if (Array.isArray(existing) && existing[0]?.serial) {
      return res.status(200).json({ ok: true, serial: existing[0].serial, already: true });
    }

    // Attended? The registration for this user and event must be marked attended.
    const regRes = await fetch(
      `${supabaseUrl}/rest/v1/event_registrations?user_id=eq.${uid}&event_id=eq.${encodeURIComponent(event_id)}&select=id,status,email&limit=1`,
      { headers: h }
    );
    const [registration] = (await regRes.json().catch(() => [])) as Array<{ id: string; status: string; email: string }>;
    if (!registration) {
      return res.status(403).json({ ok: false, message: 'We could not find your registration for this event.' });
    }
    if (registration.status !== 'attended') {
      return res.status(400).json({ ok: false, message: 'Your certificate is ready once your attendance is marked at the event.' });
    }

    // Recipient name + event title.
    const [profileRes, eventRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${uid}&select=full_name,email`, { headers: h }),
      fetch(`${supabaseUrl}/rest/v1/events?id=eq.${encodeURIComponent(event_id)}&select=name`, { headers: h }),
    ]);
    const [profile] = (await profileRes.json().catch(() => [])) as Array<{ full_name?: string; email?: string }>;
    const [event] = (await eventRes.json().catch(() => [])) as Array<{ name?: string }>;
    const recipientName = profile?.full_name || registration.email || 'Yatri';
    const title = event?.name || 'Yatri Cloud Event';

    const now = new Date();
    const yyyymmdd = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}`;
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    const serial = `YC-CERT-${yyyymmdd}-${rand}`;

    const insertRes = await fetch(`${supabaseUrl}/rest/v1/certificates`, {
      method: 'POST',
      headers: { ...h, Prefer: 'return=representation' },
      body: JSON.stringify({ serial, kind: 'event', user_id: uid, event_id, recipient_name: recipientName, title }),
    });
    if (!insertRes.ok) {
      console.error('event certificate insert failed:', await insertRes.text());
      return res.status(500).json({ ok: false, message: 'We could not issue your certificate just now. Please try again.' });
    }

    // Email the certificate link (best effort).
    try {
      const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
      const host = req.headers.host;
      const url = `https://www.yatricloud.com/certificate/${serial}`;
      if (host && registration.email) {
        await fetch(`${proto}://${host}/api/send-email`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: registration.email,
            subject: `Your certificate of attendance for ${title}`,
            html: `
              <div style="font-family:'Segoe UI',Tahoma,sans-serif;color:#1f2937;line-height:1.6;max-width:600px;margin:0 auto;">
                <div style="background:#0a1f44;padding:26px 30px;border-radius:0 0 16px 16px;color:#fff;font-size:20px;font-weight:700;">Yatri Cloud</div>
                <div style="background:#fff;padding:34px 30px;margin:20px;border-radius:14px;box-shadow:0 4px 10px rgba(0,0,0,0.06);">
                  <h2 style="color:#0a1f44;margin-top:0;">Thank you for joining, ${recipientName}</h2>
                  <p>Here is your certificate of attendance for <strong>${title}</strong>.</p>
                  <p style="margin:24px 0;"><a href="${url}" style="display:inline-block;background:#007CFF;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;">View your certificate</a></p>
                  <p style="color:#6b7280;font-size:13px;">Certificate serial ${serial}. Anyone can verify it at the link above.</p>
                  <p>Warm regards,<br><strong>Team Yatri Cloud</strong></p>
                </div>
              </div>`,
          }),
        });
      }
    } catch (e) {
      console.error('event certificate email failed (ignored):', e);
    }

    return res.status(200).json({ ok: true, serial });
  } catch (error) {
    console.error('Error in /api/events/issue-certificate:', error);
    return res.status(500).json({ ok: false, message: 'Something went wrong. Please try again.' });
  }
}
