-- ============================================================
-- Yatri Cloud — 011_homepage_marketing.sql
-- Dynamic homepage marketing content: team_members, package_benefits,
-- certification_steps, eligible_exams, recognitions, trust_features.
-- Admin managed from /admin; public read. Seeded from the values live
-- on the site today (dash punctuation cleaned per VOICE.md 6b).
-- ============================================================

-- ---------- helper macro pattern: every table gets trigger + RLS ----------

create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  image_url text,
  portfolio_url text,
  sort_order int not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_team_members_updated on team_members;
create trigger trg_team_members_updated before update on team_members
  for each row execute function set_updated_at();
alter table team_members enable row level security;
drop policy if exists "team_public_read" on team_members;
create policy "team_public_read" on team_members for select using (active = true or is_admin());
drop policy if exists "team_admin_write" on team_members;
create policy "team_admin_write" on team_members for all using (is_admin()) with check (is_admin());

insert into team_members (name, role, image_url, portfolio_url, sort_order)
select * from (values
  ('Yatharth Chauhan', 'Founder – Yatri Cloud', 'https://raw.githubusercontent.com/YatharthChauhan2362/prod-public-images/refs/heads/main/yatharth-chauhan-profile1.png', 'https://yatharthchauhan.me/', 1),
  ('Nensi Ravaliya', 'Creator - Yatri Cloud', 'https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/Team%20Yatri%20Cloud/Nensi%20Ravaliya/profile-nensi-ravaliya.png', 'https://nensi.yatricloud.com/', 2)
) as seed(name, role, image_url, portfolio_url, sort_order)
where not exists (select 1 from team_members);

create table if not exists package_benefits (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  sort_order int not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_package_benefits_updated on package_benefits;
create trigger trg_package_benefits_updated before update on package_benefits
  for each row execute function set_updated_at();
alter table package_benefits enable row level security;
drop policy if exists "benefits_public_read" on package_benefits;
create policy "benefits_public_read" on package_benefits for select using (active = true or is_admin());
drop policy if exists "benefits_admin_write" on package_benefits;
create policy "benefits_admin_write" on package_benefits for all using (is_admin()) with check (is_admin());

insert into package_benefits (title, description, sort_order)
select * from (values
  ('50% OFF Vouchers', 'Get AWS Associate exam vouchers at half price, a limited time offer', 1),
  ('Exam Dumps & Resources', 'Comprehensive exam dumps and study resources to help you prepare effectively', 2),
  ('Udemy Course Free Access', 'Get free access to our premium Udemy certification courses', 3),
  ('Topmate Free Connect', 'Free Topmate sessions with Yatharth Chauhan and Nensi Ravaliya for personalized guidance', 4),
  ('LinkedIn Recommendation', 'Get a professional LinkedIn recommendation from us after certification', 5),
  ('Yatri Wall of Fame', 'Get featured on our Wall of Fame after successfully passing your AWS certification', 6)
) as seed(title, description, sort_order)
where not exists (select 1 from package_benefits);

create table if not exists certification_steps (
  id uuid primary key default gen_random_uuid(),
  step_number int not null,
  title text not null,
  description text not null,
  action_label text,
  action_is_popup boolean not null default false,
  sort_order int not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_cert_steps_updated on certification_steps;
create trigger trg_cert_steps_updated before update on certification_steps
  for each row execute function set_updated_at();
alter table certification_steps enable row level security;
drop policy if exists "steps_public_read" on certification_steps;
create policy "steps_public_read" on certification_steps for select using (active = true or is_admin());
drop policy if exists "steps_admin_write" on certification_steps;
create policy "steps_admin_write" on certification_steps for all using (is_admin()) with check (is_admin());

insert into certification_steps (step_number, title, description, action_label, action_is_popup, sort_order)
select * from (values
  (1, 'Select Time', 'Select a suitable time slot to schedule your meeting', 'Book Now', true, 1),
  (2, 'Book a Meet', 'Confirm your booking through the Calendly widget below', null, false, 2),
  (3, 'Exam Scheduling', 'We will start processing ahead to schedule the exam during our meeting', null, false, 3)
) as seed(step_number, title, description, action_label, action_is_popup, sort_order)
where not exists (select 1 from certification_steps);

create table if not exists eligible_exams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  exam_code text,
  sort_order int not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_eligible_exams_updated on eligible_exams;
create trigger trg_eligible_exams_updated before update on eligible_exams
  for each row execute function set_updated_at();
alter table eligible_exams enable row level security;
drop policy if exists "exams_public_read" on eligible_exams;
create policy "exams_public_read" on eligible_exams for select using (active = true or is_admin());
drop policy if exists "exams_admin_write" on eligible_exams;
create policy "exams_admin_write" on eligible_exams for all using (is_admin()) with check (is_admin());

insert into eligible_exams (title, exam_code, sort_order)
select * from (values
  ('AWS Cloud Practitioner', 'CLF-C02', 1),
  ('AWS AI Practitioner', 'AIF-C01', 2),
  ('AWS Certified Solutions Architect – Associate (SAA-C03)', 'SAA-C03', 3),
  ('AWS Certified Developer – Associate (DVA-C02)', 'DVA-C02', 4),
  ('AWS Certified CloudOps Engineer – Associate (SOA-C03)', 'SOA-C03', 5),
  ('AWS Certified Data Engineer – Associate (DEA-C01)', 'DEA-C01', 6),
  ('AWS Certified Machine Learning Engineer – Associate (MLA-C01)', 'MLA-C01', 7)
) as seed(title, exam_code, sort_order)
where not exists (select 1 from eligible_exams);

create table if not exists recognitions (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  logo_url text,
  sort_order int not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_recognitions_updated on recognitions;
create trigger trg_recognitions_updated before update on recognitions
  for each row execute function set_updated_at();
alter table recognitions enable row level security;
drop policy if exists "recognitions_public_read" on recognitions;
create policy "recognitions_public_read" on recognitions for select using (active = true or is_admin());
drop policy if exists "recognitions_admin_write" on recognitions;
create policy "recognitions_admin_write" on recognitions for all using (is_admin()) with check (is_admin());

insert into recognitions (label, logo_url, sort_order)
select * from (values
  ('Microsoft MVP', '/logos/microsoft.svg', 1),
  ('Microsoft Certified Trainer', '/logos/microsoft.svg', 2),
  ('Google Developer Expert', '/logos/google.svg', 3),
  ('AWS Hero', '/logos/aws.svg', 4),
  ('AWS Subject Matter Expert', '/logos/aws.svg', 5),
  ('AWS Community Builder', '/logos/aws.svg', 6),
  ('CNCF Ambassador', '/logos/cncf.svg', 7),
  ('Docker Captain', '/logos/docker.svg', 8),
  ('HashiCorp Ambassador', '/logos/hashicorp.svg', 9),
  ('MS Learn Student Ambassador (Gold)', '/logos/microsoft.svg', 10),
  ('Google Student Ambassador', '/logos/google.svg', 11),
  ('GitHub Campus Expert', '/logos/github.svg', 12)
) as seed(label, logo_url, sort_order)
where not exists (select 1 from recognitions);

create table if not exists trust_features (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'feature' check (kind in ('feature','not_for_you')),
  title text not null,
  description text,
  sort_order int not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_trust_features_updated on trust_features;
create trigger trg_trust_features_updated before update on trust_features
  for each row execute function set_updated_at();
alter table trust_features enable row level security;
drop policy if exists "trust_public_read" on trust_features;
create policy "trust_public_read" on trust_features for select using (active = true or is_admin());
drop policy if exists "trust_admin_write" on trust_features;
create policy "trust_admin_write" on trust_features for all using (is_admin()) with check (is_admin());

insert into trust_features (kind, title, description, sort_order)
select * from (values
  ('feature', '50% OFF Vouchers', 'Get AWS Associate exam vouchers at half price, a limited time offer.', 1),
  ('feature', 'Complete Support Package', 'Exam dumps, study resources, guides, and personal support included.', 2),
  ('feature', 'Guided Exam Scheduling', 'Our team schedules your exam via personal meeting call for correct setup.', 3),
  ('feature', 'Personal Support', 'Direct support from our team via WhatsApp group for guidance and assistance.', 4),
  ('feature', 'Yatri Wall of Fame', 'Get featured on our Wall of Fame after successfully passing your AWS certification.', 5),
  ('not_for_you', 'You are looking for completely free vouchers (we offer 50% OFF with full support package)', null, 6),
  ('not_for_you', 'You prefer handling exam scheduling yourself (we provide guided support to ensure success)', null, 7),
  ('not_for_you', 'You are hesitant about joining our support group (it is essential for coordination and direct help)', null, 8),
  ('not_for_you', 'You do not need additional resources (we include exam dumps, Udemy access, and study materials)', null, 9),
  ('not_for_you', 'You want to go solo (we are here to support you every step of the way)', null, 10)
) as seed(kind, title, description, sort_order)
where not exists (select 1 from trust_features);
