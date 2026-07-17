import { useState, useEffect, useMemo } from "react";
import { Loader2, Search, Users, UserCheck, Download, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ListPager } from "@/components/ui/list-pager";
import { StatsCard } from "@/components/admin/StatsCard";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format, startOfMonth, subMonths } from "date-fns";

const PAGE_SIZE = 15;

interface YatriRow {
    id: string;
    full_name: string;
    email: string;
    role: string;
    phone: string | null;
    city: string | null;
    created_at: string;
}

type RoleFilter = "all" | "user" | "admin" | "trainer" | "mentor";
type SortKey = "newest" | "oldest" | "name-asc" | "name-desc";

const ROLE_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    admin: { label: "Admin", variant: "destructive" },
    trainer: { label: "Trainer", variant: "default" },
    mentor: { label: "Mentor", variant: "default" },
    user: { label: "User", variant: "secondary" },
};

export default function AdminYatris() {
    const [users, setUsers] = useState<YatriRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
    const [sort, setSort] = useState<SortKey>("newest");
    const [page, setPage] = useState(1);

    // Stats
    const [totalCount, setTotalCount] = useState(0);
    const [newThisMonth, setNewThisMonth] = useState(0);

    useEffect(() => { setPage(1); }, [search, roleFilter, sort]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("id, full_name, email, role, city, created_at")
                .order("created_at", { ascending: false })
                .limit(5000);
            if (error) throw error;
            const rows: YatriRow[] = (data || []).map((r: any) => ({
                id: r.id,
                full_name: String(r.full_name || "").trim() || "Yatri",
                email: String(r.email || ""),
                role: String(r.role || "user"),
                phone: null,
                city: r.city || null,
                created_at: String(r.created_at || ""),
            }));
            setUsers(rows);
            setTotalCount(rows.length);

            // Count new this month
            const monthStart = startOfMonth(new Date()).toISOString();
            setNewThisMonth(rows.filter(r => r.created_at >= monthStart).length);
        } catch (e: any) {
            toast.error("Failed to load users: " + (e?.message || "Unknown error"));
        } finally {
            setLoading(false);
        }
    };

    const q = search.trim().toLowerCase();

    const filtered = useMemo(() => {
        let list = users;
        // Role filter
        if (roleFilter !== "all") {
            list = list.filter(u => u.role === roleFilter);
        }
        // Search
        if (q) {
            list = list.filter(u =>
                u.full_name.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                (u.city || "").toLowerCase().includes(q) ||
                (u.phone || "").includes(q)
            );
        }
        // Sort
        const sorted = [...list];
        switch (sort) {
            case "oldest":
                sorted.sort((a, b) => a.created_at.localeCompare(b.created_at));
                break;
            case "name-asc":
                sorted.sort((a, b) => a.full_name.localeCompare(b.full_name));
                break;
            case "name-desc":
                sorted.sort((a, b) => b.full_name.localeCompare(a.full_name));
                break;
            default: // newest — already sorted from DB
                break;
        }
        return sorted;
    }, [users, roleFilter, q, sort]);

    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, pageCount);
    const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const roleCounts = useMemo(() => {
        const counts: Record<string, number> = { user: 0, admin: 0, trainer: 0, mentor: 0 };
        for (const u of users) {
            counts[u.role] = (counts[u.role] || 0) + 1;
        }
        return counts;
    }, [users]);

    const handleExportCsv = () => {
        const headers = ["Name", "Email", "Role", "Phone", "City", "Joined"];
        const rows = filtered.map(u => [
            u.full_name,
            u.email,
            u.role,
            u.phone || "",
            u.city || "",
            u.created_at ? format(new Date(u.created_at), "yyyy-MM-dd") : "",
        ]);
        const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `yatris-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Exported ${filtered.length} users`);
    };

    const handleSendEmail = (email: string) => {
        window.open(`mailto:${email}`, "_blank");
    };

    return (
        <div className="px-4 md:px-8 py-8 md:py-10 max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in">
            {/* Header band */}
            <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-6 md:p-8">
                <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
                <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-brand-200/20 blur-3xl" />

                <div className="relative space-y-1.5">
                    <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Users
                    </p>
                    <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">All Yatris</h1>
                    <p className="text-muted-foreground">View and manage every registered user on the platform.</p>
                </div>

                {/* Stats inside header */}
                <div className="relative mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <StatsCard title="Total users" value={totalCount} icon={Users} color="bg-blue-500/10 text-blue-600" />
                    <StatsCard title="New this month" value={newThisMonth} icon={UserCheck} color="bg-emerald-500/10 text-emerald-600" />
                    <StatsCard title="Trainers" value={roleCounts.trainer || 0} icon={Users} color="bg-violet-500/10 text-violet-600" />
                    <StatsCard title="Mentors" value={roleCounts.mentor || 0} icon={Users} color="bg-amber-500/10 text-amber-600" />
                </div>
            </div>

            {/* Filters bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 items-center gap-3">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search name, email, city..."
                            className="pl-9 rounded-xl"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
                        <SelectTrigger className="w-36 rounded-xl">
                            <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All roles</SelectItem>
                            <SelectItem value="user">Users</SelectItem>
                            <SelectItem value="trainer">Trainers</SelectItem>
                            <SelectItem value="mentor">Mentors</SelectItem>
                            <SelectItem value="admin">Admins</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                        <SelectTrigger className="w-36 rounded-xl">
                            <SelectValue placeholder="Sort" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Newest first</SelectItem>
                            <SelectItem value="oldest">Oldest first</SelectItem>
                            <SelectItem value="name-asc">Name A–Z</SelectItem>
                            <SelectItem value="name-desc">Name Z–A</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button variant="outline" className="rounded-xl" onClick={handleExportCsv}>
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                </Button>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : filtered.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Users className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                        <p className="text-muted-foreground">{q || roleFilter !== "all" ? "No users match your filters." : "No registered users yet."}</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="rounded-2xl border border-border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead className="hidden md:table-cell">City</TableHead>
                                    <TableHead className="hidden lg:table-cell">Phone</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="w-16">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paged.map(user => {
                                    const badge = ROLE_BADGE[user.role] || ROLE_BADGE.user;
                                    return (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.full_name}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant={badge.variant} className="text-xs capitalize">{badge.label}</Badge>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{user.city || "—"}</TableCell>
                                            <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{user.phone || "—"}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground tabular-nums">
                                                {user.created_at ? format(new Date(user.created_at), "dd MMM yyyy") : "—"}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                    title={`Email ${user.full_name}`}
                                                    onClick={() => handleSendEmail(user.email)}
                                                >
                                                    <Mail className="h-4 w-4" />
                                                    <span className="sr-only">Email {user.full_name}</span>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} users
                        </p>
                        <ListPager page={currentPage} pageCount={pageCount} onPageChange={setPage} />
                    </div>
                </>
            )}
        </div>
    );
}
