-- ============================================================
-- 088: Training Sessions & Attendance
-- ============================================================

-- ── training_sessions ───────────────────────────────────────
create table if not exists training_sessions (
  id             uuid primary key default gen_random_uuid(),
  training_id    uuid not null references trainings(id) on delete cascade,
  title          text not null,
  session_date   date not null,
  start_time     time,
  end_time       time,
  section        text,
  mode           text default 'online',
  meet_link      text,
  venue          text,
  is_combined    boolean default false,
  completed      boolean default false,
  notes          text,
  created_by     uuid references auth.users(id),
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

create index if not exists idx_training_sessions_training on training_sessions(training_id);
create index if not exists idx_training_sessions_date     on training_sessions(session_date);
alter table training_sessions enable row level security;

create policy "admin_training_sessions_all" on training_sessions
  for all to authenticated
  using (exists (select 1 from admin_users where id = auth.uid()))
  with check (exists (select 1 from admin_users where id = auth.uid()));

create policy "trainer_training_sessions_own" on training_sessions
  for all to authenticated
  using (
    exists (
      select 1 from trainings t
      where t.id = training_sessions.training_id
        and t.trainer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from trainings t
      where t.id = training_sessions.training_id
        and t.trainer_id = auth.uid()
    )
  );

create policy "student_training_sessions_read" on training_sessions
  for select to authenticated
  using (
    exists (
      select 1 from training_enrollments te
      where te.training_id = training_sessions.training_id
        and te.user_id = auth.uid()
    )
  );


-- ── training_attendance ─────────────────────────────────────
do $$ begin
  if not exists (select 1 from pg_type where typname = 'attendance_status_t') then
    create type attendance_status_t as enum ('present', 'absent', 'late', 'excused');
  end if;
end $$;

create table if not exists training_attendance (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references training_sessions(id) on delete cascade,
  training_id  uuid not null references trainings(id) on delete cascade,
  user_id      uuid references auth.users(id),
  email        text not null,
  full_name    text,
  roll_number  text,
  status       attendance_status_t not null default 'absent',
  remark       text,
  marked_by    uuid references auth.users(id),
  marked_at    timestamptz default now(),
  created_at   timestamptz default now(),
  unique(session_id, email)
);

create index if not exists idx_attendance_session  on training_attendance(session_id);
create index if not exists idx_attendance_training on training_attendance(training_id);
create index if not exists idx_attendance_user     on training_attendance(user_id);
create index if not exists idx_attendance_email    on training_attendance(email);
alter table training_attendance enable row level security;

create policy "admin_attendance_all" on training_attendance
  for all to authenticated
  using (exists (select 1 from admin_users where id = auth.uid()))
  with check (exists (select 1 from admin_users where id = auth.uid()));

create policy "trainer_attendance_own" on training_attendance
  for all to authenticated
  using (
    exists (select 1 from trainings t where t.id = training_attendance.training_id and t.trainer_id = auth.uid())
  )
  with check (
    exists (select 1 from trainings t where t.id = training_attendance.training_id and t.trainer_id = auth.uid())
  );

create policy "student_attendance_read_own" on training_attendance
  for select to authenticated
  using (user_id = auth.uid());


-- ── training_assessments ────────────────────────────────────
create table if not exists training_assessments (
  id              uuid primary key default gen_random_uuid(),
  training_id     uuid not null references trainings(id) on delete cascade,
  title           text not null,
  weight_pct      numeric(5,2) default 16.66,
  max_marks       numeric(7,2) default 100,
  assessment_date date,
  created_at      timestamptz default now()
);

create index if not exists idx_assessments_training on training_assessments(training_id);
alter table training_assessments enable row level security;

create policy "admin_assessments_all" on training_assessments
  for all to authenticated
  using (exists (select 1 from admin_users where id = auth.uid()))
  with check (exists (select 1 from admin_users where id = auth.uid()));

create policy "trainer_assessments_own" on training_assessments
  for all to authenticated
  using (
    exists (select 1 from trainings t where t.id = training_assessments.training_id and t.trainer_id = auth.uid())
  )
  with check (
    exists (select 1 from trainings t where t.id = training_assessments.training_id and t.trainer_id = auth.uid())
  );

create policy "student_assessments_read" on training_assessments
  for select to authenticated
  using (
    exists (
      select 1 from training_enrollments te
      where te.training_id = training_assessments.training_id and te.user_id = auth.uid()
    )
  );


-- ── training_student_scores ─────────────────────────────────
create table if not exists training_student_scores (
  id             uuid primary key default gen_random_uuid(),
  assessment_id  uuid not null references training_assessments(id) on delete cascade,
  training_id    uuid not null references trainings(id) on delete cascade,
  user_id        uuid references auth.users(id),
  email          text not null,
  full_name      text,
  score          numeric(7,2),
  bucket         text,
  uploaded_at    timestamptz default now(),
  unique(assessment_id, email)
);

create index if not exists idx_scores_assessment on training_student_scores(assessment_id);
create index if not exists idx_scores_training   on training_student_scores(training_id);
alter table training_student_scores enable row level security;

create policy "admin_scores_all" on training_student_scores
  for all to authenticated
  using (exists (select 1 from admin_users where id = auth.uid()))
  with check (exists (select 1 from admin_users where id = auth.uid()));

create policy "trainer_scores_own" on training_student_scores
  for all to authenticated
  using (
    exists (select 1 from trainings t where t.id = training_student_scores.training_id and t.trainer_id = auth.uid())
  )
  with check (
    exists (select 1 from trainings t where t.id = training_student_scores.training_id and t.trainer_id = auth.uid())
  );

create policy "student_scores_read_own" on training_student_scores
  for select to authenticated
  using (user_id = auth.uid());

-- updated_at trigger for sessions
create or replace function update_training_sessions_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_training_sessions_updated_at on training_sessions;
create trigger trg_training_sessions_updated_at
  before update on training_sessions
  for each row execute procedure update_training_sessions_updated_at();
