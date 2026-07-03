import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Issue a course completion certificate.
 *
 * Body: { training_id, access_token }
 *
 * The caller proves who they are with a Supabase access token. We then check,
 * with the service role, that they are enrolled and have completed EVERY lesson
 * of the training. Only then do we issue a certificate. This is the only writer
 * of the certificates table, so completion cannot be faked from the browser.
 * Idempotent: if a certificate already exists it is returned unchanged.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Method Not Allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ ok: false, message: 'The server is not configured to issue certificates yet.' });
  }
  const h = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' };

  try {
    const { training_id, access_token } = req.body || {};
    if (!training_id || !access_token) {
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

    // Every lesson of the course.
    const modRes = await fetch(
      `${supabaseUrl}/rest/v1/course_modules?training_id=eq.${encodeURIComponent(training_id)}&select=id,course_lessons(id)`,
      { headers: h }
    );
    const mods = (await modRes.json().catch(() => [])) as Array<{ course_lessons?: Array<{ id: string }> }>;
    const lessonIds = mods.flatMap((m) => (m.course_lessons || []).map((l) => l.id));
    if (lessonIds.length === 0) {
      return res.status(400).json({ ok: false, message: 'This course has no lessons yet.' });
    }

    // The user's completed lessons.
    const progRes = await fetch(
      `${supabaseUrl}/rest/v1/lesson_progress?user_id=eq.${uid}&training_id=eq.${encodeURIComponent(training_id)}&select=lesson_id`,
      { headers: h }
    );
    const prog = (await progRes.json().catch(() => [])) as Array<{ lesson_id: string }>;
    const done = new Set(prog.map((p) => p.lesson_id));
    const allDone = lessonIds.every((id) => done.has(id));
    if (!allDone) {
      return res.status(400).json({ ok: false, message: 'Finish every lesson to earn your certificate.' });
    }

    // Recipient name + course title.
    const [profileRes, trainingRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${uid}&select=full_name,email`, { headers: h }),
      fetch(`${supabaseUrl}/rest/v1/trainings?id=eq.${encodeURIComponent(training_id)}&select=name,course_title`, { headers: h }),
    ]);
    const [profile] = (await profileRes.json().catch(() => [])) as Array<{ full_name?: string; email?: string }>;
    const [training] = (await trainingRes.json().catch(() => [])) as Array<{ name?: string; course_title?: string }>;
    const recipientName = profile?.full_name || enrollment.email || 'Yatri';
    const title = training?.course_title || training?.name || 'Yatri Cloud Training';

    // A readable, unique serial.
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

    // Mark the enrollment completed (best effort).
    await fetch(`${supabaseUrl}/rest/v1/training_enrollments?id=eq.${enrollment.id}`, {
      method: 'PATCH', headers: { ...h, Prefer: 'return=minimal' },
      body: JSON.stringify({ status: 'completed', completed_at: now.toISOString() }),
    }).catch(() => {});

    // Email the certificate link (best effort).
    try {
      const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
      const host = req.headers.host;
      const url = `https://www.yatricloud.com/certificate/${serial}`;
      if (host && enrollment.email) {
        await fetch(`${proto}://${host}/api/send-email`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: enrollment.email,
            subject: `Your certificate for ${title}`,
            html: `
              <div style="font-family:'Segoe UI',Tahoma,sans-serif;color:#1f2937;line-height:1.6;max-width:600px;margin:0 auto;">
                <div style="background:#0a1f44;padding:26px 30px;border-radius:0 0 16px 16px;color:#fff;font-size:20px;font-weight:700;">Yatri Cloud</div>
                <div style="background:#fff;padding:34px 30px;margin:20px;border-radius:14px;box-shadow:0 4px 10px rgba(0,0,0,0.06);">
                  <h2 style="color:#0a1f44;margin-top:0;">Congratulations, ${recipientName}</h2>
                  <p>You completed <strong>${title}</strong>. Your certificate is ready.</p>
                  <p style="margin:24px 0;"><a href="${url}" style="display:inline-block;background:#007CFF;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;">View your certificate</a></p>
                  <p style="color:#6b7280;font-size:13px;">Certificate serial ${serial}. Anyone can verify it at the link above.</p>
                  <p>Warm regards,<br><strong>Team Yatri Cloud</strong></p>
                </div>
              </div>`,
          }),
        });
      }
    } catch (e) {
      console.error('certificate email failed (ignored):', e);
    }

    return res.status(200).json({ ok: true, serial });
  } catch (error) {
    console.error('Error in /api/training/issue-certificate:', error);
    return res.status(500).json({ ok: false, message: 'Something went wrong. Please try again.' });
  }
}
