import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac } from 'crypto';

/**
 * Verify a Razorpay payment signature server-side, then record the payment
 * in Supabase (`payments` table) with the service-role key.
 *
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature,
 *         amount?, currency?, order_id? (our orders.id, optional) }
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
    if (supabaseUrl && serviceKey) {
      const insert = await fetch(`${supabaseUrl}/rest/v1/payments`, {
        method: 'POST',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
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
      if (!insert.ok) console.error('⚠️ payment record insert failed:', await insert.text());

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
    } else {
      console.warn('⚠️ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — payment verified but not recorded');
    }

    return res.status(200).json({ verified: true, recorded });
  } catch (error: any) {
    console.error('Error in /api/razorpay/verify:', error);
    return res.status(500).json({ verified: false, message: 'Internal error verifying payment' });
  }
}
