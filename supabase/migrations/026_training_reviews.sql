-- ============================================================
-- Yatri Cloud — 026_training_reviews.sql
-- Ratings and reviews for trainings (mirrors mentor_reviews).
-- A verified review is one written by an enrolled student. The trainings
-- avg_rating and review_count are kept fresh by a trigger.
-- ============================================================

alter table trainings
  add column if not exists avg_rating numeric(3,2) not null default 0,
  add column if not exists review_count int not null default 0;

create table if not exists training_reviews (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references trainings(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  enrollment_id uuid references training_enrollments(id) on delete set null,
  name text not null,
  rating int not null check (rating between 1 and 5),
  review text not null default '',
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  unique (training_id, user_id)
);
create index if not exists idx_training_reviews_training on training_reviews (training_id, created_at desc);

alter table training_reviews enable row level security;

-- Public reads published reviews; owner and admin see their own or all.
drop policy if exists "training_reviews_public_read" on training_reviews;
create policy "training_reviews_public_read" on training_reviews for select
  using (is_public = true or user_id = auth.uid() or is_admin());

-- A student may write one review for a training they are enrolled in.
drop policy if exists "training_reviews_insert_enrolled" on training_reviews;
create policy "training_reviews_insert_enrolled" on training_reviews for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from training_enrollments e
      where e.training_id = training_reviews.training_id
        and e.user_id = auth.uid()
        and e.payment_status in ('paid','free')
    )
  );

-- Owner may edit or remove their own review; admins moderate all.
drop policy if exists "training_reviews_owner_update" on training_reviews;
create policy "training_reviews_owner_update" on training_reviews for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "training_reviews_owner_delete" on training_reviews;
create policy "training_reviews_owner_delete" on training_reviews for delete
  using (user_id = auth.uid());

drop policy if exists "training_reviews_admin_all" on training_reviews;
create policy "training_reviews_admin_all" on training_reviews for all
  using (is_admin()) with check (is_admin());

-- Keep the training rating summary fresh from public reviews.
create or replace function refresh_training_rating() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  tid uuid := coalesce(new.training_id, old.training_id);
begin
  update trainings t set
    review_count = (select count(*) from training_reviews r where r.training_id = tid and r.is_public),
    avg_rating = coalesce((select round(avg(r.rating)::numeric, 2) from training_reviews r where r.training_id = tid and r.is_public), 0)
  where t.id = tid;
  return null;
end $$;

drop trigger if exists trg_training_rating on training_reviews;
create trigger trg_training_rating
  after insert or update or delete on training_reviews
  for each row execute function refresh_training_rating();
