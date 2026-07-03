import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Move a mentorship booking to a new time.
 *
 * Body: { booking_id, access_token, slot_start, slot_end }
 *
 * The mentee cannot change a confirmed booking directly (row level security
 * only lets them cancel a pending one), so rescheduling runs here with the
 * service role after we verify who is asking. Allowed for the mentee who owns
 * the booking, the mentor who runs it, or an admin. The unique slot index on
 * the table is the real guard against double booking: if the new time is
 * taken we surface that clearly.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Method Not Allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res
      .status(500)
      .json({ ok: false, message: 'The server is not configured to reschedule bookings yet.' });
  }

  const svcHeaders = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  };

  try {
    const { booking_id, access_token, slot_start, slot_end } = req.body || {};

    if (!booking_id || !access_token || !slot_start || !slot_end) {
      return res
        .status(400)
        .json({ ok: false, message: 'This request is missing some details. Please try again.' });
    }

    // ── Who is asking? Verify the access token against Supabase Auth.
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${access_token}` },
    });
    if (!userRes.ok) {
      return res
        .status(401)
        .json({ ok: false, message: 'Please sign in again to reschedule this booking.' });
    }
    const authUser = await userRes.json().catch(() => null);
    const uid = authUser?.id;
    if (!uid) {
      return res
        .status(401)
        .json({ ok: false, message: 'Please sign in again to reschedule this booking.' });
    }

    // ── Load the booking with the service role.
    const bookingRes = await fetch(
      `${supabaseUrl}/rest/v1/mentorship_bookings?id=eq.${encodeURIComponent(booking_id)}&select=*`,
      { headers: svcHeaders }
    );
    const bookingRows = await bookingRes.json().catch(() => []);
    const booking = Array.isArray(bookingRows) ? bookingRows[0] : null;
    if (!booking) {
      return res.status(404).json({ ok: false, message: 'We could not find this booking.' });
    }

    // ── Authorize: mentee owner, the owning mentor, or an admin.
    let allowed = booking.user_id === uid;
    if (!allowed) {
      const mentorRes = await fetch(
        `${supabaseUrl}/rest/v1/mentors?id=eq.${encodeURIComponent(booking.mentor_id)}&select=user_id`,
        { headers: svcHeaders }
      );
      const mentorRows = await mentorRes.json().catch(() => []);
      const mentorUserId = Array.isArray(mentorRows) ? mentorRows[0]?.user_id : null;
      if (mentorUserId && mentorUserId === uid) allowed = true;
    }
    if (!allowed) {
      const profileRes = await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(uid)}&select=role`,
        { headers: svcHeaders }
      );
      const profileRows = await profileRes.json().catch(() => []);
      const role = Array.isArray(profileRows) ? profileRows[0]?.role : null;
      if (role === 'admin') allowed = true;
    }
    if (!allowed) {
      return res
        .status(403)
        .json({ ok: false, message: 'You are not allowed to reschedule this booking.' });
    }

    // ── Only upcoming, live bookings can move.
    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      return res.status(400).json({
        ok: false,
        message: 'Only upcoming sessions can be rescheduled.',
      });
    }

    // ── Apply the new time. A conflict on the unique slot index means the new
    //    time was just taken by another booking.
    const patchRes = await fetch(
      `${supabaseUrl}/rest/v1/mentorship_bookings?id=eq.${encodeURIComponent(booking_id)}`,
      {
        method: 'PATCH',
        headers: { ...svcHeaders, Prefer: 'return=representation' },
        body: JSON.stringify({
          slot_start,
          slot_end,
          rescheduled_count: Number(booking.rescheduled_count ?? 0) + 1,
          // Moving a slot clears the sent reminder flags so the new time is reminded again.
          reminded_1d: false,
          reminded_1h: false,
        }),
      }
    );

    if (!patchRes.ok) {
      const text = await patchRes.text().catch(() => '');
      if (patchRes.status === 409 || text.includes('uniq_mentor_slot') || text.includes('duplicate key')) {
        return res.status(409).json({
          ok: false,
          slotTaken: true,
          message: 'That time was just taken. Please pick a different slot.',
        });
      }
      console.error('⚠️ reschedule patch failed:', text);
      return res
        .status(500)
        .json({ ok: false, message: 'We could not move this session just now. Please try again.' });
    }

    // ── Best effort emails: never block or change the result.
    try {
      await notifyRescheduled(req, supabaseUrl, svcHeaders, booking, slot_start);
    } catch (emailError) {
      console.error('⚠️ reschedule notification failed (ignored):', emailError);
    }

    return res.status(200).json({ ok: true, message: 'Your session was moved to the new time.' });
  } catch (error) {
    console.error('Error in /api/mentorship/reschedule-booking:', error);
    return res
      .status(500)
      .json({ ok: false, message: 'Something went wrong while rescheduling. Please try again.' });
  }
}

/** Tells the mentee and the mentor about the new time. Best effort. */
async function notifyRescheduled(
  req: VercelRequest,
  supabaseUrl: string,
  svcHeaders: Record<string, string>,
  booking: any,
  newSlotStart: string
) {
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const host = req.headers.host;
  if (!host) return;
  const sendEmail = `${proto}://${host}/api/send-email`;

  const [mentorRes, serviceRes, privateRes] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/mentors?id=eq.${encodeURIComponent(booking.mentor_id)}&select=name`, { headers: svcHeaders }),
    fetch(`${supabaseUrl}/rest/v1/mentorship_services?id=eq.${encodeURIComponent(booking.service_id)}&select=title`, { headers: svcHeaders }),
    fetch(`${supabaseUrl}/rest/v1/mentor_private?mentor_id=eq.${encodeURIComponent(booking.mentor_id)}&select=contact_email`, { headers: svcHeaders }),
  ]);

  const mentorName = (await mentorRes.json().catch(() => []))?.[0]?.name || 'your mentor';
  const serviceTitle = (await serviceRes.json().catch(() => []))?.[0]?.title || 'Mentorship session';
  const mentorEmail = (await privateRes.json().catch(() => []))?.[0]?.contact_email;

  const tz = booking.buyer_timezone || 'Asia/Kolkata';
  const whenLocal = new Date(newSlotStart).toLocaleString('en-IN', { timeZone: tz });
  const whenIst = new Date(newSlotStart).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const block = (whoWhen: string) => `
    <div style="font-family: 'Segoe UI', Tahoma, sans-serif; color: #1f2937; line-height: 1.6;">
      <h2 style="color: #1e3a8a;">Your session moved to a new time</h2>
      <div style="background-color: #eff6ff; border-left: 4px solid #007CFF; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 5px 0;"><strong>Session:</strong> ${serviceTitle}</p>
        <p style="margin: 5px 0;"><strong>New time:</strong> ${whoWhen}</p>
      </div>
      <p>See you then.</p>
      <p>Team Yatri Cloud</p>
    </div>`;

  if (booking.customer_email) {
    await fetch(sendEmail, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: booking.customer_email,
        subject: `New time for your session: ${serviceTitle}`,
        html: block(`${whenLocal} (${tz})`),
      }),
    });
  }
  if (mentorEmail) {
    await fetch(sendEmail, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: mentorEmail,
        subject: `A session was moved: ${serviceTitle}`,
        html: block(`${whenIst} IST`),
      }),
    });
  }
}
