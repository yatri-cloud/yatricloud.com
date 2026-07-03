-- ============================================================
-- Yatri Cloud — 024_event_waitlist.sql
-- Event capacity waitlist. When an event with a capacity is full, Yatris can
-- join the waitlist. Admins see the waitlist and notify the next in line when
-- a seat opens. Mirrors the event_registrations access model (login required).
-- ============================================================

create table if not exists event_waitlist (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  name text,
  email text not null,
  phone text,
  status text not null default 'waiting'
    check (status in ('waiting','notified','converted','cancelled')),
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (event_id, email)
);
create index if not exists idx_event_waitlist_event on event_waitlist (event_id, created_at);

alter table event_waitlist enable row level security;

-- A Yatri joins their own waitlist entry; admins can add anyone.
drop policy if exists "waitlist_insert_auth" on event_waitlist;
create policy "waitlist_insert_auth" on event_waitlist for insert
  with check (user_id = auth.uid() or is_admin());

-- Owner or admin reads.
drop policy if exists "waitlist_read_own" on event_waitlist;
create policy "waitlist_read_own" on event_waitlist for select
  using (user_id = auth.uid() or is_admin());

-- The owner may leave the waitlist (cancel); admins manage everything.
drop policy if exists "waitlist_owner_cancel" on event_waitlist;
create policy "waitlist_owner_cancel" on event_waitlist for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and status = 'cancelled');

drop policy if exists "waitlist_admin_all" on event_waitlist;
create policy "waitlist_admin_all" on event_waitlist for all
  using (is_admin()) with check (is_admin());
