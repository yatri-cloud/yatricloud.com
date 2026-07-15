import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ListPager } from "@/components/ui/list-pager";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const PAGE_SIZE = 12;

interface CompanyRow {
    id: string;
    name: string;
    slug: string;
    source: string;
    website: string | null;
    active: boolean;
    jobs_count: number;
    last_synced_at: string | null;
}

const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "never";

export default function AdminJobs() {
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState<CompanyRow[]>([]);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    useEffect(() => { setPage(1); }, [search]);

    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [source, setSource] = useState("greenhouse");
    const [website, setWebsite] = useState("");
    const [adding, setAdding] = useState(false);

    const load = async () => {
        setLoading(true);
        const { data } = await supabase
            .from("job_companies")
            .select("id, name, slug, source, website, active, jobs_count, last_synced_at")
            .order("name");
        setRows((data as CompanyRow[]) || []);
        setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return rows.filter((r) => !q || r.name.toLowerCase().includes(q) || r.slug.toLowerCase().includes(q));
    }, [rows, search]);
    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, pageCount);
    const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const totalJobs = rows.reduce((s, r) => s + (r.active ? r.jobs_count : 0), 0);

    const add = async () => {
        if (!name.trim() || !slug.trim()) {
            toast.error("Company name and board slug are both needed.");
            return;
        }
        setAdding(true);
        const { error } = await supabase.from("job_companies").insert({
            name: name.trim(),
            slug: slug.trim().toLowerCase(),
            source,
            website: website.trim() || null,
        });
        setAdding(false);
        if (error) {
            toast.error(error.message.includes("duplicate") ? "That slug already exists." : "That did not save.");
            return;
        }
        toast.success("Added. Run the sync to pull its jobs.");
        setName(""); setSlug(""); setWebsite("");
        load();
    };

    const toggle = async (r: CompanyRow) => {
        const { error } = await supabase.from("job_companies").update({ active: !r.active }).eq("id", r.id);
        if (error) { toast.error("That did not save."); return; }
        setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, active: !r.active } : x)));
    };

    const remove = async (r: CompanyRow) => {
        const { error } = await supabase.from("job_companies").delete().eq("id", r.id);
        if (error) { toast.error("Could not delete that company."); return; }
        toast.success("Deleted with all its postings.");
        setRows((prev) => prev.filter((x) => x.id !== r.id));
    };

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Loading companies…</span>
            </div>
        );
    }

    return (
        <div className="px-4 md:px-8 py-8 md:py-10 max-w-7xl mx-auto space-y-6 md:space-y-8">
            <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-6 md:p-8">
                <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
                <div className="relative space-y-1.5">
                    <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Companies</h1>
                    <p className="text-muted-foreground">
                        {totalJobs.toLocaleString("en-IN")} live postings across {rows.filter((r) => r.active).length} active boards.
                        Jobs sync from official ATS APIs; run <code className="rounded bg-muted px-1.5 py-0.5 text-xs">node scripts/jobs-sync.mjs</code> after changes.
                    </p>
                </div>
            </div>

            {/* Add company */}
            <div className="grid gap-2 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[1fr_1fr_150px_1fr_auto]">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Company name" aria-label="Company name" />
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Board slug (e.g. stripe)" aria-label="Board slug" />
                <Select value={source} onValueChange={setSource}>
                    <SelectTrigger aria-label="ATS source"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="greenhouse">Greenhouse</SelectItem>
                        <SelectItem value="lever">Lever</SelectItem>
                        <SelectItem value="ashby">Ashby</SelectItem>
                    </SelectContent>
                </Select>
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Website (for the logo)" aria-label="Website" />
                <Button onClick={add} disabled={adding} className="shadow-inset-btn">
                    {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />} Add
                </Button>
            </div>

            <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search companies" aria-label="Search companies" className="h-10 pl-9" />
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-brand-50/60 text-left">
                                <th className="px-4 py-3 font-semibold">Company</th>
                                <th className="px-4 py-3 font-semibold">Source</th>
                                <th className="px-4 py-3 font-semibold">Jobs</th>
                                <th className="px-4 py-3 font-semibold">Last sync</th>
                                <th className="px-4 py-3 font-semibold">Active</th>
                                <th className="px-4 py-3 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paged.map((r) => (
                                <tr key={r.id} className="border-b border-border/60 last:border-0 hover:bg-brand-50/30">
                                    <td className="px-4 py-3">
                                        <p className="font-semibold">{r.name}</p>
                                        <p className="text-xs text-muted-foreground">{r.slug}</p>
                                    </td>
                                    <td className="px-4 py-3 capitalize text-muted-foreground">{r.source}</td>
                                    <td className="px-4 py-3 tabular-nums">{r.jobs_count.toLocaleString("en-IN")}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{fmt(r.last_synced_at)}</td>
                                    <td className="px-4 py-3">
                                        <Switch checked={r.active} onCheckedChange={() => toggle(r)} aria-label={`Toggle ${r.name}`} />
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label={`Delete ${r.name}`}
                                            title="Delete"
                                            className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                                            onClick={() => remove(r)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <ListPager page={currentPage} pageCount={pageCount} onPageChange={setPage} />
        </div>
    );
}
