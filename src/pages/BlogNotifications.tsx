import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Hand, MessageSquare, UserPlus, Bell, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { getUserId, listNotifications, markAllNotificationsRead, type BlogNotification } from "@/lib/blog-api";

const ago = (d: string) => {
  const m = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
};

const ICON = { clap: Hand, response: MessageSquare, follow: UserPlus, mention: Bell };
const verb = (n: BlogNotification) =>
  n.type === "clap" ? "clapped for" : n.type === "response" ? "responded to" : n.type === "follow" ? "started following you" : "mentioned you in";

const BlogNotifications = () => {
  const [ready, setReady] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [items, setItems] = useState<BlogNotification[]>([]);

  useEffect(() => {
    (async () => {
      const id = await getUserId();
      setUid(id);
      if (id) { setItems(await listNotifications()); await markAllNotificationsRead(); }
      setReady(true);
    })();
  }, []);

  if (!ready) return <div className="min-h-screen bg-background"><Navbar /><div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div></div>;

  if (!uid) return (
    <div className="min-h-screen bg-background text-foreground"><Navbar />
      <main className="container mx-auto max-w-lg px-4 py-32 text-center"><Bell className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-4 font-display text-2xl font-bold">Sign in to see your activity</h1>
        <Button asChild className="mt-6 rounded-full"><Link to="/certifiedyatris">Sign in</Link></Button></main><Footer />
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="Activity | Yatri Blog" noindex />
      <Navbar />
      <main className="container mx-auto max-w-2xl px-4 pb-20 pt-28 md:px-6">
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">Activity</h1>
        <div className="mt-6 divide-y divide-border">
          {items.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">No activity yet. Publish a story and watch the claps roll in.</p>
          ) : items.map((n) => {
            const Icon = ICON[n.type];
            return (
              <div key={n.id} className={`flex items-start gap-3 py-4 ${!n.read ? "pl-2" : ""}`}>
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-primary"><Icon className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1 text-sm">
                  <p><span className="font-semibold text-foreground">{n.actor_name || "Someone"}</span> <span className="text-muted-foreground">{verb(n)}</span>{n.post_title && <> <Link to={`/blog/${n.post_slug}`} className="font-medium text-foreground hover:text-primary">{n.post_title}</Link></>}</p>
                  <p className="text-xs text-muted-foreground">{ago(n.created_at)}</p>
                </div>
                {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
              </div>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BlogNotifications;
