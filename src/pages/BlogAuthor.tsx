import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Clock, Hand, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import {
  getAuthorProfile, listFeed, followerCount, isFollowing, toggleFollow, getUserId,
  type AuthorProfile, type FeedPost,
} from "@/lib/blog-api";
import { toast } from "sonner";

const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "";

const BlogAuthor = () => {
  const { id = "" } = useParams();
  const [author, setAuthor] = useState<AuthorProfile | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(false);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [a, p, f, u] = await Promise.all([getAuthorProfile(id), listFeed({ authorId: id, limit: 50 }), followerCount(id), getUserId()]);
      if (cancelled) return;
      setAuthor(a); setPosts(p); setFollowers(f); setUid(u);
      if (u) setFollowing(await isFollowing(id));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  const onFollow = async () => {
    if (!uid) { toast.error("Sign in to follow.", { action: { label: "Sign in", onClick: () => (window.location.href = "/certifiedyatris") } }); return; }
    const now = await toggleFollow(id);
    setFollowing(now); setFollowers((n) => n + (now ? 1 : -1));
  };

  if (loading) return <div className="min-h-screen bg-background"><Navbar /><div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div></div>;

  if (!author) return (
    <div className="min-h-screen bg-background text-foreground"><Navbar />
      <main className="container mx-auto max-w-2xl px-4 py-32 text-center"><h1 className="font-display text-2xl font-bold">Author not found</h1>
        <Button asChild className="mt-6 rounded-full"><Link to="/blog">Back to the blog</Link></Button></main><Footer />
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title={`${author.full_name} | Yatri Blog`} description={author.bio || `Stories by ${author.full_name} on Yatri Cloud.`} url={`/blog/author/${id}`} />
      <div className="noise-overlay" />
      <Navbar />
      <main className="container mx-auto max-w-3xl px-4 pb-20 pt-28 md:px-6">
        <div className="flex flex-col items-start gap-5 border-b border-border pb-8 sm:flex-row sm:items-center">
          <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-2xl font-bold text-primary">
            {author.photo_url ? <img src={author.photo_url} alt="" className="h-full w-full object-cover" /> : author.full_name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">{author.full_name}</h1>
            {author.bio && <p className="mt-1 text-muted-foreground">{author.bio}</p>}
            <p className="mt-1 text-sm text-muted-foreground">{followers} follower{followers === 1 ? "" : "s"} · {posts.length} stor{posts.length === 1 ? "y" : "ies"}</p>
          </div>
          {uid !== id && <Button onClick={onFollow} variant={following ? "outline" : "default"} className="rounded-full">{following ? "Following" : "Follow"}</Button>}
        </div>

        <div className="mt-2">
          {posts.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">No published stories yet.</p>
          ) : posts.map((post) => (
            <article key={post.id} className="group flex gap-4 border-b border-border py-6">
              <div className="min-w-0 flex-1">
                <Link to={`/blog/${post.slug}`}>
                  <h3 className="font-display text-lg font-bold tracking-tight group-hover:text-primary">{post.title}</h3>
                  {post.subtitle && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.subtitle}</p>}
                </Link>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>{fmt(post.published_at)}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {post.reading_minutes} min</span>
                  <span className="inline-flex items-center gap-1"><Hand className="h-3.5 w-3.5" /> {post.clap_total}</span>
                </div>
              </div>
              {post.cover_image_url && <Link to={`/blog/${post.slug}`}><img src={post.cover_image_url} alt="" loading="lazy" className="h-24 w-32 shrink-0 rounded-xl object-cover" /></Link>}
            </article>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BlogAuthor;
