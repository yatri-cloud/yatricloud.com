import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return res.status(500).json({ message: 'Razorpay keys are not configured on the server' });
  }

  try {
    const { amount, currency, receipt, notes } = req.body || {};

    if (!amount || !currency) {
      return res.status(400).json({ message: 'amount and currency are required' });
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount,
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
        payment_capture: 1,
        notes: notes || {},
      }),
    });

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text();
      let errorData: any;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || `HTTP error from Razorpay: ${razorpayResponse.status}` };
      }
      console.error('Razorpay order creation failed:', errorData);
      return res.status(razorpayResponse.status).json({
        message: errorData.error?.description || errorData.message || 'Failed to create Razorpay order',
      });
    }

    const razorpayOrder = await razorpayResponse.json();

    return res.status(200).json({
      orderId: razorpayOrder.id,
    });
  } catch (error: any) {
    console.error('Error in /api/razorpay/create-order:', error);
    return res.status(500).json({
      message: error?.message || 'Internal Server Error while creating Razorpay order',
    });
  }
}


