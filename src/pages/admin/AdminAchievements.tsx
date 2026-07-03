import { useState, useEffect, useMemo } from "react";
import { Loader2, Search } from "lucide-react";
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
import { format } from "date-fns";

interface Cert {
    id: string;
    full_name: string;
    email: string;
    provider: string;
    certification_name: string;
    exam_code: string | null;
    certification_date: string | null;
    verified_credential_url: string | null;
    is_public: boolean;
    created_at: string;
}

const PROVIDERS = ["AWS", "AZURE", "GCP", "GITHUB", "ORACLE", "SALESFORCE", "SERVICENOW", "OPENAI", "HASHICORP", "KUBERNETES", "OTHER"];

export default function AdminAchievements() {
    const [rows, setRows] = useState<Cert[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [providerFilter, setProviderFilter] = useState("all");
    const [publicFilter, setPublicFilter] = useState("all");
    const [editing, setEditing] = useState<Cert | null>(null);
    const [saving, setSaving] = useState(false);

    const load = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("certifications")
            .select("id, full_name, email, provider, certification_name, exam_code, certification_date, verified_credential_url, is_public, created_at")
            .order("created_at", { ascending: false });
        if (!error && Array.isArray(data)) setRows(data as Cert[]);
        setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return rows.filter((r) => {
            if (providerFilter !== "all" && r.provider !== providerFilter) return false;
            if (publicFilter === "public" && !r.is_public) return false;
            if (publicFilter === "hidden" && r.is_public) return false;
            if (!q) return true;
            return (
                r.full_name.toLowerCase().includes(q) ||
                r.email.toLowerCase().includes(q) ||
                r.certification_name.toLowerCase().includes(q) ||
                (r.exam_code || "").toLowerCase().includes(q) ||
                r.provider.toLowerCase().includes(q)
            );
        });
    }, [rows, search, providerFilter, publicFilter]);

    const togglePublic = async (c: Cert) => {
        const { error } = await supabase.from("certifications").update({ is_public: !c.is_public }).eq("id", c.id);
        if (error) { toast.error(error.message); return; }
        setRows((prev) => prev.map((x) => (x.id === c.id ? { ...x, is_public: !x.is_public } : x)));
    };

    const remove = async (c: Cert) => {
        if (!window.confirm(`Delete ${c.full_name}'s "${c.certification_name}"? This cannot be undone.`)) return;
        const { error } = await supabase.from("certifications").delete().eq("id", c.id);
        if (error) { toast.error(error.message); return; }
        setRows((prev) => prev.filter((x) => x.id !== c.id));
        toast.success("Certification removed.");
    };

    const saveEdit = async () => {
        if (!editing) return;
        if (!editing.certification_name.trim()) { toast.error("Certification name is required."); return; }
        setSaving(true);
        const { error } = await supabase.from("certifications").update({
            certification_name: editing.certification_name.trim(),
            exam_code: editing.exam_code?.trim() || null,
            certification_date: editing.certification_date || null,
            provider: editing.provider,
            is_public: editing.is_public,
        }).eq("id", editing.id);
        setSaving(false);
        if (error) { toast.error(error.message); return; }
        setRows((prev) => prev.map((x) => (x.id === editing.id ? { ...editing } : x)));
        setEditing(null);
        toast.success("Certification updated.");
    };

    const publicCount = rows.filter((r) => r.is_public).length;

    return (
        <div className="px-4 md:px-8 py-8 md:py-10 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="font-display text-3xl font-black tracking-tight">Achievements</h1>
                <p className="mt-1 text-muted-foreground">
                    Every certification Yatris have shared. {rows.length} total, {publicCount} shown publicly.
                </p>
            </div>

            <Card>
                <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="text-base">All certifications</CardTitle>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, cert" className="pl-9" />
                        </div>
                        <Select value={providerFilter} onValueChange={setProviderFilter}>
                            <SelectTrigger className="w-full sm:w-[150px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All providers</SelectItem>
                                {PROVIDERS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={publicFilter} onValueChange={setPublicFilter}>
                            <SelectTrigger className="w-full sm:w-[130px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All status</SelectItem>
                                <SelectItem value="public">Public</SelectItem>
                                <SelectItem value="hidden">Hidden</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                    ) : filtered.length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">{rows.length === 0 ? "No certifications yet." : "No certifications match your filters."}</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Yatri</TableHead>
                                        <TableHead>Certification</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map((c) => (
                                        <TableRow key={c.id}>
                                            <TableCell>
                                                <div className="font-medium">{c.full_name}</div>
                                                <div className="text-xs text-muted-foreground">{c.email}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="border-primary/30 text-primary">{c.provider}</Badge>
                                                    <span className="max-w-[220px] truncate">{c.certification_name}</span>
                                                </div>
                                                {c.exam_code && <div className="text-xs text-muted-foreground">{c.exam_code}</div>}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap text-muted-foreground">
                                                {c.certification_date ? format(new Date(c.certification_date), "dd MMM yyyy") : "—"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={c.is_public ? "border-emerald-500/30 text-emerald-600" : "border-border text-muted-foreground"}>
                                                    {c.is_public ? "Public" : "Hidden"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {c.verified_credential_url && (
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <a href={c.verified_credential_url} target="_blank" rel="noreferrer">Credential</a>
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" size="sm" onClick={() => togglePublic(c)}>{c.is_public ? "Hide" : "Show"}</Button>
                                                    <Button variant="ghost" size="sm" onClick={() => setEditing({ ...c })}>Edit</Button>
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

            <Dialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>Edit certification</DialogTitle>
                        <DialogDescription>Update this Yatri's certification. Changes are live on the achievements page.</DialogDescription>
                    </DialogHeader>
                    {editing && (
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="a-name">Certification name</Label>
                                <Input id="a-name" value={editing.certification_name} onChange={(e) => setEditing({ ...editing, certification_name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label>Provider</Label>
                                    <Select value={editing.provider} onValueChange={(v) => setEditing({ ...editing, provider: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{PROVIDERS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="a-exam">Exam code</Label>
                                    <Input id="a-exam" value={editing.exam_code || ""} onChange={(e) => setEditing({ ...editing, exam_code: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="a-date">Certification date</Label>
                                <Input id="a-date" type="date" value={editing.certification_date || ""} onChange={(e) => setEditing({ ...editing, certification_date: e.target.value })} />
                            </div>
                            <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={editing.is_public} onChange={(e) => setEditing({ ...editing, is_public: e.target.checked })} className="h-4 w-4 rounded border-border" />
                                Show on the public achievements page
                            </label>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
                        <Button onClick={saveEdit} disabled={saving} className="gap-2">
                            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
