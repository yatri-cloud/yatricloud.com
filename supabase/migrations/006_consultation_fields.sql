-- ============================================================
-- Yatri Cloud — 006_consultation_fields.sql
-- Align consultation_requests with the Partners page form inputs
-- (kind: college|corporate, role, phone, headcount, focus, message)
-- ============================================================

alter table consultation_requests
  add column if not exists kind text check (kind in ('college','corporate','other')) default 'other',
  add column if not exists role text,
  add column if not exists phone text,
  add column if not exists headcount int,
  add column if not exists focus text,
  add column if not exists message text;
