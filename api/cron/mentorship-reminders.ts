import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Mentorship session reminders + review follow ups (Vercel Cron, hourly).
 *
 * Runs once an hour (see vercel.json crons). Using the service-role key it
 * sweeps mentorship_bookings and sends three kinds of transactional email
 * through the existing /api/send-email path:
 *
 *   1. Day reminder  - confirmed sessions starting in about 24 hours
 *      (window now+23h .. now+25h, reminded_1d=false). Emails the mentee
 *      and the mentor, then sets reminded_1d=true.
 *   2. Hour reminder - confirmed sessions starting within about 90 minutes
 *      (window now .. now+90m, reminded_1h=false). Emails the mentee and
 *      the mentor with the meeting link if one is set, then sets
 *      reminded_1h=true.
 *   3. Review follow up - sessions that ended 2h..72h ago, status confirmed
 *      or completed, review_requested=false. Emails the mentee a review
 *      request, then sets review_requested=true.
 *
 * Every booking is handled inside its own try/catch so one failure never
 * blocks the rest. The boolean flags are the idempotency guard: a booking is
 * only patched true after its email attempt, so it will not be emailed twice
 * on the next hourly run.
 *
 * Auth: when CRON_SECRET is set the request must carry
 * `Authorization: Bearer ${CRON_SECRET}` (Vercel Cron sends this
 * automatically); a mismatch returns 401.
 */

const BLUE = '#007CFF';
const INK = '#1f2937';
const MUTED = '#6b7280';

type Booking = {
  id: string;
  status: string;
  slot_start: string | null;
  slot_end: string | null;
  customer_name: string | null;
  customer_email: string | null;
  mentor_id: string | null;
  service_id: string | null;
  buyer_timezone: string | null;
  meeting_link?: string | null;
  reminded_1d?: boolean;
  reminded_1h?: boolean;
  review_requested?: boolean;
};

/** Renders an ISO timestamp in the buyer's timezone, plainly and safely. */
const renderTime = (iso: string | null, timezone: string | null): string => {
  if (!iso) return '';
  const tz = timezone || 'Asia/Kolkata';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: tz,
    }).format(new Date(iso));
  } catch {
    // Fall back to IST if the stored timezone is not a valid IANA name.
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata',
    }).format(new Date(iso));
  }
};

/** Wraps body content in the shared inline-styled email shell. */
const shell = (title: string, body: string): string => `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: ${INK}; line-height: 1.6; max-width: 600px; margin: 0 auto;">
    <div style="background-color: #1e3a8a; padding: 24px; text-align: center; border-radius: 0 0 16px 16px;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Yatri Cloud</h1>
    </div>
    <div style="background-color: #ffffff; padding: 32px; margin: 20px 0; border-radius: 12px;">
      <h2 style="color: #1e3a8a; margin-top: 0;">${title}</h2>
      ${body}
    </div>
    <p style="text-align: center; color: ${MUTED}; font-size: 12px;">© ${new Date().getFullYear()} Yatri Cloud. All rights reserved.</p>
  </div>
`;

/** Standard info block used inside the emails. */
const infoBlock = (rows: string[]): string => `
  <div style="background-color: #eff6ff; border-left: 4px solid ${BLUE}; padding: 15px; margin: 20px 0; border-radius: 4px;">
    ${rows.filter(Boolean).join('')}
  </div>
`;

const row = (label: string, value: string): string =>
  `<p style="margin: 5px 0;"><strong>${label}:</strong> ${value}</p>`;

const button = (href: string, text: string): string => `
  <div style="text-align: center; margin: 28px 0;">
    <a href="${href}" style="background-color: ${BLUE}; color: #ffffff; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">${text}</a>
  </div>
`;

/** ISO to UTC basic format YYYYMMDDTHHMMSSZ (mirrors src/lib/mentorship.ts). */
const toCalendarUtc = (iso: string): string =>
  new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

/** Google Calendar add event URL, same format as the client helper. */
const googleCalendarUrl = (input: {
  title: string;
  startISO: string;
  endISO: string;
  details?: string;
  location?: string;
}): string => {
  const dates = `${toCalendarUtc(input.startISO)}/${toCalendarUtc(input.endISO)}`;
  const params = [
    'action=TEMPLATE',
    `text=${encodeURIComponent(input.title)}`,
    `dates=${dates}`,
    `details=${encodeURIComponent(input.details ?? '')}`,
    `location=${encodeURIComponent(input.location ?? '')}`,
  ].join('&');
  return `https://calendar.google.com/calendar/render?${params}`;
};

/** Calendar button block for a booking, or empty when it has no slot. */
const calendarBlock = (b: Booking, title: string, name: string): string => {
  if (!b.slot_start || !b.slot_end) return '';
  const url = googleCalendarUrl({
    title,
    startISO: b.slot_start,
    endISO: b.slot_end,
    details: `Mentorship session with ${name}.${b.meeting_link ? ` Join: ${b.meeting_link}` : ''}`,
    location: b.meeting_link || 'Online',
  });
  return button(url, 'Add to your calendar');
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ── Auth: Vercel Cron sends Authorization: Bearer ${CRON_SECRET}
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

  const summary = { day: 0, hour: 0, review: 0, errors: [] as string[] };

  // Single "now" for the whole run so all windows are consistent.
  const now = new Date();
  const iso = (ms: number) => new Date(now.getTime() + ms).toISOString();
  const H = 60 * 60 * 1000;
  const M = 60 * 1000;

  const authHeaders = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
  };

  // ── Small helpers scoped to this request ────────────────────────────────

  const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
    const resp = await fetch(`${proto}://${host}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html }),
    });
    if (!resp.ok) {
      throw new Error(`send-email ${resp.status}: ${await resp.text().catch(() => '')}`);
    }
  };

  const patchBooking = async (id: string, patch: Record<string, unknown>): Promise<void> => {
    const resp = await fetch(
      `${supabaseUrl}/rest/v1/mentorship_bookings?id=eq.${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: { ...authHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(patch),
      }
    );
    if (!resp.ok) {
      throw new Error(`patch ${resp.status}: ${await resp.text().catch(() => '')}`);
    }
  };

  const selectBookings = async (query: string): Promise<Booking[]> => {
    const resp = await fetch(`${supabaseUrl}/rest/v1/mentorship_bookings?${query}`, {
      headers: authHeaders,
    });
    if (!resp.ok) {
      throw new Error(`select ${resp.status}: ${await resp.text().catch(() => '')}`);
    }
    return (await resp.json().catch(() => [])) as Booking[];
  };

  const mentorContactEmail = async (mentorId: string | null): Promise<string | null> => {
    if (!mentorId) return null;
    try {
      const resp = await fetch(
        `${supabaseUrl}/rest/v1/mentor_private?mentor_id=eq.${encodeURIComponent(
          mentorId
        )}&select=contact_email`,
        { headers: authHeaders }
      );
      const rows = await resp.json().catch(() => []);
      return rows?.[0]?.contact_email || null;
    } catch {
      return null;
    }
  };

  const mentorName = async (mentorId: string | null): Promise<string> => {
    if (!mentorId) return 'Mentor';
    try {
      const resp = await fetch(
        `${supabaseUrl}/rest/v1/mentors?id=eq.${encodeURIComponent(mentorId)}&select=name`,
        { headers: authHeaders }
      );
      const rows = await resp.json().catch(() => []);
      return rows?.[0]?.name || 'Mentor';
    } catch {
      return 'Mentor';
    }
  };

  const serviceTitle = async (serviceId: string | null): Promise<string> => {
    if (!serviceId) return 'Mentorship session';
    try {
      const resp = await fetch(
        `${supabaseUrl}/rest/v1/mentorship_services?id=eq.${encodeURIComponent(
          serviceId
        )}&select=title`,
        { headers: authHeaders }
      );
      const rows = await resp.json().catch(() => []);
      return rows?.[0]?.title || 'Mentorship session';
    } catch {
      return 'Mentorship session';
    }
  };

  // ── 1. Day reminder ──────────────────────────────────────────────────────
  try {
    const bookings = await selectBookings(
      [
        'status=eq.confirmed',
        'reminded_1d=eq.false',
        `slot_start=gte.${iso(23 * H)}`,
        `slot_start=lt.${iso(25 * H)}`,
        'select=*',
      ].join('&')
    );

    for (const b of bookings) {
      try {
        const [title, name] = await Promise.all([
          serviceTitle(b.service_id),
          mentorName(b.mentor_id),
        ]);
        const when = renderTime(b.slot_start, b.buyer_timezone);
        const menteeName = b.customer_name || 'there';
        const calBlock = calendarBlock(b, title, name);

        const menteeHtml = shell(
          'Your session is tomorrow',
          `
            <p>Hello ${menteeName},</p>
            <p>This is a friendly reminder that your mentorship session is scheduled for tomorrow.</p>
            ${infoBlock([
              row('Session', title),
              row('Mentor', name),
              row('When', when),
            ])}
            ${calBlock}
            <p>Please be ready a few minutes early. We look forward to seeing you.</p>
            <p>Team Yatri Cloud</p>
          `
        );

        const mentorHtml = shell(
          'Your session is tomorrow',
          `
            <p>Hello ${name},</p>
            <p>This is a reminder that you have a mentorship session scheduled for tomorrow.</p>
            ${infoBlock([
              row('Session', title),
              row('Yatri', `${menteeName}${b.customer_email ? ` (${b.customer_email})` : ''}`),
              row('When', when),
            ])}
            ${calBlock}
            <p>Please add the meeting link from your dashboard if you have not already.</p>
            <p>Team Yatri Cloud</p>
          `
        );

        if (b.customer_email) {
          await sendEmail(b.customer_email, `Your session is tomorrow: ${title}`, menteeHtml);
        }
        const contact = await mentorContactEmail(b.mentor_id);
        if (contact) {
          await sendEmail(contact, `Your session is tomorrow: ${title}`, mentorHtml);
        }

        await patchBooking(b.id, { reminded_1d: true });
        summary.day += 1;
      } catch (err: any) {
        summary.errors.push(`day ${b.id}: ${err?.message || String(err)}`);
      }
    }
  } catch (err: any) {
    summary.errors.push(`day query: ${err?.message || String(err)}`);
  }

  // ── 2. Hour reminder ─────────────────────────────────────────────────────
  try {
    const bookings = await selectBookings(
      [
        'status=eq.confirmed',
        'reminded_1h=eq.false',
        `slot_start=gte.${now.toISOString()}`,
        `slot_start=lt.${iso(90 * M)}`,
        'select=*',
      ].join('&')
    );

    for (const b of bookings) {
      try {
        const [title, name] = await Promise.all([
          serviceTitle(b.service_id),
          mentorName(b.mentor_id),
        ]);
        const when = renderTime(b.slot_start, b.buyer_timezone);
        const menteeName = b.customer_name || 'there';
        const linkBlock = b.meeting_link ? button(b.meeting_link, 'Join the session') : '';
        const calBlock = calendarBlock(b, title, name);

        const menteeHtml = shell(
          'Your session is in about an hour',
          `
            <p>Hello ${menteeName},</p>
            <p>Your mentorship session starts soon. Here are the details.</p>
            ${infoBlock([
              row('Session', title),
              row('Mentor', name),
              row('When', when),
            ])}
            ${linkBlock}
            ${calBlock}
            <p>Please join a couple of minutes early. See you soon.</p>
            <p>Team Yatri Cloud</p>
          `
        );

        const mentorHtml = shell(
          'Your session is in about an hour',
          `
            <p>Hello ${name},</p>
            <p>Your mentorship session starts soon. Here are the details.</p>
            ${infoBlock([
              row('Session', title),
              row('Yatri', `${menteeName}${b.customer_email ? ` (${b.customer_email})` : ''}`),
              row('When', when),
            ])}
            ${linkBlock}
            ${calBlock}
            <p>Team Yatri Cloud</p>
          `
        );

        if (b.customer_email) {
          await sendEmail(b.customer_email, `Your session is in about an hour: ${title}`, menteeHtml);
        }
        const contact = await mentorContactEmail(b.mentor_id);
        if (contact) {
          await sendEmail(contact, `Your session is in about an hour: ${title}`, mentorHtml);
        }

        await patchBooking(b.id, { reminded_1h: true });
        summary.hour += 1;
      } catch (err: any) {
        summary.errors.push(`hour ${b.id}: ${err?.message || String(err)}`);
      }
    }
  } catch (err: any) {
    summary.errors.push(`hour query: ${err?.message || String(err)}`);
  }

  // ── 3. Review follow up ──────────────────────────────────────────────────
  // Sessions that ended 2h..72h ago. We match on slot_end when present and
  // fall back to slot_start, so we query on each and merge (dedup by id).
  try {
    const pastLow = iso(-72 * H); // older bound (72h ago)
    const pastHigh = iso(-2 * H); // newer bound (2h ago)

    const byEnd = await selectBookings(
      [
        'status=in.(confirmed,completed)',
        'review_requested=eq.false',
        `slot_end=gte.${pastLow}`,
        `slot_end=lt.${pastHigh}`,
        'select=*',
      ].join('&')
    );
    const byStart = await selectBookings(
      [
        'status=in.(confirmed,completed)',
        'review_requested=eq.false',
        'slot_end=is.null',
        `slot_start=gte.${pastLow}`,
        `slot_start=lt.${pastHigh}`,
        'select=*',
      ].join('&')
    );

    const seen = new Set<string>();
    const bookings = [...byEnd, ...byStart].filter((b) => {
      if (seen.has(b.id)) return false;
      seen.add(b.id);
      return true;
    });

    for (const b of bookings) {
      try {
        if (!b.customer_email) {
          // Nothing to send to, but still mark handled so we do not requery forever.
          await patchBooking(b.id, { review_requested: true });
          continue;
        }
        const title = await serviceTitle(b.service_id);
        const menteeName = b.customer_name || 'there';

        const html = shell(
          'How was your session',
          `
            <p>Hello ${menteeName},</p>
            <p>Thank you for attending your mentorship session for ${title}. We hope it was helpful.</p>
            <p>Would you take a moment to share how it went. Your review helps other Yatris choose the right mentor and helps our mentors improve.</p>
            ${button('https://www.yatricloud.com/mentorship/bookings', 'Leave a review')}
            <p>Thank you for being part of Yatri Cloud.</p>
            <p>Team Yatri Cloud</p>
          `
        );

        await sendEmail(b.customer_email, `How was your session: ${title}`, html);
        await patchBooking(b.id, { review_requested: true });
        summary.review += 1;
      } catch (err: any) {
        summary.errors.push(`review ${b.id}: ${err?.message || String(err)}`);
      }
    }
  } catch (err: any) {
    summary.errors.push(`review query: ${err?.message || String(err)}`);
  }

  return res.status(200).json(summary);
}
