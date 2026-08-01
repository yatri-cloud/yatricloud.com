import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
    Loader2,
    Eye,
    History,
    CheckCircle2,
    XCircle,
    Pencil,
    Trash2,
    MoreVertical,
    GraduationCap,
    AlertTriangle,
    Copy,
    IndianRupee,
    Users,
    FileWarning,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Card, CardContent,
} from "@/components/ui/card";
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CourseRow {
    id: string;
    courseName: string;
    subType: string;      // provider label
    instructor: string;
    trainerId?: string;
    status: "Draft" | "Published" | "Review";
    reviewStatus: string;
    visibility: "public" | "private";
    timestamp: string;
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
    // anti-cheat flags
    duplicate: boolean;
    priceChanged: boolean;
    highPrice: boolean;
}

type GroupBy = "trainer" | "course" | "price" | "status";

const GROUP_OPTIONS: { key: GroupBy; label: string }[] = [
    { key: "trainer", label: "By Trainer" },
    { key: "course", label: "By Course" },
    { key: "price", label: "By Price" },
    { key: "status", label: "By Status" },
];

const PRICE_BUCKETS: { key: string; label: string; match: (p: number) => boolean }[] = [
    { key: "free", label: "Free", match: (p) => p === 0 },
    { key: "low", label: "Under ₹1,000", match: (p) => p > 0 && p < 1000 },
    { key: "mid", label: "₹1,000 – ₹5,000", match: (p) => p >= 1000 && p <= 5000 },
    { key: "high", label: "Over ₹5,000", match: (p) => p > 5000 },
];

const fmtINR = (n: number) =>
    n === 0 ? "₹0" : `₹${n.toLocaleString("en-IN")}`;

const fmtDate = (iso?: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const statusTone = (s: string) =>
    s === "Published" ? "bg-success/10 text-success"
        : s === "Review" ? "bg-amber-500/10 text-amber-600"
            : "bg-muted text-muted-foreground";

export default function AdminTrainingReview() {
    const [isLoading, setIsLoading] = useState(true);
    const [rows, setRows] = useState<MergedRow[]>([]);
    const [groupBy, setGroupBy] = useState<GroupBy>("trainer");

    // Audit dialog
    const [auditFor, setAuditFor] = useState<MergedRow | null>(null);
    const [audits, setAudits] = useState<AuditRow[]>([]);
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

            // Duplicate detection: same provider + normalized course name.
            const dupKey = (c: any) => `${(c.subType || "").toLowerCase().trim()}|${(c.courseName || "").toLowerCase().replace(/[^a-z0-9]/g, "")}`;
            const seen = new Map<string, number>();
            (courses as unknown as CourseRow[]).forEach((c) => {
                const k = dupKey(c);
                seen.set(k, (seen.get(k) || 0) + 1);
            });

            // Price changes come straight from the audit trail.
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

    const groups = useMemo(() => {
        const groupKey = (r: MergedRow): string => {
            switch (groupBy) {
                case "trainer": return r.trainerName || "Unassigned";
                case "course": return r.provider || "Other";
                case "status": return r.status;
                case "price":
                    return PRICE_BUCKETS.find((b) => b.match(r.price))?.key || "free";
            }
        };
        const label = (key: string): string => {
            if (groupBy === "status") return key;
            if (groupBy === "price") return PRICE_BUCKETS.find((b) => b.key === key)?.label || key;
            return key;
        };
        const map = new Map<string, MergedRow[]>();
        rows.forEach((r) => {
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
            // Default: most revenue first.
            return (map.get(b)!.reduce((s, x) => s + x.revenue, 0)) - (map.get(a)!.reduce((s, x) => s + x.revenue, 0));
        });
        return keys.map((k) => ({
            key: k,
            label: label(k),
            items: map.get(k)!,
            count: map.get(k)!.length,
            revenue: map.get(k)!.reduce((s, x) => s + x.revenue, 0),
        }));
    }, [rows, groupBy]);

    const totals = useMemo(() => ({
        total: rows.length,
        published: rows.filter((r) => r.status === "Published").length,
        pending: rows.filter((r) => r.status === "Review").length,
        revenue: rows.reduce((s, r) => s + r.revenue, 0),
        paidSeats: rows.reduce((s, r) => s + r.paidEnrollments, 0),
        flags: rows.filter((r) => r.duplicate || r.priceChanged || r.highPrice).length,
    }), [rows]);

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

    const StatCard = ({ label, value, sub, icon: Icon }: { label: string; value: string; sub?: string; icon: any }) => (
        <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-5 flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
                    <p className="mt-1 font-display text-2xl font-bold tracking-tight tabular-nums">{value}</p>
                    {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="px-4 md:px-8 py-8 md:py-10">
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
                {/* Header band */}
                <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-6 md:p-8">
                    <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
                    <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div className="space-y-1.5">
                            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Trainer course pipeline
                            </p>
                            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Training Review &amp; Finance</h1>
                            <p className="text-muted-foreground">
                                Every trainer-submitted course, grouped and audited — full CRUD, pricing control and transparency.
                            </p>
                        </div>
                        <Link to="/admin/training/create" className="self-start md:self-auto">
                            <Button className="gap-2 rounded-xl min-h-[44px] bg-primary text-primary-foreground shadow-inset-btn hover:bg-brand-600 focus-visible:ring-2 focus-visible:ring-ring">
                                <GraduationCap className="h-4 w-4" /> Create Course
                            </Button>
                        </Link>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" /> Loading training overview…
                    </div>
                ) : (
                    <>
                        {/* Finance summary */}
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
                            <StatCard label="Courses" value={String(totals.total)} icon={GraduationCap} />
                            <StatCard label="Published" value={String(totals.published)} icon={CheckCircle2} />
                            <StatCard label="In review" value={String(totals.pending)} icon={Eye} />
                            <StatCard label="Revenue (paid)" value={fmtINR(totals.revenue)} icon={IndianRupee} />
                            <StatCard label="Paid seats" value={String(totals.paidSeats)} icon={Users} />
                            <StatCard label="Flags" value={String(totals.flags)} icon={FileWarning} sub="duplicates · price edits" />
                        </div>

                        {/* Group-by toggle */}
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground">Group by</span>
                            {GROUP_OPTIONS.map((o) => (
                                <button
                                    key={o.key}
                                    onClick={() => setGroupBy(o.key)}
                                    aria-pressed={groupBy === o.key}
                                    className={cn(
                                        "min-h-[40px] rounded-xl border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                        groupBy === o.key
                                            ? "border-primary bg-primary text-primary-foreground shadow-inset-btn"
                                            : "border-border bg-card text-muted-foreground hover:border-brand-200 hover:text-foreground"
                                    )}
                                >
                                    {o.label}
                                </button>
                            ))}
                        </div>

                        {/* Grouped sections */}
                        {groups.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
                                No trainings yet. Courses created by approved trainers will appear here.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {groups.map((g) => (
                                    <section key={g.key} className="rounded-2xl border border-border bg-card overflow-hidden">
                                        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-brand-50/50 px-5 py-3">
                                            <div className="flex items-center gap-2">
                                                <h2 className="font-display text-base font-semibold tracking-tight">{g.label}</h2>
                                                <Badge variant="outline" className="text-xs">{g.count} course{g.count !== 1 ? "s" : ""}</Badge>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm">
                                                <span className="text-muted-foreground">{g.count === 1 ? "1 course" : `${g.count} courses`}</span>
                                                <span className="text-muted-foreground">·</span>
                                                <span className="inline-flex items-center gap-1 font-medium">
                                                    <IndianRupee className="h-3.5 w-3.5 text-primary" /> {fmtINR(g.revenue)}
                                                </span>
                                            </div>
                                        </header>

                                        <div className="divide-y divide-border">
                                            {g.items.map((r) => (
                                                <div key={r.id} className="flex flex-col md:flex-row md:items-center gap-3 px-5 py-4">
                                                    {/* Identity */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="font-medium text-sm truncate">{r.courseName || "Untitled course"}</span>
                                                            <Badge className={cn("text-xs", statusTone(r.status))}>{r.status}</Badge>
                                                            {r.visibility === "private" && <Badge variant="outline" className="text-xs">Private</Badge>}
                                                        </div>
                                                        <p className="mt-0.5 text-xs text-muted-foreground truncate">
                                                            {r.provider || "Other provider"} · {r.trainerName || "No trainer"}
                                                        </p>
                                                        {/* Anti-cheat flags */}
                                                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                            {r.duplicate && (
                                                                <Badge className="bg-amber-500/10 text-amber-600 text-[11px] gap-1">
                                                                    <Copy className="h-3 w-3" /> Possible duplicate
                                                                </Badge>
                                                            )}
                                                            {r.priceChanged && (
                                                                <Badge className="bg-amber-500/10 text-amber-600 text-[11px] gap-1">
                                                                    <History className="h-3 w-3" /> Price changed
                                                                </Badge>
                                                            )}
                                                            {r.highPrice && (
                                                                <Badge className="bg-red-500/10 text-red-600 text-[11px] gap-1">
                                                                    <AlertTriangle className="h-3 w-3" /> Unusually high price
                                                                </Badge>
                                                            )}
                                                            {r.reviewStatus === "pending" && (
                                                                <Badge className="bg-blue-500/10 text-primary text-[11px] gap-1">
                                                                    <Eye className="h-3 w-3" /> Awaiting review
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Price + revenue */}
                                                    <div className="flex md:flex-col md:items-end gap-4 md:gap-0.5 md:w-40 shrink-0">
                                                        <div className="text-sm font-semibold tabular-nums">{fmtINR(r.price)}</div>
                                                        <div className="text-xs text-muted-foreground tabular-nums">
                                                            {r.paidEnrollments} paid · {r.freeEnrollments} free
                                                        </div>
                                                        <div className="text-xs font-medium text-primary tabular-nums">
                                                            {fmtINR(r.revenue)} earned
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" aria-label={`Actions for ${r.courseName}`} className="h-10 w-10 rounded-xl shrink-0">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-52">
                                                            <DropdownMenuItem asChild>
                                                                <Link to={`/admin/training/edit/${r.id}`}><Pencil className="mr-2 h-4 w-4" /> Edit course</Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => openAudit(r)}>
                                                                <History className="mr-2 h-4 w-4" /> View audit log
                                                            </DropdownMenuItem>
                                                            {r.status === "Review" && (
                                                                <>
                                                                    <DropdownMenuItem onClick={() => handleApprove(r)}>
                                                                        <CheckCircle2 className="mr-2 h-4 w-4 text-success" /> Approve &amp; publish
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleReject(r)}>
                                                                        <XCircle className="mr-2 h-4 w-4 text-destructive" /> Reject
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(r)}>
                                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Audit dialog */}
                <Dialog open={!!auditFor} onOpenChange={(o) => { if (!o) setAuditFor(null); }}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Audit log — {auditFor?.courseName}</DialogTitle>
                            <DialogDescription>
                                Every create, edit, submit, approval and price change on this course.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="max-h-[60vh] overflow-auto space-y-2">
                            {isAuditLoading ? (
                                <div className="flex items-center gap-2 py-8 text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                                </div>
                            ) : audits.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">No changes recorded yet.</p>
                            ) : (
                                audits.map((a) => (
                                    <div key={a.id} className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                                            {a.action === "approved" ? <CheckCircle2 className="h-4 w-4" />
                                                : a.action === "rejected" || a.action === "deleted" ? <XCircle className="h-4 w-4" />
                                                    : <History className="h-4 w-4" />}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 text-sm">
                                                <span className="font-medium capitalize">{a.action.replace(/_/g, " ")}</span>
                                                {a.actorName && <span className="text-muted-foreground">by {a.actorName}</span>}
                                                <Badge variant="outline" className="text-[10px]">{a.actorRole}</Badge>
                                            </div>
                                            {(a.oldValue != null || a.newValue != null) && (
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    <span className="text-muted-foreground/70">{a.field}:</span>{" "}
                                                    {a.oldValue != null && <span className="line-through opacity-60">{a.oldValue}</span>}
                                                    {a.oldValue != null && a.newValue != null && <span> → </span>}
                                                    {a.newValue != null && <span className="font-medium">{a.newValue}</span>}
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
