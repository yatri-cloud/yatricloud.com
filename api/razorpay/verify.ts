import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac } from 'crypto';

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
 * Verify a Razorpay payment signature server-side, then record the payment
 * in Supabase (`payments` table) with the service-role key.
 *
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature,
 *         amount?, currency?, order_id? (our orders.id, optional),
 *         booking_id? (our mentorship_bookings.id, optional) }
 *
 * When booking_id is present the verified payment also flips the pending
 * mentorship booking to confirmed (service role bypasses RLS: this is the
 * ONLY code path allowed to confirm a paid booking) and fires a
 * best-effort notification email to the mentor.
 *
 * Never trust the client: the HMAC check below is the ONLY thing that makes
 * a payment real. RLS blocks all client writes to `payments`; only this
 * endpoint (service role) records them.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!keySecret) {
    return res.status(500).json({ message: 'Razorpay is not configured on the server' });
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
      currency,
      order_id,
      booking_id,
    } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ verified: false, message: 'Missing payment fields' });
    }

    // ── The signature check (Razorpay docs): HMAC-SHA256(order_id|payment_id, secret)
    const expected = createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      console.warn('❌ Razorpay signature mismatch', { razorpay_order_id, razorpay_payment_id });
      return res.status(400).json({ verified: false, message: 'Invalid payment signature' });
    }

    // ── Record the verified payment (best-effort: verification result is
    //    authoritative even if the audit insert hiccups)
    let recorded = false;
    let paymentRowId: string | null = null;
    if (supabaseUrl && serviceKey) {
      const insert = await fetch(`${supabaseUrl}/rest/v1/payments`, {
        method: 'POST',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          order_id: order_id || null,
          provider: 'razorpay',
          provider_order_id: razorpay_order_id,
          provider_payment_id: razorpay_payment_id,
          amount: Number(amount ?? 0) / 100 || 0, // Razorpay sends paise
          currency: currency || 'INR',
          status: 'completed',
          verified_at: new Date().toISOString(),
          raw: { razorpay_order_id, razorpay_payment_id },
        }),
      });
      recorded = insert.ok;
      if (!insert.ok) {
        console.error('⚠️ payment record insert failed:', await insert.text());
      } else {
        try {
          const rows = await insert.json();
          paymentRowId = Array.isArray(rows) ? rows[0]?.id ?? null : null;
        } catch {
          paymentRowId = null;
        }
      }

      // Mark our order completed if provided
      if (order_id && recorded) {
        await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(order_id)}`, {
          method: 'PATCH',
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({ status: 'completed' }),
        });
      }

      // ── Mentorship: flip the paid pending booking to confirmed.
      //    This endpoint (service role) is the ONLY writer allowed to do it.
      if (booking_id) {
        try {
          const bookingPatch = await fetch(
            `${supabaseUrl}/rest/v1/mentorship_bookings?id=eq.${encodeURIComponent(
              booking_id
            )}&status=eq.pending`,
            {
              method: 'PATCH',
              headers: {
                apikey: serviceKey,
                Authorization: `Bearer ${serviceKey}`,
                'Content-Type': 'application/json',
                Prefer: 'return=representation',
              },
              body: JSON.stringify({
                status: 'confirmed',
                ...(paymentRowId ? { payment_id: paymentRowId } : {}),
                ...(order_id ? { order_id } : {}),
              }),
            }
          );
          if (!bookingPatch.ok) {
            console.error('⚠️ booking confirm failed:', await bookingPatch.text());
          } else {
            // Fire-and-forget mentor notification: never affects the verdict.
            try {
              const patched = await bookingPatch.json().catch(() => []);
              const booking = Array.isArray(patched) ? patched[0] : null;

              // Record the commission split on the booking (Route order transfer).
              // Best effort: never affects the payment verdict.
              if (booking?.id && keyId && keySecret) {
                try {
                  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
                  const trRes = await fetch(
                    `https://api.razorpay.com/v1/orders/${encodeURIComponent(razorpay_order_id)}/transfers`,
                    { headers: { Authorization: `Basic ${auth}` } }
                  );
                  const trData = await trRes.json().catch(() => ({}));
                  const transfer = Array.isArray(trData?.items) ? trData.items[0] : null;
                  if (transfer?.id) {
                    const payoutRupees = Number(transfer.amount ?? 0) / 100;
                    const amountRupees = Number(booking.amount ?? 0);
                    await fetch(
                      `${supabaseUrl}/rest/v1/mentorship_bookings?id=eq.${encodeURIComponent(booking.id)}`,
                      {
                        method: 'PATCH',
                        headers: {
                          apikey: serviceKey,
                          Authorization: `Bearer ${serviceKey}`,
                          'Content-Type': 'application/json',
                          Prefer: 'return=minimal',
                        },
                        body: JSON.stringify({
                          transfer_id: transfer.id,
                          mentor_payout: payoutRupees,
                          platform_fee: Math.max(amountRupees - payoutRupees, 0),
                        }),
                      }
                    );
                  }
                } catch (err) {
                  console.error('Recording the commission split failed (ignored):', err);
                }
              }

              if (booking?.mentor_id) {
                const [privateRes, mentorRes, serviceRes] = await Promise.all([
                  fetch(
                    `${supabaseUrl}/rest/v1/mentor_private?mentor_id=eq.${encodeURIComponent(
                      booking.mentor_id
                    )}&select=contact_email`,
                    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
                  ),
                  fetch(
                    `${supabaseUrl}/rest/v1/mentors?id=eq.${encodeURIComponent(
                      booking.mentor_id
                    )}&select=name`,
                    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
                  ),
                  fetch(
                    `${supabaseUrl}/rest/v1/mentorship_services?id=eq.${encodeURIComponent(
                      booking.service_id
                    )}&select=title`,
                    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
                  ),
                ]);
                const contactEmail = (await privateRes.json().catch(() => []))?.[0]?.contact_email;
                const mentorName = (await mentorRes.json().catch(() => []))?.[0]?.name || 'Mentor';
                const serviceTitle =
                  (await serviceRes.json().catch(() => []))?.[0]?.title || 'Mentorship session';

                if (contactEmail) {
                  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
                  const host = req.headers.host;
                  const slotLine = booking.slot_start
                    ? `<p style="margin: 5px 0;"><strong>When:</strong> ${new Date(
                        booking.slot_start
                      ).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>`
                    : '';
                  const calLink =
                    booking.slot_start && booking.slot_end
                      ? `<div style="text-align: center; margin: 24px 0;"><a href="${googleCalendarUrl(
                          {
                            title: serviceTitle,
                            startISO: booking.slot_start,
                            endISO: booking.slot_end,
                            details: `Mentorship session with ${booking.customer_name || 'your Yatri'}.`,
                            location: booking.meeting_link || 'Online',
                          }
                        )}" style="background-color: #3b82f6; color: #ffffff; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Add to your calendar</a></div>`
                      : '';
                  await fetch(`${proto}://${host}/api/send-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      to: contactEmail,
                      subject: `New booking: ${serviceTitle}`,
                      html: `
                        <div style="font-family: 'Segoe UI', Tahoma, sans-serif; color: #1f2937; line-height: 1.6;">
                          <h2 style="color: #1e3a8a;">New mentorship booking</h2>
                          <p>Hello ${mentorName},</p>
                          <p>A new session was just booked and paid on Yatri Cloud.</p>
                          <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
                            <p style="margin: 5px 0;"><strong>Session:</strong> ${serviceTitle}</p>
                            <p style="margin: 5px 0;"><strong>Yatri:</strong> ${booking.customer_name || ''} (${booking.customer_email || ''})</p>
                            ${slotLine}
                          </div>
                          ${calLink}
                          <p>Please add the meeting link from your dashboard before the session.</p>
                          <p>Team Yatri Cloud</p>
                        </div>
                      `,
                    }),
                  });
                }
              }
            } catch (notifyError) {
              console.error('⚠️ mentor notification failed (ignored):', notifyError);
            }
          }
        } catch (bookingError) {
          console.error('⚠️ booking confirm errored (payment still verified):', bookingError);
        }
      }
    } else {
      console.warn('⚠️ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — payment verified but not recorded');
    }

    return res.status(200).json({ verified: true, recorded });
  } catch (error: any) {
    console.error('Error in /api/razorpay/verify:', error);
    return res.status(500).json({ verified: false, message: 'Internal error verifying payment' });
  }
}
