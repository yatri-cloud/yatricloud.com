-- 037: Column-level privacy for the public wall of fame.
--
-- The certifications table carries personal contact data (email, phone,
-- state/city, country code) that the anonymous wall-of-fame query must never
-- be able to read — even if a client asks for it. Row access is unchanged
-- (RLS still gates anon to is_public = true); this narrows the COLUMNS the
-- anon role can select to exactly what the wall displays.
--
-- Authenticated users keep full column access: RLS limits them to public
-- rows + their own + admin, and the admin console and self-service flows
-- need the contact fields.

revoke select on table public.certifications from anon;

grant select (
  id,
  user_id,
  full_name,
  provider,
  certification_name,
  exam_code,
  certification_date,
  verified_credential_url,
  linkedin_url,
  photo_url,
  country,
  additional_notes,
  is_public,
  created_at
) on public.certifications to anon;
