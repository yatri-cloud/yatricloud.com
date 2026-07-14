import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Search, Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import ScrollReveal from "@/components/ScrollReveal";
import { listAllProducts, updateProduct, setProductStatus, deleteProduct, validateProductPatch, STORE_CATEGORIES, PRODUCT_LEVELS, type StoreProduct } from "@/lib/store-products";

const CATEGORIES = STORE_CATEGORIES;
const LEVELS = PRODUCT_LEVELS;
const empty = (): StoreProduct => ({ id: "", title: "", category: "AWS", originalPrice: 0, discountedPrice: 0, discount: 0, image: "", description: "", examCode: "", level: "Associate", status: "draft" });

const AdminProducts = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<StoreProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<StoreProduct | null>(null);

  const load = async () => { setItems(await listAllProducts()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? items.filter((p) => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || (p.examCode || "").toLowerCase().includes(q)) : items;
  }, [items, search]);

  const toggleStatus = async (p: StoreProduct) => {
    const next = p.status === "published" ? "draft" : "published";
    setItems((xs) => xs.map((x) => (x.id === p.id ? { ...x, status: next } : x)));
    try { await setProductStatus(p.id, next); } catch { toast({ title: "Update failed", variant: "destructive" }); load(); }
  };

  const save = async () => {
    if (!editing) return;
    const patch = {
      title: editing.title, category: editing.category, examCode: editing.examCode, level: editing.level,
      originalPrice: Number(editing.originalPrice) || 0, discountedPrice: Number(editing.discountedPrice) || 0,
      image: editing.image, description: editing.description,
    };
    const problem = validateProductPatch(patch);
    if (problem) { toast({ title: problem, variant: "destructive" }); return; }
    setSaving(true);
    try {
      await updateProduct(editing.id, patch);
      toast({ title: "Product saved" }); setEditing(null); load();
    } catch { toast({ title: "Save failed", variant: "destructive" }); } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try { await deleteProduct(toDelete.id); setItems((xs) => xs.filter((x) => x.id !== toDelete.id)); toast({ title: "Product deleted" }); }
    catch { toast({ title: "Delete failed", variant: "destructive" }); } finally { setToDelete(null); }
  };

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center gap-3 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading products…</div>;

  const published = items.filter((p) => p.status === "published").length;

  return (
    <div className="px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-6 md:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Store</p>
                <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight md:text-3xl">Manage <span className="gradient-text">products</span></h1>
                <p className="mt-1 text-muted-foreground">{items.length} products · {published} published. Edit, publish, or remove — changes are live.</p>
              </div>
              <Button asChild className="rounded-xl bg-primary hover:bg-brand-600 shadow-inset-btn"><Link to="/admin/products/add"><Plus className="mr-1.5 h-4 w-4" /> Add product</Link></Button>
            </div>
          </div>
        </ScrollReveal>

        <div className="rounded-2xl border border-brand-100 bg-card shadow-card">
          <div className="border-b border-border p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title, category, or exam code…" className="h-10 rounded-lg pl-9" />
            </div>
          </div>
          <div className="divide-y divide-border">
            {shown.length === 0 ? <p className="p-10 text-center text-sm text-muted-foreground">No products match.</p> : shown.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-4 hover:bg-muted/40">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
                  {p.image ? <img src={p.image} alt="" className="h-full w-full object-cover" loading="lazy" /> : <span className="text-xs font-bold text-muted-foreground">{p.category.slice(0, 2)}</span>}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{p.title || "Untitled"}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-2 py-0.5 font-medium">{p.category}</span>
                    <span>{p.level}</span>
                    {p.examCode && <span className="font-mono">{p.examCode}</span>}
                    <span className="font-semibold text-foreground">₹{p.discountedPrice}</span>
                    {p.originalPrice > p.discountedPrice && <span className="line-through">₹{p.originalPrice}</span>}
                    {p.discount > 0 && <span className="text-primary">{p.discount}% off</span>}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <label className="mr-1 flex items-center gap-1.5 text-xs text-muted-foreground" title={p.status === "published" ? "Published" : "Draft"}>
                    {p.status === "published" ? "Live" : "Draft"}
                    <Switch checked={p.status === "published"} onCheckedChange={() => toggleStatus(p)} className="scale-90" />
                  </label>
                  <Button size="icon" variant="ghost" onClick={() => setEditing({ ...p })} className="h-9 w-9 rounded-lg text-muted-foreground hover:text-primary" aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setToDelete(p)} className="h-9 w-9 rounded-lg text-muted-foreground hover:bg-destructive hover:text-destructive-foreground" aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-display tracking-tight">Edit product</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="space-y-1.5"><Label>Title</Label><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Category</Label>
                  <Select value={editing.category} onValueChange={(v) => setEditing({ ...editing, category: v as StoreProduct["category"] })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Level</Label>
                  <Select value={editing.level} onValueChange={(v) => setEditing({ ...editing, level: v as StoreProduct["level"] })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Original price (₹)</Label><Input type="number" value={editing.originalPrice} onChange={(e) => setEditing({ ...editing, originalPrice: Number(e.target.value) })} className="rounded-xl" /></div>
                <div className="space-y-1.5"><Label>Discounted price (₹)</Label><Input type="number" value={editing.discountedPrice} onChange={(e) => setEditing({ ...editing, discountedPrice: Number(e.target.value) })} className="rounded-xl" /></div>
              </div>
              <div className="space-y-1.5"><Label>Exam code</Label><Input value={editing.examCode} onChange={(e) => setEditing({ ...editing, examCode: e.target.value })} className="rounded-xl" placeholder="e.g. SAA-C03" /></div>
              <div className="space-y-1.5"><Label>Image URL</Label><Input value={editing.image} onChange={(e) => setEditing({ ...editing, image: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label>Description</Label><Textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="min-h-[80px] rounded-xl" /></div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditing(null)} className="rounded-xl">Cancel</Button>
            <Button onClick={save} disabled={saving} className="rounded-xl bg-primary hover:bg-brand-600 shadow-inset-btn">{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader><AlertDialogTitle className="font-display tracking-tight">Delete {toDelete?.title || "this product"}?</AlertDialogTitle>
            <AlertDialogDescription>It will be removed from the store. This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"><Trash2 className="mr-2 h-4 w-4" /> Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminProducts;
