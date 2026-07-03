-- ============================================================
-- Yatri Cloud — 023_training_admin_real.sql
-- Make the previously stubbed training admin tools real:
--   - training_providers: a real, editable list of training providers.
--   - trainings.review_status: a submit for review and approve gate so a
--     trainer submits a course and an admin approves it to publish.
-- ============================================================

create table if not exists training_providers (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text,
  logo_url text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_training_providers_updated on training_providers;
create trigger trg_training_providers_updated before update on training_providers
  for each row execute function set_updated_at();

alter table training_providers enable row level security;

drop policy if exists "training_providers_public_read" on training_providers;
create policy "training_providers_public_read" on training_providers for select
  using (active = true or is_admin());

drop policy if exists "training_providers_admin_write" on training_providers;
create policy "training_providers_admin_write" on training_providers for all
  using (is_admin()) with check (is_admin());

-- Seed from the certification providers so the list is not empty.
insert into training_providers (name, slug, sort_order)
select label, slug, sort_order from cert_providers where show_in_forms = true
on conflict (name) do nothing;

-- Review gate on trainings.
alter table trainings
  add column if not exists review_status text not null default 'none'
    check (review_status in ('none','pending','approved','rejected'));

-- The owning trainer may submit their own draft course for review, and read
-- their own review status. Publishing stays admin only (existing policies).
drop policy if exists "trainings_owner_submit" on trainings;
create policy "trainings_owner_submit" on trainings for update
  using (trainer_id = auth.uid())
  with check (trainer_id = auth.uid() and status = 'draft');
