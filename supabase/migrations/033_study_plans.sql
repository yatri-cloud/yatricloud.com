-- 033_study_plans.sql
-- Personal study planner: a Yatri picks a certification and an exam date;
-- their dashboard counts down and points at the right dumps/voucher/training.

create table if not exists study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  certification_id uuid not null references provider_certifications(id) on delete cascade,
  exam_date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, certification_id)
);
create index if not exists idx_study_plans_user on study_plans (user_id, exam_date);

alter table study_plans enable row level security;

drop policy if exists "study_plans_owner" on study_plans;
create policy "study_plans_owner" on study_plans for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
