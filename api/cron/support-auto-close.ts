import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Support auto-close sweep (mirrors the other api/cron endpoints).
 *
 * A ticket the team marked "resolved" that has sat quietly for 7 days is
 * closed automatically and the Yatri gets a friendly closing email that
 * reminds them a reply reopens nothing — closed means open a fresh ticket.
 * Idempotent: only rows still in status 'resolved' with a quiet week are
 * touched, and each is patched to 'closed' right after its email attempt.
 *
 * Auth: when CRON_SECRET is set the request must carry
 * `Authorization: Bearer ${CRON_SECRET}`.
 */

const QUIET_DAYS = 7;

type ResolvedTicket = {
  id: string;
  ticket_number: string;
  subject: string | null;
  name: string | null;
  email: string | null;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const header = req.headers.authorization || '';
    if (header !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Supabase is not configured on the server' });
  }

  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const host = req.headers.host;
  const authHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };

  const cutoff = new Date(Date.now() - QUIET_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const summary = { closed: 0, errors: [] as string[] };

  const listResp = await fetch(
    `${supabaseUrl}/rest/v1/support_tickets?select=id,ticket_number,subject,name,email` +
      `&status=eq.resolved&last_activity_at=lt.${encodeURIComponent(cutoff)}`,
    { headers: authHeaders }
  );
  if (!listResp.ok) {
    return res.status(500).json({ error: `query failed: ${listResp.status}` });
  }
  const tickets = (await listResp.json()) as ResolvedTicket[];

  for (const t of tickets) {
    try {
      const patchResp = await fetch(`${supabaseUrl}/rest/v1/support_tickets?id=eq.${t.id}`, {
        method: 'PATCH',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'closed',
          closed_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        }),
      });
      if (!patchResp.ok) throw new Error(`patch ${patchResp.status}`);
      summary.closed += 1;

      if (t.email) {
        const html = `
          <h2 style="margin:0 0 16px;">Ticket ${t.ticket_number} is closed</h2>
          <p>Hi ${t.name || 'Yatri'}, your resolved ticket <em>${t.subject || ''}</em> stayed quiet for ${QUIET_DAYS} days, so we closed it to keep your list tidy.</p>
          <p>If anything comes up again, just open a fresh ticket — it takes a minute.</p>
          <p style="text-align:center;margin:28px 0 8px;">
            <a href="https://www.yatricloud.com/support" style="display:inline-block;padding:12px 24px;background:#007CFF;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">Go to support</a>
          </p>`;
        await fetch(`${proto}://${host}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: t.email,
            subject: `Closed: [${t.ticket_number}] ${t.subject || 'your support ticket'}`,
            html,
          }),
        });
      }
    } catch (e) {
      summary.errors.push(`${t.ticket_number}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return res.status(200).json(summary);
}
