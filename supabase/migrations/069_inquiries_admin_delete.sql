-- ============================================================
-- Yatri Cloud — 069_inquiries_admin_delete.sql
-- consultation_requests + contact_messages had admin SELECT/UPDATE but no DELETE,
-- so admins could mark inquiries handled but never clear spam/resolved rows.
-- Add admin DELETE on both.
-- ============================================================
drop policy if exists "consult_admin_delete" on consultation_requests;
create policy "consult_admin_delete" on consultation_requests for delete using (is_admin());

drop policy if exists "contact_admin_delete" on contact_messages;
create policy "contact_admin_delete" on contact_messages for delete using (is_admin());
