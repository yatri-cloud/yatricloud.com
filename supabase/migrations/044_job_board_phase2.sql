-- 044: Job board phase 1b/2 — Ashby source + resume-to-jobs matching queue.

alter table public.job_companies drop constraint if exists job_companies_source_check;
alter table public.job_companies
  add constraint job_companies_source_check
  check (source in ('greenhouse','lever','ashby','manual'));

-- Matching runs on the owner's Mac (same worker family as resumes):
-- Claude reads the uploaded resume, derives target roles, and the worker
-- shortlists real postings; result lands as jsonb for the /jobs page.
create table if not exists public.job_match_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resume_path text not null,
  status text not null default 'queued'
    check (status in ('queued','processing','ready','failed')),
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.job_match_requests enable row level security;

create policy job_match_insert_own on public.job_match_requests
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and (select count(*) from public.job_match_requests r
         where r.user_id = auth.uid() and r.status in ('queued','processing')) < 2
  );
create policy job_match_select_own on public.job_match_requests
  for select to authenticated
  using (user_id = auth.uid() or is_admin());
create policy job_match_delete_own on public.job_match_requests
  for delete to authenticated
  using (user_id = auth.uid() or is_admin());
