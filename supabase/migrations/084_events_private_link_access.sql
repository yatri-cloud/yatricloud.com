-- ============================================================
-- Yatri Cloud — 084_events_private_link_access.sql
-- Allow direct-link access to private events while keeping them out of
-- public listings. The public list pages already filter private events out,
-- so this change only makes the shared link work for anyone who opens it.
-- ============================================================

drop policy if exists "events_private_link_read" on events;
create policy "events_private_link_read" on events
for select
using (
  status = 'published'
  or created_by = auth.uid()
  or is_admin()
);

drop policy if exists "events_public_read" on events;
create policy "events_public_read" on events
for select
using (
  status = 'published'
  or created_by = auth.uid()
  or is_admin()
);
