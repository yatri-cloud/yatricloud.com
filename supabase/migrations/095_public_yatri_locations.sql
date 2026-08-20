-- ============================================================
-- Yatri Cloud — 095_public_yatri_locations.sql
-- Create a secure public view for map aggregation showing user
-- locations (country, state, city, interested certs) without
-- exposing PII (email, phone, real names).
-- ============================================================

create or replace view public_yatri_locations
with (security_invoker = off) as
  select
    id,
    country,
    state_province,
    city,
    interested_certifications,
    created_at
  from profiles
  where country is not null and country != '';

grant select on public_yatri_locations to anon, authenticated;
