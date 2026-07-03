-- ============================================================
-- Yatri Cloud — 025_event_details_jsonb.sql
-- Give events a proper details jsonb column for the rich nested data
-- (speakers, sponsors, tickets, gallery, organizer, tech stack, flags)
-- instead of overloading the description column. The description column
-- goes back to holding the plain event description. Existing rows keep
-- working: the reader falls back to the legacy JSON in description.
-- ============================================================

alter table events
  add column if not exists details jsonb not null default '{}';
