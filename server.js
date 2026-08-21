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

/** Best-effort HTML → plain text for the email's text/plain alternative. */
function htmlToText(html) {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr|table)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

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
      // Plain-text alternative (improves deliverability + accessibility).
      text: req.body.text || htmlToText(html),
    });
    return res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('❌ send-email:', error);
    return res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
});

// ── Admin gateway (role & credential management; Razorpay admin is prod-only) ─
app.post('/api/razorpay/admin', async (req, res) => {
  try {
    const action = req.body?.action;
    if (typeof action === 'string' && action.startsWith('adminUsers.')) {
      const { handleAdminUsers } = await import('./lib/admin-users-lib.mjs');
      req.body = { ...(req.body || {}), action: action.slice('adminUsers.'.length) };
      return handleAdminUsers(req, res);
    }
    return res.status(501).json({ ok: false, message: 'Razorpay admin actions are only available in production.' });
  } catch (error) {
    console.error('❌ admin gateway:', error);
    return res.status(500).json({ ok: false, message: 'Server error', message_detail: error.message });
  }
});

// ── Currency rates & detection ──────────────────────────────────────────
const FALLBACK_USD = {
  INR: 85, AED: 3.67, ALL: 92, AMD: 388, ARS: 1000, AUD: 1.52, AWG: 1.79,
  AZN: 1.7, BAM: 1.8, BBD: 2, BDT: 120, BGN: 1.8, BHD: 0.376, BIF: 2900,
  BMD: 1, BND: 1.35, BOB: 6.9, BRL: 5.5, BSD: 1, BTN: 85, BWP: 13.6, BZD: 2,
  CAD: 1.38, CHF: 0.9, CLP: 950, CNY: 7.2, COP: 4100, CRC: 515, CUP: 24,
  CVE: 101, CZK: 23, DJF: 178, DKK: 6.9, DOP: 60, DZD: 134, EGP: 49, ETB: 126,
  EUR: 0.92, FJD: 2.25, GBP: 0.79, GHS: 15, GIP: 0.79, GMD: 71, GNF: 8600,
  GTQ: 7.7, GYD: 209, HKD: 7.8, HNL: 25, HRK: 6.9, HTG: 132, HUF: 360,
  IDR: 16000, ILS: 3.7, IQD: 1310, ISK: 138, JMD: 157, JOD: 0.71, JPY: 150,
  KES: 129, KGS: 87, KHR: 4050, KMF: 452, KRW: 1350, KWD: 0.307, KYD: 0.83,
  KZT: 480, LAK: 21500, LKR: 295, LRD: 190, LSL: 18, MAD: 9.9, MDL: 17.8,
  MGA: 4600, MKD: 57, MMK: 2100, MNT: 3400, MOP: 8, MUR: 46, MVR: 15.4,
  MWK: 1730, MXN: 18.5, MYR: 4.5, MZN: 63.5, NAD: 18, NGN: 1550, NIO: 36.7,
  NOK: 10.7, NPR: 136, NZD: 1.66, OMR: 0.385, PEN: 3.75, PGK: 3.9, PHP: 58,
  PKR: 278, PLN: 3.95, PYG: 7600, QAR: 3.64, RON: 4.6, RSD: 108, RUB: 92,
  RWF: 1350, SAR: 3.75, SCR: 13.5, SEK: 10.5, SGD: 1.35, SOS: 571, SSP: 3000,
  SVC: 8.75, SZL: 18, THB: 34, TND: 3.1, TRY: 34, TTD: 6.8, TWD: 32, TZS: 2650,
  UAH: 41, UGX: 3700, USD: 1, UYU: 42, UZS: 12800, VND: 25400, VUV: 120,
  XAF: 605, XCD: 2.7, XOF: 605, XPF: 110, YER: 250, ZAR: 18, ZMW: 27,
};
const SUPPORTED_CURRENCIES = Object.keys(FALLBACK_USD);

function fallbackCurrencyRates() {
  const inrPerUsd = FALLBACK_USD.INR;
  const out = {};
  for (const [code, usd] of Object.entries(FALLBACK_USD)) out[code] = usd / inrPerUsd;
  return out;
}

let currencyRatesCache = null;
const RATES_TTL_MS = 6 * 60 * 60 * 1000;

app.get('/api/currency', async (req, res) => {
  try {
    const mode = String(req.query.mode || 'rates').toLowerCase();

    if (mode === 'detect') {
      const raw = req.headers['x-vercel-ip-country'] || '';
      const country = typeof raw === 'string' ? raw.toUpperCase() : '';
      const currency = country === 'IN' ? 'INR' : country ? 'USD' : 'INR';
      return res.status(200).json({ country: country || null, currency });
    }

    if (currencyRatesCache && Date.now() - currencyRatesCache.at < RATES_TTL_MS) {
      return res.status(200).json({ base: 'INR', rates: currencyRatesCache.rates, source: currencyRatesCache.source, updatedAt: currencyRatesCache.updatedAt });
    }

    let rates = fallbackCurrencyRates();
    let source = 'fallback';
    let updatedAt = new Date().toISOString();

    try {
      const r = await fetch('https://open.er-api.com/v6/latest/INR', {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(4000),
      });
      if (r.ok) {
        const data = await r.json();
        if (data.result === 'success' && data.rates && typeof data.rates.INR === 'number') {
          const live = { INR: 1 };
          for (const code of SUPPORTED_CURRENCIES) {
            const v = data.rates[code];
            if (typeof v === 'number' && v > 0) live[code] = v;
            else if (code !== 'INR') live[code] = rates[code];
          }
          rates = live;
          source = 'open.er-api.com';
          updatedAt = data.time_last_update_utc || updatedAt;
        }
      }
    } catch {
      /* ignore, use fallback */
    }

    currencyRatesCache = { rates, source, updatedAt, at: Date.now() };
    return res.status(200).json({ base: 'INR', rates, source, updatedAt });
  } catch (error) {
    console.error('❌ /api/currency:', error);
    return res.status(200).json({ base: 'INR', rates: fallbackCurrencyRates(), source: 'fallback', updatedAt: new Date().toISOString() });
  }
});

// ── Health ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`🚀 Yatri Cloud dev server on http://localhost:${PORT}`);
  console.log(`   💳 /api/razorpay/create-order · /api/razorpay/verify`);
  console.log(`   📧 /api/send-email   💚 /health   👑 /api/razorpay/admin   💱 /api/currency`);
});
