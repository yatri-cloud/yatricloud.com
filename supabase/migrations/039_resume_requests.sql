-- 039: Resume maker queue + private storage.
-- Site inserts requests; a local worker (scripts/resume-worker.mjs, service
-- role) claims them, builds .docx/.pdf via resume-maker/, uploads to the
-- private `resumes` bucket and marks rows ready. Owners read only their own
-- rows/files; admins see all rows.

create table if not exists public.resume_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  input_text text not null default '',
  jd_text text not null default '',
  status text not null default 'queued'
    check (status in ('queued','processing','ready','failed')),
  error text,
  docx_path text,
  pdf_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.resume_requests enable row level security;

create policy resume_requests_insert_own on public.resume_requests
  for insert to authenticated
  with check (user_id = auth.uid());

create policy resume_requests_select_own on public.resume_requests
  for select to authenticated
  using (user_id = auth.uid() or is_admin());

-- No user update/delete: the worker mutates rows with the service role.

-- Private bucket; owners read files under resumes/<their-uid>/...
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

create policy resumes_read_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
