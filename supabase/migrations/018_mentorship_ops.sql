-- ============================================================
-- Yatri Cloud — 018_mentorship_ops.sql
-- Operations for the mentorship platform:
--   - session reminders and review follow ups (tracking flags)
--   - reschedule and cancel with refund (audit columns)
-- All additive and nullable, so nothing changes until the features use them.
-- ============================================================

alter table mentorship_bookings
  -- reminder and follow up tracking (set by the cron job so we never double send)
  add column if not exists reminded_1d boolean not null default false,
  add column if not exists reminded_1h boolean not null default false,
  add column if not exists review_requested boolean not null default false,
  -- reschedule and cancel with refund
  add column if not exists refund_id text,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancel_reason text,
  add column if not exists rescheduled_count int not null default 0;

-- The cron reminder query scans confirmed upcoming sessions by time.
create index if not exists idx_mbookings_reminders
  on mentorship_bookings (status, slot_start)
  where status = 'confirmed' and slot_start is not null;
