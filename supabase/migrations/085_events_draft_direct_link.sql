-- ============================================================
-- Yatri Cloud — 085_events_draft_direct_link.sql
-- Allow direct-link access to draft, upcoming and private events
-- so attendee registrations and payments work end-to-end.
-- Public listing pages (getPublishedEvents) explicitly filter for
-- status = 'published' and visibility != 'private'.
-- Also allow authenticated users to update their own event_registrations.
-- ============================================================

drop policy if exists "events_public_read" on events;
drop policy if exists "events_private_link_read" on events;

create policy "events_public_read" on events
for select
using (true);

-- Allow users to update their own registrations (e.g. during payment checkout & retries)
drop policy if exists "eventreg_update_own" on event_registrations;
create policy "eventreg_update_own" on event_registrations
for update
to authenticated
using (user_id = auth.uid() or is_admin())
with check (user_id = auth.uid() or is_admin());
