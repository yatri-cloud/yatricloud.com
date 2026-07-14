import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PenLine, Search, Clock, Hand, MessageSquare, Sparkles, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ScrollReveal from "@/components/ScrollReveal";
import { listFeed, popularTags, type FeedPost } from "@/lib/blog-api";

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "";

const Avatar = ({ name, photo }: { name: string; photo: string | null }) => (
  <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-xs font-bold text-primary">
    {photo ? <img src={photo} alt="" className="h-full w-full object-cover" loading="lazy" /> : (name || "Y").slice(0, 1).toUpperCase()}
  </span>
);

const Byline = ({ post }: { post: FeedPost }) => (
  <div className="flex items-center gap-2 text-sm text-muted-foreground">
    <Avatar name={post.author_name} photo={post.author_photo} />
    <Link to={`/blog/author/${post.author_id}`} className="font-medium text-foreground hover:text-primary">{post.author_name}</Link>
    <span aria-hidden>·</span>
    <span>{fmtDate(post.published_at)}</span>
  </div>
);

const Meta = ({ post }: { post: FeedPost }) => (
  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
    <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {post.reading_minutes} min read</span>
    <span className="inline-flex items-center gap-1"><Hand className="h-3.5 w-3.5" /> {post.clap_total}</span>
    <span className="inline-flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {post.response_count}</span>
  </div>
);

const PostCard = ({ post }: { post: FeedPost }) => (
  <article className="group flex flex-col gap-4 border-b border-border py-6 md:flex-row md:items-start md:gap-6">
    <div className="min-w-0 flex-1">
      <Byline post={post} />
      <Link to={`/blog/${post.slug}`} className="mt-2 block">
        <h3 className="font-display text-lg font-bold tracking-tight text-foreground group-hover:text-primary md:text-xl">{post.title}</h3>
        {post.subtitle && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.subtitle}</p>}
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <Meta post={post} />
        {post.tag_labels?.[0] && (
          <Link to={`/blog?tag=${post.tag_slugs[0]}`} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground">
            {post.tag_labels[0]}
          </Link>
        )}
      </div>
    </div>
    {post.cover_image_url && (
      <Link to={`/blog/${post.slug}`} className="block shrink-0 md:order-last">
        <img src={post.cover_image_url} alt="" loading="lazy" className="h-40 w-full rounded-xl object-cover md:h-28 md:w-44" />
      </Link>
    )}
  </article>
);

const Blog = () => {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState<string | null>(new URLSearchParams(window.location.search).get("tag"));
  const [sort, setSort] = useState<"new" | "top">("new");
  const [tags, setTags] = useState<{ slug: string; label: string }[]>([]);

  useEffect(() => { popularTags().then(setTags); }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const q = search.trim();
    const t = setTimeout(() => {
      listFeed({ tag: tag || undefined, search: q || undefined, sort, limit: 40 }).then((rows) => {
        if (!cancelled) { setPosts(rows); setLoading(false); }
      });
    }, q ? 300 : 0);
    return () => { cancelled = true; clearTimeout(t); };
  }, [search, tag, sort]);

  const featured = useMemo(() => posts.find((p) => p.featured) ?? null, [posts]);
  const rest = useMemo(() => posts.filter((p) => p.id !== featured?.id), [posts, featured]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="Yatri Blog — Stories & ideas for cloud learners" description="Guides, career stories, and deep dives on AWS, Azure, GCP, DevOps and Kubernetes — written by the Yatri community." url="/blog" />
      <div className="noise-overlay" />
      <Navbar />
      <main className="container mx-auto max-w-4xl px-4 pb-20 pt-28 md:px-6">
        <ScrollReveal>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-1 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Yatri Blog</p>
              <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Stories &amp; ideas</h1>
              <p className="mt-2 max-w-xl text-muted-foreground">Career journeys, exam playbooks, and deep dives — written by Yatris, for Yatris.</p>
            </div>
            <Button asChild className="shadow-inset-btn"><Link to="/blog/write"><PenLine className="mr-2 h-4 w-4" /> Write a story</Link></Button>
          </div>
        </ScrollReveal>

        {/* Toolbar */}
        <div className="mt-8 flex flex-col gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search stories…" aria-label="Search stories" className="h-11 rounded-full pl-10" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setTag(null)} className={`rounded-full border px-3 py-1 text-xs font-semibold ${!tag ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>All</button>
            {tags.map((t) => (
              <button key={t.slug} onClick={() => setTag(t.slug)} className={`rounded-full border px-3 py-1 text-xs font-semibold ${tag === t.slug ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>{t.label}</button>
            ))}
            <span className="ml-auto flex rounded-full border border-border p-0.5 text-xs font-semibold">
              <button onClick={() => setSort("new")} className={`rounded-full px-3 py-1 ${sort === "new" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Latest</button>
              <button onClick={() => setSort("top")} className={`rounded-full px-3 py-1 ${sort === "top" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Top</button>
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[240px] items-center justify-center gap-3 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading stories…</div>
        ) : posts.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground">{search || tag ? "No stories match that yet." : "No stories published yet — be the first to write one."}</p>
            <Button asChild variant="outline" className="mt-4 rounded-full"><Link to="/blog/write"><PenLine className="mr-2 h-4 w-4" /> Write the first story</Link></Button>
          </div>
        ) : (
          <div className="mt-4">
            {featured && !search && !tag && (
              <ScrollReveal>
                <Link to={`/blog/${featured.slug}`} className="group mt-4 block overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.06] to-card">
                  {featured.cover_image_url && <img src={featured.cover_image_url} alt="" className="h-56 w-full object-cover md:h-72" loading="lazy" />}
                  <div className="p-6 md:p-8">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary"><Sparkles className="h-3.5 w-3.5" /> Featured</span>
                    <h2 className="mt-2 font-display text-2xl font-bold tracking-tight group-hover:text-primary md:text-3xl">{featured.title}</h2>
                    {featured.subtitle && <p className="mt-2 line-clamp-2 text-muted-foreground">{featured.subtitle}</p>}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><Byline post={featured} /><Meta post={featured} /></div>
                  </div>
                </Link>
              </ScrollReveal>
            )}
            <div>{rest.map((p) => <PostCard key={p.id} post={p} />)}</div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
