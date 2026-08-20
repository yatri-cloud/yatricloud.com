-- 091: Email logs table for tracking all sent emails
-- Stores a record for every email sent through the /api/send-email endpoint.

CREATE TABLE IF NOT EXISTS public.email_logs (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email      text         NOT NULL,
  subject       text         NOT NULL,
  template_key  text,                          -- e.g. 'welcome', 'enrollment_confirmed'
  status        text         NOT NULL DEFAULT 'sent'  -- 'sent' | 'failed'
                             CHECK (status IN ('sent', 'failed')),
  error         text,                          -- populated on failure
  metadata      jsonb        DEFAULT '{}',     -- any extra context (user_id, event_id, etc.)
  sent_at       timestamptz  NOT NULL DEFAULT now(),
  created_at    timestamptz  NOT NULL DEFAULT now()
);

-- Indexes for the admin table filters
CREATE INDEX IF NOT EXISTS idx_email_logs_status      ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_template    ON public.email_logs(template_key);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at     ON public.email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email    ON public.email_logs(to_email);

-- RLS: admin-only access
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_logs_admin_all" ON public.email_logs;
CREATE POLICY "email_logs_admin_all" ON public.email_logs
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Grant to service role for server-side inserts
GRANT ALL ON public.email_logs TO service_role;
