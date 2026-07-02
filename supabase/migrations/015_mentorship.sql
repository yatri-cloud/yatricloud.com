-- ============================================================
-- Yatri Cloud — 015_mentorship.sql
-- Mentorship platform: mentors, private contact details, services
-- with buyer-gated secrets, weekly availability rules, bookings,
-- reviews with a rating refresh trigger, orders.kind extension,
-- Mentorship nav links, and idempotent seeds.
-- Spec: docs/MENTORSHIP-PLAN.md §1. Style follows 012.
-- ============================================================

-- ---------- mentors ----------

create table if not exists mentors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references profiles(id) on delete set null,
  slug text unique not null,
  name text not null,
  headline text not null default '',
  bio text not null default '',
  photo_url text,
  linkedin_url text,
  expertise text[] not null default '{}',
  languages text[] not null default '{English,Hindi}',
  timezone text not null default 'Asia/Kolkata',
  notice_hours int not null default 12,
  booking_window_days int not null default 30,
  buffer_min int not null default 15,
  avg_rating numeric(3,2) not null default 0,
  review_count int not null default 0,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  status content_status_t not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_mentors_updated on mentors;
create trigger trg_mentors_updated before update on mentors
  for each row execute function set_updated_at();
alter table mentors enable row level security;
drop policy if exists "mentors_public_read" on mentors;
create policy "mentors_public_read" on mentors for select
  using (status = 'published' or is_admin() or user_id = auth.uid());
drop policy if exists "mentors_admin_all" on mentors;
create policy "mentors_admin_all" on mentors for all
  using (is_admin()) with check (is_admin());
drop policy if exists "mentors_self_update" on mentors;
create policy "mentors_self_update" on mentors for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- mentor_private (no public read) ----------

create table if not exists mentor_private (
  mentor_id uuid primary key references mentors(id) on delete cascade,
  contact_email text not null
);
alter table mentor_private enable row level security;
drop policy if exists "mentor_private_admin_owner" on mentor_private;
create policy "mentor_private_admin_owner" on mentor_private for all
  using (is_admin() or mentor_id in (select id from mentors where user_id = auth.uid()))
  with check (is_admin() or mentor_id in (select id from mentors where user_id = auth.uid()));

-- ---------- mentorship_services ----------

create table if not exists mentorship_services (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references mentors(id) on delete cascade,
  slug text not null,
  type text not null check (type in ('call','package','digital','webinar')),
  title text not null,
  short_description text not null default '',
  description text not null default '',
  price numeric(10,2) not null check (price >= 0),
  compare_at_price numeric(10,2) check (compare_at_price is null or compare_at_price > price),
  currency text not null default 'INR',
  duration_min int,
  sessions_count int not null default 1,
  webinar_start_at timestamptz,
  capacity int,
  cta_label text not null default 'Book Now',
  badge text check (badge is null or badge in ('Popular','Best Seller')),
  cover_url text,
  questions jsonb not null default '[]',
  sort_order int not null default 0,
  status content_status_t not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mentor_id, slug)
);
drop trigger if exists trg_mentorship_services_updated on mentorship_services;
create trigger trg_mentorship_services_updated before update on mentorship_services
  for each row execute function set_updated_at();
alter table mentorship_services enable row level security;
drop policy if exists "mservices_public_read" on mentorship_services;
create policy "mservices_public_read" on mentorship_services for select
  using (
    status = 'published'
    or is_admin()
    or mentor_id in (select id from mentors where user_id = auth.uid())
  );
drop policy if exists "mservices_admin_all" on mentorship_services;
create policy "mservices_admin_all" on mentorship_services for all
  using (is_admin()) with check (is_admin());
drop policy if exists "mservices_owner_all" on mentorship_services;
create policy "mservices_owner_all" on mentorship_services for all
  using (mentor_id in (select id from mentors where user_id = auth.uid()))
  with check (mentor_id in (select id from mentors where user_id = auth.uid()));

-- ---------- mentor_availability (weekly rules; 0 = Sunday) ----------

create table if not exists mentor_availability (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references mentors(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);
drop trigger if exists trg_mentor_availability_updated on mentor_availability;
create trigger trg_mentor_availability_updated before update on mentor_availability
  for each row execute function set_updated_at();
alter table mentor_availability enable row level security;
drop policy if exists "mavailability_public_read" on mentor_availability;
create policy "mavailability_public_read" on mentor_availability for select using (true);
drop policy if exists "mavailability_admin_owner_write" on mentor_availability;
create policy "mavailability_admin_owner_write" on mentor_availability for all
  using (is_admin() or mentor_id in (select id from mentors where user_id = auth.uid()))
  with check (is_admin() or mentor_id in (select id from mentors where user_id = auth.uid()));

-- ---------- mentorship_bookings ----------

create table if not exists mentorship_bookings (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references mentorship_services(id),
  mentor_id uuid not null references mentors(id),
  user_id uuid not null references profiles(id),
  customer_name text not null default '',
  customer_email text not null default '',
  customer_phone text,
  answers jsonb not null default '[]',
  slot_start timestamptz,
  slot_end timestamptz,
  buyer_timezone text not null default 'Asia/Kolkata',
  amount numeric(10,2) not null check (amount >= 0),
  currency text not null default 'INR',
  status text not null default 'pending'
    check (status in ('pending','confirmed','completed','cancelled','refunded')),
  order_id uuid references orders(id),
  payment_id uuid references payments(id),
  meeting_link text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists idx_mbookings_slot_taken
  on mentorship_bookings (mentor_id, slot_start)
  where status in ('pending','confirmed','completed') and slot_start is not null;
create index if not exists idx_mbookings_user_created
  on mentorship_bookings (user_id, created_at desc);
create index if not exists idx_mbookings_mentor_slot
  on mentorship_bookings (mentor_id, slot_start);
drop trigger if exists trg_mentorship_bookings_updated on mentorship_bookings;
create trigger trg_mentorship_bookings_updated before update on mentorship_bookings
  for each row execute function set_updated_at();
alter table mentorship_bookings enable row level security;
drop policy if exists "mbookings_select_own" on mentorship_bookings;
create policy "mbookings_select_own" on mentorship_bookings for select
  using (
    user_id = auth.uid()
    or is_admin()
    or mentor_id in (select id from mentors where user_id = auth.uid())
  );
drop policy if exists "mbookings_insert_own" on mentorship_bookings;
create policy "mbookings_insert_own" on mentorship_bookings for insert to authenticated
  with check (
    user_id = auth.uid()
    and (status = 'pending' or (status = 'confirmed' and amount = 0))
  );
-- Users may only cancel their own pending bookings. Paid pending
-- bookings flip to confirmed exclusively via /api/razorpay/verify
-- (service role, bypasses RLS).
drop policy if exists "mbookings_user_cancel" on mentorship_bookings;
create policy "mbookings_user_cancel" on mentorship_bookings for update
  using (user_id = auth.uid() and status = 'pending')
  with check (user_id = auth.uid() and status = 'cancelled');
drop policy if exists "mbookings_mentor_update" on mentorship_bookings;
create policy "mbookings_mentor_update" on mentorship_bookings for update
  using (mentor_id in (select id from mentors where user_id = auth.uid()))
  with check (mentor_id in (select id from mentors where user_id = auth.uid()));
drop policy if exists "mbookings_admin_all" on mentorship_bookings;
create policy "mbookings_admin_all" on mentorship_bookings for all
  using (is_admin()) with check (is_admin());

-- ---------- mentorship_service_secrets (after bookings: buyer read) ----------

create table if not exists mentorship_service_secrets (
  service_id uuid primary key references mentorship_services(id) on delete cascade,
  delivery_url text,
  meeting_link text
);
alter table mentorship_service_secrets enable row level security;
drop policy if exists "msecrets_read" on mentorship_service_secrets;
create policy "msecrets_read" on mentorship_service_secrets for select
  using (
    is_admin()
    or service_id in (
      select s.id from mentorship_services s
      join mentors m on m.id = s.mentor_id
      where m.user_id = auth.uid()
    )
    or exists (
      select 1 from mentorship_bookings b
      where b.service_id = mentorship_service_secrets.service_id
        and b.user_id = auth.uid()
        and b.status in ('confirmed','completed')
    )
  );
drop policy if exists "msecrets_admin_owner_write" on mentorship_service_secrets;
create policy "msecrets_admin_owner_write" on mentorship_service_secrets for all
  using (
    is_admin()
    or service_id in (
      select s.id from mentorship_services s
      join mentors m on m.id = s.mentor_id
      where m.user_id = auth.uid()
    )
  )
  with check (
    is_admin()
    or service_id in (
      select s.id from mentorship_services s
      join mentors m on m.id = s.mentor_id
      where m.user_id = auth.uid()
    )
  );

-- ---------- mentor_reviews (existing reviews table untouched) ----------

create table if not exists mentor_reviews (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references mentors(id) on delete cascade,
  service_id uuid references mentorship_services(id) on delete set null,
  booking_id uuid unique references mentorship_bookings(id) on delete set null,
  user_id uuid references profiles(id) on delete set null,
  name text not null default '',
  rating int not null check (rating between 1 and 5),
  review text not null default '',
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);
alter table mentor_reviews enable row level security;
drop policy if exists "mreviews_public_read" on mentor_reviews;
create policy "mreviews_public_read" on mentor_reviews for select
  using (is_public = true or user_id = auth.uid() or is_admin());
drop policy if exists "mreviews_insert_own" on mentor_reviews;
create policy "mreviews_insert_own" on mentor_reviews for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists "mreviews_admin_all" on mentor_reviews;
create policy "mreviews_admin_all" on mentor_reviews for all
  using (is_admin()) with check (is_admin());

-- Recompute mentors.avg_rating / review_count from public reviews.
-- Security definer: reviewers have no update rights on mentors.
create or replace function refresh_mentor_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  target uuid;
begin
  target := coalesce(new.mentor_id, old.mentor_id);
  update mentors set
    avg_rating = coalesce((
      select round(avg(rating)::numeric, 2) from mentor_reviews
      where mentor_id = target and is_public = true
    ), 0),
    review_count = coalesce((
      select count(*) from mentor_reviews
      where mentor_id = target and is_public = true
    ), 0)
  where id = target;
  return coalesce(new, old);
end $$;
drop trigger if exists trg_mentor_reviews_rating on mentor_reviews;
create trigger trg_mentor_reviews_rating
  after insert or update or delete on mentor_reviews
  for each row execute function refresh_mentor_rating();

-- ---------- orders.kind: allow mentorship ----------
-- Constraint was created inline and unnamed in 001_schema.sql, so it
-- carries the default name orders_kind_check.

alter table orders drop constraint if exists orders_kind_check;
alter table orders add constraint orders_kind_check
  check (kind in ('store','exam_dump','event','training','mentorship','other'));

-- ---------- nav_links: Mentorship (idempotent) ----------

insert into nav_links (location, label, href, sort_order)
select 'navbar', 'Mentorship', '/mentorship', 8
where not exists (select 1 from nav_links where location = 'navbar' and href = '/mentorship');

insert into nav_links (location, label, href, sort_order)
select 'footer_explore', 'Mentorship', '/mentorship', 7
where not exists (select 1 from nav_links where location = 'footer_explore' and href = '/mentorship');

-- ---------- seeds: mentors (from team_members fallbacks in src/lib/site-content.ts) ----------

insert into mentors (slug, name, headline, bio, photo_url, linkedin_url, expertise, is_featured, sort_order)
select * from (values
  (
    'yatharth-chauhan',
    'Yatharth Chauhan',
    'Founder of Yatri Cloud. AWS, Azure and DevOps mentor.',
    'Yatharth has guided thousands of Yatris into cloud careers. He mentors on AWS, Azure, DevOps and Kubernetes, and he loves turning confusing certification paths into a clear plan you can follow with confidence.',
    'https://raw.githubusercontent.com/YatharthChauhan2362/prod-public-images/refs/heads/main/yatharth-chauhan-profile1.png',
    'https://yatharthchauhan.me/',
    array['AWS','Azure','DevOps','Kubernetes'],
    true,
    1
  ),
  (
    'nensi-ravaliya',
    'Nensi Ravaliya',
    'Creator at Yatri Cloud. Google Cloud and career mentor.',
    'Nensi builds learning content and community programs at Yatri Cloud. She mentors on Google Cloud, Azure and career growth, and she is known for advice that is warm, honest and easy to act on.',
    'https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/Team%20Yatri%20Cloud/Nensi%20Ravaliya/profile-nensi-ravaliya.png',
    'https://nensi.yatricloud.com/',
    array['Google Cloud','Azure','Career Growth'],
    true,
    2
  )
) as seed(slug, name, headline, bio, photo_url, linkedin_url, expertise, is_featured, sort_order)
where not exists (select 1 from mentors);

-- ---------- seeds: 4 services per mentor ----------

insert into mentorship_services
  (mentor_id, slug, type, title, short_description, description,
   price, compare_at_price, duration_min, sessions_count, badge, sort_order)
select m.id, s.slug, s.type, s.title, s.short_description, s.description,
       s.price, s.compare_at_price, s.duration_min, s.sessions_count, s.badge, s.sort_order
from mentors m
join (values
  (
    'career-guidance-call', 'call', '1 on 1 Career Guidance Call',
    'A focused 30 minute call to map your next step in cloud.',
    'Bring your questions about certifications, job switches or learning paths. We will look at where you are today and leave you with a simple plan for your next 90 days.',
    499, 999, 30, 1, 'Popular', 1
  ),
  (
    'resume-linkedin-review', 'call', 'Resume and LinkedIn Review',
    'A live 45 minute review of your resume and LinkedIn profile.',
    'We go through your resume and LinkedIn together, fix what holds you back and highlight what recruiters actually want to see.',
    799, null, 45, 1, null, 2
  ),
  (
    'interview-prep-package', 'package', 'Interview Prep Package',
    'Three mock interview sessions with honest, actionable feedback.',
    'Three sessions that cover core concepts, scenario questions and a full mock interview. You get notes and improvement points after every session.',
    1999, 2999, 60, 3, null, 3
  ),
  (
    'cloud-career-roadmap', 'digital', 'Cloud Career Roadmap',
    'A downloadable roadmap that takes you from beginner to job ready.',
    'A step by step guide covering the skills, certifications and projects that matter for a cloud career. Yours to keep, with lifetime updates.',
    299, null, null, 1, null, 4
  )
) as s(slug, type, title, short_description, description,
       price, compare_at_price, duration_min, sessions_count, badge, sort_order) on true
where m.slug in ('yatharth-chauhan', 'nensi-ravaliya')
  and not exists (select 1 from mentorship_services);

-- ---------- seeds: availability (IST rules; weekday 0 = Sunday) ----------
-- Mon to Fri 18:00 to 21:00, Sat 10:00 to 13:00.

insert into mentor_availability (mentor_id, weekday, start_time, end_time)
select m.id, d.weekday, d.start_time::time, d.end_time::time
from mentors m
join (values
  (1, '18:00', '21:00'),
  (2, '18:00', '21:00'),
  (3, '18:00', '21:00'),
  (4, '18:00', '21:00'),
  (5, '18:00', '21:00'),
  (6, '10:00', '13:00')
) as d(weekday, start_time, end_time) on true
where m.slug in ('yatharth-chauhan', 'nensi-ravaliya')
  and not exists (select 1 from mentor_availability);

-- ---------- seeds: mentor_private (admin email; fallback info@yatricloud.com) ----------

insert into mentor_private (mentor_id, contact_email)
select m.id, coalesce(
  (select email from profiles where role = 'admin' order by created_at limit 1),
  'info@yatricloud.com'
)
from mentors m
where m.slug in ('yatharth-chauhan', 'nensi-ravaliya')
  and not exists (select 1 from mentor_private)
on conflict (mentor_id) do nothing;

-- ---------- seeds: public reviews (guarded: needs an admin profile id) ----------
-- Inserting these fires refresh_mentor_rating, which fills avg_rating
-- and review_count on both mentors.

insert into mentor_reviews (mentor_id, user_id, name, rating, review)
select m.id, a.id, r.name, r.rating, r.review
from mentors m
join (values
  ('yatharth-chauhan', 'Priya Sharma', 5, 'Yatharth gave me a clear plan for my AWS journey. I walked out of the call knowing exactly what to do next.'),
  ('yatharth-chauhan', 'Rohan Mehta', 5, 'Very patient and practical. He reviewed my resume line by line and the feedback was easy to act on.'),
  ('yatharth-chauhan', 'Ankit Verma', 4, 'Great session. The roadmap he shared saved me weeks of confusion.'),
  ('nensi-ravaliya', 'Sneha Patel', 5, 'Nensi made cloud careers feel simple. She listened first and then gave advice that actually fit my situation.'),
  ('nensi-ravaliya', 'Kunal Shah', 5, 'The interview prep sessions were worth every rupee. I felt confident and ready on the day.'),
  ('nensi-ravaliya', 'Aarti Joshi', 4, 'Warm, honest and super helpful. My LinkedIn profile looks so much better now.')
) as r(mentor_slug, name, rating, review) on r.mentor_slug = m.slug
cross join (select id from profiles where role = 'admin' order by created_at limit 1) a
where not exists (select 1 from mentor_reviews);
