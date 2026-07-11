-- 046: Job outreach (phase 4) — per-application email drafts + admin referral contacts.
alter table public.job_applications
  add column if not exists email_subject text,
  add column if not exists email_body text,
  add column if not exists email_status text not null default 'none'
    check (email_status in ('none','drafting','drafted','sent'));

-- Admin-curated referral contacts (willingly shared — NO scraping).
-- Public read so users see who can refer; only admins write.
create table if not exists public.referral_contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.job_companies(id) on delete cascade,
  name text not null,
  role text not null default '',
  contact text not null default '',        -- email or public profile URL they agreed to share
  note text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.referral_contacts enable row level security;
create policy referral_contacts_public_read on public.referral_contacts
  for select using (active = true);
create policy referral_contacts_admin_all on public.referral_contacts
  for all to authenticated using (is_admin()) with check (is_admin());
