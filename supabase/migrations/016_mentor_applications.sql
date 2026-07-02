-- ============================================================
-- Yatri Cloud — 016_mentor_applications.sql
-- Mentor application lifecycle: anyone signed in can apply to
-- become a mentor; admins review and approve or reject. Approval
-- creates the mentors row linked to the applicant, which unlocks
-- the mentor dashboard automatically.
-- ============================================================

create table if not exists mentor_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  headline text not null default '',
  bio text not null default '',
  expertise text[] not null default '{}',
  linkedin_url text,
  photo_url text,
  experience_years text,
  motivation text,
  links jsonb not null default '{}',
  status text not null default 'pending'
    check (status in ('pending','approved','rejected')),
  admin_notes text,
  mentor_id uuid references mentors(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_mentor_apps_status on mentor_applications (status, created_at desc);
create index if not exists idx_mentor_apps_user on mentor_applications (user_id);

drop trigger if exists trg_mentor_apps_updated on mentor_applications;
create trigger trg_mentor_apps_updated before update on mentor_applications
  for each row execute function set_updated_at();

alter table mentor_applications enable row level security;

-- Signed in Yatris submit their own application.
drop policy if exists "mentor_apps_insert_own" on mentor_applications;
create policy "mentor_apps_insert_own" on mentor_applications for insert
  with check (user_id = auth.uid() and status = 'pending');

-- Applicants see their own; admins see all.
drop policy if exists "mentor_apps_select_own_or_admin" on mentor_applications;
create policy "mentor_apps_select_own_or_admin" on mentor_applications for select
  using (user_id = auth.uid() or is_admin());

-- Applicants may update their own application only while it is pending.
drop policy if exists "mentor_apps_update_own_pending" on mentor_applications;
create policy "mentor_apps_update_own_pending" on mentor_applications for update
  using (user_id = auth.uid() and status = 'pending')
  with check (user_id = auth.uid() and status = 'pending');

-- Admins manage everything.
drop policy if exists "mentor_apps_admin_all" on mentor_applications;
create policy "mentor_apps_admin_all" on mentor_applications for all
  using (is_admin()) with check (is_admin());
