-- 041: Resume maker production CRUD.
-- Owners can delete their requests (and their files); admins can see every
-- file, retry failed jobs (update) and delete any request.

create policy resume_requests_delete_own on public.resume_requests
  for delete to authenticated
  using (user_id = auth.uid() or is_admin());

-- Admin-only update from the browser (retry failed → queued). The worker
-- keeps using the service role, which bypasses RLS.
create policy resume_requests_update_admin on public.resume_requests
  for update to authenticated
  using (is_admin())
  with check (is_admin());

-- Storage: owners delete files in their own folder; admins read everything
-- in the bucket (for the admin console download links).
create policy resumes_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'resumes'
    and ((storage.foldername(name))[1] = auth.uid()::text or is_admin())
  );

create policy resumes_read_admin on storage.objects
  for select to authenticated
  using (bucket_id = 'resumes' and is_admin());
