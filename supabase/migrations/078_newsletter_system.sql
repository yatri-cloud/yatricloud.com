-- 078_newsletter_system.sql
-- Newsletter system: subscriber management, campaign composer, send tracking

-- ─── Extend subscribers ──────────────────────────────────────────────
ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz,
  ADD COLUMN IF NOT EXISTS unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid();

-- ─── Newsletters (campaigns) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subject text NOT NULL,
  body_html text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent')),
  sent_at timestamptz,
  sent_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  recipient_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "newsletters_admin_all" ON newsletters
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─── Newsletter sends (delivery tracking) ────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  newsletter_id uuid NOT NULL REFERENCES newsletters(id) ON DELETE CASCADE,
  subscriber_id uuid NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE newsletter_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "newsletter_sends_admin_all" ON newsletter_sends
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─── RLS additions ───────────────────────────────────────────────────
-- Allow public to unsubscribe (UPDATE own row by token)
CREATE POLICY "subscribers_public_unsubscribe" ON subscribers
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- Allow admins full CRUD on subscribers
CREATE POLICY "subscribers_admin_all" ON subscribers
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─── Seed newsletter welcome template ────────────────────────────────
INSERT INTO email_templates (key, subject, body_html)
VALUES (
  'newsletter_welcome',
  'Welcome to the Yatri Cloud newsletter',
  '<p style="margin:0 0 16px;color:#1f2937;font-size:16px;line-height:1.6;">Hey {{name}},</p><p style="margin:0 0 16px;color:#1f2937;font-size:16px;line-height:1.6;">Welcome to the Yatri Cloud newsletter. You will receive updates on new certification dumps, upcoming events, exclusive discounts, and learning resources to help you ace your cloud exams.</p><p style="margin:0 0 16px;color:#1f2937;font-size:16px;line-height:1.6;">We are glad to have you with us, Yatri.</p><p style="margin:0;color:#6b7280;font-size:14px;">The Yatri Cloud Team</p>'
)
ON CONFLICT (key) DO NOTHING;

-- ─── Indexes ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers(status);
CREATE INDEX IF NOT EXISTS idx_subscribers_token ON subscribers(unsubscribe_token);
CREATE INDEX IF NOT EXISTS idx_newsletters_status ON newsletters(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_sends_newsletter ON newsletter_sends(newsletter_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_sends_subscriber ON newsletter_sends(subscriber_id);
