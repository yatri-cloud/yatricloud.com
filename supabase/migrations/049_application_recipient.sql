-- 049: per-application email recipient (user-editable), so outreach works
-- even before a company contact address is on file.
alter table public.job_applications add column if not exists email_to text;
