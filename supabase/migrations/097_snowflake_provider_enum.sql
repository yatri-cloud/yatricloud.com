-- ============================================================
-- Yatri Cloud — 097_snowflake_provider_enum.sql
-- Add SNOWFLAKE to provider_t enum and seed Snowflake in cert_providers
-- and provider_certifications so all database constraints and enums
-- support Snowflake certifications, vouchers, dumps, and trainings.
-- ============================================================

-- 1. Add SNOWFLAKE value to provider_t enum if not already present
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_enum e on t.oid = e.enumtypid
    where t.typname = 'provider_t' and e.enumlabel = 'SNOWFLAKE'
  ) then
    alter type provider_t add value 'SNOWFLAKE';
  end if;
end $$;

-- 2. Seed cert_providers table with Snowflake
insert into cert_providers (
  slug,
  label,
  enum_value,
  logo_url,
  logo_light_url,
  brand_color,
  blurb,
  cert_count,
  show_on_home,
  show_in_forms,
  sort_order,
  active
) values (
  'snowflake',
  'Snowflake',
  'SNOWFLAKE',
  '/logos/snowflake.png',
  '/logos/snowflake.png',
  '#29B5E8',
  'Data cloud & data warehouse',
  6,
  true,
  true,
  4,
  true
)
on conflict (slug) do update set
  label = excluded.label,
  enum_value = excluded.enum_value,
  logo_url = excluded.logo_url,
  logo_light_url = excluded.logo_light_url,
  brand_color = excluded.brand_color,
  active = true;

-- 3. Seed default Snowflake certifications in provider_certifications
insert into provider_certifications (provider_slug, value, label, exam_code, level, sort_order, active)
values
  ('snowflake', 'snowpro-core-certification', 'SnowPro Core Certification', 'COF-C02', 'Associate', 1, true),
  ('snowflake', 'snowpro-advanced-architect', 'SnowPro Advanced: Architect', 'ARA-C01', 'Professional', 2, true),
  ('snowflake', 'snowpro-advanced-data-engineer', 'SnowPro Advanced: Data Engineer', 'DEA-C01', 'Professional', 3, true),
  ('snowflake', 'snowpro-advanced-data-scientist', 'SnowPro Advanced: Data Scientist', 'DSA-C01', 'Professional', 4, true),
  ('snowflake', 'snowpro-advanced-data-analyst', 'SnowPro Advanced: Data Analyst', 'DAA-C01', 'Professional', 5, true),
  ('snowflake', 'snowpro-advanced-administrator', 'SnowPro Advanced: Administrator', 'ADA-C01', 'Professional', 6, true)
on conflict (provider_slug, value) do update set
  label = excluded.label,
  exam_code = excluded.exam_code,
  level = excluded.level,
  sort_order = excluded.sort_order,
  active = true;
