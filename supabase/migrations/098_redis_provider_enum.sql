-- ============================================================
-- Yatri Cloud — 098_redis_provider_enum.sql
-- Add REDIS to provider_t enum and seed Redis in cert_providers
-- and provider_certifications so all database constraints and enums
-- support Redis certifications, question banks, dumps, and trainings.
-- ============================================================

-- 1. Add REDIS value to provider_t enum if not already present
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_enum e on t.oid = e.enumtypid
    where t.typname = 'provider_t' and e.enumlabel = 'REDIS'
  ) then
    alter type provider_t add value 'REDIS';
  end if;
end $$;

-- 2. Seed cert_providers table with Redis if not already present
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
  'redis',
  'Redis',
  'REDIS',
  'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg',
  'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg',
  '#DC382D',
  'In-memory data structures, caching & Redis Certified Developer',
  1,
  true,
  true,
  13,
  true
)
on conflict (slug) do update set
  enum_value = excluded.enum_value,
  label = excluded.label,
  logo_url = excluded.logo_url,
  brand_color = excluded.brand_color,
  active = true;

-- 3. Seed provider_certifications with Redis Certified Developer
insert into provider_certifications (
  provider_slug,
  exam_code,
  title,
  level,
  track,
  active,
  url
) values (
  'redis',
  'REDIS-DEV',
  'Redis Certified Developer',
  'developer',
  'in-memory',
  true,
  '/examdumps/practice/redis-certified-developer'
)
on conflict do nothing;
