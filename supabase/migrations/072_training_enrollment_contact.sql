-- 072: Persist attendee contact details on training enrollments.
-- The enrollment form collected phone/city/state/country/linkedin as REQUIRED
-- fields but enroll() discarded them (only email/payment persisted). Add
-- columns so the details are stored and reachable by admins/trainers instead of
-- being thrown away. Additive + nullable — safe, non-destructive. Existing
-- row-level policies already scope this table to the owner + admins, so the new
-- columns need no policy change.
alter table training_enrollments
  add column if not exists full_name text,
  add column if not exists phone     text,
  add column if not exists city      text,
  add column if not exists state     text,
  add column if not exists country   text,
  add column if not exists linkedin  text;
