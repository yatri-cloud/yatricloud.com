-- 038: Personal data can no longer be read by ANY role that doesn't own it.
--
-- 1. The public wall of fame moves to a dedicated view exposing only display
--    columns of is_public rows. The certifications TABLE becomes own+admin
--    only, so even a signed-in account can no longer read other people's
--    contact data (closes the residual noted in migration 037).
-- 2. Trainings: anonymous visitors can browse the catalog but never select
--    meet_link or trainer_email (previously select * shipped both to anyone).
-- 3. Reviews: reviewer email is not selectable by anon.
--
-- The view intentionally runs with owner (postgres) privileges — its WHERE
-- is_public = true and fixed column list ARE the security boundary, which is
-- exactly the controlled use case for a definer-rights view.

-- Backfill the 2 legacy rows whose auth link was missing, so the own-rows
-- policy below keeps them visible to their owners.
update public.certifications c set user_id = u.id
  from auth.users u
  where c.user_id is null and lower(u.email) = lower(c.email);

-- Public wall view (safe columns, public rows only)
create or replace view public.certifications_public as
  select id, full_name, provider, certification_name, exam_code,
         certification_date, verified_credential_url, linkedin_url,
         photo_url, country, additional_notes, created_at
  from public.certifications
  where is_public = true;

alter view public.certifications_public owner to postgres;
revoke all on public.certifications_public from public, anon, authenticated;
grant select on public.certifications_public to anon, authenticated;

-- The table itself: own rows + admin only. Public reads use the view.
drop policy if exists certs_public_read on public.certifications;
create policy certs_read_own_admin on public.certifications
  for select using (user_id = auth.uid() or is_admin());

-- anon no longer touches the table at all (037's column grant superseded)
revoke select on table public.certifications from anon;

-- Trainings: catalog browsable, meeting link + trainer email are not
revoke select on table public.trainings from anon;
grant select (id, slug, name, course_title, provider, start_date, start_time,
  end_date, duration_hours, mode, city, trainer_id, trainer_name, max_capacity,
  price_inr, image_url, description, resources, status, created_at, updated_at,
  review_status, avg_rating, review_count, certification_id, visibility, level)
  on public.trainings to anon;

-- Reviews: no reviewer emails for anonymous readers
revoke select on table public.reviews from anon;
grant select (id, user_id, name, rating, review, context, photo_url, is_public, created_at)
  on public.reviews to anon;
