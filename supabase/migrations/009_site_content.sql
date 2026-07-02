-- ============================================================
-- Yatri Cloud — 009_site_content.sql
-- Dynamic site content batch 1: site_settings, site_stats,
-- promotions, faqs. Admin managed from /admin; public read.
-- Seeded with the values that are live on the site today so the
-- frontend swap changes nothing visually.
-- ============================================================

-- ---------- site_settings: key/value store for brand + contact + links ----------
create table if not exists site_settings (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_site_settings_updated on site_settings;
create trigger trg_site_settings_updated before update on site_settings
  for each row execute function set_updated_at();

alter table site_settings enable row level security;

drop policy if exists "site_settings_public_read" on site_settings;
create policy "site_settings_public_read" on site_settings for select using (true);

drop policy if exists "site_settings_admin_write" on site_settings;
create policy "site_settings_admin_write" on site_settings for all
  using (is_admin()) with check (is_admin());

insert into site_settings (key, value) values
  ('contact', '{
    "email": "info@yatricloud.com",
    "phone": "+91 97248 23602",
    "phone_href": "tel:+919724823602",
    "location": "Bengaluru, Karnataka, India",
    "hours": "Mon to Fri: 9:00 AM to 6:00 PM · Sat & Sun: 10:00 AM to 4:00 PM"
  }'),
  ('social', '{
    "youtube": "https://www.youtube.com/@yatricloud?sub_confirmation=1",
    "linkedin": "https://linkedin.com/company/yatricloud",
    "whatsapp": "https://whatsapp.com/channel/0029VakdAHIFHWq60yHA1Q0s"
  }'),
  ('booking', '{
    "calendly_url": "https://calendly.com/yatricloud/40min"
  }'),
  ('brand', '{
    "name": "Yatri Cloud",
    "tagline": "Focus on learning, not the price tag.",
    "designed_by": "Uimitra"
  }')
on conflict (key) do nothing;

-- ---------- site_stats: the trust numbers shown across the site ----------
create table if not exists site_stats (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value text not null,
  label text not null,
  sort_order int not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_site_stats_updated on site_stats;
create trigger trg_site_stats_updated before update on site_stats
  for each row execute function set_updated_at();

alter table site_stats enable row level security;

drop policy if exists "site_stats_public_read" on site_stats;
create policy "site_stats_public_read" on site_stats for select using (active = true or is_admin());

drop policy if exists "site_stats_admin_write" on site_stats;
create policy "site_stats_admin_write" on site_stats for all
  using (is_admin()) with check (is_admin());

insert into site_stats (key, value, label, sort_order) values
  ('learners',     '50K+', 'Learners',       1),
  ('rating',       '4.8',  'Rating',         2),
  ('tracks',       '6',    'Cloud Tracks',   3),
  ('success_rate', '95%',  'Success Rate',   4),
  ('communities',  '17',   'Communities',    5),
  ('reached',      '400K+','Learners reached', 6)
on conflict (key) do nothing;

-- ---------- promotions: offers/banners shown across the site ----------
create table if not exists promotions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  headline text not null,
  discount_text text,
  cta_label text,
  cta_url text,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_promotions_updated on promotions;
create trigger trg_promotions_updated before update on promotions
  for each row execute function set_updated_at();

alter table promotions enable row level security;

drop policy if exists "promotions_public_read" on promotions;
create policy "promotions_public_read" on promotions for select using (active = true or is_admin());

drop policy if exists "promotions_admin_write" on promotions;
create policy "promotions_admin_write" on promotions for all
  using (is_admin()) with check (is_admin());

insert into promotions (slug, headline, discount_text, cta_label, cta_url, sort_order) values
  ('voucher-offer', 'Get 50% OFF on Certification Vouchers', '50% OFF', 'Get Your 50% OFF', 'https://calendly.com/yatricloud/40min', 1)
on conflict (slug) do nothing;

-- ---------- faqs: homepage FAQ section ----------
create table if not exists faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  list_items text[],
  sort_order int not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_faqs_updated on faqs;
create trigger trg_faqs_updated before update on faqs
  for each row execute function set_updated_at();

alter table faqs enable row level security;

drop policy if exists "faqs_public_read" on faqs;
create policy "faqs_public_read" on faqs for select using (active = true or is_admin());

drop policy if exists "faqs_admin_write" on faqs;
create policy "faqs_admin_write" on faqs for all
  using (is_admin()) with check (is_admin());

insert into faqs (question, answer, list_items, sort_order)
select * from (values
  ('Step 1: How do I schedule my exam meeting?',
   'To schedule your certification processing meeting, simply select a suitable time slot and book a meet through our Calendly widget on the website. This is the first step to get started with the certification process.',
   null::text[], 1),
  ('Step 2: What happens during the scheduling meeting?',
   'During the meeting call, our team will coordinate with you to start processing your exam scheduling ahead. We will finalize the date and time together to ensure correct exam selection. We handle everything for you to make the process smooth and stress free.',
   null::text[], 2),
  ('Is there still a WhatsApp group requirement?',
   'No, we have made the process simpler. You no longer need to join a WhatsApp group beforehand. Simply schedule a meeting directly through our Calendly widget at your convenience to get started.',
   null::text[], 3),
  ('Which AWS Associate exams are eligible for the 50% OFF discount?',
   'list',
   array[
     'AWS Cloud Practitioner',
     'AWS AI Practitioner',
     'AWS Certified Solutions Architect – Associate (SAA-C03)',
     'AWS Certified Developer – Associate (DVA-C02)',
     'AWS Certified CloudOps Engineer – Associate (SOA-C03)',
     'AWS Certified Data Engineer – Associate (DEA-C01)',
     'AWS Certified Machine Learning Engineer – Associate (MLA-C01)'
   ], 4),
  ('What bonus features are included with my certification?',
   'These benefits are available only after getting 50% OFF. You will receive: 50% OFF Vouchers, Exam Dumps and Resources, Udemy Course Free Access, Topmate Free Connect with Yatharth and Nensi, and a LinkedIn Recommendation. These resources are designed to help you prepare well and pass your exam with confidence.',
   null::text[], 5),
  ('What happens after I schedule the meet?',
   'Once you book a slot through our Calendly widget, you will receive a calendar invitation. Please join the meeting at the scheduled time where our team will help you finalize your exam date, make sure everything is set up correctly, and process your certification request.',
   null::text[], 6),
  ('How long does the entire certification process take?',
   'The process is simple. Book a meeting slot, it takes just a minute, then attend the short meeting where we schedule your exam. The timeline depends on your availability for the scheduling meeting, but we work to make it as quick as possible.',
   null::text[], 7)
) as seed(question, answer, list_items, sort_order)
where not exists (select 1 from faqs);
