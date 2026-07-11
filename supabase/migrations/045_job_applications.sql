-- 045: Job profile + selected-jobs pipeline (phase 3).
create table if not exists public.job_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  resume_path text not null default '',
  roles text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.job_profiles enable row level security;
create policy job_profiles_own on public.job_profiles
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.job_postings(id) on delete cascade,
  resume_request_id uuid references public.resume_requests(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, job_id)
);
alter table public.job_applications enable row level security;
create policy job_applications_own on public.job_applications
  for all to authenticated
  using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid());

-- Batch builds need more headroom than 3 active resume requests.
drop policy resume_requests_insert_own on public.resume_requests;
create policy resume_requests_insert_own on public.resume_requests
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and (select count(*) from public.resume_requests r
         where r.user_id = auth.uid() and r.status in ('queued','processing')) < 12
  );
