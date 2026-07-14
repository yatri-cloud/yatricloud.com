-- ============================================================
-- Yatri Cloud — 062_blog.sql
-- Medium-style publishing platform. Phase 1 (writing + reading) + Phase 2
-- (social: claps, responses, follows, bookmarks, notifications). Monetization
-- (subscriptions/paywall/payouts) is intentionally NOT built here — the `access`
-- column is a forward-looking stub so member-only posts can be gated later.
--
-- Auth model: Supabase Auth. author_id/user_id = auth.uid() → profiles(id).
-- Security boundary is RLS (browser uses the publishable key). is_admin() and
-- set_updated_at() already exist (migrations 002 / earlier).
-- ============================================================

-- ---------- posts ----------
create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete cascade,
  slug text unique not null,
  title text not null,
  subtitle text,
  cover_image_url text,
  content text not null default '',            -- markdown
  excerpt text,                                -- short preview (auto or manual)
  status text not null default 'draft' check (status in ('draft','published','scheduled')),
  access text not null default 'free' check (access in ('free','member')),  -- paywall stub
  reading_minutes int not null default 1,
  featured boolean not null default false,     -- admin curation ("Featured" feed)
  view_count int not null default 0,
  published_at timestamptz,
  scheduled_for timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_blog_posts_published on blog_posts (status, published_at desc);
create index if not exists idx_blog_posts_author on blog_posts (author_id, updated_at desc);
create index if not exists idx_blog_posts_featured on blog_posts (featured, published_at desc) where featured;

drop trigger if exists trg_blog_posts_updated on blog_posts;
create trigger trg_blog_posts_updated before update on blog_posts
  for each row execute function set_updated_at();

alter table blog_posts enable row level security;
-- Readable when published, or by its author, or admin.
drop policy if exists "blog_posts_read" on blog_posts;
create policy "blog_posts_read" on blog_posts for select
  using (status = 'published' or author_id = auth.uid() or is_admin());
drop policy if exists "blog_posts_insert_own" on blog_posts;
create policy "blog_posts_insert_own" on blog_posts for insert to authenticated
  with check (author_id = auth.uid());
drop policy if exists "blog_posts_update_own" on blog_posts;
create policy "blog_posts_update_own" on blog_posts for update
  using (author_id = auth.uid() or is_admin()) with check (author_id = auth.uid() or is_admin());
drop policy if exists "blog_posts_delete_own" on blog_posts;
create policy "blog_posts_delete_own" on blog_posts for delete
  using (author_id = auth.uid() or is_admin());

-- ---------- tags ----------
create table if not exists blog_tags (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null,
  created_at timestamptz not null default now()
);
alter table blog_tags enable row level security;
drop policy if exists "blog_tags_read" on blog_tags;
create policy "blog_tags_read" on blog_tags for select using (true);
drop policy if exists "blog_tags_write" on blog_tags;
create policy "blog_tags_write" on blog_tags for insert to authenticated with check (true);
drop policy if exists "blog_tags_admin" on blog_tags;
create policy "blog_tags_admin" on blog_tags for all using (is_admin()) with check (is_admin());

create table if not exists blog_post_tags (
  post_id uuid not null references blog_posts(id) on delete cascade,
  tag_id uuid not null references blog_tags(id) on delete cascade,
  primary key (post_id, tag_id)
);
create index if not exists idx_blog_post_tags_tag on blog_post_tags (tag_id);
alter table blog_post_tags enable row level security;
drop policy if exists "blog_post_tags_read" on blog_post_tags;
create policy "blog_post_tags_read" on blog_post_tags for select using (true);
drop policy if exists "blog_post_tags_write" on blog_post_tags;
create policy "blog_post_tags_write" on blog_post_tags for all
  using (exists (select 1 from blog_posts p where p.id = post_id and (p.author_id = auth.uid() or is_admin())))
  with check (exists (select 1 from blog_posts p where p.id = post_id and (p.author_id = auth.uid() or is_admin())));

-- ---------- claps (1..50 per user per post) ----------
create table if not exists blog_claps (
  post_id uuid not null references blog_posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  count int not null default 1 check (count between 1 and 50),
  updated_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index if not exists idx_blog_claps_post on blog_claps (post_id);
alter table blog_claps enable row level security;
drop policy if exists "blog_claps_read" on blog_claps;
create policy "blog_claps_read" on blog_claps for select using (true);
drop policy if exists "blog_claps_own" on blog_claps;
create policy "blog_claps_own" on blog_claps for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- responses (threaded comments) ----------
create table if not exists blog_responses (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references blog_posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  parent_id uuid references blog_responses(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_blog_responses_post on blog_responses (post_id, created_at);
drop trigger if exists trg_blog_responses_updated on blog_responses;
create trigger trg_blog_responses_updated before update on blog_responses
  for each row execute function set_updated_at();
alter table blog_responses enable row level security;
drop policy if exists "blog_responses_read" on blog_responses;
create policy "blog_responses_read" on blog_responses for select using (true);
drop policy if exists "blog_responses_insert" on blog_responses;
create policy "blog_responses_insert" on blog_responses for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists "blog_responses_modify" on blog_responses;
create policy "blog_responses_modify" on blog_responses for update
  using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid() or is_admin());
drop policy if exists "blog_responses_delete" on blog_responses;
create policy "blog_responses_delete" on blog_responses for delete
  using (user_id = auth.uid() or is_admin());

-- ---------- bookmarks (reading list) ----------
create table if not exists blog_bookmarks (
  post_id uuid not null references blog_posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table blog_bookmarks enable row level security;
drop policy if exists "blog_bookmarks_own" on blog_bookmarks;
create policy "blog_bookmarks_own" on blog_bookmarks for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- follows (reader → author) ----------
create table if not exists blog_follows (
  follower_id uuid not null references profiles(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, author_id),
  check (follower_id <> author_id)
);
create index if not exists idx_blog_follows_author on blog_follows (author_id);
alter table blog_follows enable row level security;
drop policy if exists "blog_follows_read" on blog_follows;
create policy "blog_follows_read" on blog_follows for select using (true);
drop policy if exists "blog_follows_own" on blog_follows;
create policy "blog_follows_own" on blog_follows for all to authenticated
  using (follower_id = auth.uid()) with check (follower_id = auth.uid());

-- ---------- notifications ----------
create table if not exists blog_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,   -- recipient
  actor_id uuid references profiles(id) on delete set null,          -- who caused it
  type text not null check (type in ('clap','response','follow','mention')),
  post_id uuid references blog_posts(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_blog_notifications_user on blog_notifications (user_id, read, created_at desc);
alter table blog_notifications enable row level security;
drop policy if exists "blog_notifications_own" on blog_notifications;
create policy "blog_notifications_own" on blog_notifications for select using (user_id = auth.uid());
drop policy if exists "blog_notifications_update" on blog_notifications;
create policy "blog_notifications_update" on blog_notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
-- inserts come from a security-definer trigger below (any authenticated action
-- can create a notification for another user), so no broad insert policy.

-- ---------- view counter (anon-safe, no update grant needed) ----------
create or replace function increment_blog_view(p_slug text)
returns void language sql security definer set search_path = public as $$
  update blog_posts set view_count = view_count + 1
    where slug = p_slug and status = 'published';
$$;

-- ---------- fan-out notifications on clap / response / follow ----------
create or replace function blog_notify() returns trigger
language plpgsql security definer set search_path = public as $$
declare recipient uuid; kind text; pid uuid; actor uuid;
begin
  if tg_table_name = 'blog_claps' then
    select author_id into recipient from blog_posts where id = new.post_id;
    kind := 'clap'; pid := new.post_id; actor := new.user_id;
  elsif tg_table_name = 'blog_responses' then
    select author_id into recipient from blog_posts where id = new.post_id;
    kind := 'response'; pid := new.post_id; actor := new.user_id;
  elsif tg_table_name = 'blog_follows' then
    recipient := new.author_id; kind := 'follow'; pid := null; actor := new.follower_id;
  end if;
  if recipient is not null and recipient <> actor then
    insert into blog_notifications (user_id, actor_id, type, post_id)
      values (recipient, actor, kind, pid);
  end if;
  return new;
end $$;

drop trigger if exists trg_blog_notify_clap on blog_claps;
create trigger trg_blog_notify_clap after insert on blog_claps
  for each row execute function blog_notify();
drop trigger if exists trg_blog_notify_response on blog_responses;
create trigger trg_blog_notify_response after insert on blog_responses
  for each row execute function blog_notify();
drop trigger if exists trg_blog_notify_follow on blog_follows;
create trigger trg_blog_notify_follow after insert on blog_follows
  for each row execute function blog_notify();
