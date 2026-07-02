-- ============================================================
-- Yatri Cloud — 014_tech_logos_hero.sql
-- Dynamic tech/brand logos and the hero subheadline copy.
-- tech_logos feeds the site logo marquees: grp 'marquee' is the
-- white-chip marquee (TechLogos.tsx) and grp 'community' is the
-- company logo strip at the bottom of the homepage community
-- section (CommunitySection.tsx). Admin managed from /admin;
-- public read. Seeded from the values live on the site today so
-- the frontend swap changes nothing visually.
-- For community rows, href stores the light-theme logo variant
-- (the theme-aware marquee swaps AWS and GitHub art per theme).
-- ============================================================

create table if not exists tech_logos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  src text not null,
  href text,
  grp text not null default 'marquee',
  sort_order int not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_tech_logos_updated on tech_logos;
create trigger trg_tech_logos_updated before update on tech_logos
  for each row execute function set_updated_at();
alter table tech_logos enable row level security;
drop policy if exists "tech_logos_public_read" on tech_logos;
create policy "tech_logos_public_read" on tech_logos for select using (active = true or is_admin());
drop policy if exists "tech_logos_admin_write" on tech_logos;
create policy "tech_logos_admin_write" on tech_logos for all using (is_admin()) with check (is_admin());

-- grp 'marquee' — TECH_LOGOS in src/components/TechLogos.tsx
-- grp 'community' — companies in src/components/sections/CommunitySection.tsx
insert into tech_logos (name, src, href, grp, sort_order)
select * from (values
  ('AWS', '/logos/aws.svg', null, 'marquee', 1),
  ('Azure', '/logos/azure.svg', null, 'marquee', 2),
  ('Google Cloud', '/logos/googlecloud.svg', null, 'marquee', 3),
  ('Kubernetes', '/logos/kubernetes.svg', null, 'marquee', 4),
  ('Terraform', '/logos/terraform.svg', null, 'marquee', 5),
  ('Docker', '/logos/docker.svg', null, 'marquee', 6),
  ('Ansible', '/logos/ansible.svg', null, 'marquee', 7),
  ('Python', '/logos/python.svg', null, 'marquee', 8),
  ('Linux', '/logos/linux.svg', null, 'marquee', 9),
  ('GitHub', '/logos/github.svg', null, 'marquee', 10),
  ('AWS', 'https://raw.githubusercontent.com/yatricloud/yatri-images/main/certification.yatricloud.com/logo/certifications/aws.svg', 'https://raw.githubusercontent.com/yatricloud/yatri-images/main/certification.yatricloud.com/logo/certifications/aws-light.png', 'community', 1),
  ('Google Cloud', 'https://raw.githubusercontent.com/yatricloud/yatri-images/main/certification.yatricloud.com/logo/certifications/google_cloud.svg', null, 'community', 2),
  ('Azure', 'https://raw.githubusercontent.com/yatricloud/yatri-images/main/certification.yatricloud.com/logo/certifications/Microsoft_Azure.svg', null, 'community', 3),
  ('Salesforce', 'https://raw.githubusercontent.com/yatricloud/yatri-images/main/certification.yatricloud.com/logo/certifications/Salesforce.com_logo.svg', null, 'community', 4),
  ('Oracle', 'https://raw.githubusercontent.com/yatricloud/yatri-images/main/certification.yatricloud.com/logo/certifications/Oracle_logo.svg', null, 'community', 5),
  ('GitHub', 'https://raw.githubusercontent.com/yatricloud/yatri-images/main/certification.yatricloud.com/logo/certifications/github-white-icon.webp', 'https://raw.githubusercontent.com/yatricloud/yatri-images/main/certification.yatricloud.com/logo/certifications/github-white-icon.webp', 'community', 6)
) as seed(name, src, href, grp, sort_order)
where not exists (select 1 from tech_logos);

-- ---------- site_settings: hero subheadline (verbatim from HeroSection.tsx) ----------
insert into site_settings (key, value) values
  ('hero', '{
    "subheadline": "Get AWS certified at 50% OFF. Book your time slot and we''ll schedule your exam during the meeting. Dumps, resources, and support included!"
  }')
on conflict (key) do nothing;
