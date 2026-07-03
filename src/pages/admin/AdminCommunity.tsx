import { useState, useEffect } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Community {
    id: string;
    name: string;
    url: string;
    tagline: string | null;
    logo_url: string | null;
    grp: string;
    sort_order: number;
    active: boolean;
}

const GROUPS: { value: string; label: string }[] = [
    { value: "main", label: "Main communities" },
    { value: "ms_subs", label: "Microsoft sub-communities" },
    { value: "channel", label: "Broadcast channel" },
];
const groupLabel = (g: string) => GROUPS.find((x) => x.value === g)?.label || g;

const EMPTY: Omit<Community, "id"> = { name: "", url: "", tagline: "", logo_url: "", grp: "main", sort_order: 0, active: true };

export default function AdminCommunity() {
    const [rows, setRows] = useState<Community[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState<Omit<Community, "id">>(EMPTY);
    const [saving, setSaving] = useState(false);

    const load = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("communities")
            .select("id, name, url, tagline, logo_url, grp, sort_order, active")
            .order("grp").order("sort_order");
        if (!error && Array.isArray(data)) setRows(data as Community[]);
        setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const openAdd = () => { setEditId(null); setForm(EMPTY); setDialogOpen(true); };
    const openEdit = (c: Community) => { setEditId(c.id); setForm({ name: c.name, url: c.url, tagline: c.tagline || "", logo_url: c.logo_url || "", grp: c.grp, sort_order: c.sort_order, active: c.active }); setDialogOpen(true); };

    const save = async () => {
        if (!form.name.trim() || !form.url.trim()) { toast.error("Name and URL are required."); return; }
        setSaving(true);
        const payload = {
            name: form.name.trim(),
            url: form.url.trim(),
            tagline: form.tagline?.trim() || null,
            logo_url: form.logo_url?.trim() || null,
            grp: form.grp,
            sort_order: Number(form.sort_order) || 0,
            active: form.active,
        };
        const { error } = editId
            ? await supabase.from("communities").update(payload).eq("id", editId)
            : await supabase.from("communities").insert(payload);
        setSaving(false);
        if (error) { toast.error(error.message.includes("row-level security") ? "Admins only." : error.message); return; }
        toast.success(editId ? "Community updated." : "Community added.");
        setDialogOpen(false);
        load();
    };

    const toggleActive = async (c: Community) => {
        const { error } = await supabase.from("communities").update({ active: !c.active }).eq("id", c.id);
        if (error) { toast.error(error.message); return; }
        setRows((prev) => prev.map((x) => (x.id === c.id ? { ...x, active: !x.active } : x)));
    };

    const remove = async (c: Community) => {
        if (!window.confirm(`Delete "${c.name}"? This cannot be undone.`)) return;
        const { error } = await supabase.from("communities").delete().eq("id", c.id);
        if (error) { toast.error(error.message); return; }
        setRows((prev) => prev.filter((x) => x.id !== c.id));
        toast.success("Community deleted.");
    };

    return (
        <div className="px-4 md:px-8 py-8 md:py-10 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="font-display text-3xl font-black tracking-tight">Community</h1>
                    <p className="mt-1 text-muted-foreground">Manage the community links shown on the public community page.</p>
                </div>
                <Button className="gap-2" onClick={openAdd}><Plus className="h-4 w-4" /> Add community</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">All community links</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                    ) : rows.length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">No community links yet. Add your first one.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Group</TableHead>
                                        <TableHead>Order</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.map((c) => (
                                        <TableRow key={c.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    {c.logo_url && <img src={c.logo_url} alt="" className="h-6 w-6 shrink-0 rounded object-contain" />}
                                                    <div className="min-w-0">
                                                        <a href={c.url} target="_blank" rel="noreferrer" className="font-medium hover:text-primary hover:underline">{c.name}</a>
                                                        {c.tagline && <div className="truncate text-xs text-muted-foreground">{c.tagline}</div>}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{groupLabel(c.grp)}</TableCell>
                                            <TableCell className="text-muted-foreground">{c.sort_order}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={c.active ? "border-emerald-500/30 text-emerald-600" : "border-border text-muted-foreground"}>
                                                    {c.active ? "Active" : "Hidden"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button variant="ghost" size="sm" onClick={() => toggleActive(c)}>{c.active ? "Hide" : "Show"}</Button>
                                                    <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>Edit</Button>
                                                    <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => remove(c)}>Delete</Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>{editId ? "Edit community" : "Add community"}</DialogTitle>
                        <DialogDescription>Changes are live on the public community page immediately.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="c-name">Name</Label>
                            <Input id="c-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. AWS Community" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="c-url">URL</Label>
                            <Input id="c-url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="c-tag">Tagline (optional)</Label>
                            <Input id="c-tag" value={form.tagline || ""} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="Short description" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="c-logo">Logo URL (optional)</Label>
                            <Input id="c-logo" value={form.logo_url || ""} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://.../logo.svg" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Group</Label>
                                <Select value={form.grp} onValueChange={(v) => setForm({ ...form, grp: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{GROUPS.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="c-order">Sort order</Label>
                                <Input id="c-order" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
                            </div>
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 rounded border-border" />
                            Show on the public site
                        </label>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
                        <Button onClick={save} disabled={saving} className="gap-2">
                            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
