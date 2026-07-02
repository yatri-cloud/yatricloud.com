-- ============================================================
-- Yatri Cloud — 002_rls.sql
-- Row Level Security: enable on every table + policies.
-- Model: anon reads published/public content only; authenticated
-- users own their rows; admins (profiles.role='admin') manage all;
-- payments are service-role-only writes.
-- ============================================================

-- ---------- admin helper ----------
create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ============ profiles ============
alter table profiles enable row level security;

drop policy if exists "profiles_select_own_or_admin" on profiles;
create policy "profiles_select_own_or_admin" on profiles for select
  using (id = auth.uid() or is_admin());

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles for update
  using (id = auth.uid() or is_admin())
  with check (id = auth.uid() or is_admin());

-- inserts happen via the auth trigger (security definer); no direct client insert policy needed

-- ============ certifications ============
alter table certifications enable row level security;

drop policy if exists "certs_public_read" on certifications;
create policy "certs_public_read" on certifications for select
  using (is_public = true or user_id = auth.uid() or is_admin());

drop policy if exists "certs_insert_own" on certifications;
create policy "certs_insert_own" on certifications for insert to authenticated
  with check (user_id = auth.uid() or is_admin());

drop policy if exists "certs_update_own" on certifications;
create policy "certs_update_own" on certifications for update
  using (user_id = auth.uid() or is_admin());

drop policy if exists "certs_delete_own" on certifications;
create policy "certs_delete_own" on certifications for delete
  using (user_id = auth.uid() or is_admin());

-- ============ events ============
alter table events enable row level security;

drop policy if exists "events_public_read" on events;
create policy "events_public_read" on events for select
  using (status = 'published' or created_by = auth.uid() or is_admin());

drop policy if exists "events_admin_write" on events;
create policy "events_admin_write" on events for all
  using (is_admin()) with check (is_admin());

-- ============ event_registrations ============
alter table event_registrations enable row level security;

drop policy if exists "eventreg_read_own" on event_registrations;
create policy "eventreg_read_own" on event_registrations for select
  using (user_id = auth.uid() or is_admin());

drop policy if exists "eventreg_insert_auth" on event_registrations;
create policy "eventreg_insert_auth" on event_registrations for insert to authenticated
  with check (user_id = auth.uid() or is_admin());

drop policy if exists "eventreg_admin_update" on event_registrations;
create policy "eventreg_admin_update" on event_registrations for update
  using (is_admin());

-- ============ event_submissions (speaker/sponsor/venue forms — public submit) ============
alter table event_submissions enable row level security;

drop policy if exists "eventsub_insert_any" on event_submissions;
create policy "eventsub_insert_any" on event_submissions for insert
  with check (true);   -- public forms; rate-limit at edge

drop policy if exists "eventsub_admin_read" on event_submissions;
create policy "eventsub_admin_read" on event_submissions for select
  using (is_admin());

drop policy if exists "eventsub_admin_update" on event_submissions;
create policy "eventsub_admin_update" on event_submissions for update
  using (is_admin());

-- ============ event_feedback ============
alter table event_feedback enable row level security;

drop policy if exists "eventfb_insert_any" on event_feedback;
create policy "eventfb_insert_any" on event_feedback for insert
  with check (true);

drop policy if exists "eventfb_admin_read" on event_feedback;
create policy "eventfb_admin_read" on event_feedback for select
  using (is_admin());

-- ============ products ============
alter table products enable row level security;

drop policy if exists "products_public_read" on products;
create policy "products_public_read" on products for select
  using (status = 'published' or is_admin());

drop policy if exists "products_admin_write" on products;
create policy "products_admin_write" on products for all
  using (is_admin()) with check (is_admin());

-- ============ exam_dumps ============
alter table exam_dumps enable row level security;

drop policy if exists "dumps_public_read" on exam_dumps;
create policy "dumps_public_read" on exam_dumps for select
  using (status = 'published' or is_admin());

drop policy if exists "dumps_admin_write" on exam_dumps;
create policy "dumps_admin_write" on exam_dumps for all
  using (is_admin()) with check (is_admin());

-- ============ orders ============
alter table orders enable row level security;

drop policy if exists "orders_read_own" on orders;
create policy "orders_read_own" on orders for select
  using (user_id = auth.uid() or is_admin());

drop policy if exists "orders_insert_own" on orders;
create policy "orders_insert_own" on orders for insert to authenticated
  with check (user_id = auth.uid());

-- status transitions happen server-side (service role bypasses RLS)

-- ============ payments (SERVICE-ROLE ONLY writes) ============
alter table payments enable row level security;

drop policy if exists "payments_read_own" on payments;
create policy "payments_read_own" on payments for select
  using (
    is_admin() or exists (
      select 1 from orders o
      where o.id = payments.order_id and o.user_id = auth.uid()
    )
  );
-- No insert/update policies for clients: only service role (Edge Functions) writes payments.

-- ============ trainings ============
alter table trainings enable row level security;

drop policy if exists "trainings_public_read" on trainings;
create policy "trainings_public_read" on trainings for select
  using (status in ('published','archived') or trainer_id = auth.uid() or is_admin());

drop policy if exists "trainings_trainer_write" on trainings;
create policy "trainings_trainer_write" on trainings for update
  using (trainer_id = auth.uid() or is_admin());

drop policy if exists "trainings_admin_all" on trainings;
create policy "trainings_admin_all" on trainings for all
  using (is_admin()) with check (is_admin());

-- ============ training_enrollments ============
alter table training_enrollments enable row level security;

drop policy if exists "enroll_read_own" on training_enrollments;
create policy "enroll_read_own" on training_enrollments for select
  using (
    user_id = auth.uid() or is_admin()
    or exists (select 1 from trainings t where t.id = training_id and t.trainer_id = auth.uid())
  );

drop policy if exists "enroll_insert_own" on training_enrollments;
create policy "enroll_insert_own" on training_enrollments for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "enroll_admin_update" on training_enrollments;
create policy "enroll_admin_update" on training_enrollments for update
  using (is_admin());

-- ============ voucher_requests ============
alter table voucher_requests enable row level security;

drop policy if exists "voucher_insert_any" on voucher_requests;
create policy "voucher_insert_any" on voucher_requests for insert
  with check (true);   -- public form; rate-limit at edge

drop policy if exists "voucher_read_own" on voucher_requests;
create policy "voucher_read_own" on voucher_requests for select
  using (user_id = auth.uid() or is_admin());

drop policy if exists "voucher_admin_update" on voucher_requests;
create policy "voucher_admin_update" on voucher_requests for update
  using (is_admin());

-- ============ reviews ============
alter table reviews enable row level security;

drop policy if exists "reviews_public_read" on reviews;
create policy "reviews_public_read" on reviews for select
  using (is_public = true or user_id = auth.uid() or is_admin());

drop policy if exists "reviews_insert_any" on reviews;
create policy "reviews_insert_any" on reviews for insert
  with check (true);   -- public review form; moderate via is_public

drop policy if exists "reviews_admin_update" on reviews;
create policy "reviews_admin_update" on reviews for update
  using (is_admin());
