-- ============================================================
-- Yatri Cloud — 017_mentorship_commission.sql
-- Platform commission on mentorship bookings via Razorpay Route.
-- The mentor receives their share as an order level transfer to their
-- Razorpay linked account; the platform commission stays in the main
-- account automatically. All columns are additive and nullable, so
-- nothing changes until a mentor has a linked account id and Route is
-- activated. See docs/PAYMENTS-COMMISSION.md.
-- ============================================================

-- Mentor payout wiring.
alter table mentors
  add column if not exists razorpay_account_id text,           -- acc_XXXXXXXXXXXXXX linked account
  add column if not exists commission_percent numeric(5,2);    -- per mentor override; null uses the platform default

-- Per booking money trail (filled by the payment verify step).
alter table mentorship_bookings
  add column if not exists platform_fee numeric(10,2),
  add column if not exists mentor_payout numeric(10,2),
  add column if not exists transfer_id text;

-- Platform default commission percent, editable from admin site settings.
insert into site_settings (key, value)
values ('commission', '{"mentorship_percent": 10}')
on conflict (key) do nothing;
