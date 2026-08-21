-- ============================================================
-- Yatri Cloud — 096_anthropic_provider_enum.sql
-- Add ANTHROPIC to provider_t enum and seed Anthropic in cert_providers
-- and provider_certifications so all database constraints and enums
-- support Anthropic certifications and trainings.
-- ============================================================

-- 1. Add ANTHROPIC value to provider_t enum if not already present
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_enum e on t.oid = e.enumtypid
    where t.typname = 'provider_t' and e.enumlabel = 'ANTHROPIC'
  ) then
    alter type provider_t add value 'ANTHROPIC';
  end if;
end $$;

-- 2. Seed cert_providers table with Anthropic
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
  'anthropic',
  'Anthropic',
  'ANTHROPIC',
  '/logos/anthropic.svg',
  '/logos/anthropic.svg',
  '#D97757',
  'Claude AI & prompt engineering',
  4,
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

-- 3. Seed default Anthropic certifications in provider_certifications
insert into provider_certifications (provider_slug, value, label, exam_code, level, sort_order, active)
values
  ('anthropic', 'anthropic-claude-certified-architect', 'Anthropic Certified Claude Architect', 'ACCA', 'Professional', 1, true),
  ('anthropic', 'anthropic-prompt-engineering-specialist', 'Anthropic Prompt Engineering Specialist', 'APES', 'Specialty', 2, true),
  ('anthropic', 'anthropic-ai-safety-practitioner', 'Anthropic AI Safety & Alignment Practitioner', 'AASP', 'Associate', 3, true),
  ('anthropic', 'anthropic-claude-developer-associate', 'Anthropic Claude Developer Associate', 'ACDA', 'Associate', 4, true)
on conflict (provider_slug, value) do update set
  label = excluded.label,
  exam_code = excluded.exam_code,
  level = excluded.level,
  active = true;
