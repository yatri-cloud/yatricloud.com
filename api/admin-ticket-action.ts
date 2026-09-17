import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Method Not Allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ ok: false, message: 'Server database is not configured' });
  }

  const svcHeaders = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  };

  try {
    const { action, ticket_id, status } = req.body || {};

    if (!ticket_id) {
      return res.status(400).json({ ok: false, message: 'ticket_id is required' });
    }

    if (action === 'delete') {
      // Delete associated messages first
      await fetch(
        `${supabaseUrl}/rest/v1/support_messages?ticket_id=eq.${encodeURIComponent(ticket_id)}`,
        {
          method: 'DELETE',
          headers: svcHeaders,
        }
      );

      // Delete the ticket
      const delRes = await fetch(
        `${supabaseUrl}/rest/v1/support_tickets?id=eq.${encodeURIComponent(ticket_id)}`,
        {
          method: 'DELETE',
          headers: { ...svcHeaders, Prefer: 'return=representation' },
        }
      );

      if (!delRes.ok) {
        const errText = await delRes.text();
        console.error('Delete ticket failed:', errText);
        return res.status(500).json({ ok: false, message: 'Failed to delete ticket' });
      }

      return res.status(200).json({ ok: true, message: 'Ticket deleted successfully' });
    }

    if (action === 'set_status') {
      if (!status || !['open', 'pending', 'resolved', 'closed'].includes(status)) {
        return res.status(400).json({ ok: false, message: 'Valid status is required' });
      }

      const patch: Record<string, unknown> = {
        status,
        last_activity_at: new Date().toISOString(),
      };
      if (status === 'resolved') patch.resolved_at = new Date().toISOString();
      if (status === 'closed') patch.closed_at = new Date().toISOString();

      const patchRes = await fetch(
        `${supabaseUrl}/rest/v1/support_tickets?id=eq.${encodeURIComponent(ticket_id)}`,
        {
          method: 'PATCH',
          headers: { ...svcHeaders, Prefer: 'return=representation' },
          body: JSON.stringify(patch),
        }
      );

      if (!patchRes.ok) {
        const errText = await patchRes.text();
        console.error('Set ticket status failed:', errText);
        return res.status(500).json({ ok: false, message: 'Failed to update ticket status' });
      }

      return res.status(200).json({ ok: true, message: 'Ticket status updated' });
    }

    return res.status(400).json({ ok: false, message: 'Unknown action' });
  } catch (error) {
    console.error('Admin ticket action error:', error);
    return res.status(500).json({ ok: false, message: 'Internal server error' });
  }
}
