import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, Download, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListPager } from "@/components/ui/list-pager";
import { toast } from "sonner";
import {
    listAllResumeRequests,
    retryResumeRequest,
    deleteResumeRequest,
    resumeDownloadUrl,
    type AdminResumeRequest,
} from "@/lib/resume-api";

const PAGE_SIZE = 12;

const STATUS_META: Record<string, { label: string; dot: string }> = {
    queued: { label: "Queued", dot: "bg-warning" },
    processing: { label: "Building", dot: "bg-primary" },
    ready: { label: "Ready", dot: "bg-success" },
    failed: { label: "Failed", dot: "bg-destructive" },
};

const StatusPill = ({ status }: { status: string }) => {
    const meta = STATUS_META[status] || { label: status, dot: "bg-muted-foreground" };
    return (
        <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
            <span className={`h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
            {meta.label}
        </span>
    );
};

const formatDate = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
        ? ""
        : d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
};

export default function AdminResumes() {
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState<AdminResumeRequest[]>([]);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [sort, setSort] = useState("newest");
    const [page, setPage] = useState(1);
    useEffect(() => { setPage(1); }, [search, status, sort]);

    const load = async () => {
        setLoading(true);
        setRows(await listAllResumeRequests());
        setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = rows.filter((r) => {
            if (status !== "all" && r.status !== status) return false;
            if (!q) return true;
            return (
                r.full_name.toLowerCase().includes(q) ||
                r.email.toLowerCase().includes(q) ||
                (r.error || "").toLowerCase().includes(q)
            );
        });
        const sorted = [...list];
        if (sort === "oldest") sorted.sort((a, b) => a.created_at.localeCompare(b.created_at));
        else if (sort === "name") sorted.sort((a, b) => a.full_name.localeCompare(b.full_name));
        else sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
        return sorted;
    }, [rows, search, status, sort]);

    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, pageCount);
    const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const queuedCount = rows.filter((r) => r.status === "queued" || r.status === "processing").length;

    const retry = async (r: AdminResumeRequest) => {
        if (!(await retryResumeRequest(r.id))) {
            toast.error("That did not save. Please try again.");
            return;
        }
        toast.success("Back in the queue.");
        load();
    };

    const remove = async (r: AdminResumeRequest) => {
        if (!(await deleteResumeRequest(r))) {
            toast.error("Could not delete that request.");
            return;
        }
        toast.success("Deleted.");
        setRows((prev) => prev.filter((x) => x.id !== r.id));
    };

    const download = async (path: string | null) => {
        if (!path) return;
        const url = await resumeDownloadUrl(path);
        if (!url) { toast.error("Could not fetch the file."); return; }
        window.open(url, "_blank", "noopener");
    };

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Loading resume requests…</span>
            </div>
        );
    }

    return (
        <div className="px-4 md:px-8 py-8 md:py-10 max-w-7xl mx-auto space-y-6 md:space-y-8">
            {/* Header band */}
            <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-6 md:p-8">
                <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
                <div className="relative space-y-1.5">
                    <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Resume requests</h1>
                    <p className="text-muted-foreground">
                        Every request from /resume-maker. The local worker builds them;
                        {queuedCount > 0
                            ? ` ${queuedCount} waiting or building right now.`
                            : " the queue is clear."}
                    </p>
                </div>
            </div>

            {/* Search, filter, sort */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, email or error"
                        aria-label="Search resume requests"
                        className="h-10 pl-9"
                    />
                </div>
                <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-10 w-full sm:w-[160px]" aria-label="Filter by status">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="queued">Queued</SelectItem>
                        <SelectItem value="processing">Building</SelectItem>
                        <SelectItem value="ready">Ready</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={sort} onValueChange={setSort}>
                    <SelectTrigger className="h-10 w-full sm:w-[160px]" aria-label="Sort resume requests">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="newest">Newest first</SelectItem>
                        <SelectItem value="oldest">Oldest first</SelectItem>
                        <SelectItem value="name">Name A to Z</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* List */}
            {filtered.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
                    {rows.length === 0
                        ? "No resume requests yet. They appear here the moment a Yatri submits one."
                        : "No requests match that search."}
                </div>
            ) : (
                <>
                    <div className="overflow-hidden rounded-2xl border border-border bg-card">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-brand-50/60 text-left">
                                        <th className="px-4 py-3 font-semibold">Yatri</th>
                                        <th className="px-4 py-3 font-semibold">Status</th>
                                        <th className="px-4 py-3 font-semibold">Requested</th>
                                        <th className="px-4 py-3 font-semibold">Files</th>
                                        <th className="px-4 py-3 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paged.map((r) => (
                                        <tr key={r.id} className="border-b border-border/60 last:border-0 hover:bg-brand-50/30">
                                            <td className="px-4 py-3">
                                                <p className="font-semibold">{r.full_name}</p>
                                                <p className="text-xs text-muted-foreground">{r.email}</p>
                                                {r.status === "failed" && r.error && (
                                                    <p className="mt-1 text-xs text-destructive">{r.error}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                                            <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDate(r.created_at)}</td>
                                            <td className="px-4 py-3">
                                                {r.status === "ready" ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <Button variant="outline" size="sm" className="h-8" onClick={() => download(r.docx_path)} disabled={!r.docx_path}>
                                                            <Download className="mr-1 h-3.5 w-3.5" /> Word
                                                        </Button>
                                                        <Button variant="outline" size="sm" className="h-8" onClick={() => download(r.pdf_path)} disabled={!r.pdf_path}>
                                                            <Download className="mr-1 h-3.5 w-3.5" /> PDF
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    {(r.status === "failed" || r.status === "ready") && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            aria-label="Retry this request"
                                                            title="Retry"
                                                            className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-brand-50 hover:text-primary"
                                                            onClick={() => retry(r)}
                                                        >
                                                            <RotateCcw className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        aria-label="Delete this request"
                                                        title="Delete"
                                                        className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                                                        onClick={() => remove(r)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <ListPager page={currentPage} pageCount={pageCount} onPageChange={setPage} />
                </>
            )}
        </div>
    );
}
