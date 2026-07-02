-- ============================================================
-- Yatri Cloud — 003_storage.sql
-- Storage buckets + object policies.
-- Public buckets: avatars, event-media, product-images
-- Private buckets (signed URLs only): training-resources, exam-dumps
-- ============================================================

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('event-media', 'event-media', true),
  ('product-images', 'product-images', true),
  ('training-resources', 'training-resources', false),
  ('exam-dumps', 'exam-dumps', false)
on conflict (id) do nothing;

-- ---------- public buckets: anyone can read ----------
drop policy if exists "public_read_public_buckets" on storage.objects;
create policy "public_read_public_buckets" on storage.objects for select
  using (bucket_id in ('avatars','event-media','product-images'));

-- ---------- avatars: users manage their own folder (userId/...) ----------
drop policy if exists "avatars_user_write" on storage.objects;
create policy "avatars_user_write" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_user_update" on storage.objects;
create policy "avatars_user_update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_user_delete" on storage.objects;
create policy "avatars_user_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- admin manages content buckets ----------
drop policy if exists "admin_write_content_buckets" on storage.objects;
create policy "admin_write_content_buckets" on storage.objects for all to authenticated
  using (
    bucket_id in ('event-media','product-images','training-resources','exam-dumps')
    and public.is_admin()
  )
  with check (
    bucket_id in ('event-media','product-images','training-resources','exam-dumps')
    and public.is_admin()
  );

-- ---------- private buckets: NO public select policy on purpose ----------
-- training-resources: enrolled users get signed URLs from an Edge Function
-- exam-dumps: buyers get signed URLs from an Edge Function after payment verification
-- (service role bypasses RLS to create signed URLs)
