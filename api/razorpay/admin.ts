import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Admin gateway to the Razorpay API.
 *
 * One function, many actions (kept together to stay under the serverless
 * function budget). Every call must carry a Supabase access token belonging to
 * an admin; we verify it server side with the service role before touching
 * Razorpay. The Razorpay secret never leaves the server.
 *
 * POST /api/razorpay/admin  { action, access_token, ...params }
 *   action = "invoices.list"    params: { count?, skip? }
 *          | "invoices.create"  params: { customer:{name,email,contact}, description?, item_name, amount, currency, notify? }
 *          | "invoices.cancel"  params: { invoice_id }
 *          | "payments.list"    params: { count?, skip? }
 *
 * invoices.create issues the invoice and returns its short_url (a hosted pay
 * page). This lets an admin raise a professional invoice, in any currency, from
 * Yatri Cloud, and pull the ones raised in the Razorpay dashboard back in.
 */

// Currencies whose ISO minor unit is not 2 (mirrors verify.ts / currency-catalog).
const ZERO_DECIMAL = new Set(['BIF','CLP','DJF','GNF','ISK','JPY','KMF','KRW','PYG','RWF','UGX','VND','VUV','XAF','XOF','XPF']);
const THREE_DECIMAL = new Set(['BHD','IQD','JOD','KWD','OMR','TND']);
function toSmallestUnit(amountMajor: number, code: string): number {
  const c = (code || 'INR').toUpperCase();
  const dec = ZERO_DECIMAL.has(c) ? 0 : THREE_DECIMAL.has(c) ? 3 : 2;
  return Math.round((Number(amountMajor) || 0) * Math.pow(10, dec));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Method Not Allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!supabaseUrl || !serviceKey) return res.status(500).json({ ok: false, message: 'Server is not configured.' });
  if (!keyId || !keySecret) return res.status(500).json({ ok: false, message: 'Payments are not configured on the server.' });

  const { action, access_token } = req.body || {};
  if (!action || !access_token) return res.status(400).json({ ok: false, message: 'Missing action or sign in token.' });

  // ---- Verify the caller is an admin ----
  try {
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${access_token}` },
    });
    if (!userRes.ok) return res.status(401).json({ ok: false, message: 'Please sign in again.' });
    const authUser = await userRes.json().catch(() => null);
    const uid = authUser?.id;
    if (!uid) return res.status(401).json({ ok: false, message: 'Please sign in again.' });

    const profRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${uid}&select=role`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
    );
    const [profile] = (await profRes.json().catch(() => [])) as Array<{ role?: string }>;
    if (profile?.role !== 'admin') return res.status(403).json({ ok: false, message: 'Admins only.' });
  } catch (e) {
    console.error('admin gateway auth error:', e);
    return res.status(500).json({ ok: false, message: 'Could not verify your access.' });
  }

  // ---- Razorpay call helper (Basic auth) ----
  const basic = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const rzp = async (method: string, path: string, body?: unknown) => {
    const r = await fetch(`https://api.razorpay.com/v1${path}`, {
      method,
      headers: { Authorization: basic, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, data };
  };

  try {
    const p = req.body || {};

    if (action === 'invoices.list') {
      const count = Math.min(Math.max(Number(p.count) || 25, 1), 100);
      const skip = Math.max(Number(p.skip) || 0, 0);
      const r = await rzp('GET', `/invoices?count=${count}&skip=${skip}`);
      if (!r.ok) return res.status(r.status).json({ ok: false, message: r.data?.error?.description || 'Could not load invoices.' });
      return res.status(200).json({ ok: true, count: r.data.count, items: r.data.items || [] });
    }

    if (action === 'payments.list') {
      const count = Math.min(Math.max(Number(p.count) || 25, 1), 100);
      const skip = Math.max(Number(p.skip) || 0, 0);
      const r = await rzp('GET', `/payments?count=${count}&skip=${skip}`);
      if (!r.ok) return res.status(r.status).json({ ok: false, message: r.data?.error?.description || 'Could not load payments.' });
      return res.status(200).json({ ok: true, count: r.data.count, items: r.data.items || [] });
    }

    if (action === 'invoices.create') {
      const cust = p.customer || {};
      const currency = String(p.currency || 'INR').toUpperCase();
      const amount = Number(p.amount);
      if (!cust.name || !cust.email) return res.status(400).json({ ok: false, message: 'Customer name and email are required.' });
      if (!p.item_name) return res.status(400).json({ ok: false, message: 'An item name is required.' });
      if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ ok: false, message: 'Enter a valid amount.' });

      const payload: Record<string, unknown> = {
        type: 'invoice',
        description: String(p.description || p.item_name),
        customer: {
          name: String(cust.name),
          email: String(cust.email),
          ...(cust.contact ? { contact: String(cust.contact) } : {}),
        },
        line_items: [
          { name: String(p.item_name), amount: toSmallestUnit(amount, currency), currency, quantity: 1 },
        ],
        currency,
        email_notify: p.notify ? 1 : 0,
        sms_notify: 0,
      };
      const r = await rzp('POST', '/invoices', payload);
      if (!r.ok) return res.status(r.status).json({ ok: false, message: r.data?.error?.description || 'Could not create the invoice.' });
      return res.status(200).json({
        ok: true,
        invoice: { id: r.data.id, status: r.data.status, short_url: r.data.short_url, amount: r.data.amount, currency: r.data.currency },
      });
    }

    if (action === 'invoices.cancel') {
      if (!p.invoice_id) return res.status(400).json({ ok: false, message: 'Missing invoice id.' });
      const r = await rzp('POST', `/invoices/${encodeURIComponent(String(p.invoice_id))}/cancel`);
      if (!r.ok) return res.status(r.status).json({ ok: false, message: r.data?.error?.description || 'Could not cancel the invoice.' });
      return res.status(200).json({ ok: true, status: r.data.status });
    }

    return res.status(400).json({ ok: false, message: `Unknown action: ${action}` });
  } catch (e) {
    console.error('admin gateway action error:', e);
    return res.status(500).json({ ok: false, message: 'Something went wrong talking to Razorpay.' });
  }
}
