-- ============================================================
-- Yatri Cloud — 027_event_certificates.sql
-- Certificates of attendance for events. Reuses the certificates table
-- (kind already allows 'event'); adds an event_id link. A certificate is
-- issued only after an admin marks the registration as attended, verified
-- server side by /api/events/issue-certificate.
-- ============================================================

alter table certificates
  add column if not exists event_id uuid references events(id) on delete set null;

create index if not exists idx_certificates_event on certificates (event_id);
