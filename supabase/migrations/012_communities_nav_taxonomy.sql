-- ============================================================
-- Yatri Cloud — 012_communities_nav_taxonomy.sql
-- Dynamic communities directory, site navigation links, and shared
-- dropdown option lists: communities, nav_links, option_lists.
-- Admin managed from /admin; public read. Seeded from the values live
-- on the site today (Community.tsx, Navbar.tsx, Footer.tsx, Udemy.tsx,
-- store-products.ts, AddProduct.tsx, Events.tsx, CreateEvent.tsx,
-- SponsorSubmissionForm.tsx).
-- ============================================================

-- ---------- helper macro pattern: every table gets trigger + RLS ----------

create table if not exists communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  tagline text,
  logo_url text,
  grp text not null default 'main',
  sort_order int not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_communities_updated on communities;
create trigger trg_communities_updated before update on communities
  for each row execute function set_updated_at();
alter table communities enable row level security;
drop policy if exists "communities_public_read" on communities;
create policy "communities_public_read" on communities for select using (active = true or is_admin());
drop policy if exists "communities_admin_write" on communities;
create policy "communities_admin_write" on communities for all using (is_admin()) with check (is_admin());

insert into communities (name, url, tagline, logo_url, grp, sort_order)
select * from (values
  ('WhatsApp Channel', 'https://whatsapp.com/channel/0029VakdAHIFHWq60yHA1Q0s', null, null, 'channel', 1),
  ('AWS Yatri', 'https://chat.whatsapp.com/Luh1daKLk4tCfgohAdkayp', 'The world''s #1 cloud', '/logos/aws.svg', 'main', 1),
  ('Microsoft Yatri', 'https://chat.whatsapp.com/CzcpDRiV2vR87vGwY7dPAp', 'Azure, MVP & the Microsoft stack', '/logos/microsoft.svg', 'main', 2),
  ('GCP Yatri', 'https://chat.whatsapp.com/JgUS13YbcYCL82PfpLQnBv', 'Google Cloud & data', '/logos/googlecloud.svg', 'main', 3),
  ('GitHub Yatri', 'https://chat.whatsapp.com/DbuYINmHGKF3qkQLYU5Ugx', 'Open source, PRs & version control', '/logos/github.svg', 'main', 4),
  ('Kubernetes Yatri', 'https://chat.whatsapp.com/LC5LN2YTqjV24X0eiSMNwe', 'Containers & cloud-native', '/logos/kubernetes.svg', 'main', 5),
  ('DevOps Yatri', 'https://chat.whatsapp.com/JYjH73L6Tof7JDmYQSUYqW', 'CI/CD, automation & SRE', null, 'main', 6),
  ('AI Yatri', 'https://chat.whatsapp.com/FPgpa7E8WQyA75ITKzXxI0', 'LLMs, ML & the future of AI', null, 'main', 7),
  ('Salesforce Yatri', 'https://chat.whatsapp.com/KGjtJpcqgPRJFB6ImU2Awc', 'CRM & the Salesforce ecosystem', '/logos/salesforce.svg', 'main', 8),
  ('Oracle Yatri', 'https://chat.whatsapp.com/JETPhF7ZE3LDQQeeigLLge', 'Databases & enterprise cloud', '/logos/oracle.svg', 'main', 9),
  ('TiDB Yatri', 'https://chat.whatsapp.com/GNFWRA2yxSVCafGXgpXQO6', 'Distributed SQL & databases', null, 'main', 10),
  ('Google Cloud Arcade Yatri', 'https://chat.whatsapp.com/Lkm5LMvsTrACLn6FIijist', 'Earn badges & swag with GCP Arcade', null, 'main', 11),
  ('Women Yatri', 'https://chat.whatsapp.com/If2yiVZNzivHdf7nv5lHiU', 'Women in cloud & tech', null, 'main', 12),
  ('Blog Yatri', 'https://chat.whatsapp.com/LJWGl6juKNgK7kO7jjgwp1', 'Write, learn & get published', null, 'main', 13),
  ('Yatri LinkedIn', 'https://chat.whatsapp.com/ImroH8OP1GKBzB2dACmqmf', 'Network, grow & get noticed', null, 'main', 14),
  ('Azure Yatri', 'https://chat.whatsapp.com/JUl0ysEOLZGKVSHnsuIoJb', 'Microsoft''s cloud platform', '/logos/azure.svg', 'ms_subs', 1),
  ('MLSA Yatri', 'https://chat.whatsapp.com/CRPn0N5V2lbDsexLrXY0l4', 'Microsoft Learn Student Ambassadors', '/logos/microsoft.svg', 'ms_subs', 2),
  ('MVP Yatri', 'https://chat.whatsapp.com/GIqTRS29D8iIQodRNNXblr', 'Most Valuable Professionals', '/logos/microsoft.svg', 'ms_subs', 3)
) as seed(name, url, tagline, logo_url, grp, sort_order)
where not exists (select 1 from communities);

create table if not exists nav_links (
  id uuid primary key default gen_random_uuid(),
  location text not null check (location in ('navbar','footer_explore','footer_quick','footer_legal')),
  label text not null,
  href text not null,
  sort_order int not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_nav_links_updated on nav_links;
create trigger trg_nav_links_updated before update on nav_links
  for each row execute function set_updated_at();
alter table nav_links enable row level security;
drop policy if exists "nav_links_public_read" on nav_links;
create policy "nav_links_public_read" on nav_links for select using (active = true or is_admin());
drop policy if exists "nav_links_admin_write" on nav_links;
create policy "nav_links_admin_write" on nav_links for all using (is_admin()) with check (is_admin());

insert into nav_links (location, label, href, sort_order)
select * from (values
  ('navbar', 'Training', '/training', 1),
  ('navbar', 'Practice Tests', '#courses', 2),
  ('navbar', 'Exam Dumps', '/examdumps', 3),
  ('navbar', 'Events', '/events', 4),
  ('navbar', 'Community', '/community', 5),
  ('navbar', 'Achievements', '/achievements', 6),
  ('navbar', 'Partners', '/partners', 7),
  ('footer_explore', 'Exam Dumps', '/examdumps', 1),
  ('footer_explore', 'Training', '/training', 2),
  ('footer_explore', 'Events', '/events', 3),
  ('footer_explore', 'Yatri Store', '/yatristore', 4),
  ('footer_explore', 'Udemy Courses', '/udemy', 5),
  ('footer_explore', 'Certified Yatris', '/certifiedyatris', 6),
  ('footer_quick', 'Get Certified', '#certification-process', 1),
  ('footer_quick', 'Benefits', '#benefits', 2),
  ('footer_quick', 'Practice Tests', '#courses', 3),
  ('footer_quick', 'Team', '#team', 4),
  ('footer_quick', 'FAQ', '#faq', 5),
  ('footer_quick', 'Achievements', '/achievements', 6),
  ('footer_legal', 'Privacy Policy', '/privacy-policy', 1),
  ('footer_legal', 'Terms of Service', '/terms-of-service', 2),
  ('footer_legal', 'Reviews', '/reviews', 3)
) as seed(location, label, href, sort_order)
where not exists (select 1 from nav_links);

create table if not exists option_lists (
  id uuid primary key default gen_random_uuid(),
  list text not null,
  value text not null,
  label text not null,
  sort_order int not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (list, value)
);
drop trigger if exists trg_option_lists_updated on option_lists;
create trigger trg_option_lists_updated before update on option_lists
  for each row execute function set_updated_at();
alter table option_lists enable row level security;
drop policy if exists "option_lists_public_read" on option_lists;
create policy "option_lists_public_read" on option_lists for select using (active = true or is_admin());
drop policy if exists "option_lists_admin_write" on option_lists;
create policy "option_lists_admin_write" on option_lists for all using (is_admin()) with check (is_admin());

-- udemy_creator — CREATORS in src/pages/Udemy.tsx
insert into option_lists (list, value, label, sort_order)
select * from (values
  ('udemy_creator', 'yatharth-chauhan', 'Yatharth Chauhan', 1),
  ('udemy_creator', 'nensi-ravaliya', 'Nensi Ravaliya', 2)
) as seed(list, value, label, sort_order)
where not exists (select 1 from option_lists where list = 'udemy_creator');

-- course_tech — TECH_OPTIONS in src/pages/Udemy.tsx
insert into option_lists (list, value, label, sort_order)
select * from (values
  ('course_tech', 'AWS', 'AWS', 1),
  ('course_tech', 'Azure', 'Azure', 2),
  ('course_tech', 'Google Cloud', 'Google Cloud', 3),
  ('course_tech', 'GitHub', 'GitHub', 4),
  ('course_tech', 'Oracle', 'Oracle', 5),
  ('course_tech', 'Salesforce', 'Salesforce', 6),
  ('course_tech', 'ServiceNow', 'ServiceNow', 7)
) as seed(list, value, label, sort_order)
where not exists (select 1 from option_lists where list = 'course_tech');

-- course_category — CATEGORY_OPTIONS in src/pages/Udemy.tsx
insert into option_lists (list, value, label, sort_order)
select * from (values
  ('course_category', 'cloud', 'Cloud', 1),
  ('course_category', 'devops', 'DevOps', 2),
  ('course_category', 'ai', 'AI', 3),
  ('course_category', 'data', 'Data', 4),
  ('course_category', 'security', 'Security', 5),
  ('course_category', 'networking', 'Networking', 6),
  ('course_category', 'other', 'Other', 7)
) as seed(list, value, label, sort_order)
where not exists (select 1 from option_lists where list = 'course_category');

-- store_category — categories in src/data/store-products.ts
insert into option_lists (list, value, label, sort_order)
select * from (values
  ('store_category', 'AWS', 'AWS', 1),
  ('store_category', 'Azure', 'Azure', 2),
  ('store_category', 'GCP', 'GCP', 3),
  ('store_category', 'Oracle', 'Oracle', 4),
  ('store_category', 'Salesforce', 'Salesforce', 5),
  ('store_category', 'ServiceNow', 'ServiceNow', 6),
  ('store_category', 'GitHub', 'GitHub', 7)
) as seed(list, value, label, sort_order)
where not exists (select 1 from option_lists where list = 'store_category');

-- product_level — level enum in src/pages/AddProduct.tsx
insert into option_lists (list, value, label, sort_order)
select * from (values
  ('product_level', 'Associate', 'Associate', 1),
  ('product_level', 'Practitioner', 'Practitioner', 2),
  ('product_level', 'Professional', 'Professional', 3),
  ('product_level', 'Specialty', 'Specialty', 4)
) as seed(list, value, label, sort_order)
where not exists (select 1 from option_lists where list = 'product_level');

-- event_category — categories in src/pages/Events.tsx ('All' is a filter
-- pseudo-option, not a category — excluded, same rule as store_category)
insert into option_lists (list, value, label, sort_order)
select * from (values
  ('event_category', 'Concert', 'Concert', 1),
  ('event_category', 'Conference', 'Conference', 2),
  ('event_category', 'Hackathon', 'Hackathon', 3),
  ('event_category', 'Marathon', 'Marathon', 4),
  ('event_category', 'Workshop', 'Workshop', 5)
) as seed(list, value, label, sort_order)
where not exists (select 1 from option_lists where list = 'event_category');

-- sponsor_tier — sponsor tier select in src/pages/CreateEvent.tsx
insert into option_lists (list, value, label, sort_order)
select * from (values
  ('sponsor_tier', 'Platinum', 'Platinum', 1),
  ('sponsor_tier', 'Gold', 'Gold', 2),
  ('sponsor_tier', 'Silver', 'Silver', 3),
  ('sponsor_tier', 'Bronze', 'Bronze', 4),
  ('sponsor_tier', 'Partner', 'Partner', 5)
) as seed(list, value, label, sort_order)
where not exists (select 1 from option_lists where list = 'sponsor_tier');

-- sponsorship_area — sponsorshipOptions in src/pages/SponsorSubmissionForm.tsx
insert into option_lists (list, value, label, sort_order)
select * from (values
  ('sponsorship_area', 'Venue', 'Venue', 1),
  ('sponsorship_area', 'Food & Beverages', 'Food & Beverages', 2),
  ('sponsorship_area', 'Swag/Merchandise', 'Swag/Merchandise', 3),
  ('sponsorship_area', 'Travel Support', 'Travel Support', 4),
  ('sponsorship_area', 'Prize Money', 'Prize Money', 5),
  ('sponsorship_area', 'General Support', 'General Support', 6)
) as seed(list, value, label, sort_order)
where not exists (select 1 from option_lists where list = 'sponsorship_area');
