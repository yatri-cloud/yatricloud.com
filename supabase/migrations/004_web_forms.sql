-- ============================================================
-- Yatri Cloud — 004_web_forms.sql
-- Website form tables (imported from previous exports):
-- consultation_requests, contact_messages, subscribers, course_requests
-- RLS: public INSERT (forms), admin-only SELECT/UPDATE.
-- ============================================================

create table if not exists consultation_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  state text,
  company_name text,
  status request_status_t not null default 'pending',
  created_at timestamptz not null default now()
);
create index if not exists idx_consult_status on consultation_requests (status, created_at desc);

create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  status request_status_t not null default 'pending',
  created_at timestamptz not null default now()
);
create index if not exists idx_contact_status on contact_messages (status, created_at desc);

create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists course_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  message text,
  course_name text,
  status request_status_t not null default 'pending',
  created_at timestamptz not null default now()
);
create index if not exists idx_coursereq_status on course_requests (status, created_at desc);

-- ---------- RLS ----------
alter table consultation_requests enable row level security;
alter table contact_messages enable row level security;
alter table subscribers enable row level security;
alter table course_requests enable row level security;

-- Public forms: anyone may submit
drop policy if exists "consult_insert_any" on consultation_requests;
create policy "consult_insert_any" on consultation_requests for insert with check (true);

drop policy if exists "contact_insert_any" on contact_messages;
create policy "contact_insert_any" on contact_messages for insert with check (true);

drop policy if exists "subscribers_insert_any" on subscribers;
create policy "subscribers_insert_any" on subscribers for insert with check (true);

drop policy if exists "coursereq_insert_any" on course_requests;
create policy "coursereq_insert_any" on course_requests for insert with check (true);

-- Admin-only read/manage
drop policy if exists "consult_admin_read" on consultation_requests;
create policy "consult_admin_read" on consultation_requests for select using (is_admin());
drop policy if exists "consult_admin_update" on consultation_requests;
create policy "consult_admin_update" on consultation_requests for update using (is_admin());

drop policy if exists "contact_admin_read" on contact_messages;
create policy "contact_admin_read" on contact_messages for select using (is_admin());
drop policy if exists "contact_admin_update" on contact_messages;
create policy "contact_admin_update" on contact_messages for update using (is_admin());

drop policy if exists "subscribers_admin_read" on subscribers;
create policy "subscribers_admin_read" on subscribers for select using (is_admin());

drop policy if exists "coursereq_admin_read" on course_requests;
create policy "coursereq_admin_read" on course_requests for select using (is_admin());
drop policy if exists "coursereq_admin_update" on course_requests;
create policy "coursereq_admin_update" on course_requests for update using (is_admin());
