-- ============================================================
-- Yatri Cloud — 067_trainings_rls_harden.sql
-- Two production RLS gaps on `trainings`:
--   1. No INSERT policy for trainers → an approved trainer literally cannot
--      create a course (only admins could). Add an insert policy scoped to
--      the trainer's own DRAFT rows, and only for trainer/admin roles.
--   2. trainings_trainer_write had no WITH CHECK, so a trainer could UPDATE
--      their own row to status='published' — self-publishing past admin review.
--      Tighten it: trainers may only leave their row in 'draft'; only admins
--      publish/archive/cancel.
-- Publishing stays admin-only via approveCourse() running with is_admin().
-- ============================================================

-- 1) Trainers create their own draft courses.
drop policy if exists "trainings_trainer_insert" on trainings;
create policy "trainings_trainer_insert" on trainings for insert to authenticated
  with check (
    trainer_id = auth.uid()
    and status = 'draft'
    and exists (select 1 from profiles where id = auth.uid() and role in ('trainer', 'admin'))
  );

-- 2) Trainers edit only their own rows and can't self-publish; admins unrestricted.
drop policy if exists "trainings_trainer_write" on trainings;
create policy "trainings_trainer_write" on trainings for update
  using (trainer_id = auth.uid() or is_admin())
  with check ((trainer_id = auth.uid() and status = 'draft') or is_admin());
