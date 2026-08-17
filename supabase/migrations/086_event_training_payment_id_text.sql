-- ============================================================
-- Yatri Cloud — 086_event_training_payment_id_text.sql
-- Allow payment_id to store Razorpay payment IDs (text) or internal UUIDs
-- without failing on invalid UUID syntax.
-- ============================================================

-- Drop foreign key constraint on event_registrations.payment_id if present and alter to text
alter table event_registrations alter column payment_id type text using payment_id::text;

-- Drop foreign key constraint on training_enrollments.payment_id if present and alter to text
alter table training_enrollments alter column payment_id type text using payment_id::text;
