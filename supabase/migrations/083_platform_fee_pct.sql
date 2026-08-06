-- ============================================================
-- Yatri Cloud — 083_platform_fee_pct.sql
-- Optional per-item "platform fee" as a percentage, set by an admin at
-- creation time. The fee is added ON TOP of the base price, so the user's
-- final payable amount = base price + (base price × fee%). Applies to both
-- paid events and paid trainings.
--
-- The fee is computed on the BASE price (not coupon-discounted); coupons
-- only reduce the ticket portion. A value of 0 (the default) means no fee,
-- so all existing rows are unaffected until an admin sets one.
--
-- Column is additive; RLS is row-level (no column privileges), so existing
-- policies are unaffected.
-- ============================================================

alter table events    add column if not exists platform_fee_pct numeric(5,2) not null default 0;
alter table trainings add column if not exists platform_fee_pct numeric(5,2) not null default 0;
