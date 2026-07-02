-- 008_event_feedback_public.sql
-- The public event feedback form (/events/:eventName/feedback) only knows the
-- event by its display name (from the URL), not by a foreign-key id. Relax the
-- event_id constraint and add an event_name column so anonymous attendees can
-- leave feedback without a resolved event row. Replaces the old Apps Script
-- no-cors POST.

alter table event_feedback
  alter column event_id drop not null;

alter table event_feedback
  add column if not exists event_name text;

alter table event_feedback
  add column if not exists name text;

create index if not exists idx_event_fb_name on event_feedback (event_name);
