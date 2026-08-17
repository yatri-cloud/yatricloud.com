import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Combined mentorship booking action handler:
 * - Cancel booking (with optional Razorpay refund)
 * - Reschedule booking (to new slot_start / slot_end)
 *
 * Body:
 *  { action: 'cancel', booking_id, access_token, cancel_reason? }
 *  { action: 'reschedule', booking_id, access_token, slot_start, slot_end }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Method Not Allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ ok: false, message: 'The server is not configured for mentorship actions yet.' });
  }

  const svcHeaders = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  };

  try {
    const { action, booking_id, access_token, cancel_reason, slot_start, slot_end } = req.body || {};

    if (!booking_id || !access_token) {
      return res.status(400).json({ ok: false, message: 'This request is missing some details. Please try again.' });
    }

    // ── Verify user access token
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${access_token}` },
    });
    if (!userRes.ok) {
      return res.status(401).json({ ok: false, message: 'Please sign in again.' });
    }
    const authUser = await userRes.json().catch(() => null);
    const uid = authUser?.id;
    if (!uid) {
      return res.status(401).json({ ok: false, message: 'Please sign in again.' });
    }

    // ── Load booking
    const bookingRes = await fetch(
      `${supabaseUrl}/rest/v1/mentorship_bookings?id=eq.${encodeURIComponent(booking_id)}&select=*`,
      { headers: svcHeaders }
    );
    const bookingRows = await bookingRes.json().catch(() => []);
    const booking = Array.isArray(bookingRows) ? bookingRows[0] : null;
    if (!booking) {
      return res.status(404).json({ ok: false, message: 'We could not find this booking.' });
    }

    // ── Authorize: mentee owner, mentor owner, or admin
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
      return res.status(403).json({ ok: false, message: 'You are not allowed to modify this booking.' });
    }

    const isCancel = action === 'cancel' || Boolean(cancel_reason) || (!slot_start && !slot_end);

    // ── CANCEL ACTION
    if (isCancel) {
      if (booking.status === 'cancelled') {
        return res.status(200).json({ ok: true, already: true, message: 'This booking was already cancelled.' });
      }

      let refunded = false;
      let refundError: string | null = null;

      if (booking.payment_id && keyId && keySecret) {
        try {
          const payRes = await fetch(
            `${supabaseUrl}/rest/v1/payments?id=eq.${encodeURIComponent(booking.payment_id)}&select=razorpay_payment_id,amount,currency`,
            { headers: svcHeaders }
          );
          const payRows = await payRes.json().catch(() => []);
          const rzPaymentId = Array.isArray(payRows) ? payRows[0]?.razorpay_payment_id : null;

          if (rzPaymentId) {
            const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;
            const refundRes = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(rzPaymentId)}/refund`, {
              method: 'POST',
              headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                notes: { reason: cancel_reason || 'Mentorship booking cancelled', booking_id: booking.id },
              }),
            });
            const refundBody = await refundRes.json().catch(() => ({}));
            if (refundRes.ok && refundBody.id) {
              refunded = true;
            } else {
              refundError = refundBody?.error?.description || `Razorpay refund failed (status ${refundRes.status})`;
            }
          }
        } catch (e: any) {
          refundError = e?.message || 'Refund attempt threw';
        }
      }

      await fetch(`${supabaseUrl}/rest/v1/mentorship_bookings?id=eq.${encodeURIComponent(booking_id)}`, {
        method: 'PATCH',
        headers: svcHeaders,
        body: JSON.stringify({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: uid,
          cancel_reason: cancel_reason || null,
        }),
      });

      return res.status(200).json({
        ok: true,
        refunded,
        refundError: refundError || undefined,
        message: refunded
          ? 'Your booking was cancelled and your payment has been refunded to your original payment method.'
          : 'Your booking has been cancelled.',
      });
    }

    // ── RESCHEDULE ACTION
    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      return res.status(400).json({ ok: false, message: `Cannot reschedule a ${booking.status} booking.` });
    }

    const patchRes = await fetch(`${supabaseUrl}/rest/v1/mentorship_bookings?id=eq.${encodeURIComponent(booking_id)}`, {
      method: 'PATCH',
      headers: { ...svcHeaders, Prefer: 'return=representation' },
      body: JSON.stringify({
        slot_start,
        slot_end,
        rescheduled_at: new Date().toISOString(),
        rescheduled_by: uid,
      }),
    });

    if (!patchRes.ok) {
      const errText = await patchRes.text();
      if (errText.includes('idx_mentorship_bookings_mentor_slot') || errText.includes('unique') || errText.includes('duplicate')) {
        return res.status(409).json({ ok: false, message: 'That time slot was just booked by someone else. Please pick another time.' });
      }
      return res.status(500).json({ ok: false, message: 'We could not update the booking time. Please try again.' });
    }

    return res.status(200).json({ ok: true, message: 'Booking rescheduled successfully.' });
  } catch (error) {
    console.error('Error in /api/mentorship-action:', error);
    return res.status(500).json({ ok: false, message: 'Something went wrong. Please try again.' });
  }
}
