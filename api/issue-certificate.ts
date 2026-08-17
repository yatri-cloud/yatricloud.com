import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Issue a certificate of attendance (event) or completion (training).
 *
 * Body: { event_id?, training_id?, access_token }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Method Not Allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ ok: false, message: 'The server is not configured to issue certificates yet.' });
  }
  const h = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' };

  try {
    const { event_id, training_id, access_token } = req.body || {};
    if ((!event_id && !training_id) || !access_token) {
      return res.status(400).json({ ok: false, message: 'This request is missing some details.' });
    }

    // Who is asking?
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${access_token}` },
    });
    if (!userRes.ok) return res.status(401).json({ ok: false, message: 'Please sign in again.' });
    const authUser = await userRes.json().catch(() => null);
    const uid = authUser?.id;
    if (!uid) return res.status(401).json({ ok: false, message: 'Please sign in again.' });

    // Handle Training Certificate
    if (training_id) {
      // Already issued? Return it.
      const existingRes = await fetch(
        `${supabaseUrl}/rest/v1/certificates?user_id=eq.${uid}&training_id=eq.${encodeURIComponent(training_id)}&select=serial&limit=1`,
        { headers: h }
      );
      const existing = await existingRes.json().catch(() => []);
      if (Array.isArray(existing) && existing[0]?.serial) {
        return res.status(200).json({ ok: true, serial: existing[0].serial, already: true });
      }

      // Enrolled and paid or free?
      const enrRes = await fetch(
        `${supabaseUrl}/rest/v1/training_enrollments?user_id=eq.${uid}&training_id=eq.${encodeURIComponent(training_id)}&select=id,payment_status,email&limit=1`,
        { headers: h }
      );
      const [enrollment] = (await enrRes.json().catch(() => [])) as Array<{ id: string; payment_status: string; email: string }>;
      if (!enrollment || enrollment.payment_status === 'pending' || enrollment.payment_status === 'failed') {
        return res.status(403).json({ ok: false, message: 'You need to be enrolled in this course to earn a certificate.' });
      }

      // Completed all lessons?
      const curRes = await fetch(
        `${supabaseUrl}/rest/v1/training_curriculum?training_id=eq.${encodeURIComponent(training_id)}&select=id`,
        { headers: h }
      );
      const curriculum = ((await curRes.json().catch(() => [])) as Array<{ id: string }>) || [];
      const totalLessons = curriculum.length;

      if (totalLessons > 0) {
        const progRes = await fetch(
          `${supabaseUrl}/rest/v1/training_progress?user_id=eq.${uid}&training_id=eq.${encodeURIComponent(training_id)}&completed=eq.true&select=lesson_id`,
          { headers: h }
        );
        const progress = ((await progRes.json().catch(() => [])) as Array<{ lesson_id: string }>) || [];
        const completedIds = new Set(progress.map((p) => p.lesson_id));
        const missing = curriculum.filter((l) => !completedIds.has(l.id));
        if (missing.length > 0) {
          return res.status(403).json({
            ok: false,
            message: `Complete all ${totalLessons} lessons to claim your certificate (${missing.length} remaining).`,
          });
        }
      }

      // Recipient name + course title
      const [profileRes, courseRes] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${uid}&select=full_name,email`, { headers: h }),
        fetch(`${supabaseUrl}/rest/v1/trainings?id=eq.${encodeURIComponent(training_id)}&select=course_title,name`, { headers: h }),
      ]);
      const [profile] = (await profileRes.json().catch(() => [])) as Array<{ full_name?: string; email?: string }>;
      const [course] = (await courseRes.json().catch(() => [])) as Array<{ course_title?: string; name?: string }>;
      const recipientName = profile?.full_name || enrollment.email || 'Yatri';
      const title = course?.course_title || course?.name || 'Yatri Cloud Training';

      const now = new Date();
      const yyyymmdd = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}`;
      const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
      const serial = `YC-CERT-${yyyymmdd}-${rand}`;

      const insertRes = await fetch(`${supabaseUrl}/rest/v1/certificates`, {
        method: 'POST',
        headers: { ...h, Prefer: 'return=representation' },
        body: JSON.stringify({ serial, kind: 'training', user_id: uid, training_id, recipient_name: recipientName, title }),
      });
      if (!insertRes.ok) {
        console.error('certificate insert failed:', await insertRes.text());
        return res.status(500).json({ ok: false, message: 'We could not issue your certificate just now. Please try again.' });
      }

      return res.status(200).json({ ok: true, serial });
    }

    // Handle Event Certificate
    if (event_id) {
      const existingRes = await fetch(
        `${supabaseUrl}/rest/v1/certificates?user_id=eq.${uid}&event_id=eq.${encodeURIComponent(event_id)}&select=serial&limit=1`,
        { headers: h }
      );
      const existing = await existingRes.json().catch(() => []);
      if (Array.isArray(existing) && existing[0]?.serial) {
        return res.status(200).json({ ok: true, serial: existing[0].serial, already: true });
      }

      const regRes = await fetch(
        `${supabaseUrl}/rest/v1/event_registrations?user_id=eq.${uid}&event_id=eq.${encodeURIComponent(event_id)}&select=id,status,email&limit=1`,
        { headers: h }
      );
      const [registration] = (await regRes.json().catch(() => [])) as Array<{ id: string; status: string; email: string }>;
      if (!registration) {
        return res.status(403).json({ ok: false, message: 'We could not find your registration for this event.' });
      }
      if (registration.status !== 'attended') {
        return res.status(400).json({ ok: false, message: 'Your certificate is ready once your attendance is marked at the event.' });
      }

      const [profileRes, eventRes] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${uid}&select=full_name,email`, { headers: h }),
        fetch(`${supabaseUrl}/rest/v1/events?id=eq.${encodeURIComponent(event_id)}&select=name`, { headers: h }),
      ]);
      const [profile] = (await profileRes.json().catch(() => [])) as Array<{ full_name?: string; email?: string }>;
      const [event] = (await eventRes.json().catch(() => [])) as Array<{ name?: string }>;
      const recipientName = profile?.full_name || registration.email || 'Yatri';
      const title = event?.name || 'Yatri Cloud Event';

      const now = new Date();
      const yyyymmdd = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}`;
      const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
      const serial = `YC-CERT-${yyyymmdd}-${rand}`;

      const insertRes = await fetch(`${supabaseUrl}/rest/v1/certificates`, {
        method: 'POST',
        headers: { ...h, Prefer: 'return=representation' },
        body: JSON.stringify({ serial, kind: 'event', user_id: uid, event_id, recipient_name: recipientName, title }),
      });
      if (!insertRes.ok) {
        console.error('event certificate insert failed:', await insertRes.text());
        return res.status(500).json({ ok: false, message: 'We could not issue your certificate just now. Please try again.' });
      }

      return res.status(200).json({ ok: true, serial });
    }

    return res.status(400).json({ ok: false, message: 'Invalid certificate request.' });
  } catch (error) {
    console.error('Error in /api/issue-certificate:', error);
    return res.status(500).json({ ok: false, message: 'Something went wrong. Please try again.' });
  }
}
