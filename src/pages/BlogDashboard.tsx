import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PenLine, Eye, Clock, Loader2, FileText, Globe, Pencil, Trash2, Bell, User } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getUserId, listMyPosts, deletePost, unreadCount, type MyPost } from "@/lib/blog-api";

const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "";

const BlogDashboard = () => {
  const [ready, setReady] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [tab, setTab] = useState<"published" | "draft">("published");
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    (async () => {
      const id = await getUserId();
      setUid(id);
      if (id) { setPosts(await listMyPosts()); setUnread(await unreadCount()); }
      setReady(true);
    })();
  }, []);

  const remove = async (id: string) => {
    if (!confirm("Delete this story? This cannot be undone.")) return;
    if (await deletePost(id)) { setPosts((p) => p.filter((x) => x.id !== id)); toast.success("Deleted"); }
  };

  const published = posts.filter((p) => p.status === "published");
  const drafts = posts.filter((p) => p.status !== "published");
  const shown = tab === "published" ? published : drafts;
  const totalViews = published.reduce((s, p) => s + (p.view_count || 0), 0);

  if (!ready) return <div className="min-h-screen bg-background"><Navbar /><div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div></div>;

  if (!uid) return (
    <div className="min-h-screen bg-background text-foreground"><Navbar />
      <main className="container mx-auto max-w-lg px-4 py-32 text-center">
        <PenLine className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-4 font-display text-2xl font-bold">Sign in to see your stories</h1>
        <Button asChild className="mt-6 rounded-full"><Link to="/certifiedyatris">Sign in</Link></Button>
      </main><Footer />
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="Your stories | Yatri Blog" noindex />
      <Navbar />
      <main className="container mx-auto max-w-3xl px-4 pb-20 pt-28 md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">Your stories</h1>
            <p className="mt-1 text-muted-foreground">{published.length} published · {drafts.length} draft{drafts.length === 1 ? "" : "s"} · {totalViews} total views</p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="rounded-full"><Link to="/blog/notifications">
              <Bell className="mr-1.5 h-4 w-4" /> Activity {unread > 0 && <span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{unread}</span>}
            </Link></Button>
            <Button asChild variant="outline" className="rounded-full"><Link to="/blog/settings"><User className="mr-1.5 h-4 w-4" /> Profile</Link></Button>
            <Button asChild className="rounded-full shadow-inset-btn"><Link to="/blog/write"><PenLine className="mr-1.5 h-4 w-4" /> New story</Link></Button>
          </div>
        </div>

        <div className="mt-6 flex gap-2 border-b border-border">
          {(["published", "draft"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold capitalize ${tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t === "published" ? <Globe className="mr-1.5 inline h-4 w-4" /> : <FileText className="mr-1.5 inline h-4 w-4" />}
              {t === "published" ? "Published" : "Drafts"} ({t === "published" ? published.length : drafts.length})
            </button>
          ))}
        </div>

        <div className="mt-2">
          {shown.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
              {tab === "published" ? "No published stories yet." : "No drafts."}
              <div className="mt-4"><Button asChild variant="outline" className="rounded-full"><Link to="/blog/write"><PenLine className="mr-1.5 h-4 w-4" /> Start writing</Link></Button></div>
            </div>
          ) : shown.map((p) => (
            <div key={p.id} className="flex items-center gap-3 border-b border-border py-4">
              <div className="min-w-0 flex-1">
                {p.status === "published" ? (
                  <Link to={`/blog/${p.slug}`} className="font-semibold text-foreground hover:text-primary">{p.title}</Link>
                ) : (
                  <Link to={`/blog/edit/${p.id}`} className="font-semibold text-foreground hover:text-primary">{p.title || "Untitled"}</Link>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>{p.status === "published" ? `Published ${fmt(p.published_at)}` : `Edited ${fmt(p.updated_at)}`}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {p.reading_minutes} min</span>
                  {p.status === "published" && <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {p.view_count}</span>}
                  {p.featured && <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">Featured</span>}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button asChild size="icon" variant="ghost" className="h-9 w-9 rounded-lg text-muted-foreground hover:text-primary" aria-label="Edit"><Link to={`/blog/edit/${p.id}`}><Pencil className="h-4 w-4" /></Link></Button>
                <Button size="icon" variant="ghost" onClick={() => remove(p.id)} className="h-9 w-9 rounded-lg text-muted-foreground hover:text-destructive" aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BlogDashboard;
