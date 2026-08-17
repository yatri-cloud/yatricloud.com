-- ============================================================
-- Yatri Cloud — 086_event_training_payment_id_text.sql
-- Allow payment_id to store Razorpay payment IDs (text) or internal UUIDs
-- without failing on invalid UUID syntax.
-- ============================================================

-- 1. Drop the foreign key constraint on payment_id
alter table event_registrations drop constraint if exists event_registrations_payment_id_fkey;
alter table training_enrollments drop constraint if exists training_enrollments_payment_id_fkey;

-- 2. Alter column types to text
alter table event_registrations alter column payment_id type text using payment_id::text;
alter table training_enrollments alter column payment_id type text using payment_id::text;
