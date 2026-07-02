-- ============================================================
-- Yatri Cloud — 001_schema.sql
-- Core schema: enums, 14 tables, indexes, updated_at triggers
-- Idempotent-ish: guarded with IF NOT EXISTS where possible.
-- ============================================================

-- ---------- ENUMS ----------
do $$ begin
  create type provider_t as enum ('AWS','AZURE','GCP','GITHUB','ORACLE','SALESFORCE','SERVICENOW','OPENAI','HASHICORP','KUBERNETES','OTHER');
exception when duplicate_object then null; end $$;

do $$ begin
  create type content_status_t as enum ('draft','published','archived','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status_t as enum ('pending','completed','failed','refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_provider_t as enum ('razorpay','stripe','free');
exception when duplicate_object then null; end $$;

do $$ begin
  create type enrollment_status_t as enum ('enrolled','in_progress','completed','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type registration_status_t as enum ('registered','attended','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type request_status_t as enum ('pending','approved','sent','used','rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type submission_kind_t as enum ('speaker','sponsor','venue');
exception when duplicate_object then null; end $$;

-- ---------- updated_at helper ----------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- 1. profiles (extends auth.users) ----------
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  email text unique not null,
  full_name text not null default '',
  linkedin_url text,
  photo_url text,
  country text,
  state_province text,
  city text,
  country_code text,
  phone_number text,
  role text not null default 'yatri' check (role in ('yatri','trainer','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_profiles_updated on profiles;
create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, photo_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- 9/10 first: orders + payments (referenced by others) ----------
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  email text not null,
  kind text not null check (kind in ('store','exam_dump','event','training','other')),
  items jsonb not null default '[]',
  amount numeric(10,2) not null check (amount >= 0),
  currency text not null default 'INR',
  status payment_status_t not null default 'pending',
  created_at timestamptz not null default now()
);
create index if not exists idx_orders_email on orders (email);
create index if not exists idx_orders_user on orders (user_id);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete set null,
  provider payment_provider_t not null,
  provider_order_id text,
  provider_payment_id text,
  amount numeric(10,2) not null check (amount >= 0),
  currency text not null default 'INR',
  status payment_status_t not null default 'pending',
  raw jsonb not null default '{}',
  created_at timestamptz not null default now(),
  verified_at timestamptz
);
create index if not exists idx_payments_order on payments (order_id);
create index if not exists idx_payments_provider_ids on payments (provider, provider_order_id);

-- ---------- 2. certifications ----------
create table if not exists certifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  email text not null,
  full_name text not null,
  provider provider_t not null,
  certification_name text not null,
  exam_code text,
  certification_date date,
  verified_credential_url text,
  linkedin_url text,
  photo_url text,
  country text,
  state_province text,
  city text,
  country_code text,
  phone_number text,
  additional_notes text,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_certs_provider_exam on certifications (provider, exam_code);
create index if not exists idx_certs_email on certifications (email);
create index if not exists idx_certs_user on certifications (user_id);

-- ---------- 3. events ----------
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  event_date timestamptz,
  location text,
  city text,
  country text,
  capacity int,
  ticket_type text not null default 'free' check (ticket_type in ('free','paid')),
  price_inr numeric(10,2) not null default 0,
  image_url text,
  meet_link text,
  status content_status_t not null default 'draft',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_events_updated on events;
create trigger trg_events_updated before update on events
  for each row execute function set_updated_at();
create index if not exists idx_events_status_date on events (status, event_date);

-- ---------- 4. event_registrations ----------
create table if not exists event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  user_id uuid references profiles(id),
  registration_code text unique not null,
  name text not null,
  email text not null,
  phone text,
  city text,
  state text,
  country text,
  linkedin_url text,
  status registration_status_t not null default 'registered',
  attended_at timestamptz,
  payment_id uuid references payments(id),
  created_at timestamptz not null default now()
);
create unique index if not exists uq_event_reg_email on event_registrations (event_id, email);
create index if not exists idx_event_reg_user on event_registrations (user_id);

-- ---------- 5. event_submissions (speaker/sponsor/venue) ----------
create table if not exists event_submissions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  kind submission_kind_t not null,
  name text not null,
  email text,
  phone text,
  organization text,
  title text,
  bio text,
  links jsonb not null default '{}',
  details jsonb not null default '{}',
  status request_status_t not null default 'pending',
  created_at timestamptz not null default now()
);
create index if not exists idx_event_sub_event_kind on event_submissions (event_id, kind);

-- ---------- 6. event_feedback ----------
create table if not exists event_feedback (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  user_id uuid references profiles(id),
  email text,
  rating int check (rating between 1 and 5),
  comments text,
  answers jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists idx_event_fb_event on event_feedback (event_id);

-- ---------- 7. products (Yatri Store) ----------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  provider provider_t not null,
  exam_code text,
  level text,
  original_price_inr numeric(10,2) not null default 0,
  discounted_price_inr numeric(10,2) not null default 0,
  image_url text,
  description text,
  status content_status_t not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_products_updated on products;
create trigger trg_products_updated before update on products
  for each row execute function set_updated_at();
create index if not exists idx_products_provider_status on products (provider, status);

-- ---------- 8. exam_dumps ----------
create table if not exists exam_dumps (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  provider provider_t not null,
  original_price_inr numeric(10,2),
  price_inr numeric(10,2) not null default 0,
  image_url text,
  description text,
  file_path text,
  download_url text,          -- legacy external URL (until file migrated to Storage)
  status content_status_t not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_dumps_updated on exam_dumps;
create trigger trg_dumps_updated before update on exam_dumps
  for each row execute function set_updated_at();
create index if not exists idx_dumps_provider_status on exam_dumps (provider, status);

-- ---------- 11. trainings ----------
create table if not exists trainings (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name text not null,
  course_title text,
  provider provider_t,
  start_date date,
  start_time time,
  end_date date,
  duration_hours numeric(5,1),
  mode text not null default 'online' check (mode in ('online','hybrid','offline')),
  city text,
  trainer_id uuid references profiles(id),
  trainer_name text,
  trainer_email text,
  max_capacity int,
  price_inr numeric(10,2) not null default 0,
  meet_link text,
  image_url text,
  description text,
  resources jsonb not null default '[]',
  status content_status_t not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_trainings_updated on trainings;
create trigger trg_trainings_updated before update on trainings
  for each row execute function set_updated_at();
create index if not exists idx_trainings_status on trainings (status, start_date);

-- ---------- 12. training_enrollments ----------
create table if not exists training_enrollments (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references trainings(id) on delete cascade,
  user_id uuid references profiles(id),
  email text not null,
  status enrollment_status_t not null default 'enrolled',
  payment_id uuid references payments(id),
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (training_id, email)
);
create index if not exists idx_enroll_user on training_enrollments (user_id);

-- ---------- 13. voucher_requests ----------
create table if not exists voucher_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  full_name text not null,
  email text not null,
  whatsapp text,
  contact_number text,
  country text,
  provider provider_t not null,
  exams text[] not null default '{}',
  reason text,
  status request_status_t not null default 'pending',
  created_at timestamptz not null default now()
);
create index if not exists idx_voucher_email on voucher_requests (email);
create index if not exists idx_voucher_status on voucher_requests (status);

-- ---------- 14. reviews ----------
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  name text not null,
  email text,
  rating int check (rating between 1 and 5),
  review text not null,
  context text not null default 'general',
  photo_url text,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_reviews_public on reviews (is_public, created_at desc);
