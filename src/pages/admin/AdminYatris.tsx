import { useState, useEffect, useMemo } from "react";
import {
    Loader2, Search, Users, UserCheck, Download, Mail,
    ShieldAlert, Ban, CheckCircle2, Trash2,
    Calendar, ArrowUpDown, Filter, ShieldCheck, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListPager } from "@/components/ui/list-pager";
import { StatsCard } from "@/components/admin/StatsCard";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format, startOfMonth, startOfYear, subDays } from "date-fns";

export interface YatriRow {
    id: string;
    full_name: string;
    email: string;
    role: string;
    photo_url: string | null;
    country: string | null;
    state_province: string | null;
    city: string | null;
    country_code: string | null;
    phone_number: string | null;
    linkedin_url: string | null;
    interested_certifications: string[] | null;
    created_at: string;
}

type RoleFilter = "all" | "user" | "admin" | "trainer" | "mentor" | "disabled";
type DateFilter = "all" | "1d" | "7d" | "30d" | "90d" | "365d" | "this_year";
type SortKey = "newest" | "oldest" | "name-asc" | "name-desc";

const ROLE_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    admin: { label: "Admin", variant: "destructive" },
    trainer: { label: "Trainer", variant: "default" },
    mentor: { label: "Mentor", variant: "default" },
    user: { label: "Yatri", variant: "secondary" },
    yatri: { label: "Yatri", variant: "secondary" },
    disabled: { label: "Disabled", variant: "outline" },
};

export default function AdminYatris() {
    const [users, setUsers] = useState<YatriRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
    const [dateFilter, setDateFilter] = useState<DateFilter>("all");
    const [sort, setSort] = useState<SortKey>("newest");
    const [pageSize, setPageSize] = useState<number>(15);
    const [page, setPage] = useState(1);

    // Active tab
    const [activeTab, setActiveTab] = useState<"directory" | "moderation">("directory");

    // Moderation section state
    const [moderationSearch, setModerationSearch] = useState("");
    const [selectedUser, setSelectedUser] = useState<YatriRow | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [userToDelete, setUserToDelete] = useState<YatriRow | null>(null);
    const [isDeletingUser, setIsDeletingUser] = useState(false);

    // Stats
    const [totalCount, setTotalCount] = useState(0);
    const [newThisMonth, setNewThisMonth] = useState(0);

    useEffect(() => { setPage(1); }, [search, roleFilter, dateFilter, sort, pageSize]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("id, full_name, email, role, photo_url, country, state_province, city, country_code, phone_number, linkedin_url, interested_certifications, created_at")
                .order("created_at", { ascending: false })
                .limit(5000);

            if (error) throw error;

            const rows: YatriRow[] = (data || []).map((r: any) => ({
                id: r.id,
                full_name: String(r.full_name || "").trim() || "Yatri",
                email: String(r.email || ""),
                role: String(r.role || "yatri").toLowerCase(),
                photo_url: r.photo_url || null,
                country: r.country || null,
                state_province: r.state_province || null,
                city: r.city || null,
                country_code: r.country_code || null,
                phone_number: r.phone_number || null,
                linkedin_url: r.linkedin_url || null,
                interested_certifications: Array.isArray(r.interested_certifications) ? r.interested_certifications : null,
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
            if (roleFilter === "user") {
                list = list.filter(u => u.role === "user" || u.role === "yatri");
            } else {
                list = list.filter(u => u.role === roleFilter);
            }
        }

        // Date range filter
        if (dateFilter !== "all") {
            const now = new Date();
            let threshold: Date;
            if (dateFilter === "1d") {
                threshold = subDays(now, 1);
            } else if (dateFilter === "7d") {
                threshold = subDays(now, 7);
            } else if (dateFilter === "30d") {
                threshold = subDays(now, 30);
            } else if (dateFilter === "90d") {
                threshold = subDays(now, 90);
            } else if (dateFilter === "365d") {
                threshold = subDays(now, 365);
            } else if (dateFilter === "this_year") {
                threshold = startOfYear(now);
            } else {
                threshold = new Date(0);
            }
            const thresholdIso = threshold.toISOString();
            list = list.filter(u => u.created_at >= thresholdIso);
        }

        // Search
        if (q) {
            list = list.filter(u =>
                u.full_name.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                (u.city || "").toLowerCase().includes(q) ||
                (u.state_province || "").toLowerCase().includes(q) ||
                (u.country || "").toLowerCase().includes(q) ||
                (u.phone_number || "").includes(q) ||
                (u.country_code || "").includes(q)
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
            default: // newest
                sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
                break;
        }
        return sorted;
    }, [users, roleFilter, dateFilter, q, sort]);

    const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
    const currentPage = Math.min(page, pageCount);
    const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const roleCounts = useMemo(() => {
        const counts: Record<string, number> = { user: 0, admin: 0, trainer: 0, mentor: 0, disabled: 0 };
        for (const u of users) {
            const r = (u.role === "yatri" ? "user" : u.role) as keyof typeof counts;
            counts[r] = (counts[r] || 0) + 1;
        }
        return counts;
    }, [users]);

    // Moderation search list
    const moderationResults = useMemo(() => {
        if (!moderationSearch.trim()) return users.slice(0, 10);
        const query = moderationSearch.trim().toLowerCase();
        return users.filter(u =>
            u.full_name.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query) ||
            (u.phone_number || "").includes(query)
        ).slice(0, 20);
    }, [users, moderationSearch]);

    // Toggle user disabled status
    const handleToggleDisableUser = async (user: YatriRow) => {
        setIsUpdatingStatus(true);
        try {
            const isCurrentlyDisabled = user.role === "disabled";
            const newRole = isCurrentlyDisabled ? "yatri" : "disabled";

            const { error } = await supabase
                .from("profiles")
                .update({ role: newRole })
                .eq("id", user.id);

            if (error) throw error;

            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
            if (selectedUser?.id === user.id) {
                setSelectedUser(prev => prev ? { ...prev, role: newRole } : null);
            }

            toast.success(isCurrentlyDisabled ? `User ${user.full_name} has been enabled.` : `User ${user.full_name} has been disabled.`);
        } catch (err: any) {
            toast.error("Failed to update status: " + (err.message || "Unknown error"));
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    // Permanently Delete User
    const handleConfirmDeleteUser = async () => {
        if (!userToDelete) return;
        setIsDeletingUser(true);
        try {
            // Delete child table records
            await supabase.from("certifications").delete().eq("user_id", userToDelete.id);
            await supabase.from("event_registrations").delete().eq("user_id", userToDelete.id);
            await supabase.from("training_enrollments").delete().eq("user_id", userToDelete.id);

            // Delete profile
            const { error } = await supabase.from("profiles").delete().eq("id", userToDelete.id);
            if (error) throw error;

            setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
            if (selectedUser?.id === userToDelete.id) {
                setSelectedUser(null);
            }

            toast.success(`User ${userToDelete.full_name} (${userToDelete.email}) permanently deleted.`);
            setUserToDelete(null);
        } catch (err: any) {
            toast.error("Failed to delete user: " + (err.message || "Unknown error"));
        } finally {
            setIsDeletingUser(false);
        }
    };

    const handleExportCsv = () => {
        const headers = ["Name", "Email", "Role", "Country Code", "Phone", "Country", "State", "City", "LinkedIn", "Joined"];
        const rows = filtered.map(u => [
            u.full_name,
            u.email,
            u.role,
            u.country_code || "",
            u.phone_number || "",
            u.country || "",
            u.state_province || "",
            u.city || "",
            u.linkedin_url || "",
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
        <div className="space-y-6 md:space-y-8 animate-in fade-in">
            {/* Header band */}
            <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-6 md:p-8">
                <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
                <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-brand-200/20 blur-3xl" />

                <div className="relative space-y-1.5">
                    <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">All Yatris & Users</h1>
                    <p className="text-sm text-muted-foreground">Manage user directory, profiles, access permissions, and account records.</p>
                </div>

                {/* Stats inside header */}
                <div className="relative mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <StatsCard title="Total users" value={totalCount} icon={Users} color="bg-blue-500 text-white border-0" />
                    <StatsCard title="New this month" value={newThisMonth} icon={UserCheck} color="bg-emerald-500 text-white border-0" />
                    <StatsCard title="Trainers" value={roleCounts.trainer || 0} icon={Users} color="bg-violet-500/10 text-violet-600" />
                </div>
            </div>

            {/* Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border">
                    <TabsList className="bg-muted/80 p-1 rounded-xl">
                        <TabsTrigger value="directory" className="rounded-lg px-4 py-2 font-medium">
                            Directory & Profiles ({filtered.length})
                        </TabsTrigger>
                        <TabsTrigger value="moderation" className="rounded-lg px-4 py-2 font-medium data-[state=active]:bg-destructive data-[state=active]:text-white">
                            User Moderation & Access Control
                        </TabsTrigger>
                    </TabsList>

                    {activeTab === "directory" && (
                        <Button variant="outline" className="rounded-xl shrink-0" onClick={handleExportCsv}>
                            <Download className="mr-2 h-4 w-4" /> Export CSV
                        </Button>
                    )}
                </div>

                {/* TAB 1: ALL YATRIS DIRECTORY */}
                <TabsContent value="directory" className="space-y-4 pt-4">
                    {/* Filters Bar */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border/80 shadow-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search name, email, city, phone..."
                                    className="pl-9 rounded-xl"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>

                            {/* Role Filter */}
                            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
                                <SelectTrigger className="rounded-xl">
                                    <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                                    <SelectValue placeholder="Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All roles</SelectItem>
                                    <SelectItem value="user">Yatris / Users</SelectItem>
                                    <SelectItem value="trainer">Trainers</SelectItem>
                                    <SelectItem value="mentor">Mentors</SelectItem>
                                    <SelectItem value="admin">Admins</SelectItem>
                                    <SelectItem value="disabled">Disabled Accounts</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Date Filter */}
                            <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
                                <SelectTrigger className="rounded-xl">
                                    <Calendar className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                                    <SelectValue placeholder="Joined Timeline" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Time (Lifetime)</SelectItem>
                                    <SelectItem value="1d">Last 24 Hours (Today)</SelectItem>
                                    <SelectItem value="7d">Last 7 Days</SelectItem>
                                    <SelectItem value="30d">Last 30 Days (Month)</SelectItem>
                                    <SelectItem value="90d">Last 90 Days (Quarter)</SelectItem>
                                    <SelectItem value="365d">Past Year (12 Months)</SelectItem>
                                    <SelectItem value="this_year">This Year</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Sort */}
                            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                                <SelectTrigger className="rounded-xl">
                                    <ArrowUpDown className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
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

                        {/* Rows Per Page Selector */}
                        <div className="flex items-center gap-2 justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-border/60">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">Per page:</span>
                            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                                <SelectTrigger className="w-24 h-9 rounded-xl text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="15">15</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                    <SelectItem value="250">250</SelectItem>
                                    <SelectItem value="1000">All</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Table View */}
                    {loading ? (
                        <div className="flex justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <Card className="rounded-2xl border-border/80">
                            <CardContent className="py-12 text-center">
                                <Users className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                                <p className="text-muted-foreground">
                                    {q || roleFilter !== "all" || dateFilter !== "all"
                                        ? "No users match your applied filters."
                                        : "No registered users found."}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            <div className="rounded-2xl border border-border/80 overflow-hidden bg-card shadow-sm">
                                <Table>
                                    <TableHeader className="bg-muted/40">
                                        <TableRow>
                                            <TableHead className="w-64">User & Name</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead className="hidden md:table-cell">Location</TableHead>
                                            <TableHead className="hidden lg:table-cell">Phone</TableHead>
                                            <TableHead className="text-center w-20">LinkedIn</TableHead>
                                            <TableHead>Joined</TableHead>
                                            <TableHead className="w-20 text-right">Contact</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paged.map(user => {
                                            const badge = ROLE_BADGE[user.role] || ROLE_BADGE.user;
                                            const locationText = [user.city, user.state_province, user.country]
                                                .filter(Boolean)
                                                .join(", ");
                                            const fullPhone = user.phone_number
                                                ? `${user.country_code ? user.country_code + " " : ""}${user.phone_number}`
                                                : "—";

                                            return (
                                                <TableRow key={user.id} className="hover:bg-muted/30">
                                                    {/* User & Name */}
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            {user.photo_url ? (
                                                                <img
                                                                    src={user.photo_url}
                                                                    alt={user.full_name}
                                                                    referrerPolicy="no-referrer"
                                                                    crossOrigin="anonymous"
                                                                    onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                                                                    className="w-9 h-9 rounded-full object-cover border border-border shadow-xs shrink-0 bg-muted"
                                                                />
                                                            ) : (
                                                                <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 font-bold text-xs text-primary">
                                                                    {user.full_name.charAt(0).toUpperCase()}
                                                                </div>
                                                            )}
                                                            <div className="min-w-0">
                                                                <p className="font-semibold text-sm truncate text-foreground">{user.full_name}</p>
                                                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* Role */}
                                                    <TableCell>
                                                        <Badge variant={badge.variant} className="text-xs capitalize font-medium">
                                                            {badge.label}
                                                        </Badge>
                                                    </TableCell>

                                                    {/* Location */}
                                                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground max-w-[180px] truncate">
                                                        {locationText || "—"}
                                                    </TableCell>

                                                    {/* Phone */}
                                                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground font-mono">
                                                        {fullPhone}
                                                    </TableCell>

                                                    {/* LinkedIn Profile Icon */}
                                                    <TableCell className="text-center">
                                                        {user.linkedin_url ? (
                                                            <a
                                                                href={user.linkedin_url.startsWith("http") ? user.linkedin_url : `https://${user.linkedin_url}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                title={`View ${user.full_name}'s LinkedIn Profile`}
                                                                className="inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-muted/80 transition-transform duration-200 hover:scale-110"
                                                            >
                                                                <img
                                                                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/LinkedIn_logo_initials.png/500px-LinkedIn_logo_initials.png?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=thumbnail"
                                                                    alt="LinkedIn"
                                                                    className="w-4 h-4 object-contain"
                                                                    width={16}
                                                                    height={16}
                                                                />
                                                            </a>
                                                        ) : (
                                                            <span className="text-muted-foreground/40 text-xs">—</span>
                                                        )}
                                                    </TableCell>

                                                    {/* Joined Date */}
                                                    <TableCell className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                                                        {user.created_at ? format(new Date(user.created_at), "dd MMM yyyy") : "—"}
                                                    </TableCell>

                                                    {/* Quick Email */}
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-primary rounded-lg"
                                                            title={`Send email to ${user.email}`}
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

                            {/* Pagination and Range Info */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                    Showing <span className="font-semibold text-foreground">{(currentPage - 1) * pageSize + 1}</span>–<span className="font-semibold text-foreground">{Math.min(currentPage * pageSize, filtered.length)}</span> of <span className="font-semibold text-foreground">{filtered.length}</span> users
                                </p>
                                <ListPager page={currentPage} pageCount={pageCount} onPageChange={setPage} />
                            </div>
                        </>
                    )}
                </TabsContent>

                {/* TAB 2: DEDICATED USER MODERATION & ACCESS CONTROL SECTION */}
                <TabsContent value="moderation" className="space-y-6 pt-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left Side: Search & Filter Users */}
                        <div className="lg:col-span-5 space-y-4">
                            <Card className="rounded-2xl border-border/80 shadow-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg font-bold">Search User to Manage</CardTitle>
                                    <CardDescription className="text-xs">
                                        Search by name, email, or phone to inspect, disable, or delete a specific account safely.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Type name or email..."
                                            className="pl-9 rounded-xl"
                                            value={moderationSearch}
                                            onChange={e => setModerationSearch(e.target.value)}
                                        />
                                    </div>

                                    <div className="rounded-xl border border-border/60 max-h-[380px] overflow-y-auto divide-y divide-border/60 bg-muted/20">
                                        {moderationResults.length === 0 ? (
                                            <div className="p-4 text-center text-xs text-muted-foreground">
                                                No users found matching "{moderationSearch}"
                                            </div>
                                        ) : (
                                            moderationResults.map(u => {
                                                const isSelected = selectedUser?.id === u.id;
                                                const badge = ROLE_BADGE[u.role] || ROLE_BADGE.user;
                                                return (
                                                    <button
                                                        key={u.id}
                                                        type="button"
                                                        onClick={() => setSelectedUser(u)}
                                                        className={`w-full text-left p-3 flex items-center justify-between gap-3 transition-colors hover:bg-accent/40 ${isSelected ? "bg-primary/10 border-l-4 border-primary" : ""}`}
                                                    >
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-semibold text-xs truncate text-foreground">{u.full_name}</p>
                                                            <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                                                        </div>
                                                        <Badge variant={badge.variant} className="text-[10px] capitalize shrink-0">
                                                            {badge.label}
                                                        </Badge>
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Side: Selected User Moderation Panel */}
                        <div className="lg:col-span-7">
                            {selectedUser ? (
                                <Card className="rounded-2xl border-border/80 shadow-md">
                                    <CardHeader className="border-b border-border/60 pb-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                {selectedUser.photo_url ? (
                                                    <img
                                                        src={selectedUser.photo_url}
                                                        alt={selectedUser.full_name}
                                                        referrerPolicy="no-referrer"
                                                        crossOrigin="anonymous"
                                                        className="w-12 h-12 rounded-full object-cover border-2 border-primary/20 shadow-xs"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-base text-primary">
                                                        {selectedUser.full_name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <CardTitle className="text-lg font-bold">{selectedUser.full_name}</CardTitle>
                                                    <CardDescription className="text-xs font-mono">{selectedUser.email}</CardDescription>
                                                </div>
                                            </div>
                                            <Badge variant={selectedUser.role === "disabled" ? "outline" : "default"} className="text-xs capitalize">
                                                {selectedUser.role === "disabled" ? "Disabled Account" : `${selectedUser.role} Account`}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-6 pt-6">
                                        {/* User Details Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-muted/30 p-4 rounded-xl border border-border/60">
                                            <div>
                                                <p className="text-muted-foreground font-medium">User ID</p>
                                                <p className="font-mono text-[11px] truncate text-foreground mt-0.5">{selectedUser.id}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground font-medium">Joined Date</p>
                                                <p className="font-medium text-foreground mt-0.5">
                                                    {selectedUser.created_at ? format(new Date(selectedUser.created_at), "PPP p") : "—"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground font-medium">Phone</p>
                                                <p className="font-medium text-foreground mt-0.5">
                                                    {selectedUser.phone_number ? `${selectedUser.country_code || ""} ${selectedUser.phone_number}` : "—"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground font-medium">Location</p>
                                                <p className="font-medium text-foreground mt-0.5">
                                                    {[selectedUser.city, selectedUser.state_province, selectedUser.country].filter(Boolean).join(", ") || "—"}
                                                </p>
                                            </div>
                                            {selectedUser.linkedin_url && (
                                                <div className="sm:col-span-2">
                                                    <p className="text-muted-foreground font-medium">LinkedIn Profile</p>
                                                    <a
                                                        href={selectedUser.linkedin_url.startsWith("http") ? selectedUser.linkedin_url : `https://${selectedUser.linkedin_url}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary hover:underline inline-flex items-center gap-1 font-medium mt-0.5"
                                                    >
                                                        {selectedUser.linkedin_url}
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </div>
                                            )}
                                        </div>

                                        {/* Moderation Controls */}
                                        <div className="space-y-4 pt-2">
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                {/* Disable / Enable Button */}
                                                <Button
                                                    type="button"
                                                    variant={selectedUser.role === "disabled" ? "default" : "outline"}
                                                    disabled={isUpdatingStatus}
                                                    onClick={() => handleToggleDisableUser(selectedUser)}
                                                    className="flex-1 rounded-xl"
                                                >
                                                    {isUpdatingStatus ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                            Updating...
                                                        </>
                                                    ) : selectedUser.role === "disabled" ? (
                                                        <>
                                                            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" />
                                                            Enable Account
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Ban className="w-4 h-4 mr-2 text-amber-500" />
                                                            Disable User Access
                                                        </>
                                                    )}
                                                </Button>

                                                {/* Delete Button */}
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    disabled={isDeletingUser}
                                                    onClick={() => setUserToDelete(selectedUser)}
                                                    className="flex-1 rounded-xl"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Permanently Delete User
                                                </Button>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground">
                                                Disabling prevents the user from logging in or accessing certifications. Permanent deletion purges profile, certificates, and event registrations.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="rounded-2xl border-dashed border-border/80 p-8 text-center flex flex-col items-center justify-center min-h-[320px]">
                                    <ShieldCheck className="w-12 h-12 text-muted-foreground/40 mb-3" />
                                    <p className="font-semibold text-foreground">Select a User</p>
                                    <p className="text-xs text-muted-foreground max-w-sm mt-1">
                                        Choose any user from the left search list to view their credentials, toggle access, or delete their profile.
                                    </p>
                                </Card>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* DELETE USER CONFIRMATION MODAL */}
            <Dialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-destructive">Permanently Delete User?</DialogTitle>
                        <DialogDescription className="text-xs space-y-2 pt-2 text-muted-foreground">
                            <span>
                                Are you sure you want to permanently delete <strong className="text-foreground">{userToDelete?.full_name}</strong> ({userToDelete?.email})?
                            </span>
                            <span className="block p-2.5 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 text-xs mt-2">
                                <strong>Warning:</strong> This action cannot be undone. All linked certifications, event registrations, and profile records will be purged immediately.
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0 pt-3">
                        <Button
                            variant="outline"
                            onClick={() => setUserToDelete(null)}
                            disabled={isDeletingUser}
                            className="rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmDeleteUser}
                            disabled={isDeletingUser}
                            className="rounded-xl"
                        >
                            {isDeletingUser ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Confirm Delete User"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

