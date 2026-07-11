-- 042: Cap active resume requests at 3 per user (spam/queue protection).
-- The subselect runs as the requesting user, who can only see their own
-- rows, which is exactly the count we need.

drop policy resume_requests_insert_own on public.resume_requests;

create policy resume_requests_insert_own on public.resume_requests
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and (
      select count(*) from public.resume_requests r
      where r.user_id = auth.uid()
        and r.status in ('queued', 'processing')
    ) < 3
  );
