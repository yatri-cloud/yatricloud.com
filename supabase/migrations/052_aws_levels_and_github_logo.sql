-- ============================================================
-- Yatri Cloud — 052_aws_levels_and_github_logo.sql
-- 1. AWS certifications: set `level` (foundational/associate/professional/
--    specialty) to match https://aws.amazon.com/certification/, and retire
--    the Machine Learning – Specialty (MLS-C01), which AWS has removed.
-- 2. GitHub provider logo was a white mark (invisible on the white catalog
--    tiles) — swap to the dark GitHub mark with a white variant for dark UI.
--
-- Non-destructive: only updates levels + fixes one logo; the single delete
-- targets a genuinely-retired exam (study_plans/trainings don't reference it).
-- Keep in sync with src/lib/cert-catalog.ts.
-- ============================================================

update provider_certifications set level = 'foundational'
  where provider_slug = 'aws' and value in ('cloud-practitioner', 'ai-practitioner');

update provider_certifications set level = 'associate'
  where provider_slug = 'aws' and value in (
    'cloudops-associate', 'solutions-architect-associate', 'developer-associate',
    'data-engineer-associate', 'machine-learning-engineer-associate'
  );

update provider_certifications set level = 'professional'
  where provider_slug = 'aws' and value in (
    'solutions-architect-professional', 'devops-engineer-professional', 'genai-developer-professional'
  );

update provider_certifications set level = 'specialty'
  where provider_slug = 'aws' and value in ('advanced-networking-specialty', 'security-specialty');

-- Retired by AWS (no longer on aws.amazon.com/certification).
delete from provider_certifications where provider_slug = 'aws' and value = 'machine-learning-specialty';

-- GitHub logo: dark mark for light tiles, white variant for dark surfaces.
update cert_providers
  set logo_url = 'https://cdn.simpleicons.org/github/181717',
      logo_light_url = 'https://cdn.simpleicons.org/github/ffffff',
      updated_at = now()
  where slug = 'github';

-- GCP: set `level` to match https://cloud.google.com/learn/certification
-- (foundational / associate / professional). The 14 exams already match the
-- page exactly, so this only tags them by level.
update provider_certifications set level = 'foundational'
  where provider_slug = 'gcp' and value in ('cloud-digital-leader', 'generative-ai-leader');

update provider_certifications set level = 'associate'
  where provider_slug = 'gcp' and value in (
    'associate-cloud-engineer', 'google-workspace-administrator', 'data-practitioner'
  );

update provider_certifications set level = 'professional'
  where provider_slug = 'gcp' and value in (
    'professional-cloud-architect', 'professional-cloud-database-engineer', 'professional-cloud-developer',
    'professional-data-engineer', 'professional-cloud-devops-engineer', 'professional-cloud-security-engineer',
    'professional-cloud-network-engineer', 'professional-machine-learning-engineer',
    'professional-security-operations-engineer'
  );
