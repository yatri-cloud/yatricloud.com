import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, Star, Eye, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import ScrollReveal from "@/components/ScrollReveal";
import {
  listAllEntityReviews,
  setEntityReviewPublic,
  deleteEntityReview,
  type AdminEntityReview,
  type ReviewEntityType,
} from "@/lib/entity-reviews";

/**
 * Moderation console for the unified per-entity reviews (migration 075):
 * events, store products, udemy courses and exam dumps in one queue with a
 * type filter. Training and mentor reviews keep their own consoles.
 */

const TYPE_LABELS: Record<ReviewEntityType, string> = {
  event: "Events",
  product: "Store",
  udemy_course: "Udemy",
  exam_dump: "Exam dumps",
};

const fmt = (d: string) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

const AdminContentReviews = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<AdminEntityReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | ReviewEntityType>("all");
  const [visibility, setVisibility] = useState<"all" | "public" | "hidden">("all");
  const [toDelete, setToDelete] = useState<AdminEntityReview | null>(null);

  const load = async () => {
    setRows(await listAllEntityReviews());
    setLoading(false);
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = async (r: AdminEntityReview) => {
    setRows((xs) => xs.map((x) => (x.id === r.id ? { ...x, isPublic: !x.isPublic } : x)));
    const ok = await setEntityReviewPublic(r.id, !r.isPublic);
    if (!ok) { toast({ title: "Update failed", variant: "destructive" }); load(); }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const ok = await deleteEntityReview(toDelete.id);
    if (!ok) toast({ title: "Delete failed", variant: "destructive" });
    else { setRows((xs) => xs.filter((x) => x.id !== toDelete.id)); toast({ title: "Review deleted" }); }
    setToDelete(null);
  };

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (typeFilter !== "all" && r.entityType !== typeFilter) return false;
      if (visibility === "public" && !r.isPublic) return false;
      if (visibility === "hidden" && r.isPublic) return false;
      if (q && !(r.name.toLowerCase().includes(q) || r.review.toLowerCase().includes(q) || r.entityName.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [rows, search, typeFilter, visibility]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: rows.length };
    for (const t of Object.keys(TYPE_LABELS)) counts[t] = rows.filter((r) => r.entityType === t).length;
    return counts;
  }, [rows]);

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center gap-3 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading reviews…</div>;

  return (
    <div className="px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-6 md:p-8">
            <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">Content <span className="gradient-text">reviews</span></h1>
            <p className="mt-1 text-muted-foreground">
              Reviews Yatris leave on events, store products, Udemy courses and exam dumps — {rows.length} total. Training and mentor reviews have their own consoles.
            </p>
          </div>
        </ScrollReveal>

        <div className="rounded-2xl border border-brand-100 bg-card shadow-card">
          <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by reviewer, text or item…"
                className="h-10 rounded-lg pl-9"
                data-testid="content-reviews-search"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["all", ...Object.keys(TYPE_LABELS)] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t as typeof typeFilter)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${typeFilter === t ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
                >
                  {t === "all" ? "All" : TYPE_LABELS[t as ReviewEntityType]}{" "}
                  <span className={typeFilter === t ? "text-primary-foreground/80" : "text-muted-foreground/70"}>{typeCounts[t]}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              {(["all", "public", "hidden"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setVisibility(f)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${visibility === f ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-border">
            {shown.length === 0 ? (
              <p className="p-10 text-center text-sm text-muted-foreground">
                {rows.length === 0 ? "No content reviews yet. They appear the moment a Yatri reviews an event, product, course or dump." : "No reviews match."}
              </p>
            ) : shown.map((r) => (
              <div key={r.id} className={`flex items-start gap-3 p-4 ${!r.isPublic ? "opacity-60" : ""}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">{r.name}</span>
                    <span className="flex items-center gap-0.5 text-warning">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-current" : "text-muted-foreground/30"}`} />)}</span>
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-primary">{TYPE_LABELS[r.entityType]}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{r.entityName}</span>
                    {!r.isPublic && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">Hidden</span>}
                    <span className="text-xs text-muted-foreground">{fmt(r.createdAt)}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{r.review}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button size="sm" variant="outline" onClick={() => toggle(r)} className="rounded-lg" title={r.isPublic ? "Hide" : "Show"}>
                    {r.isPublic ? <><EyeOff className="mr-1 h-3.5 w-3.5" /> Hide</> : <><Eye className="mr-1 h-3.5 w-3.5" /> Show</>}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setToDelete(r)} className="h-9 w-9 rounded-lg text-muted-foreground hover:bg-destructive hover:text-destructive-foreground" aria-label={`Delete the review by ${r.name}`}><Trash2 className="h-4 w-4" /></Button>
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

export default AdminContentReviews;
