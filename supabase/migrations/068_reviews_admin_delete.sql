-- ============================================================
-- Yatri Cloud — 068_reviews_admin_delete.sql
-- The general review wall (reviews table) had admin UPDATE (hide via is_public)
-- but no DELETE — so spam/abusive reviews couldn't be removed. Add admin delete.
-- ============================================================
drop policy if exists "reviews_admin_delete" on reviews;
create policy "reviews_admin_delete" on reviews for delete using (is_admin());
