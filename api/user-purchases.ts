import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Method Not Allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ ok: false, message: 'Database is not configured on the server' });
  }

  const svcHeaders = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  };

  try {
    const { access_token } = req.body || {};
    if (!access_token) {
      return res.status(401).json({ ok: false, message: 'access_token is required' });
    }

    // Verify user session
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${access_token}` },
    });
    if (!userRes.ok) {
      return res.status(401).json({ ok: false, message: 'Please sign in again.' });
    }
    const authUser = await userRes.json().catch(() => null);
    const uid = authUser?.id;
    const email = (authUser?.email || '').trim().toLowerCase();

    if (!uid || !email) {
      return res.status(401).json({ ok: false, message: 'User not authenticated' });
    }

    // Fetch invoices by buyer_email case-insensitively
    const [invRes, ordersRes] = await Promise.all([
      fetch(
        `${supabaseUrl}/rest/v1/invoices?buyer_email=ilike.${encodeURIComponent(
          email
        )}&select=*&order=created_at.desc`,
        { headers: svcHeaders }
      ),
      fetch(
        `${supabaseUrl}/rest/v1/orders?email=ilike.${encodeURIComponent(
          email
        )}&select=*&order=created_at.desc`,
        { headers: svcHeaders }
      ),
    ]);

    const invoices = (await invRes.json().catch(() => [])) || [];
    const orders = (await ordersRes.json().catch(() => [])) || [];

    return res.status(200).json({
      ok: true,
      invoices: Array.isArray(invoices) ? invoices : [],
      orders: Array.isArray(orders) ? orders : [],
    });
  } catch (error) {
    console.error('user-purchases error:', error);
    return res.status(500).json({ ok: false, message: 'Failed to fetch user purchases' });
  }
}
