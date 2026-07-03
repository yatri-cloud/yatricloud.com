-- ============================================================
-- Yatri Cloud — 019_mentor_date_overrides.sql
-- Date specific availability overrides on top of the weekly rules:
--   - block a whole day (holiday, vacation): kind='blocked', times null
--   - block a window on a day: kind='blocked' with start_time and end_time
--   - open a one off window on a day: kind='open' with start_time and end_time
-- Slot generation reads these alongside mentor_availability.
-- ============================================================

create table if not exists mentor_date_overrides (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references mentors(id) on delete cascade,
  date date not null,
  kind text not null check (kind in ('blocked','open')),
  start_time time,
  end_time time,
  note text,
  created_at timestamptz not null default now(),
  -- a window override needs both times and end after start
  check (
    (start_time is null and end_time is null)
    or (start_time is not null and end_time is not null and end_time > start_time)
  )
);

create index if not exists idx_mentor_date_overrides
  on mentor_date_overrides (mentor_id, date);

alter table mentor_date_overrides enable row level security;

-- Public read so the slot picker can preview correct availability for anyone.
drop policy if exists "mentor_overrides_public_read" on mentor_date_overrides;
create policy "mentor_overrides_public_read" on mentor_date_overrides for select using (true);

-- Admins manage everything.
drop policy if exists "mentor_overrides_admin_all" on mentor_date_overrides;
create policy "mentor_overrides_admin_all" on mentor_date_overrides for all
  using (is_admin()) with check (is_admin());

-- The owning mentor manages their own overrides.
drop policy if exists "mentor_overrides_owner_all" on mentor_date_overrides;
create policy "mentor_overrides_owner_all" on mentor_date_overrides for all
  using (mentor_id in (select id from mentors where user_id = auth.uid()))
  with check (mentor_id in (select id from mentors where user_id = auth.uid()));
