-- 031_quizzes.sql
-- Practice quiz engine. The authoring UI (QuizBuilder) and the student flow
-- (QuizOverview/QuizTaking/QuizResults) already exist in the app; this gives
-- them real storage.
--
-- Security note: quiz rows carry the correct answers inside `questions`, so
-- reads are gated to enrolled students, the training's trainer, and admins —
-- never anon. Attempts are owned by the student who made them.

create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references trainings(id) on delete cascade,
  title text not null default 'Practice Quiz',
  description text,
  -- QuizQuestion[]: { id, question, questionType, options[{text,explanation}],
  --                   correctAnswers (1-based), overallExplanation, domain?, order }
  questions jsonb not null default '[]',
  passing_score int not null default 70 check (passing_score between 0 and 100),
  time_limit_min int check (time_limit_min > 0),
  sort_order int not null default 0,
  status text not null default 'published' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_quizzes_training on quizzes (training_id, sort_order);

create table if not exists quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  training_id uuid not null references trainings(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  -- QuizAnswer[]: { questionId, selectedAnswers (1-based), isCorrect, flagged }
  answers jsonb not null default '[]',
  score numeric(5,2) not null default 0,
  is_passed boolean not null default false,
  time_spent_sec int not null default 0,
  status text not null default 'completed' check (status in ('in-progress', 'completed', 'abandoned')),
  created_at timestamptz not null default now()
);
create index if not exists idx_quiz_attempts_user on quiz_attempts (user_id, quiz_id, created_at desc);

alter table quizzes enable row level security;
alter table quiz_attempts enable row level security;

-- Quizzes: enrolled students, the trainer, and admins may read.
drop policy if exists "quizzes_read" on quizzes;
create policy "quizzes_read" on quizzes for select using (
  is_admin()
  or exists (select 1 from trainings t where t.id = quizzes.training_id and t.trainer_id = auth.uid())
  or (
    status = 'published'
    and exists (
      select 1 from training_enrollments e
      where e.training_id = quizzes.training_id and e.user_id = auth.uid()
    )
  )
);

-- Quizzes: the training's trainer and admins may write.
drop policy if exists "quizzes_write" on quizzes;
create policy "quizzes_write" on quizzes for all using (
  is_admin()
  or exists (select 1 from trainings t where t.id = quizzes.training_id and t.trainer_id = auth.uid())
) with check (
  is_admin()
  or exists (select 1 from trainings t where t.id = quizzes.training_id and t.trainer_id = auth.uid())
);

-- Attempts: students create and read their own; trainer/admin can review.
drop policy if exists "attempts_insert_own" on quiz_attempts;
create policy "attempts_insert_own" on quiz_attempts for insert
  with check (user_id = auth.uid());

drop policy if exists "attempts_read" on quiz_attempts;
create policy "attempts_read" on quiz_attempts for select using (
  user_id = auth.uid()
  or is_admin()
  or exists (select 1 from trainings t where t.id = quiz_attempts.training_id and t.trainer_id = auth.uid())
);
