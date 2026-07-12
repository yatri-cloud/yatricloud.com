-- ============================================================
-- Yatri Cloud — 053_derive_levels_from_names.sql
-- Give every remaining provider (Oracle, Salesforce, ServiceNow, HashiCorp,
-- Kubernetes, OpenAI, …) the same level-grouped "table of contents" in the
-- admin catalog by deriving `level` from each exam's name. Only touches rows
-- where level is still NULL, so the hand-curated azure/github/aws/gcp lists
-- are left alone. First keyword match wins (checked most-specific first).
-- ============================================================

update provider_certifications set level = 'expert'
  where level is null and label ~* '\yexpert\y';

update provider_certifications set level = 'professional'
  where level is null and label ~* '\yprofessional\y';

update provider_certifications set level = 'specialty'
  where level is null and label ~* '\yspecialty\y';

update provider_certifications set level = 'associate'
  where level is null and label ~* '\yassociate\y';

update provider_certifications set level = 'foundational'
  where level is null and (label ~* 'foundations?\y' or label ~* '\yfundamentals?\y' or label ~* '\yleader\y' or label ~* '\ypractitioner\y');
