-- 047: more official job sources — per-company SmartRecruiters + free aggregators.
alter table public.job_companies drop constraint if exists job_companies_source_check;
alter table public.job_companies
  add constraint job_companies_source_check
  check (source in ('greenhouse','lever','ashby','smartrecruiters','aggregator','manual'));
