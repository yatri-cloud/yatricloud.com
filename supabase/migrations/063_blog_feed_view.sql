-- ============================================================
-- Yatri Cloud — 063_blog_feed_view.sql
-- Read model for the public blog: published posts joined to their author's
-- PUBLIC profile fields + aggregated clap/response counts + tag arrays.
-- The view is security_invoker = off (runs as owner) but its WHERE clause only
-- ever exposes status='published' rows and only public author columns, so it's
-- safe to grant to anon. Authoring/drafts still go through blog_posts (RLS).
-- ============================================================

create or replace view blog_feed
with (security_invoker = off) as
select
  p.id, p.slug, p.title, p.subtitle, p.cover_image_url, p.content, p.excerpt,
  p.reading_minutes, p.featured, p.view_count, p.access,
  p.published_at, p.created_at, p.updated_at,
  p.author_id,
  pr.full_name as author_name,
  pr.photo_url as author_photo,
  pr.role      as author_role,
  coalesce((select sum(c.count) from blog_claps c where c.post_id = p.id), 0)::int as clap_total,
  (select count(*) from blog_responses r where r.post_id = p.id)::int as response_count,
  coalesce((select array_agg(t.label order by t.label)
            from blog_post_tags pt join blog_tags t on t.id = pt.tag_id
            where pt.post_id = p.id), '{}') as tag_labels,
  coalesce((select array_agg(t.slug order by t.slug)
            from blog_post_tags pt join blog_tags t on t.id = pt.tag_id
            where pt.post_id = p.id), '{}') as tag_slugs
from blog_posts p
join profiles pr on pr.id = p.author_id
where p.status = 'published';

grant select on blog_feed to anon, authenticated;
