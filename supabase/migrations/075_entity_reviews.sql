-- 075: unified per-entity reviews (events, store products, udemy courses,
-- exam dumps — extensible). Trainings and mentors keep their existing
-- dedicated review tables (enrollment/booking-gated with rating triggers).
--
-- Both ends:
--   * users: one review per entity per account (upsert), 1-5 stars + text.
--   * admins: moderate via is_public / delete (RLS below).
-- Event reviews are DB-gated to Yatris actually registered for that event;
-- other types require only a signed-in account.

create table if not exists entity_reviews (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('event','product','udemy_course','exam_dump')),
  entity_id uuid not null,
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  rating int not null check (rating between 1 and 5),
  review text not null,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entity_type, entity_id, user_id)
);

create index if not exists idx_entity_reviews_entity
  on entity_reviews (entity_type, entity_id, created_at desc);

drop trigger if exists trg_entity_reviews_updated on entity_reviews;
create trigger trg_entity_reviews_updated before update on entity_reviews
  for each row execute function set_updated_at();

alter table entity_reviews enable row level security;

-- Everyone reads public reviews; owners and admins see their own/hidden ones.
drop policy if exists "entrev_read" on entity_reviews;
create policy "entrev_read" on entity_reviews for select
  using (is_public = true or user_id = auth.uid() or is_admin());

-- Signed-in Yatris write their own review. Event reviews additionally require
-- a non-cancelled registration for that event (verified-attendee reviews).
drop policy if exists "entrev_insert_own" on entity_reviews;
create policy "entrev_insert_own" on entity_reviews for insert to authenticated
  with check (
    user_id = auth.uid()
    and (
      entity_type <> 'event'
      or exists (
        select 1 from event_registrations er
        where er.event_id = entity_reviews.entity_id
          and er.user_id = auth.uid()
          and er.status <> 'cancelled'
      )
    )
  );

-- Owners edit their own review; admins can do anything (incl. hide/delete).
drop policy if exists "entrev_update_own" on entity_reviews;
create policy "entrev_update_own" on entity_reviews for update
  using (user_id = auth.uid() or is_admin());

drop policy if exists "entrev_delete" on entity_reviews;
create policy "entrev_delete" on entity_reviews for delete
  using (user_id = auth.uid() or is_admin());
