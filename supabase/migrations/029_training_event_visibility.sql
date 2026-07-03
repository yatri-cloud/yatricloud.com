-- 029_training_event_visibility.sql
-- Public vs private (unlisted) visibility for events and trainings.
--
-- private = the item is still published (so a shared/direct link keeps working
-- for logged-out visitors), but it is excluded from the public /events and
-- /training listings. RLS is intentionally left UNCHANGED: the public read
-- policies already allow anon to read any published row, which is exactly what
-- an unlisted link needs. Visibility is enforced in the listing queries/pages,
-- not at the security boundary.

alter table events
  add column if not exists visibility text not null default 'public'
    check (visibility in ('public', 'private'));

alter table trainings
  add column if not exists visibility text not null default 'public'
    check (visibility in ('public', 'private'));

comment on column events.visibility is
  'public = shown in the /events listing; private = unlisted, reachable only via its direct link.';
comment on column trainings.visibility is
  'public = shown in the /training listing; private = unlisted, reachable only via its direct link.';
