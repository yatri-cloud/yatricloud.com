-- ============================================================
-- Yatri Cloud — 066_blog_cert_link.sql
-- The Yatri differentiator: a story can be linked to a certification, turning
-- the blog into "prep stories per exam". Optional cert_value/cert_provider on
-- posts; the feed view resolves the human label + exam code from the catalog.
-- ============================================================

alter table blog_posts add column if not exists cert_value text;     -- provider_certifications.value
alter table blog_posts add column if not exists cert_provider text;   -- provider slug (e.g. azure)
create index if not exists idx_blog_posts_cert on blog_posts (cert_value) where cert_value is not null;

-- Rebuild blog_feed to carry the cert link + resolved label.
-- (drop first: create-or-replace can't insert columns mid-view.)
drop view if exists blog_feed;
create view blog_feed
with (security_invoker = off) as
select
  p.id, p.slug, p.title, p.subtitle, p.cover_image_url, p.content, p.excerpt,
  p.reading_minutes, p.featured, p.view_count, p.access,
  p.published_at, p.created_at, p.updated_at,
  p.author_id,
  pr.full_name as author_name,
  pr.photo_url as author_photo,
  pr.role      as author_role,
  p.cert_value, p.cert_provider,
  pc.label     as cert_label,
  pc.exam_code as cert_code,
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
left join provider_certifications pc on pc.value = p.cert_value and pc.provider_slug = p.cert_provider
where p.status = 'published';

grant select on blog_feed to anon, authenticated;

-- Public "is this author certified?" helper — true if they hold any public
-- certification (drives the "Certified Yatri" byline badge). Reads the RLS'd
-- certifications table via a definer so it works for any viewer.
create or replace function author_is_certified(p_author uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from certifications where user_id = p_author and is_public = true);
$$;
grant execute on function author_is_certified(uuid) to anon, authenticated;
