import { useConfirm } from "@/components/providers/ConfirmProvider";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Search, Star, ExternalLink, Eye, Trash, Globe, FileText, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import ScrollReveal from "@/components/ScrollReveal";

interface Row {
  id: string; slug: string; title: string; author_id: string; status: string;
  featured: boolean; view_count: number; published_at: string | null; updated_at: string;
  author_name?: string;
}

const AdminBlog = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const { showConfirm: confirm } = useConfirm();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft" | "featured">("all");

  const load = async () => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id,slug,title,author_id,status,featured,view_count,published_at,updated_at")
      .order("updated_at", { ascending: false });
    if (error) { toast({ title: "Could not load posts", variant: "destructive" }); setLoading(false); return; }
    const list = (data ?? []) as Row[];
    const ids = [...new Set(list.map((r) => r.author_id))];
    if (ids.length) {
      const { data: authors } = await supabase.from("public_authors").select("id,full_name").in("id", ids);
      const map = Object.fromEntries((authors ?? []).map((a: any) => [a.id, a.full_name]));
      list.forEach((r) => (r.author_name = map[r.author_id] || "Unknown"));
    }
    setRows(list); setLoading(false);
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setField = async (id: string, patch: Partial<Row>) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    const { error } = await supabase.from("blog_posts").update(patch).eq("id", id);
    if (error) { toast({ title: "Update failed", variant: "destructive" }); load(); }
  };

  const toggleFeatured = (r: Row) => setField(r.id, { featured: !r.featured });
  const setStatus = (r: Row, status: string) =>
    setField(r.id, status === "published" ? { status, published_at: r.published_at || new Date().toISOString() } : { status });

  const remove = async (r: Row) => {
    if (!await confirm(`Delete "${r.title}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", r.id);
    if (error) { toast({ title: "Delete failed", variant: "destructive" }); return; }
    setRows((rs) => rs.filter((x) => x.id !== r.id));
    toast({ title: "Post deleted" });
  };

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "featured" && !r.featured) return false;
      if (filter === "published" && r.status !== "published") return false;
      if (filter === "draft" && r.status === "published") return false;
      if (q && !(r.title.toLowerCase().includes(q) || (r.author_name || "").toLowerCase().includes(q))) return false;
      return true;
    });
  }, [rows, search, filter]);

  const counts = useMemo(() => ({
    all: rows.length,
    published: rows.filter((r) => r.status === "published").length,
    draft: rows.filter((r) => r.status !== "published").length,
    featured: rows.filter((r) => r.featured).length,
  }), [rows]);

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center gap-3 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading posts…</div>;

  return (
    <div className="px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-6 md:p-8">
            <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight md:text-3xl">Manage the <span className="gradient-text">blog</span></h1>
          </div>
        </ScrollReveal>

        <div className="rounded-2xl border border-brand-100 bg-card shadow-card">
          <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title or author…" className="h-10 rounded-lg pl-9" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["all", "published", "draft", "featured"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
                  {f} <span className={filter === f ? "text-primary-foreground/80" : "text-muted-foreground/70"}>{counts[f]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-border">
            {shown.length === 0 ? (
              <p className="p-10 text-center text-sm text-muted-foreground">No posts match.</p>
            ) : shown.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-3 p-4 hover:bg-muted/40">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold text-foreground">{r.title || "Untitled"}</span>
                    {r.featured && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">FEATURED</span>}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">by {r.author_name} · {r.view_count} views</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <label className="mr-1 flex items-center gap-1.5 text-xs text-muted-foreground" title="Feature on the blog">
                    <Star className={`h-4 w-4 ${r.featured ? "fill-primary text-primary" : ""}`} />
                    <Switch checked={r.featured} onCheckedChange={() => toggleFeatured(r)} className="scale-90" aria-label="Feature" />
                  </label>
                  {r.status === "published" ? (
                    <Button asChild size="icon" variant="ghost" className="h-9 w-9 rounded-lg" aria-label="View"><Link to={`/blog/${r.slug}`} target="_blank"><ExternalLink className="h-4 w-4" /></Link></Button>
                  ) : null}
                  {r.status === "published" ? (
                    <Button size="sm" variant="outline" onClick={() => setStatus(r, "draft")} className="rounded-lg" title="Unpublish">Unpublish</Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setStatus(r, "published")} className="rounded-lg" title="Publish">Publish</Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={async () => { if (await confirm({ title: "Confirm", description: "Are you sure? This cannot be undone." })) { remove(r); } }} className="h-8 w-8 flex items-center justify-center rounded-full bg-destructive text-white hover:bg-destructive/90 hover:text-white" aria-label="Delete"><Trash className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBlog;
