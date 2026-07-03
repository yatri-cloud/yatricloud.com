-- ============================================================
-- Yatri Cloud — 021_training_progress_certificates.sql
-- Real curriculum progress and completion certificates for training.
--   - lesson_progress: which lessons a student has completed.
--   - certificates: issued when a student completes a course (server verified).
-- ============================================================

create table if not exists lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  training_id uuid not null references trainings(id) on delete cascade,
  lesson_id uuid not null references course_lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);
create index if not exists idx_lesson_progress_user_training
  on lesson_progress (user_id, training_id);

alter table lesson_progress enable row level security;

-- A student manages their own progress; admins can read all.
drop policy if exists "lesson_progress_own" on lesson_progress;
create policy "lesson_progress_own" on lesson_progress for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "lesson_progress_admin_read" on lesson_progress;
create policy "lesson_progress_admin_read" on lesson_progress for select
  using (is_admin());

create table if not exists certificates (
  id uuid primary key default gen_random_uuid(),
  serial text unique not null,
  kind text not null default 'training' check (kind in ('training','event')),
  user_id uuid references profiles(id) on delete set null,
  training_id uuid references trainings(id) on delete set null,
  recipient_name text not null,
  title text not null,
  issued_at timestamptz not null default now()
);
create index if not exists idx_certificates_user on certificates (user_id, issued_at desc);

alter table certificates enable row level security;

-- Certificates are publicly verifiable by serial (a share link), the owner sees
-- their own, admins manage all. Only the service role issues them (verify done
-- server side), so there is no public insert policy.
drop policy if exists "certificates_public_read" on certificates;
create policy "certificates_public_read" on certificates for select using (true);

drop policy if exists "certificates_admin_write" on certificates;
create policy "certificates_admin_write" on certificates for all
  using (is_admin()) with check (is_admin());
