-- 043: Job board phase 1 — companies + postings.
-- Postings come from OFFICIAL public ATS APIs (Greenhouse/Lever boards) via
-- scripts/jobs-sync.mjs (service role, runs on the owner's Mac like the
-- resume worker). Public read; admin manages companies.

create table if not exists public.job_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,            -- ATS board token (greenhouse/lever)
  source text not null default 'greenhouse'
    check (source in ('greenhouse','lever','manual')),
  website text,
  careers_url text,
  contact_email text,                   -- published careers contact only
  active boolean not null default true,
  last_synced_at timestamptz,
  jobs_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.job_postings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.job_companies(id) on delete cascade,
  external_id text not null,
  title text not null,
  location text not null default '',
  level text not null default 'mid' check (level in ('entry','mid','senior')),
  department text not null default '',
  remote boolean not null default false,
  apply_url text not null default '',
  description text not null default '',
  posted_at timestamptz,
  is_active boolean not null default true,
  synced_at timestamptz not null default now(),
  unique (company_id, external_id)
);

create index if not exists job_postings_active_idx
  on public.job_postings (is_active, level, remote);
create index if not exists job_postings_company_idx
  on public.job_postings (company_id);

alter table public.job_companies enable row level security;
alter table public.job_postings enable row level security;

create policy job_companies_public_read on public.job_companies
  for select using (active = true);
create policy job_companies_admin_all on public.job_companies
  for all to authenticated using (is_admin()) with check (is_admin());

create policy job_postings_public_read on public.job_postings
  for select using (is_active = true);
create policy job_postings_admin_all on public.job_postings
  for all to authenticated using (is_admin()) with check (is_admin());
