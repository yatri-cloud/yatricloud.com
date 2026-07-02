-- ============================================================
-- Yatri Cloud — 005_courses_trainers.sql
-- Udemy course catalog + training course structure + trainer applications
-- (discovered in data exports: udemy-courses/, training master DB)
-- ============================================================

create table if not exists udemy_courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  course_url text not null,
  image_url text,
  creator text,                -- 'Yatharth Chauhan' | 'Nensi Ravaliya' | ...
  tech text,                   -- AWS | Azure | ...
  category text,
  status content_status_t not null default 'published',
  created_at timestamptz not null default now()
);
create unique index if not exists uq_udemy_url on udemy_courses (course_url);

create table if not exists course_modules (
  id uuid primary key default gen_random_uuid(),
  training_id uuid references trainings(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_modules_training on course_modules (training_id, sort_order);

create table if not exists course_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references course_modules(id) on delete cascade,
  name text not null,
  content jsonb not null default '{}',   -- {type: video|doc|quiz, url|path, duration}
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_lessons_module on course_lessons (module_id, sort_order);

create table if not exists trainer_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  name text not null,
  email text not null,
  phone text,
  expertise text,
  linkedin_url text,
  resume_url text,
  details jsonb not null default '{}',
  status request_status_t not null default 'pending',
  created_at timestamptz not null default now()
);
create index if not exists idx_trainer_app_status on trainer_applications (status);

-- ---------- RLS ----------
alter table udemy_courses enable row level security;
alter table course_modules enable row level security;
alter table course_lessons enable row level security;
alter table trainer_applications enable row level security;

-- Udemy catalog: public read; admin write
drop policy if exists "udemy_public_read" on udemy_courses;
create policy "udemy_public_read" on udemy_courses for select using (status = 'published' or is_admin());
drop policy if exists "udemy_admin_write" on udemy_courses;
create policy "udemy_admin_write" on udemy_courses for all using (is_admin()) with check (is_admin());

-- Modules/lessons: readable if parent training is visible; trainers manage own; admin all
drop policy if exists "modules_read" on course_modules;
create policy "modules_read" on course_modules for select using (
  is_admin() or exists (
    select 1 from trainings t where t.id = training_id
      and (t.status in ('published','archived') or t.trainer_id = auth.uid())
  )
);
drop policy if exists "modules_trainer_write" on course_modules;
create policy "modules_trainer_write" on course_modules for all using (
  is_admin() or exists (select 1 from trainings t where t.id = training_id and t.trainer_id = auth.uid())
) with check (
  is_admin() or exists (select 1 from trainings t where t.id = training_id and t.trainer_id = auth.uid())
);

drop policy if exists "lessons_read" on course_lessons;
create policy "lessons_read" on course_lessons for select using (
  is_admin() or exists (
    select 1 from course_modules m join trainings t on t.id = m.training_id
    where m.id = module_id and (t.status in ('published','archived') or t.trainer_id = auth.uid())
  )
);
drop policy if exists "lessons_trainer_write" on course_lessons;
create policy "lessons_trainer_write" on course_lessons for all using (
  is_admin() or exists (
    select 1 from course_modules m join trainings t on t.id = m.training_id
    where m.id = module_id and t.trainer_id = auth.uid()
  )
) with check (
  is_admin() or exists (
    select 1 from course_modules m join trainings t on t.id = m.training_id
    where m.id = module_id and t.trainer_id = auth.uid()
  )
);

-- Trainer applications: public submit (BecomeTrainer form); admin read/manage; own read
drop policy if exists "trainerapp_insert_any" on trainer_applications;
create policy "trainerapp_insert_any" on trainer_applications for insert with check (true);
drop policy if exists "trainerapp_read_own_admin" on trainer_applications;
create policy "trainerapp_read_own_admin" on trainer_applications for select using (user_id = auth.uid() or is_admin());
drop policy if exists "trainerapp_admin_update" on trainer_applications;
create policy "trainerapp_admin_update" on trainer_applications for update using (is_admin());
