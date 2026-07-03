-- ============================================================
-- Yatri Cloud — 028_training_certification.sql
-- Align a training to the certification exam it prepares you for.
-- Links trainings to the provider_certifications catalog (exam codes),
-- so a course can say "prepares you for AWS SAA-C03" and connect to the
-- rest of the certification community.
-- ============================================================

alter table trainings
  add column if not exists certification_id uuid
    references provider_certifications(id) on delete set null;

create index if not exists idx_trainings_certification on trainings (certification_id);
