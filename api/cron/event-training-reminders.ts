import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Event and training reminders (Vercel Cron, daily on Hobby / hourly via
 * GitHub Actions).
 *
 * Mirrors api/cron/mentorship-reminders.ts. Using the service-role key it
 * sweeps event_registrations and training_enrollments and sends two kinds of
 * transactional email through the existing /api/send-email path:
 *
 *   1. Day reminder  - items starting in about 24 hours
 *      (window now+23h .. now+25h, reminded_1d=false). Emails the registrant
 *      or enrollee "starting tomorrow", then sets reminded_1d=true.
 *   2. Soon reminder - items starting within about 3 hours
 *      (window now .. now+3h, reminded_soon=false). Emails them "starting
 *      soon" with the join link, then sets reminded_soon=true.
 *
 * Events carry an explicit event_date (timestamptz) so their windows are
 * filtered in SQL. Trainings only carry a start_date (date) plus an optional
 * start_time (time), so their session start is computed in Asia/Kolkata in
 * JavaScript (default 09:00 IST when no time is set) and the window is checked
 * there.
 *
 * Every item is handled inside its own try/catch so one failure never blocks
 * the rest. The boolean flags are the idempotency guard: a row is only patched
 * true after its email attempt, so it will not be emailed twice on the next
 * run.
 *
 * Auth: when CRON_SECRET is set the request must carry
 * `Authorization: Bearer ${CRON_SECRET}` (Vercel Cron sends this
 * automatically); a mismatch returns 401.
 */

const BLUE = '#007CFF';
const INK = '#1f2937';
const MUTED = '#6b7280';

/** India Standard Time is a fixed +05:30 offset with no daylight saving. */
const IST_OFFSET = '+05:30';

type EmbeddedEvent = {
  name: string | null;
  event_date: string | null;
  meet_link: string | null;
  city: string | null;
};

type EventRegistration = {
  id: string;
  name: string | null;
  email: string | null;
  status: string | null;
  reminded_1d?: boolean;
  reminded_soon?: boolean;
  events?: EmbeddedEvent | null;
};

type Training = {
  id: string;
  slug: string | null;
  name: string | null;
  course_title: string | null;
  start_date: string | null;
  start_time: string | null;
  meet_link: string | null;
  status: string | null;
};

type TrainingEnrollment = {
  id: string;
  training_id: string | null;
  email: string | null;
  status: string | null;
  payment_status: string | null;
  reminded_1d?: boolean;
  reminded_soon?: boolean;
};

/** Renders an ISO timestamp in IST, plainly and safely. */
const renderTime = (iso: string | null): string => {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata',
    }).format(new Date(iso));
  } catch {
    return '';
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

/**
 * Calendar button for an item with a single start time. Events and trainings
 * have no explicit end, so we treat the session as two hours long.
 */
const calendarButton = (input: {
  title: string;
  startISO: string;
  details?: string;
  location?: string;
}): string => {
  const endISO = new Date(new Date(input.startISO).getTime() + 2 * 60 * 60 * 1000).toISOString();
  const url = googleCalendarUrl({
    title: input.title,
    startISO: input.startISO,
    endISO,
    details: input.details,
    location: input.location,
  });
  return button(url, 'Add to your calendar');
};

/**
 * Session start for a training as an instant, computed from its start_date and
 * start_time as wall-clock IST (default 09:00 when no time is set). Returns
 * null when there is no start_date or the value is unparseable.
 */
const trainingStartISO = (t: Training): string | null => {
  if (!t.start_date) return null;
  const time = (t.start_time && t.start_time.trim()) || '09:00:00';
  const d = new Date(`${t.start_date}T${time}${IST_OFFSET}`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
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

  const summary = {
    events: { day: 0, soon: 0 },
    training: { day: 0, soon: 0 },
    priceAlerts: 0,
    supportClosed: 0,
    errors: [] as string[],
  };

  // Single "now" for the whole run so all windows are consistent.
  const now = new Date();
  const iso = (ms: number) => new Date(now.getTime() + ms).toISOString();
  const H = 60 * 60 * 1000;

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

  const patch = async (
    table: string,
    id: string,
    body: Record<string, unknown>
  ): Promise<void> => {
    const resp = await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { ...authHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      throw new Error(`patch ${resp.status}: ${await resp.text().catch(() => '')}`);
    }
  };

  const select = async <T>(table: string, query: string): Promise<T[]> => {
    const resp = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, { headers: authHeaders });
    if (!resp.ok) {
      throw new Error(`select ${resp.status}: ${await resp.text().catch(() => '')}`);
    }
    return (await resp.json().catch(() => [])) as T[];
  };

  // ── Events ───────────────────────────────────────────────────────────────
  // event_registrations embeds its event so we get event_date, name, meet_link
  // and city in one call. The !inner join lets the event_date window filter the
  // registrations themselves.
  const eventSelect = 'id,name,email,status,reminded_1d,reminded_soon,events!inner(name,event_date,meet_link,city)';

  // Events: day reminder (starting in about 24 hours).
  try {
    const regs = await select<EventRegistration>(
      'event_registrations',
      [
        `select=${eventSelect}`,
        'status=in.(registered,attended)',
        'reminded_1d=eq.false',
        `events.event_date=gte.${iso(23 * H)}`,
        `events.event_date=lt.${iso(25 * H)}`,
      ].join('&')
    );

    for (const r of regs) {
      try {
        const ev = r.events;
        if (!ev || !ev.event_date) continue;
        const eventName = ev.name || 'Yatri Cloud event';
        const when = renderTime(ev.event_date);
        const who = r.name || 'there';
        const location = ev.meet_link || ev.city || 'Online';
        const calBlock = calendarButton({
          title: eventName,
          startISO: ev.event_date,
          details: `${eventName} with Yatri Cloud.${ev.meet_link ? ` Join: ${ev.meet_link}` : ''}`,
          location,
        });
        const linkBlock = ev.meet_link ? button(ev.meet_link, 'Join the event') : '';

        const html = shell(
          'Your event is tomorrow',
          `
            <p>Hello ${who},</p>
            <p>This is a friendly reminder that your event is happening tomorrow.</p>
            ${infoBlock([
              row('Event', eventName),
              row('When', when),
              row('Where', location),
            ])}
            ${calBlock}
            ${linkBlock}
            <p>Please be ready a few minutes early. We look forward to seeing you.</p>
            <p>Team Yatri Cloud</p>
          `
        );

        if (r.email) {
          await sendEmail(r.email, `Your event is tomorrow: ${eventName}`, html);
        }
        await patch('event_registrations', r.id, { reminded_1d: true });
        summary.events.day += 1;
      } catch (err: any) {
        summary.errors.push(`event day ${r.id}: ${err?.message || String(err)}`);
      }
    }
  } catch (err: any) {
    summary.errors.push(`event day query: ${err?.message || String(err)}`);
  }

  // Events: soon reminder (starting within about 3 hours).
  try {
    const regs = await select<EventRegistration>(
      'event_registrations',
      [
        `select=${eventSelect}`,
        'status=in.(registered,attended)',
        'reminded_soon=eq.false',
        `events.event_date=gte.${now.toISOString()}`,
        `events.event_date=lt.${iso(3 * H)}`,
      ].join('&')
    );

    for (const r of regs) {
      try {
        const ev = r.events;
        if (!ev || !ev.event_date) continue;
        const eventName = ev.name || 'Yatri Cloud event';
        const when = renderTime(ev.event_date);
        const who = r.name || 'there';
        const location = ev.meet_link || ev.city || 'Online';
        const calBlock = calendarButton({
          title: eventName,
          startISO: ev.event_date,
          details: `${eventName} with Yatri Cloud.${ev.meet_link ? ` Join: ${ev.meet_link}` : ''}`,
          location,
        });
        const linkBlock = ev.meet_link ? button(ev.meet_link, 'Join the event') : '';

        const html = shell(
          'Your event is starting soon',
          `
            <p>Hello ${who},</p>
            <p>Your event starts soon. Here are the details.</p>
            ${infoBlock([
              row('Event', eventName),
              row('When', when),
              row('Where', location),
            ])}
            ${linkBlock}
            ${calBlock}
            <p>Please join a couple of minutes early. See you soon.</p>
            <p>Team Yatri Cloud</p>
          `
        );

        if (r.email) {
          await sendEmail(r.email, `Your event is starting soon: ${eventName}`, html);
        }
        await patch('event_registrations', r.id, { reminded_soon: true });
        summary.events.soon += 1;
      } catch (err: any) {
        summary.errors.push(`event soon ${r.id}: ${err?.message || String(err)}`);
      }
    }
  } catch (err: any) {
    summary.errors.push(`event soon query: ${err?.message || String(err)}`);
  }

  // ── Training ───────────────────────────────────────────────────────────────
  // Trainings only carry a start_date, so we fetch the ones near now, compute
  // the session start in IST, and check the day and soon windows in code. Each
  // matching training then emails its paid or free enrollments.
  try {
    const lowDate = new Date(now.getTime() - 1 * 24 * H).toISOString().slice(0, 10);
    const highDate = new Date(now.getTime() + 2 * 24 * H).toISOString().slice(0, 10);

    const trainings = await select<Training>(
      'trainings',
      [
        'select=id,slug,name,course_title,start_date,start_time,meet_link,status',
        'status=neq.cancelled',
        'start_date=not.is.null',
        `start_date=gte.${lowDate}`,
        `start_date=lte.${highDate}`,
      ].join('&')
    );

    for (const t of trainings) {
      const startISO = trainingStartISO(t);
      if (!startISO) continue;
      const start = new Date(startISO).getTime();

      const isDay = start >= now.getTime() + 23 * H && start < now.getTime() + 25 * H;
      const isSoon = start >= now.getTime() && start < now.getTime() + 3 * H;
      if (!isDay && !isSoon) continue;

      const kind: 'day' | 'soon' = isDay ? 'day' : 'soon';
      const flag = kind === 'day' ? 'reminded_1d' : 'reminded_soon';

      try {
        const enrollments = await select<TrainingEnrollment>(
          'training_enrollments',
          [
            'select=id,training_id,email,status,payment_status,reminded_1d,reminded_soon',
            `training_id=eq.${encodeURIComponent(t.id)}`,
            'payment_status=in.(paid,free)',
            'status=neq.cancelled',
            `${flag}=eq.false`,
          ].join('&')
        );

        const title = t.course_title || t.name || 'Yatri Cloud training';
        const when = renderTime(startISO);
        const location = t.meet_link || 'Online';
        const calBlock = calendarButton({
          title,
          startISO,
          details: `${title} with Yatri Cloud.${t.meet_link ? ` Join: ${t.meet_link}` : ''}`,
          location,
        });
        const linkBlock = t.meet_link ? button(t.meet_link, 'Join the session') : '';

        const html =
          kind === 'day'
            ? shell(
                'Your training is tomorrow',
                `
                  <p>Hello there,</p>
                  <p>This is a friendly reminder that your training session is scheduled for tomorrow.</p>
                  ${infoBlock([
                    row('Training', title),
                    row('When', when),
                    row('Where', location),
                  ])}
                  ${calBlock}
                  ${linkBlock}
                  <p>Please be ready a few minutes early. We look forward to seeing you.</p>
                  <p>Team Yatri Cloud</p>
                `
              )
            : shell(
                'Your training is starting soon',
                `
                  <p>Hello there,</p>
                  <p>Your training session starts soon. Here are the details.</p>
                  ${infoBlock([
                    row('Training', title),
                    row('When', when),
                    row('Where', location),
                  ])}
                  ${linkBlock}
                  ${calBlock}
                  <p>Please join a couple of minutes early. See you soon.</p>
                  <p>Team Yatri Cloud</p>
                `
              );

        const subject =
          kind === 'day'
            ? `Your training is tomorrow: ${title}`
            : `Your training is starting soon: ${title}`;

        for (const en of enrollments) {
          try {
            if (en.email) {
              await sendEmail(en.email, subject, html);
            }
            await patch('training_enrollments', en.id, { [flag]: true });
            summary.training[kind] += 1;
          } catch (err: any) {
            summary.errors.push(`training ${kind} ${en.id}: ${err?.message || String(err)}`);
          }
        }
      } catch (err: any) {
        summary.errors.push(`training ${kind} ${t.id}: ${err?.message || String(err)}`);
      }
    }
  } catch (err: any) {
    summary.errors.push(`training query: ${err?.message || String(err)}`);
  }

  // ── 4. Store price-drop alerts (product_alerts, migration 036) ──────────
  // Lives in this cron because the project sits at Vercel Hobby's 12-function
  // cap — a separate api/cron file would fail the deploy.
  try {
    const alerts = await select<{
      id: string;
      email: string;
      last_price_inr: string | number;
      products: { id: string; title: string; discounted_price_inr: string | number; status: string } | null;
    }>(
      'product_alerts',
      'select=id,email,last_price_inr,products(id,title,discounted_price_inr,status)'
    );

    for (const alert of alerts) {
      const product = alert.products;
      if (!product || product.status === 'archived') continue;
      const seen = Number(alert.last_price_inr) || 0;
      const current = Number(product.discounted_price_inr) || 0;
      if (!(current > 0 && seen > 0 && current < seen)) continue;

      const html = `
        <div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
          <h2 style="color:#007CFF;margin:0 0 12px;">Good news — the price dropped</h2>
          <p style="margin:0 0 8px;"><strong>${product.title}</strong> is now
            <strong>&#8377;${current.toLocaleString('en-IN')}</strong>
            <s style="color:#888;">&#8377;${seen.toLocaleString('en-IN')}</s>
            — the drop you asked us to watch for.</p>
          <p style="margin:0 0 20px;">Prices move often, so grab it while it lasts.</p>
          <a href="https://www.yatricloud.com/yatristore"
             style="display:inline-block;background:#007CFF;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;">
            Open the Yatri Store
          </a>
          <p style="margin:20px 0 0;color:#888;font-size:12px;">You get this because you watched this product on Yatri Cloud.</p>
        </div>`;

      try {
        await sendEmail(alert.email, `Price drop: ${product.title}`, html);
        // Reset the baseline so a further drop notifies again, once per drop.
        await patch('product_alerts', alert.id, {
          last_price_inr: current,
          notified_at: new Date().toISOString(),
        });
        summary.priceAlerts += 1;
      } catch (err: any) {
        summary.errors.push(`price alert ${alert.id}: ${err?.message || String(err)}`);
      }
    }
  } catch (err: any) {
    summary.errors.push(`price alerts query: ${err?.message || String(err)}`);
  }

  // ── Support auto-close: resolved tickets quiet for 7 days get closed with
  // a friendly email. Lives here (not its own function) because the Vercel
  // Hobby plan caps a deployment at 12 serverless functions.
  try {
    const QUIET_DAYS = 7;
    const cutoff = new Date(now.getTime() - QUIET_DAYS * 24 * H).toISOString();
    const resp = await fetch(
      `${supabaseUrl}/rest/v1/support_tickets?select=id,ticket_number,subject,name,email` +
        `&status=eq.resolved&last_activity_at=lt.${encodeURIComponent(cutoff)}`,
      { headers: authHeaders }
    );
    if (!resp.ok) throw new Error(`query ${resp.status}`);
    const tickets = (await resp.json()) as {
      id: string; ticket_number: string; subject: string | null;
      name: string | null; email: string | null;
    }[];
    for (const t of tickets) {
      try {
        await patch('support_tickets', t.id, {
          status: 'closed',
          closed_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        });
        if (t.email) {
          const html = `
            <h2 style="margin:0 0 16px;color:${INK};">Ticket ${t.ticket_number} is closed</h2>
            <p style="color:${MUTED};">Hi ${t.name || 'Yatri'}, your resolved ticket <em>${t.subject || ''}</em> stayed quiet for ${QUIET_DAYS} days, so we closed it to keep your list tidy. If anything comes up again, just open a fresh ticket.</p>
            <p style="text-align:center;margin:28px 0 8px;">
              <a href="https://www.yatricloud.com/support" style="display:inline-block;padding:12px 24px;background:${BLUE};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">Go to support</a>
            </p>`;
          await sendEmail(t.email, `Closed: [${t.ticket_number}] ${t.subject || 'your support ticket'}`, html);
        }
        summary.supportClosed += 1;
      } catch (err: any) {
        summary.errors.push(`support close ${t.ticket_number}: ${err?.message || String(err)}`);
      }
    }
  } catch (err: any) {
    summary.errors.push(`support close query: ${err?.message || String(err)}`);
  }

  return res.status(200).json(summary);
}
