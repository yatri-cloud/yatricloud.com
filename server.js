/**
 * Yatri Cloud — local dev server.
 *
 * Mirrors the Vercel `api/` functions for local development only:
 *   - POST /api/razorpay/create-order
 *   - POST /api/razorpay/verify        (HMAC signature check + record in Supabase)
 *   - POST /api/send-email             (Office 365 SMTP via nodemailer)
 *   - GET  /health
 *
 * In production these run as Vercel serverless functions under `api/`.
 * All data reads/writes go directly to Supabase from the browser — this
 * server has NO database/Sheets/Apps-Script/Udemy/AI responsibilities.
 * Every secret comes from .env; nothing is hardcoded.
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createHmac } from 'crypto';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// ── Razorpay: create order ──────────────────────────────────────────────
app.post('/api/razorpay/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, notes } = req.body || {};
    if (!amount) return res.status(400).json({ error: 'Amount is required' });

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return res.status(500).json({ error: 'Razorpay credentials not configured on the server' });
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
      body: JSON.stringify({
        amount,
        currency,
        receipt: receipt || `receipt_${Date.now()}`,
        payment_capture: 1,
        notes: notes || {},
      }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.description || `Razorpay API error: ${response.status}`);
    }
    const order = await response.json();
    return res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (error) {
    console.error('❌ Razorpay create-order:', error);
    return res.status(500).json({ error: 'Failed to create Razorpay order', message: error.message });
  }
});

// ── Razorpay: verify signature + record payment ─────────────────────────
app.post('/api/razorpay/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, currency, order_id } = req.body || {};
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) return res.status(500).json({ verified: false, message: 'Razorpay not configured' });
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ verified: false, message: 'Missing payment fields' });
    }

    const expected = createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    if (expected !== razorpay_signature) {
      return res.status(400).json({ verified: false, message: 'Invalid payment signature' });
    }

    let recorded = false;
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && serviceKey) {
      const r = await fetch(`${supabaseUrl}/rest/v1/payments`, {
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
          amount: Number(amount ?? 0) / 100 || 0,
          currency: currency || 'INR',
          status: 'completed',
          verified_at: new Date().toISOString(),
          raw: { razorpay_order_id, razorpay_payment_id },
        }),
      });
      recorded = r.ok;
    }
    return res.json({ verified: true, recorded });
  } catch (error) {
    console.error('❌ Razorpay verify:', error);
    return res.status(500).json({ verified: false, message: 'Internal error verifying payment' });
  }
});

// ── Transactional email (Office 365 SMTP) ───────────────────────────────
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, html } = req.body || {};
    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
    }
    const { EMAIL_USER, EMAIL_PASS } = process.env;
    const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.office365.com';
    const EMAIL_PORT = process.env.EMAIL_PORT || 587;
    const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Yatri Cloud';
    if (!EMAIL_USER || !EMAIL_PASS) {
      return res.status(500).json({ error: 'Email configuration missing on server' });
    }

    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: Number(EMAIL_PORT),
      secure: false,
      auth: { user: EMAIL_USER, pass: EMAIL_PASS },
      tls: { ciphers: 'SSLv3' },
    });
    const info = await transporter.sendMail({
      from: `"${EMAIL_FROM_NAME}" <${EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('❌ send-email:', error);
    return res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
});

// ── Health ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`🚀 Yatri Cloud dev server on http://localhost:${PORT}`);
  console.log(`   💳 /api/razorpay/create-order · /api/razorpay/verify`);
  console.log(`   📧 /api/send-email   💚 /health`);
});
