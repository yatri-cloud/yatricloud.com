-- ============================================================
-- Yatri Cloud — 054_certification_url.sql
-- Add an optional official URL to each certification so the admin can jump
-- straight to the vendor's exam page (and we can surface "Learn more" links
-- on the site later). Additive + nullable — nothing depends on it being set.
-- ============================================================

alter table provider_certifications add column if not exists url text;
