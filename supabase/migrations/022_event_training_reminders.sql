-- ============================================================
-- Yatri Cloud — 022_event_training_reminders.sql
-- Reminder tracking for event registrations and training live sessions.
-- The cron sets these flags so a reminder is never sent twice.
-- ============================================================

alter table event_registrations
  add column if not exists reminded_1d boolean not null default false,
  add column if not exists reminded_soon boolean not null default false;

alter table training_enrollments
  add column if not exists reminded_1d boolean not null default false,
  add column if not exists reminded_soon boolean not null default false;
