-- 079_newsletter_tracking_and_scheduling.sql
-- Newsletter scheduling, open/click tracking, subscriber segments

-- ─── Scheduling ──────────────────────────────────────────────────────
ALTER TABLE newsletters
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;

-- ─── Open tracking ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_opens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  newsletter_id uuid NOT NULL REFERENCES newsletters(id) ON DELETE CASCADE,
  subscriber_id uuid NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  opened_at timestamptz NOT NULL DEFAULT now(),
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE newsletter_opens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "newsletter_opens_admin_all" ON newsletter_opens
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Public can INSERT (tracking pixel fires from subscriber's email client)
CREATE POLICY "newsletter_opens_public_insert" ON newsletter_opens
  FOR INSERT WITH CHECK (true);

-- ─── Click tracking ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  newsletter_id uuid NOT NULL REFERENCES newsletters(id) ON DELETE CASCADE,
  subscriber_id uuid NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  url text NOT NULL,
  clicked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE newsletter_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "newsletter_clicks_admin_all" ON newsletter_clicks
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "newsletter_clicks_public_insert" ON newsletter_clicks
  FOR INSERT WITH CHECK (true);

-- ─── Subscriber segments ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriber_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscriber_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriber_segments_admin_all" ON subscriber_segments
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Junction table: subscribers ↔ segments
CREATE TABLE IF NOT EXISTS subscriber_segment_members (
  segment_id uuid NOT NULL REFERENCES subscriber_segments(id) ON DELETE CASCADE,
  subscriber_id uuid NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  PRIMARY KEY (segment_id, subscriber_id)
);

ALTER TABLE subscriber_segment_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriber_segment_members_admin_all" ON subscriber_segment_members
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─── Subscriber source tracking ──────────────────────────────────────
ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'website';

-- ─── Newsletter segment targeting ────────────────────────────────────
ALTER TABLE newsletters
  ADD COLUMN IF NOT EXISTS segment_id uuid REFERENCES subscriber_segments(id) ON DELETE SET NULL;

-- ─── Summary columns on newsletters for fast analytics ───────────────
ALTER TABLE newsletters
  ADD COLUMN IF NOT EXISTS open_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS click_count int NOT NULL DEFAULT 0;

-- ─── Indexes ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_newsletter_opens_newsletter ON newsletter_opens(newsletter_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_opens_subscriber ON newsletter_opens(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_clicks_newsletter ON newsletter_clicks(newsletter_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_clicks_subscriber ON newsletter_clicks(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_newsletters_scheduled ON newsletters(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscribers_source ON subscribers(source);
CREATE INDEX IF NOT EXISTS idx_newsletters_segment ON newsletters(segment_id) WHERE segment_id IS NOT NULL;
