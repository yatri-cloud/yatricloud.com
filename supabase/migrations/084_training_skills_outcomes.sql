-- Yatri Cloud — 084_training_skills_outcomes.sql
-- Add skills and outcomes text columns to the trainings table.
-- These fields are collected in the TrainingManager form but had no
-- backing DB columns — data was silently dropped on every save.

alter table trainings add column if not exists skills text;
alter table trainings add column if not exists outcomes text;
