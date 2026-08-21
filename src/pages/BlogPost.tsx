import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Loader2, Trash, MoreHorizontal } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  getPostBySlug, incrementView, getUserId, getMyClap, setClap, isBookmarked, toggleBookmark,
  isFollowing, toggleFollow, followerCount, listResponses, addResponse, deleteResponse, authorIsCertified,
  type FeedPost, type BlogResponse,
} from "@/lib/blog-api";

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : "";

const Avatar = ({ name, photo, big }: { name: string; photo: string | null; big?: boolean }) => (
  <span className={`flex ${big ? "h-12 w-12" : "h-9 w-9"} shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 font-bold text-primary`}>
    {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : (name || "Y").slice(0, 1).toUpperCase()}
  </span>
);

const BlogPost = () => {
  const { slug = "" } = useParams();
  const [post, setPost] = useState<FeedPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);

  const [myClap, setMyClap] = useState(0);
  const [totalClaps, setTotalClaps] = useState(0);
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [certified, setCertified] = useState(false);
  const [responses, setResponses] = useState<BlogResponse[]>([]);
  const [reply, setReply] = useState("");
  const [posting, setPosting] = useState(false);
  const clapTimer = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const p = await getPostBySlug(slug);
      if (cancelled) return;
      setPost(p);
      setLoading(false);
      if (!p) return;
      setTotalClaps(p.clap_total);
      incrementView(slug);
      authorIsCertified(p.author_id).then((c) => !cancelled && setCertified(c));
      const id = await getUserId();
      if (cancelled) return;
      setUid(id);
      setFollowers(await followerCount(p.author_id));
      listResponses(p.id).then((r) => !cancelled && setResponses(r));
      if (id) {
        setMyClap(await getMyClap(p.id));
        setSaved(await isBookmarked(p.id));
        setFollowing(await isFollowing(p.author_id));
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  const requireAuth = () => {
    if (!uid) { toast.error("Sign in to interact.", { action: { label: "Sign in", onClick: () => (window.location.href = "/certifiedyatris") } }); return false; }
    return true;
  };

  const clap = () => {
    if (!requireAuth() || !post) return;
    if (myClap >= 50) { toast.info("Max 50 claps"); return; }
    const next = myClap + 1;
    setMyClap(next); setTotalClaps((t) => t + 1);
    if (clapTimer.current) window.clearTimeout(clapTimer.current);
    clapTimer.current = window.setTimeout(() => setClap(post.id, next), 500);
  };

  const onBookmark = async () => {
    if (!requireAuth() || !post) return;
    const now = await toggleBookmark(post.id);
    setSaved(now); toast.success(now ? "Saved to your reading list" : "Removed");
  };

  const onFollow = async () => {
    if (!requireAuth() || !post) return;
    const now = await toggleFollow(post.author_id);
    setFollowing(now); setFollowers((n) => n + (now ? 1 : -1));
  };

  const submitReply = async () => {
    if (!requireAuth() || !post || !reply.trim()) return;
    setPosting(true);
    const ok = await addResponse(post.id, reply);
    setPosting(false);
    if (ok) { setReply(""); setResponses(await listResponses(post.id)); toast.success("Response posted"); }
    else toast.error("Could not post");
  };

  const removeResponse = async (id: string) => {
    if (!post) return;
    if (await deleteResponse(id)) setResponses((r) => r.filter((x) => x.id !== id));
  };

  const jsonLd = useMemo(() => post ? {
    "@context": "https://schema.org", "@type": "BlogPosting",
    headline: post.title, description: post.subtitle || post.excerpt || undefined,
    image: post.cover_image_url || undefined, datePublished: post.published_at || undefined,
    author: { "@type": "Person", name: post.author_name },
  } : undefined, [post]);

  if (loading) return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="flex min-h-[60vh] items-center justify-center gap-3 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading…</div>
    </div>
  );

  if (!post) return (
    <div className="min-h-screen bg-background text-foreground"><Navbar />
      <main className="container mx-auto max-w-2xl px-4 py-32 text-center">
        <h1 className="font-display text-2xl font-bold">Story not found</h1>
        <p className="mt-2 text-muted-foreground">It may have been unpublished or the link is wrong.</p>
        <Button asChild className="mt-6 rounded-full"><Link to="/blog">Back to the blog</Link></Button>
      </main><Footer />
    </div>
  );

  const topLevel = responses.filter((r) => !r.parent_id);
  const repliesOf = (id: string) => responses.filter((r) => r.parent_id === id);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title={`${post.title} | Yatri Blog`} description={post.subtitle || post.excerpt || undefined} image={post.cover_image_url || undefined} type="article" url={`/blog/${post.slug}`} jsonLd={jsonLd} />
      <div className="noise-overlay" />
      <Navbar />
      <main className="container mx-auto max-w-2xl px-4 pb-24 pt-28 md:px-6">
        <h1 className="font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl">{post.title}</h1>
        {post.subtitle && <p className="mt-3 text-lg text-muted-foreground md:text-xl">{post.subtitle}</p>}

        {/* Author + meta */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-border py-4">
          <div className="flex items-center gap-3">
            <Avatar name={post.author_name} photo={post.author_photo} />
            <div className="text-sm">
              <span className="flex items-center gap-1.5">
                <Link to={`/blog/author/${post.author_id}`} className="font-semibold text-foreground hover:text-primary">{post.author_name}</Link>
                {certified && <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary" title="Holds a verified certification">Certified Yatri</span>}
              </span>
              <div className="flex items-center gap-2 text-muted-foreground text-xs mt-0.5">
                <span>{fmtDate(post.published_at)}</span>
                <span aria-hidden>·</span>
                <span>{post.reading_minutes} min read</span>
              </div>
            </div>
          </div>
          {uid !== post.author_id && (
            <Button size="sm" variant={following ? "outline" : "default"} onClick={onFollow} className="rounded-full">{following ? "Following" : "Follow"}</Button>
          )}
        </div>

        {post.cert_value && post.cert_label && (
          <Link to={`/blog?cert=${post.cert_value}`} className="mt-6 flex items-center gap-3 rounded-2xl border border-brand-100 bg-primary/[0.06] p-4 transition-colors hover:bg-primary/[0.1]">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Exam prep</p>
              <p className="truncate font-semibold text-foreground">{post.cert_label}</p>
            </div>
            <span className="shrink-0 text-sm font-medium text-primary">All prep stories →</span>
          </Link>
        )}

        {post.cover_image_url && <img src={post.cover_image_url} alt="" className="mt-8 w-full rounded-2xl object-cover" />}

        {/* Body */}
        <article className="prose prose-slate mt-8 max-w-none dark:prose-invert prose-headings:font-display prose-headings:tracking-tight prose-a:text-primary prose-img:rounded-xl">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </article>

        {/* Tags */}
        {post.tag_labels?.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {post.tag_labels.map((label, i) => (
              <Link key={label} to={`/blog?tag=${post.tag_slugs[i]}`} className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground hover:text-foreground">{label}</Link>
            ))}
          </div>
        )}

        {/* Engagement bar */}
        <div className="sticky bottom-4 z-10 mx-auto mt-10 flex w-fit items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-1.5 shadow-card backdrop-blur text-sm font-semibold">
          <button onClick={clap} className="hover:text-primary transition-colors px-2 py-1">
            Claps ({totalClaps})
          </button>
          <span>·</span>
          <a href="#responses" className="hover:text-primary transition-colors px-2 py-1">
            Responses ({responses.length})
          </a>
          <span>·</span>
          <button onClick={onBookmark} className="hover:text-primary transition-colors px-2 py-1">
            {saved ? "Saved" : "Save"}
          </button>
        </div>

        {/* Author card */}
        <div className="mt-12 flex items-start gap-4 rounded-2xl border border-border bg-card p-6">
          <Avatar name={post.author_name} photo={post.author_photo} big />
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Written by</p>
            <Link to={`/blog/author/${post.author_id}`} className="font-display text-lg font-bold hover:text-primary">{post.author_name}</Link>
            <p className="text-xs text-muted-foreground mt-0.5">{followers} follower{followers === 1 ? "" : "s"}</p>
          </div>
          {uid !== post.author_id && <Button size="sm" variant={following ? "outline" : "default"} onClick={onFollow} className="rounded-full">{following ? "Following" : "Follow"}</Button>}
        </div>

        {/* Responses */}
        <section id="responses" className="mt-12 scroll-mt-24">
          <h2 className="font-display text-xl font-bold">Responses ({responses.length})</h2>
          <div className="mt-4">
            {uid ? (
              <div className="flex flex-col gap-2">
                <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="What are your thoughts?" className="min-h-[90px] rounded-xl" />
                <div className="flex justify-end"><Button size="sm" onClick={submitReply} disabled={posting || !reply.trim()} className="rounded-full">{posting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Respond</Button></div>
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                <Link to="/certifiedyatris" className="font-semibold text-primary">Sign in</Link> to join the conversation.
              </p>
            )}
          </div>
          <div className="mt-6 space-y-6">
            {topLevel.map((r) => (
              <div key={r.id}>
                <ResponseItem r={r} uid={uid} onDelete={removeResponse} />
                {repliesOf(r.id).length > 0 && (
                  <div className="ml-6 mt-4 space-y-4 border-l border-border pl-4">
                    {repliesOf(r.id).map((rr) => <ResponseItem key={rr.id} r={rr} uid={uid} onDelete={removeResponse} />)}
                  </div>
                )}
              </div>
            ))}
            {responses.length === 0 && <p className="text-sm text-muted-foreground">No responses yet. Start the conversation.</p>}
          </div>
        </section>

        <div className="mt-12 text-center"><Button asChild variant="outline" className="rounded-full"><Link to="/blog">More stories</Link></Button></div>
      </main>
      <Footer />
    </div>
  );
};

const ResponseItem = ({ r, uid, onDelete }: { r: BlogResponse; uid: string | null; onDelete: (id: string) => void }) => (
  <div className="flex gap-3">
    <Avatar name={r.author_name} photo={r.author_photo} />
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold text-foreground">{r.author_name}</span>
        <span className="text-muted-foreground text-xs">{new Date(r.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
        {uid === r.user_id && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="ml-auto h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDelete(r.id)} className="text-destructive focus:bg-destructive focus:text-destructive-foreground">
                
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{r.body}</p>
    </div>
  </div>
);

export default BlogPost;
