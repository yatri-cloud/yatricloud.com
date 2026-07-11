-- 048: add 'intern' as a first-class level (was entry/mid/senior only).
alter table public.job_postings drop constraint if exists job_postings_level_check;
alter table public.job_postings
  add constraint job_postings_level_check
  check (level in ('intern','entry','mid','senior'));
