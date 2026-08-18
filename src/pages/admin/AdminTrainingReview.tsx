import { useConfirm } from "@/components/providers/ConfirmProvider";
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
    Loader2, Eye, History, CheckCircle2, XCircle, Pencil, Trash2,
    MoreVertical, GraduationCap, AlertTriangle, Copy, IndianRupee,
    Users, FileWarning, Plus, Search, ChevronUp, ChevronDown,
    ChevronLeft, ChevronRight, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    listAllTrainings, listTrainingFinance, listAllTrainingAudits,
    listTrainingAudits, approveCourse, rejectCourse, deleteTraining,
} from "@/lib/training-api";

// ── Types ─────────────────────────────────────────────────────────────────────
interface CourseRow {
    id: string;
    courseName: string;
    subType: string;
    instructor: string;
    trainerId?: string;
    status: "Draft" | "Published" | "Review";
    reviewStatus: string;
    visibility: "public" | "private";
    timestamp: string;
    thumbnailUrl?: string;
}

interface FinanceRow {
    trainingId: string;
    courseName: string;
    trainerId: string | null;
    trainerName: string;
    price: number;
    enrollments: number;
    paidEnrollments: number;
    freeEnrollments: number;
    revenue: number;
    status: string;
    reviewStatus: string;
    visibility: string;
}

interface AuditRow {
    id: string;
    trainingId: string | null;
    trainingName: string;
    actorName: string;
    actorRole: string;
    action: string;
    field: string;
    oldValue: string;
    newValue: string;
    note: string;
    createdAt: string;
}

interface MergedRow {
    id: string;
    courseName: string;
    provider: string;
    trainerName: string;
    trainerId?: string;
    status: "Draft" | "Published" | "Review";
    reviewStatus: string;
    visibility: "public" | "private";
    price: number;
    enrollments: number;
    paidEnrollments: number;
    freeEnrollments: number;
    revenue: number;
    thumbnailUrl?: string;
    duplicate: boolean;
    priceChanged: boolean;
    highPrice: boolean;
}

type GroupBy = "trainer" | "course" | "price" | "status";

const GROUP_OPTIONS: { key: GroupBy; label: string }[] = [
    { key: "trainer", label: "By Trainer" },
    { key: "course",  label: "By Course"  },
    { key: "price",   label: "By Price"   },
    { key: "status",  label: "By Status"  },
];

const PRICE_BUCKETS: { key: string; label: string; match: (p: number) => boolean }[] = [
    { key: "free", label: "Free",             match: (p) => p === 0 },
    { key: "low",  label: "Under ₹1,000",      match: (p) => p > 0 && p < 1000 },
    { key: "mid",  label: "₹1,000 – ₹5,000",   match: (p) => p >= 1000 && p <= 5000 },
    { key: "high", label: "Over ₹5,000",      match: (p) => p > 5000 },
];

const fmtINR = (n: number) => (n === 0 ? "₹0" : `₹${n.toLocaleString("en-IN")}`);

const fmtDate = (iso?: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export default function AdminTrainingReview() {
    const { confirm } = useConfirm();
    const [isLoading, setIsLoading] = useState(true);
    const [rows,      setRows]      = useState<MergedRow[]>([]);
    const [groupBy,   setGroupBy]   = useState<GroupBy>("trainer");
    const [searchTerm, setSearchTerm] = useState("");
    const [trainerFilter, setTrainerFilter] = useState("all");
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

    // Audit dialog
    const [auditFor,       setAuditFor]       = useState<MergedRow | null>(null);
    const [audits,         setAudits]         = useState<AuditRow[]>([]);
    const [isAuditLoading, setIsAuditLoading] = useState(false);

    const fetchAll = async () => {
        setIsLoading(true);
        try {
            const [courses, finance, allAudits] = await Promise.all([
                listAllTrainings(),
                listTrainingFinance(),
                listAllTrainingAudits(),
            ]);

            const financeBy = new Map<string, FinanceRow>();
            (finance as unknown as FinanceRow[]).forEach((f) => financeBy.set(f.trainingId, f));

            const dupKey = (c: any) => `${(c.subType || "").toLowerCase().trim()}|${(c.courseName || "").toLowerCase().replace(/[^a-z0-9]/g, "")}`;
            const seen = new Map<string, number>();
            (courses as unknown as CourseRow[]).forEach((c) => {
                const k = dupKey(c);
                seen.set(k, (seen.get(k) || 0) + 1);
            });

            const changedIds = new Set<string>();
            (allAudits as unknown as AuditRow[]).forEach((a) => {
                if (a.action === "price_changed" && a.trainingId) changedIds.add(a.trainingId);
            });

            const merged: MergedRow[] = (courses as unknown as CourseRow[]).map((c) => {
                const f = financeBy.get(c.id);
                const price = f?.price ?? 0;
                return {
                    id: c.id,
                    courseName: c.courseName,
                    provider: c.subType,
                    trainerName: f?.trainerName || c.instructor || "",
                    trainerId: f?.trainerId || c.trainerId,
                    status: c.status,
                    reviewStatus: c.reviewStatus || "none",
                    visibility: c.visibility || "public",
                    price,
                    enrollments: f?.enrollments ?? 0,
                    paidEnrollments: f?.paidEnrollments ?? 0,
                    freeEnrollments: f?.freeEnrollments ?? 0,
                    revenue: f?.revenue ?? 0,
                    thumbnailUrl: (c as any).thumbnailUrl || (c as any).thumbnail || (c as any).image_url || "",
                    duplicate: seen.get(dupKey(c))! > 1,
                    priceChanged: changedIds.has(c.id),
                    highPrice: price > 50000,
                };
            });

            setRows(merged);
        } catch (e: any) {
            console.error(e);
            toast.error("Failed to load training overview: " + (e?.message || "Network error"));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const trainersList = useMemo(() => {
        return Array.from(new Set(rows.map(r => r.trainerName).filter(Boolean)));
    }, [rows]);

    const filteredRows = useMemo(() => {
        return rows.filter(r => {
            const matchesSearch = !searchTerm ||
                r.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.trainerName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTrainer = trainerFilter === "all" || r.trainerName === trainerFilter;
            return matchesSearch && matchesTrainer;
        });
    }, [rows, searchTerm, trainerFilter]);

    const groups = useMemo(() => {
        const groupKey = (r: MergedRow): string => {
            switch (groupBy) {
                case "trainer": return r.trainerName || "Unassigned";
                case "course":  return r.provider || "Other";
                case "status":  return r.status;
                case "price":   return PRICE_BUCKETS.find((b) => b.match(r.price))?.key || "free";
            }
        };
        const label = (key: string): string => {
            if (groupBy === "status") return key;
            if (groupBy === "price") return PRICE_BUCKETS.find((b) => b.key === key)?.label || key;
            return key;
        };
        const map = new Map<string, MergedRow[]>();
        filteredRows.forEach((r) => {
            const k = groupKey(r);
            map.set(k, [...(map.get(k) || []), r]);
        });
        const order = groupBy === "status"
            ? ["Review", "Draft", "Published"]
            : groupBy === "price"
                ? ["free", "low", "mid", "high"]
                : null;
        const keys = [...map.keys()].sort((a, b) => {
            if (order) {
                const ia = order.indexOf(a), ib = order.indexOf(b);
                if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
            }
            return (map.get(b)!.reduce((s, x) => s + x.revenue, 0)) - (map.get(a)!.reduce((s, x) => s + x.revenue, 0));
        });
        return keys.map((k) => ({
            key: k,
            label: label(k),
            items: map.get(k)!,
            count: map.get(k)!.length,
            revenue: map.get(k)!.reduce((s, x) => s + x.revenue, 0),
        }));
    }, [filteredRows, groupBy]);

    const totals = useMemo(() => ({
        total: rows.length,
        published: rows.filter((r) => r.status === "Published").length,
        pending: rows.filter((r) => r.status === "Review").length,
        revenue: rows.reduce((s, r) => s + r.revenue, 0),
        paidSeats: rows.reduce((s, r) => s + r.paidEnrollments, 0),
        flags: rows.filter((r) => r.duplicate || r.priceChanged || r.highPrice).length,
    }), [rows]);

    const toggleGroupCollapse = (key: string) => {
        setCollapsedGroups(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const openAudit = async (r: MergedRow) => {
        setAuditFor(r);
        setIsAuditLoading(true);
        setAudits([]);
        try {
            const data = await listTrainingAudits(r.id);
            setAudits(data as unknown as AuditRow[]);
        } catch (e: any) {
            toast.error("Failed to load audit log");
        } finally {
            setIsAuditLoading(false);
        }
    };

    const handleApprove = async (r: MergedRow) => {
        try {
            await approveCourse(r.id);
            toast.success("Course approved and published");
            fetchAll();
        } catch (e: any) { toast.error("Approve failed: " + (e?.message || "Network error")); }
    };

    const handleReject = async (r: MergedRow) => {
        try {
            await rejectCourse(r.id);
            toast.success("Course rejected. It stays a draft for the trainer to fix.");
            fetchAll();
        } catch (e: any) { toast.error("Reject failed: " + (e?.message || "Network error")); }
    };

    const handleDelete = async (r: MergedRow) => {
        if (!confirm(`Delete "${r.courseName}"? This cannot be undone.`)) return;
        toast.loading("Deleting training...");
        try {
            await deleteTraining(r.id);
            toast.dismiss();
            toast.success("Training deleted");
            fetchAll();
        } catch (e: any) {
            toast.dismiss();
            toast.error("Delete failed: " + (e?.message || "Network error"));
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 py-8 px-4 md:px-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* ── Top Header ── */}
                <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-6 md:p-8">
                    <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
                    <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-brand-200/20 blur-3xl" />

                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                                Training Operations
                            </p>
                            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                                Trainer Course Pipeline
                            </h1>
                            <p className="text-xs md:text-sm text-slate-600">
                                Every trainer-submitted course, grouped and audited — full CRUD, pricing control and transparency.
                            </p>
                        </div>

                        <Link to="/admin/training/create" className="shrink-0">
                            <Button className="gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-10 px-4 shadow-2xs">
                                <Plus className="h-4 w-4" /> Create Course
                            </Button>
                        </Link>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center gap-2 py-24 text-slate-500">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" /> Loading training pipeline…
                    </div>
                ) : (
                    <>
                        {/* ── Clean Text-Only Stat Cards ── */}
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                            <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                                <p className="text-xs font-medium text-slate-500">Total Courses</p>
                                <p className="mt-2 font-display text-2xl md:text-3xl font-bold tabular-nums text-slate-900">{totals.total}</p>
                            </div>

                            <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                                <p className="text-xs font-medium text-slate-500">Published</p>
                                <p className="mt-2 font-display text-2xl md:text-3xl font-bold tabular-nums text-slate-900">{totals.published}</p>
                            </div>

                            <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                                <p className="text-xs font-medium text-slate-500">In Review</p>
                                <p className="mt-2 font-display text-2xl md:text-3xl font-bold tabular-nums text-slate-900">{totals.pending}</p>
                            </div>

                            <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                                <p className="text-xs font-medium text-slate-500">Revenue (Paid)</p>
                                <p className="mt-2 font-display text-2xl md:text-3xl font-bold tabular-nums text-slate-900">{fmtINR(totals.revenue)}</p>
                            </div>

                            <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                                <p className="text-xs font-medium text-slate-500">Paid Seats</p>
                                <p className="mt-2 font-display text-2xl md:text-3xl font-bold tabular-nums text-slate-900">{totals.paidSeats}</p>
                            </div>

                            <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                                <p className="text-xs font-medium text-slate-500">Flags</p>
                                <p className="mt-2 font-display text-2xl md:text-3xl font-bold tabular-nums text-slate-900">{totals.flags}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">duplicates • price edits</p>
                            </div>
                        </div>

                        {/* ── Filter Controls Row ── */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-700 mr-1">Group by</span>
                                {GROUP_OPTIONS.map((o) => (
                                    <button
                                        key={o.key}
                                        onClick={() => setGroupBy(o.key)}
                                        className={cn(
                                            "px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150",
                                            groupBy === o.key
                                                ? "bg-blue-600 text-white shadow-2xs"
                                                : "bg-slate-100/90 text-slate-600 hover:bg-slate-200/80",
                                        )}
                                    >
                                        {o.label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                    <Input
                                        placeholder="Search courses..."
                                        className="pl-9 h-9 rounded-xl text-xs border-slate-200 bg-white"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Select value={trainerFilter} onValueChange={setTrainerFilter}>
                                    <SelectTrigger className="w-40 h-9 rounded-xl text-xs bg-white border-slate-200"><SelectValue placeholder="All Trainers" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Trainers</SelectItem>
                                        {trainersList.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* ── Grouped Course Cards ── */}
                        {groups.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500 text-sm">
                                No courses found.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {groups.map((g) => {
                                    const isCollapsed = Boolean(collapsedGroups[g.key]);
                                    return (
                                        <div key={g.key} className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
                                            {/* Card Header Bar */}
                                            <div
                                                className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-slate-100 cursor-pointer select-none"
                                                onClick={() => toggleGroupCollapse(g.key)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <h2 className="font-bold text-slate-900 text-sm">{g.label}</h2>
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                                        {g.count} course{g.count !== 1 ? "s" : ""}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-3 text-xs">
                                                    <span className="text-slate-500 font-medium">Total Revenue</span>
                                                    <span className="font-bold text-slate-900 tabular-nums">{fmtINR(g.revenue)}</span>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 p-0">
                                                        {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Item Rows */}
                                            {!isCollapsed && (
                                                <div className="divide-y divide-slate-100">
                                                    {g.items.map((r) => (
                                                        <div key={r.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 hover:bg-slate-50/50 transition-colors">
                                                            {/* Left: Real Thumbnail image or sleek icon + title + status */}
                                                            <div className="flex items-start gap-3.5 flex-1 min-w-0">
                                                                {r.thumbnailUrl ? (
                                                                    <img
                                                                        src={r.thumbnailUrl}
                                                                        alt={r.courseName}
                                                                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 shadow-2xs"
                                                                        onError={(e) => {
                                                                            // Fallback to icon badge on image load error
                                                                            (e.target as HTMLElement).style.display = "none";
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div className="w-12 h-12 rounded-xl bg-blue-50/80 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
                                                                        <BookOpen className="h-6 w-6" />
                                                                    </div>
                                                                )}

                                                                <div className="space-y-1 min-w-0">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className="font-bold text-slate-900 text-sm truncate">{r.courseName || "Untitled course"}</span>
                                                                        
                                                                        {/* Unique Modern Status Badges */}
                                                                        {r.status === "Published" && (
                                                                            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-success text-white border-0">
                                                                                Published
                                                                            </span>
                                                                        )}

                                                                        {r.status === "Review" && (
                                                                            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-700 border border-indigo-500/25 shadow-2xs">
                                                                                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                                                                                In Review
                                                                            </span>
                                                                        )}

                                                                        {r.status === "Draft" && (
                                                                            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                                                <span className="h-2 w-2 rounded-full bg-slate-400" />
                                                                                Draft
                                                                            </span>
                                                                        )}

                                                                        {r.visibility === "private" && (
                                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                                                                Private
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-xs text-slate-500 truncate">
                                                                        {r.provider || "Other provider"} · {r.trainerName || "No trainer"}
                                                                    </p>

                                                                    {/* Unique Flag Badges */}
                                                                    <div className="flex flex-wrap gap-1.5 pt-0.5">

                                                                        {r.duplicate && (
                                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-700 border border-rose-500/25 shadow-2xs">
                                                                                <Copy className="h-3 w-3 text-rose-600" /> Duplicate Detected
                                                                            </span>
                                                                        )}
                                                                        {r.highPrice && (
                                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-700 border border-purple-500/25 shadow-2xs">
                                                                                <AlertTriangle className="h-3 w-3 text-purple-600" /> Unusually High Price
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Right: Revenue, Paid Seats, Earnings Columns */}
                                                            <div className="flex items-center gap-6 md:gap-10 text-right shrink-0">
                                                                <div>
                                                                    <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-0.5">Revenue</p>
                                                                    <p className="font-bold text-slate-900 text-base tabular-nums">{fmtINR(r.price)}</p>
                                                                </div>

                                                                <div>
                                                                    <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-0.5">Paid Seats</p>
                                                                    <p className="font-bold text-slate-900 text-base tabular-nums">{r.paidEnrollments}</p>
                                                                </div>

                                                                <div>
                                                                    <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-0.5">Earnings</p>
                                                                    <p className="font-bold text-slate-900 text-base tabular-nums">{fmtINR(r.revenue)}</p>
                                                                </div>

                                                                {/* Actions vertical three dots */}
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-500">
                                                                            <MoreVertical className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                                                        <DropdownMenuItem asChild>
                                                                            <Link to={`/admin/training/edit/${r.id}`}>Edit course</Link>
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => openAudit(r)}>
                                                                            View audit log
                                                                        </DropdownMenuItem>
                                                                        {r.status === "Review" && (
                                                                            <>
                                                                                <DropdownMenuItem onClick={() => handleApprove(r)}>
                                                                                    Approve &amp; publish
                                                                                </DropdownMenuItem>
                                                                                <DropdownMenuItem onClick={async () => { if (await confirm({ title: "Confirm", description: "Are you sure? This cannot be undone." })) { handleReject(r); } }}>
                                                                                    Reject
                                                                                </DropdownMenuItem>
                                                                            </>
                                                                        )}
                                                                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={async () => { if (await confirm({ title: "Confirm", description: "Are you sure? This cannot be undone." })) { handleDelete(r); } }}>
                                                                            Delete
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* ── Pagination Footer ── */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 text-xs text-slate-500">
                            <span>Showing 1 to {filteredRows.length} of {rows.length} course{rows.length !== 1 ? "s" : ""}</span>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-xl bg-white border-slate-200" disabled><ChevronLeft className="h-3.5 w-3.5" /></Button>
                                    <Button className="h-8 w-8 rounded-xl bg-blue-600 text-white font-bold border-0 hover:bg-blue-700 shadow-2xs">1</Button>
                                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-xl bg-white border-slate-200" disabled><ChevronRight className="h-3.5 w-3.5" /></Button>
                                </div>
                                <Select defaultValue="10">
                                    <SelectTrigger className="w-28 h-8 rounded-xl bg-white border-slate-200 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10 / page</SelectItem>
                                        <SelectItem value="25">25 / page</SelectItem>
                                        <SelectItem value="50">50 / page</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </>
                )}

                {/* Audit dialog */}
                <Dialog open={!!auditFor} onOpenChange={(o) => { if (!o) setAuditFor(null); }}>
                    <DialogContent className="max-w-2xl rounded-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">Audit log — {auditFor?.courseName}</DialogTitle>
                            <DialogDescription>
                                Every create, edit, submit, approval and price change on this course.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="max-h-[60vh] overflow-auto space-y-2 py-2">
                            {isAuditLoading ? (
                                <div className="flex items-center gap-2 py-8 text-muted-foreground justify-center">
                                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> Loading…
                                </div>
                            ) : audits.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">No changes recorded yet.</p>
                            ) : (
                                audits.map((a) => (
                                    <div key={a.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
                                            {a.action === "approved" ? <CheckCircle2 className="h-4 w-4" />
                                                : a.action === "rejected" || a.action === "deleted" ? <XCircle className="h-4 w-4" />
                                                    : <History className="h-4 w-4" />}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                                                <span className="capitalize">{a.action.replace(/_/g, " ")}</span>
                                                {a.actorName && <span className="text-muted-foreground font-normal">by {a.actorName}</span>}
                                                <Badge variant="outline" className="text-[10px] rounded-full">{a.actorRole}</Badge>
                                            </div>
                                            {(a.oldValue != null || a.newValue != null) && (
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    <span className="text-muted-foreground/70">{a.field}:</span>{" "}
                                                    {a.oldValue != null && <span className="line-through opacity-60">{a.oldValue}</span>}
                                                    {a.oldValue != null && a.newValue != null && <span> → </span>}
                                                    {a.newValue != null && <span className="font-medium text-slate-900">{a.newValue}</span>}
                                                </p>
                                            )}
                                            {a.note && <p className="mt-0.5 text-xs text-muted-foreground/80">{a.note}</p>}
                                            <p className="mt-0.5 text-[11px] text-muted-foreground/70">{fmtDate(a.createdAt)}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
