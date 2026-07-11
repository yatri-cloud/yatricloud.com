-- 050: full job-seeker profile (dedicated builder page) + referral search queue.
alter table public.job_profiles
  add column if not exists headline text not null default '',
  add column if not exists locations text not null default '',      -- preferred cities/regions, comma sep
  add column if not exists work_area text not null default '',       -- domain/field, e.g. Cloud, Data, Frontend
  add column if not exists seniority text not null default '',        -- intern/entry/mid/senior
  add column if not exists work_mode text not null default '',        -- remote/hybrid/onsite/any
  add column if not exists target_companies text not null default '', -- comma sep wishlist
  add column if not exists notes text not null default '';

-- Referral search (Google Programmable Search Engine → LinkedIn profiles).
-- Built by the Mac worker with the Custom Search JSON API (key server-side).
create table if not exists public.referral_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid references public.job_postings(id) on delete set null,
  query text not null default '',
  status text not null default 'queued'
    check (status in ('queued','processing','ready','failed')),
  result jsonb,          -- [{name, linkedin_url, snippet, note, followup, score}]
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.referral_searches enable row level security;
create policy referral_searches_own on public.referral_searches
  for all to authenticated
  using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid());
