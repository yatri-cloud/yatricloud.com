-- ============================================================
-- Yatri Cloud — 070_admin_delete_gaps.sql
-- RLS "no DELETE" audit (see D56/D68/D69): two admin management pages call
-- .delete() on tables that only had INSERT/SELECT/UPDATE policies, so the delete
-- silently failed under RLS:
--   • training_enrollments  ← AdminEnrollments "remove enrollment" (deleteEnrollment)
--   • trainer_applications  ← AdminTrainers "delete application" (deleteTrainerApplication)
-- Add admin DELETE on both. (Every other public table with a .delete() call
-- already has a DELETE or ALL policy — audited against pg_policies + code grep.)
-- ============================================================
drop policy if exists "training_enrollments_admin_delete" on training_enrollments;
create policy "training_enrollments_admin_delete" on training_enrollments for delete using (is_admin());

drop policy if exists "trainer_applications_admin_delete" on trainer_applications;
create policy "trainer_applications_admin_delete" on trainer_applications for delete using (is_admin());
