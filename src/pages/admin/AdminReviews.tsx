import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, Star, Eye, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import ScrollReveal from "@/components/ScrollReveal";

interface Review {
  id: string; name: string; email: string | null; rating: number; review: string;
  context: string | null; is_public: boolean; created_at: string;
}

const fmt = (d: string) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

const AdminReviews = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "public" | "hidden">("all");
  const [toDelete, setToDelete] = useState<Review | null>(null);

  const load = async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select("id,name,email,rating,review,context,is_public,created_at")
      .order("created_at", { ascending: false });
    if (error) { toast({ title: "Could not load reviews", variant: "destructive" }); }
    setRows((data ?? []) as Review[]); setLoading(false);
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = async (r: Review) => {
    setRows((xs) => xs.map((x) => (x.id === r.id ? { ...x, is_public: !x.is_public } : x)));
    const { error } = await supabase.from("reviews").update({ is_public: !r.is_public }).eq("id", r.id);
    if (error) { toast({ title: "Update failed", variant: "destructive" }); load(); }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const { error } = await supabase.from("reviews").delete().eq("id", toDelete.id);
    if (error) { toast({ title: "Delete failed", variant: "destructive" }); }
    else { setRows((xs) => xs.filter((x) => x.id !== toDelete.id)); toast({ title: "Review deleted" }); }
    setToDelete(null);
  };

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "public" && !r.is_public) return false;
      if (filter === "hidden" && r.is_public) return false;
      if (q && !(r.name.toLowerCase().includes(q) || r.review.toLowerCase().includes(q) || (r.context || "").toLowerCase().includes(q))) return false;
      return true;
    });
  }, [rows, search, filter]);

  const counts = useMemo(() => ({ all: rows.length, public: rows.filter((r) => r.is_public).length, hidden: rows.filter((r) => !r.is_public).length }), [rows]);

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center gap-3 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading reviews…</div>;

  return (
    <div className="px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-6 md:p-8">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Reviews</p>
            <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight md:text-3xl">Moderate the <span className="gradient-text">review wall</span></h1>
            <p className="mt-1 text-muted-foreground">{counts.all} reviews · {counts.public} shown publicly. Hide or delete anything off-brand or abusive.</p>
          </div>
        </ScrollReveal>

        <div className="rounded-2xl border border-brand-100 bg-card shadow-card">
          <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reviews or names…" className="h-10 rounded-lg pl-9" />
            </div>
            <div className="flex gap-1.5">
              {(["all", "public", "hidden"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
                  {f} <span className={filter === f ? "text-primary-foreground/80" : "text-muted-foreground/70"}>{counts[f]}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-border">
            {shown.length === 0 ? <p className="p-10 text-center text-sm text-muted-foreground">No reviews match.</p> : shown.map((r) => (
              <div key={r.id} className={`flex items-start gap-3 p-4 ${!r.is_public ? "opacity-60" : ""}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">{r.name || "Anonymous"}</span>
                    <span className="flex items-center gap-0.5 text-amber-500">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-current" : "text-muted-foreground/30"}`} />)}</span>
                    {r.context && <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{r.context}</span>}
                    {!r.is_public && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">Hidden</span>}
                    <span className="text-xs text-muted-foreground">{fmt(r.created_at)}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{r.review}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button size="sm" variant="outline" onClick={() => toggle(r)} className="rounded-lg" title={r.is_public ? "Hide" : "Show"}>
                    {r.is_public ? <><EyeOff className="mr-1 h-3.5 w-3.5" /> Hide</> : <><Eye className="mr-1 h-3.5 w-3.5" /> Show</>}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setToDelete(r)} className="h-9 w-9 rounded-lg text-muted-foreground hover:bg-destructive hover:text-destructive-foreground" aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader><AlertDialogTitle className="font-display tracking-tight">Delete this review?</AlertDialogTitle>
            <AlertDialogDescription>It will be permanently removed. To just take it off the site, use Hide instead.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"><Trash2 className="mr-2 h-4 w-4" /> Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminReviews;
