-- ============================================================
-- Yatri Cloud — 007_events_public_archive.sql
-- Past (archived) events are part of the public story ("Moments
-- we've shared" gallery) — make them anon-readable like published.
-- ============================================================

drop policy if exists "events_public_read" on events;
create policy "events_public_read" on events for select
  using (status in ('published','archived') or created_by = auth.uid() or is_admin());
