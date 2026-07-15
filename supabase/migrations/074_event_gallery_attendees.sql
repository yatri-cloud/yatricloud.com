-- 074: Attendees-only event photo gallery.
--
-- Past-event photos move out of the public events.details JSON (which any
-- visitor can read) into a PRIVATE storage bucket + a media table whose reads
-- are gated to users who ATTENDED the event (event_registrations.status =
-- 'attended') or admins. Uploads/deletes are admin-only. Attendees view photos
-- via short-lived signed URLs, which they can only mint because the storage
-- RLS SELECT policy checks their attendance.

-- ── did the current user attend this event? ─────────────────────────────────
create or replace function public.attended_event(evt uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from event_registrations r
    where r.event_id = evt
      and r.user_id = auth.uid()
      and r.status = 'attended'
  );
$$;

-- Path-based variant for the storage policy (path = "<event_id>/<file>").
-- Exception-safe: a non-UUID first segment just yields false, never an error.
create or replace function public.attended_event_path(p text)
returns boolean
language plpgsql stable security definer set search_path = public as $$
declare evt uuid;
begin
  evt := substring(p from '^[^/]+')::uuid;
  return exists (
    select 1 from event_registrations r
    where r.event_id = evt
      and r.user_id = auth.uid()
      and r.status = 'attended'
  );
exception when others then
  return false;
end $$;

-- ── media rows (one per photo/video) ────────────────────────────────────────
create table if not exists event_media (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  path        text not null,            -- "<event_id>/<file>" in the event-gallery bucket
  media_type  text not null default 'photo' check (media_type in ('photo','video')),
  caption     text,
  sort_order  int  not null default 0,
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now()
);
create index if not exists event_media_event_idx on event_media(event_id, sort_order);

alter table event_media enable row level security;

-- reads: admins + attendees of that event; writes: admins only
drop policy if exists event_media_read on event_media;
create policy event_media_read on event_media for select
  using (is_admin() or attended_event(event_id));
drop policy if exists event_media_admin_insert on event_media;
create policy event_media_admin_insert on event_media for insert
  with check (is_admin());
drop policy if exists event_media_admin_update on event_media;
create policy event_media_admin_update on event_media for update using (is_admin());
drop policy if exists event_media_admin_delete on event_media;
create policy event_media_admin_delete on event_media for delete using (is_admin());

-- ── private bucket for the actual files ─────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('event-gallery', 'event-gallery', false)
on conflict (id) do nothing;

-- storage reads gated to admins + attendees (path -> event_id); writes admin-only
drop policy if exists event_gallery_read on storage.objects;
create policy event_gallery_read on storage.objects for select
  using (bucket_id = 'event-gallery' and (is_admin() or attended_event_path(name)));
drop policy if exists event_gallery_admin_insert on storage.objects;
create policy event_gallery_admin_insert on storage.objects for insert
  with check (bucket_id = 'event-gallery' and is_admin());
drop policy if exists event_gallery_admin_delete on storage.objects;
create policy event_gallery_admin_delete on storage.objects for delete
  using (bucket_id = 'event-gallery' and is_admin());
