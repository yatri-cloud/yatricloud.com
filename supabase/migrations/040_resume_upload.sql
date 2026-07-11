-- 040: Resume maker accepts an uploaded source file (PDF/DOCX).
-- Owners upload into their own folder of the private `resumes` bucket
-- (resumes/<uid>/...); the worker downloads it with the service role.

alter table public.resume_requests
  add column if not exists input_file_path text;

create policy resumes_upload_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
