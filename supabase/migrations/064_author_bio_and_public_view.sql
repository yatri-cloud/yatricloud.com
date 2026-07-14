-- ============================================================
-- Yatri Cloud — 064_author_bio_and_public_view.sql
-- profiles.select is own-row-only, so blog authors / commenters aren't readable
-- cross-user. Expose ONLY safe public author fields via a view (never email,
-- phone, location) so the blog can show bylines everywhere. Add an author `bio`.
-- ============================================================

alter table profiles add column if not exists bio text;

create or replace view public_authors
with (security_invoker = off) as
  select id, full_name, photo_url, bio, role
  from profiles;

grant select on public_authors to anon, authenticated;
