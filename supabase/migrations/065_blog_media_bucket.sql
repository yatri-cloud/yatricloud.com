-- ============================================================
-- Yatri Cloud — 065_blog_media_bucket.sql
-- Storage for blog cover images + inline images. Public read (images are
-- served by URL in published posts), authenticated write, owner-scoped
-- update/delete. Uploaded to path `<uid>/<file>` so RLS can check ownership.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('blog-media', 'blog-media', true, 10485760,
        array['image/png','image/jpeg','image/webp','image/gif','image/svg+xml'])
on conflict (id) do update set public = true, file_size_limit = 10485760;

drop policy if exists "blog_media_read" on storage.objects;
create policy "blog_media_read" on storage.objects for select
  using (bucket_id = 'blog-media');

drop policy if exists "blog_media_insert" on storage.objects;
create policy "blog_media_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'blog-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "blog_media_update_own" on storage.objects;
create policy "blog_media_update_own" on storage.objects for update to authenticated
  using (bucket_id = 'blog-media' and owner = auth.uid());

drop policy if exists "blog_media_delete_own" on storage.objects;
create policy "blog_media_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'blog-media' and owner = auth.uid());
