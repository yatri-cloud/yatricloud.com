import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Cancel a mentorship booking, with an automatic Razorpay refund when the
 * session was paid.
 *
 * Body: { booking_id, access_token, cancel_reason? }
 *
 * The caller proves who they are with a Supabase access token. We then load
 * the booking with the service role (bypassing RLS) and allow the cancel when
 * the caller is the mentee who owns the booking, the mentor who runs it, or an
 * admin. Everything a browser could tamper with is re checked here on the
 * server: this endpoint is the only writer allowed to refund and mark a paid
 * booking cancelled.
 *
 * Design notes:
 *  - A full refund on Razorpay automatically reverses any Route transfer that
 *    was still on hold, so we never touch transfers here.
 *  - The refund call must never block the cancel. If Razorpay errors we still
 *    mark the booking cancelled and return a clear message so a human can
 *    finish the refund.
 *  - Emails to the mentee and mentor are best effort and never change the
 *    result we return.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Method Not Allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!supabaseUrl || !serviceKey) {
    return res
      .status(500)
      .json({ ok: false, message: 'The server is not configured to cancel bookings yet.' });
  }

  const svcHeaders = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  };

  try {
    const { booking_id, access_token, cancel_reason } = req.body || {};

    if (!booking_id || !access_token) {
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
        .json({ ok: false, message: 'Please sign in again to cancel this booking.' });
    }
    const authUser = await userRes.json().catch(() => null);
    const uid = authUser?.id;
    if (!uid) {
      return res
        .status(401)
        .json({ ok: false, message: 'Please sign in again to cancel this booking.' });
    }

    // ── Load the booking with the service role.
    const bookingRes = await fetch(
      `${supabaseUrl}/rest/v1/mentorship_bookings?id=eq.${encodeURIComponent(
        booking_id
      )}&select=*`,
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
        `${supabaseUrl}/rest/v1/mentors?id=eq.${encodeURIComponent(
          booking.mentor_id
        )}&select=user_id`,
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
        .json({ ok: false, message: 'You are not allowed to cancel this booking.' });
    }

    // ── Already cancelled or refunded: succeed idempotently.
    if (booking.status === 'cancelled' || booking.status === 'refunded') {
      return res.status(200).json({
        ok: true,
        refunded: booking.status === 'refunded',
        message: 'This session is already cancelled.',
      });
    }

    // ── Refund when the session was paid and confirmed.
    const amount = Number(booking.amount ?? 0) || 0;
    const wasPaid = Boolean(booking.payment_id) && booking.status === 'confirmed' && amount > 0;

    let refunded = false;
    let refundId: string | null = null;
    let refundFailed = false;

    if (wasPaid) {
      try {
        // Our payments row carries the Razorpay payment id.
        const payRes = await fetch(
          `${supabaseUrl}/rest/v1/payments?id=eq.${encodeURIComponent(
            booking.payment_id
          )}&select=provider_payment_id`,
          { headers: svcHeaders }
        );
        const payRows = await payRes.json().catch(() => []);
        const razorpayPaymentId = Array.isArray(payRows)
          ? payRows[0]?.provider_payment_id
          : null;

        if (razorpayPaymentId && keyId && keySecret) {
          const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
          const refundRes = await fetch(
            `https://api.razorpay.com/v1/payments/${encodeURIComponent(
              razorpayPaymentId
            )}/refund`,
            {
              method: 'POST',
              headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/json',
              },
              // No amount means a full refund. A full refund also reverses any
              // Route transfer that was still on hold.
              body: JSON.stringify({ speed: 'normal' }),
            }
          );
          const refundData = await refundRes.json().catch(() => ({}));
          if (refundRes.ok && refundData?.id) {
            refunded = true;
            refundId = refundData.id;
          } else {
            refundFailed = true;
            console.error('⚠️ Razorpay refund failed:', refundData);
          }
        } else {
          refundFailed = true;
          console.warn('⚠️ Missing Razorpay payment id or keys — refund skipped');
        }
      } catch (refundError) {
        refundFailed = true;
        console.error('⚠️ Razorpay refund errored (cancel continues):', refundError);
      }
    }

    // ── Mark the booking cancelled (or refunded when the money went back).
    const patchBody: Record<string, unknown> = {
      status: refunded ? 'refunded' : 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancel_reason: cancel_reason || null,
    };
    if (refundId) patchBody.refund_id = refundId;

    const patchRes = await fetch(
      `${supabaseUrl}/rest/v1/mentorship_bookings?id=eq.${encodeURIComponent(booking_id)}`,
      {
        method: 'PATCH',
        headers: { ...svcHeaders, Prefer: 'return=minimal' },
        body: JSON.stringify(patchBody),
      }
    );
    if (!patchRes.ok) {
      const text = await patchRes.text().catch(() => '');
      console.error('⚠️ booking cancel patch failed:', text);
      return res.status(500).json({
        ok: false,
        message: 'We could not cancel this booking just now. Please try again.',
      });
    }

    // ── Best effort emails: never block or change the result.
    try {
      await notifyCancelled(req, supabaseUrl, svcHeaders, booking, refunded);
    } catch (emailError) {
      console.error('⚠️ cancel notification failed (ignored):', emailError);
    }

    const message = refunded
      ? 'Your session was cancelled and a full refund has started. It reaches your account in a few working days.'
      : refundFailed
      ? 'Your session was cancelled. Your refund could not be started automatically, so our team will finish it. Please contact support if you do not see it soon.'
      : 'Your session was cancelled and the slot is now free.';

    return res.status(200).json({ ok: true, refunded, message });
  } catch (error) {
    console.error('Error in /api/mentorship/cancel-booking:', error);
    return res
      .status(500)
      .json({ ok: false, message: 'Something went wrong while cancelling. Please try again.' });
  }
}

/** Tells the mentee and the mentor that a session was cancelled. Best effort. */
async function notifyCancelled(
  req: VercelRequest,
  supabaseUrl: string,
  svcHeaders: Record<string, string>,
  booking: any,
  refunded: boolean
) {
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const host = req.headers.host;
  if (!host) return;
  const sendEmail = `${proto}://${host}/api/send-email`;

  const [mentorRes, serviceRes, privateRes] = await Promise.all([
    fetch(
      `${supabaseUrl}/rest/v1/mentors?id=eq.${encodeURIComponent(
        booking.mentor_id
      )}&select=name`,
      { headers: svcHeaders }
    ),
    fetch(
      `${supabaseUrl}/rest/v1/mentorship_services?id=eq.${encodeURIComponent(
        booking.service_id
      )}&select=title`,
      { headers: svcHeaders }
    ),
    fetch(
      `${supabaseUrl}/rest/v1/mentor_private?mentor_id=eq.${encodeURIComponent(
        booking.mentor_id
      )}&select=contact_email`,
      { headers: svcHeaders }
    ),
  ]);

  const mentorName = (await mentorRes.json().catch(() => []))?.[0]?.name || 'your mentor';
  const serviceTitle =
    (await serviceRes.json().catch(() => []))?.[0]?.title || 'Mentorship session';
  const mentorEmail = (await privateRes.json().catch(() => []))?.[0]?.contact_email;

  const slotLine = booking.slot_start
    ? `<p style="margin: 5px 0;"><strong>When:</strong> ${new Date(booking.slot_start).toLocaleString(
        'en-IN',
        { timeZone: 'Asia/Kolkata' }
      )} IST</p>`
    : '';

  const refundLine = refunded
    ? '<p>Your full refund has started and reaches your account in a few working days.</p>'
    : '';

  // Mentee
  if (booking.customer_email) {
    await fetch(sendEmail, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: booking.customer_email,
        subject: `Your session was cancelled: ${serviceTitle}`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, sans-serif; color: #1f2937; line-height: 1.6;">
            <h2 style="color: #1e3a8a;">Your session was cancelled</h2>
            <p>Hello ${booking.customer_name || 'Yatri'},</p>
            <p>Your booking with ${mentorName} has been cancelled.</p>
            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 5px 0;"><strong>Session:</strong> ${serviceTitle}</p>
              ${slotLine}
            </div>
            ${refundLine}
            <p>You can book another time whenever you are ready on Yatri Cloud.</p>
            <p>Team Yatri Cloud</p>
          </div>
        `,
      }),
    });
  }

  // Mentor
  if (mentorEmail) {
    await fetch(sendEmail, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: mentorEmail,
        subject: `A session was cancelled: ${serviceTitle}`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, sans-serif; color: #1f2937; line-height: 1.6;">
            <h2 style="color: #1e3a8a;">A session was cancelled</h2>
            <p>Hello ${mentorName},</p>
            <p>A booking on Yatri Cloud has been cancelled and the slot is free again.</p>
            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 5px 0;"><strong>Session:</strong> ${serviceTitle}</p>
              <p style="margin: 5px 0;"><strong>Yatri:</strong> ${booking.customer_name || ''} (${booking.customer_email || ''})</p>
              ${slotLine}
            </div>
            <p>Team Yatri Cloud</p>
          </div>
        `,
      }),
    });
  }
}
