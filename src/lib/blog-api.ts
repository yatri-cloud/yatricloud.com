import { supabase } from "@/lib/supabase";

/**
 * Blog data layer — Medium-style publishing on Supabase (Auth + RLS).
 * Public reads go through the `blog_feed` view (published only, aggregated
 * claps/responses, public author fields). Authoring goes through `blog_posts`
 * where RLS scopes rows to the signed-in author. Monetization (`access`) is a
 * stub for a future paywall.
 */

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type PostStatus = "draft" | "published" | "scheduled";

export interface FeedPost {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  cover_image_url: string | null;
  content: string;
  excerpt: string | null;
  reading_minutes: number;
  featured: boolean;
  view_count: number;
  access: "free" | "member";
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author_id: string;
  author_name: string;
  author_photo: string | null;
  author_role: string;
  cert_value: string | null;
  cert_provider: string | null;
  cert_label: string | null;
  cert_code: string | null;
  clap_total: number;
  response_count: number;
  tag_labels: string[];
  tag_slugs: string[];
}

export interface MyPost {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  cover_image_url: string | null;
  content: string;
  excerpt: string | null;
  status: PostStatus;
  access: "free" | "member";
  reading_minutes: number;
  featured: boolean;
  view_count: number;
  published_at: string | null;
  scheduled_for: string | null;
  updated_at: string;
  cert_value?: string | null;
  cert_provider?: string | null;
  tag_labels?: string[];
}

export interface BlogResponse {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  author_name: string;
  author_photo: string | null;
}

export interface BlogNotification {
  id: string;
  type: "clap" | "response" | "follow" | "mention";
  post_id: string | null;
  actor_id: string | null;
  actor_name: string | null;
  read: boolean;
  created_at: string;
  post_slug: string | null;
  post_title: string | null;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export const slugify = (text: string) =>
  text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);

const shortId = () => Math.random().toString(36).slice(2, 8);

/** Rough reading time from markdown content (200 wpm, min 1). */
export const readingMinutes = (content: string) =>
  Math.max(1, Math.round(content.trim().split(/\s+/).filter(Boolean).length / 200));

/** Plain-text excerpt from markdown (strips syntax, ~200 chars). */
export const makeExcerpt = (content: string, max = 200) => {
  const text = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? text.slice(0, max).replace(/\s+\S*$/, "") + "…" : text;
};

export const getUserId = async (): Promise<string | null> => {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
};

/* ------------------------------------------------------------------ */
/* Media uploads (Supabase Storage: blog-media bucket)                 */
/* ------------------------------------------------------------------ */

/** Upload an image (cover or inline) to storage, return its public URL. */
export async function uploadBlogMedia(file: File): Promise<string | null> {
  const uid = await getUserId();
  if (!uid) return null;
  if (!file.type.startsWith("image/")) { console.error("uploadBlogMedia: not an image"); return null; }
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("blog-media").upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) { console.error("uploadBlogMedia", error); return null; }
  return supabase.storage.from("blog-media").getPublicUrl(path).data.publicUrl;
}

/** Give a post a clean slug from its title (used on first publish). */
export async function setSlugFromTitle(id: string, title: string): Promise<string> {
  const slug = `${slugify(title) || "post"}-${shortId()}`;
  await supabase.from("blog_posts").update({ slug }).eq("id", id);
  return slug;
}

/* ------------------------------------------------------------------ */
/* Writer profile (edit your own byline)                               */
/* ------------------------------------------------------------------ */

export interface WriterProfile { id: string; full_name: string; bio: string | null; photo_url: string | null; }

export async function getMyWriterProfile(): Promise<WriterProfile | null> {
  const uid = await getUserId();
  if (!uid) return null;
  const { data } = await supabase.from("profiles").select("id,full_name,bio,photo_url").eq("id", uid).maybeSingle();
  return (data as WriterProfile) ?? null;
}

export async function updateMyWriterProfile(patch: { full_name?: string; bio?: string; photo_url?: string }): Promise<boolean> {
  const uid = await getUserId();
  if (!uid) return false;
  const { error } = await supabase.from("profiles").update(patch).eq("id", uid);
  if (error) { console.error("updateMyWriterProfile", error); return false; }
  return true;
}

/* ------------------------------------------------------------------ */
/* Public feed (blog_feed view)                                        */
/* ------------------------------------------------------------------ */

const FEED_COLS =
  "id,slug,title,subtitle,cover_image_url,excerpt,reading_minutes,featured,view_count,access,published_at,created_at,author_id,author_name,author_photo,author_role,cert_value,cert_provider,cert_label,cert_code,clap_total,response_count,tag_labels,tag_slugs";

export interface FeedQuery {
  tag?: string;
  authorId?: string;
  featured?: boolean;
  cert?: string;
  search?: string;
  sort?: "new" | "top";
  limit?: number;
  offset?: number;
}

export async function listFeed(q: FeedQuery = {}): Promise<FeedPost[]> {
  let query = supabase.from("blog_feed").select(FEED_COLS);
  if (q.tag) query = query.contains("tag_slugs", [q.tag]);
  if (q.authorId) query = query.eq("author_id", q.authorId);
  if (q.cert) query = query.eq("cert_value", q.cert);
  if (q.featured) query = query.eq("featured", true);
  if (q.search) query = query.or(`title.ilike.%${q.search}%,subtitle.ilike.%${q.search}%,excerpt.ilike.%${q.search}%`);
  query = q.sort === "top"
    ? query.order("clap_total", { ascending: false }).order("published_at", { ascending: false })
    : query.order("published_at", { ascending: false });
  const { data, error } = await query.range(q.offset ?? 0, (q.offset ?? 0) + (q.limit ?? 20) - 1);
  if (error) { console.error("listFeed", error); return []; }
  return (data ?? []) as FeedPost[];
}

export async function getPostBySlug(slug: string): Promise<FeedPost | null> {
  const { data, error } = await supabase.from("blog_feed").select("*").eq("slug", slug).maybeSingle();
  if (error) { console.error("getPostBySlug", error); return null; }
  return (data as FeedPost) ?? null;
}

export async function incrementView(slug: string) {
  await supabase.rpc("increment_blog_view", { p_slug: slug });
}

/* ------------------------------------------------------------------ */
/* Authoring (blog_posts, RLS-scoped to author)                        */
/* ------------------------------------------------------------------ */

export async function listMyPosts(): Promise<MyPost[]> {
  const uid = await getUserId();
  if (!uid) return [];
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id,slug,title,subtitle,cover_image_url,content,excerpt,status,access,reading_minutes,featured,view_count,published_at,scheduled_for,updated_at")
    .eq("author_id", uid)
    .order("updated_at", { ascending: false });
  if (error) { console.error("listMyPosts", error); return []; }
  return (data ?? []) as MyPost[];
}

export async function getMyPost(id: string): Promise<MyPost | null> {
  const { data, error } = await supabase.from("blog_posts").select("*").eq("id", id).maybeSingle();
  if (error) { console.error("getMyPost", error); return null; }
  return (data as MyPost) ?? null;
}

export interface PostInput {
  title: string;
  subtitle?: string;
  content?: string;
  cover_image_url?: string;
  access?: "free" | "member";
  cert_value?: string | null;
  cert_provider?: string | null;
}

export async function createPost(input: PostInput): Promise<{ id: string; slug: string } | null> {
  const uid = await getUserId();
  if (!uid) return null;
  const slug = `${slugify(input.title || "untitled") || "post"}-${shortId()}`;
  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      author_id: uid,
      slug,
      title: input.title || "Untitled",
      subtitle: input.subtitle ?? null,
      content: input.content ?? "",
      cover_image_url: input.cover_image_url ?? null,
      access: input.access ?? "free",
      status: "draft",
    })
    .select("id,slug")
    .single();
  if (error) { console.error("createPost", error); return null; }
  return data;
}

export async function updatePost(id: string, patch: Partial<PostInput> & { excerpt?: string }): Promise<boolean> {
  const fields: Record<string, unknown> = { ...patch };
  if (patch.content != null) {
    fields.reading_minutes = readingMinutes(patch.content);
    if (patch.excerpt == null) fields.excerpt = makeExcerpt(patch.content);
  }
  const { error } = await supabase.from("blog_posts").update(fields).eq("id", id);
  if (error) { console.error("updatePost", error); return false; }
  return true;
}

export async function publishPost(id: string, content: string): Promise<boolean> {
  const { error } = await supabase
    .from("blog_posts")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      reading_minutes: readingMinutes(content),
      excerpt: makeExcerpt(content),
    })
    .eq("id", id);
  if (error) { console.error("publishPost", error); return false; }
  return true;
}

export async function unpublishPost(id: string): Promise<boolean> {
  const { error } = await supabase.from("blog_posts").update({ status: "draft" }).eq("id", id);
  return !error;
}

export async function deletePost(id: string): Promise<boolean> {
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  return !error;
}

/* ------------------------------------------------------------------ */
/* Tags                                                                */
/* ------------------------------------------------------------------ */

export async function setPostTags(postId: string, labels: string[]): Promise<void> {
  const clean = [...new Set(labels.map((l) => l.trim()).filter(Boolean))].slice(0, 5);
  await supabase.from("blog_post_tags").delete().eq("post_id", postId);
  if (!clean.length) return;
  const tagIds: string[] = [];
  for (const label of clean) {
    const slug = slugify(label);
    if (!slug) continue;
    const existing = await supabase.from("blog_tags").select("id").eq("slug", slug).maybeSingle();
    if (existing.data?.id) tagIds.push(existing.data.id);
    else {
      const created = await supabase.from("blog_tags").insert({ slug, label }).select("id").single();
      if (created.data?.id) tagIds.push(created.data.id);
    }
  }
  if (tagIds.length) await supabase.from("blog_post_tags").insert(tagIds.map((tag_id) => ({ post_id: postId, tag_id })));
}

export async function popularTags(limit = 12): Promise<{ slug: string; label: string }[]> {
  const { data } = await supabase.from("blog_tags").select("slug,label").order("label").limit(limit);
  return data ?? [];
}

/* ------------------------------------------------------------------ */
/* Certification link (the Yatri differentiator: prep stories per exam) */
/* ------------------------------------------------------------------ */

export interface CertOption { value: string; label: string; provider: string; }

/** Certifications for the writer's "link to a cert" picker (active only). */
export async function listCertOptions(): Promise<CertOption[]> {
  const { data, error } = await supabase
    .from("provider_certifications")
    .select("value,label,provider_slug")
    .eq("active", true)
    .order("provider_slug").order("sort_order");
  if (error) { console.error("listCertOptions", error); return []; }
  return (data ?? []).map((r: any) => ({ value: r.value, label: r.label, provider: r.provider_slug }));
}

/** Does this author hold any public certification? (byline "Certified Yatri" badge) */
export async function authorIsCertified(authorId: string): Promise<boolean> {
  const { data } = await supabase.rpc("author_is_certified", { p_author: authorId });
  return data === true;
}

/* ------------------------------------------------------------------ */
/* Social — claps, responses, bookmarks, follows                       */
/* ------------------------------------------------------------------ */

export async function getMyClap(postId: string): Promise<number> {
  const uid = await getUserId();
  if (!uid) return 0;
  const { data } = await supabase.from("blog_claps").select("count").eq("post_id", postId).eq("user_id", uid).maybeSingle();
  return data?.count ?? 0;
}

export async function setClap(postId: string, count: number): Promise<boolean> {
  const uid = await getUserId();
  if (!uid) return false;
  const clamped = Math.max(1, Math.min(50, count));
  const { error } = await supabase.from("blog_claps").upsert({ post_id: postId, user_id: uid, count: clamped }, { onConflict: "post_id,user_id" });
  if (error) { console.error("setClap", error); return false; }
  return true;
}

export async function listResponses(postId: string): Promise<BlogResponse[]> {
  const { data, error } = await supabase
    .from("blog_responses")
    .select("id,post_id,user_id,parent_id,body,created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) { console.error("listResponses", error); return []; }
  const rows = (data ?? []) as any[];
  const authors = await authorLookup(rows.map((r) => r.user_id));
  return rows.map((r) => ({
    id: r.id, post_id: r.post_id, user_id: r.user_id, parent_id: r.parent_id,
    body: r.body, created_at: r.created_at,
    author_name: authors[r.user_id]?.full_name || "Yatri", author_photo: authors[r.user_id]?.photo_url ?? null,
  }));
}

/** Resolve public author fields for a set of ids via the safe public view. */
async function authorLookup(ids: string[]): Promise<Record<string, { full_name: string; photo_url: string | null }>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return {};
  const { data } = await supabase.from("public_authors").select("id,full_name,photo_url").in("id", unique);
  const map: Record<string, { full_name: string; photo_url: string | null }> = {};
  for (const a of (data ?? []) as any[]) map[a.id] = { full_name: a.full_name, photo_url: a.photo_url };
  return map;
}

export async function addResponse(postId: string, body: string, parentId?: string | null): Promise<boolean> {
  const uid = await getUserId();
  if (!uid || !body.trim()) return false;
  const { error } = await supabase.from("blog_responses").insert({ post_id: postId, user_id: uid, body: body.trim(), parent_id: parentId ?? null });
  if (error) { console.error("addResponse", error); return false; }
  return true;
}

export async function deleteResponse(id: string): Promise<boolean> {
  const { error } = await supabase.from("blog_responses").delete().eq("id", id);
  return !error;
}

export async function isBookmarked(postId: string): Promise<boolean> {
  const uid = await getUserId();
  if (!uid) return false;
  const { data } = await supabase.from("blog_bookmarks").select("post_id").eq("post_id", postId).eq("user_id", uid).maybeSingle();
  return !!data;
}

export async function toggleBookmark(postId: string): Promise<boolean> {
  const uid = await getUserId();
  if (!uid) return false;
  const on = await isBookmarked(postId);
  if (on) { await supabase.from("blog_bookmarks").delete().eq("post_id", postId).eq("user_id", uid); return false; }
  await supabase.from("blog_bookmarks").insert({ post_id: postId, user_id: uid });
  return true;
}

export async function listBookmarks(): Promise<FeedPost[]> {
  const uid = await getUserId();
  if (!uid) return [];
  const { data } = await supabase.from("blog_bookmarks").select("post_id").eq("user_id", uid);
  const ids = (data ?? []).map((b: any) => b.post_id);
  if (!ids.length) return [];
  const { data: posts } = await supabase.from("blog_feed").select(FEED_COLS).in("id", ids);
  return (posts ?? []) as FeedPost[];
}

export async function isFollowing(authorId: string): Promise<boolean> {
  const uid = await getUserId();
  if (!uid) return false;
  const { data } = await supabase.from("blog_follows").select("author_id").eq("follower_id", uid).eq("author_id", authorId).maybeSingle();
  return !!data;
}

export async function toggleFollow(authorId: string): Promise<boolean> {
  const uid = await getUserId();
  if (!uid || uid === authorId) return false;
  const on = await isFollowing(authorId);
  if (on) { await supabase.from("blog_follows").delete().eq("follower_id", uid).eq("author_id", authorId); return false; }
  await supabase.from("blog_follows").insert({ follower_id: uid, author_id: authorId });
  return true;
}

export async function followerCount(authorId: string): Promise<number> {
  const { count } = await supabase.from("blog_follows").select("*", { count: "exact", head: true }).eq("author_id", authorId);
  return count ?? 0;
}

export interface AuthorProfile { id: string; full_name: string; photo_url: string | null; bio?: string | null; role: string; }

export async function getAuthorProfile(authorId: string): Promise<AuthorProfile | null> {
  const { data } = await supabase.from("public_authors").select("id,full_name,photo_url,bio,role").eq("id", authorId).maybeSingle();
  return (data as AuthorProfile) ?? null;
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

export async function listNotifications(): Promise<BlogNotification[]> {
  const { data, error } = await supabase
    .from("blog_notifications")
    .select("id,type,post_id,actor_id,read,created_at,post:blog_posts(slug,title)")
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) { console.error("listNotifications", error); return []; }
  const rows = (data ?? []) as any[];
  const authors = await authorLookup(rows.map((n) => n.actor_id));
  return rows.map((n) => ({
    id: n.id, type: n.type, post_id: n.post_id, actor_id: n.actor_id, read: n.read, created_at: n.created_at,
    actor_name: authors[n.actor_id]?.full_name ?? null, post_slug: n.post?.slug ?? null, post_title: n.post?.title ?? null,
  }));
}

export async function unreadCount(): Promise<number> {
  const { count } = await supabase.from("blog_notifications").select("*", { count: "exact", head: true }).eq("read", false);
  return count ?? 0;
}

export async function markAllNotificationsRead(): Promise<void> {
  const uid = await getUserId();
  if (!uid) return;
  await supabase.from("blog_notifications").update({ read: true }).eq("user_id", uid).eq("read", false);
}
