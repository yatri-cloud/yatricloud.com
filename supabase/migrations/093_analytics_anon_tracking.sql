-- 093: Allow anonymous page-view tracking
-- The analytics_events table previously required a non-null user_id via RLS.
-- We now allow anonymous visits (user_id = null) so every page view is captured.

-- Make user_id nullable if it isn't already
ALTER TABLE public.analytics_events ALTER COLUMN user_id DROP NOT NULL;

-- Allow anonymous inserts (no auth required to write analytics events)
DROP POLICY IF EXISTS "allow_anon_insert" ON public.analytics_events;
CREATE POLICY "allow_anon_insert" ON public.analytics_events
  FOR INSERT WITH CHECK (true);

-- Admins can read everything; keep existing admin read policy
DROP POLICY IF EXISTS "analytics_admin_select" ON public.analytics_events;
CREATE POLICY "analytics_admin_select" ON public.analytics_events
  FOR SELECT USING (is_admin());

-- Each user can read their own events
DROP POLICY IF EXISTS "analytics_own_select" ON public.analytics_events;
CREATE POLICY "analytics_own_select" ON public.analytics_events
  FOR SELECT USING (user_id = auth.uid());
