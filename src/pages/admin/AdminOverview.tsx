import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    Loader2, Users, Calendar, GraduationCap, Handshake, Receipt, IndianRupee,
    TicketCheck, ArrowRight, TrendingUp, TrendingDown, Minus, ShoppingBag,
    Briefcase, Inbox, UserCheck, Mail, Tag, AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/admin/StatsCard";
import {
    getAdminOverview, getRecentActivity, getGrowthTrends, getPendingAlerts, getRecentEnrollments,
    type AdminOverview, type RecentActivity, type GrowthTrends, type Trend, type PendingAlerts, type RecentEnrollment,
} from "@/lib/admin-overview";
import { formatInvoiceMoney } from "@/lib/invoices-api";
import { ADMIN_NAV_GROUPS } from "@/config/admin-nav";
import { format } from "date-fns";

/** A compact "this month" figure with a delta chip against last month. */
function TrendTile({ title, value, trend }: { title: string; value: string; trend: Trend }) {
    const diff = trend.thisMonth - trend.lastMonth;
    const pct = trend.lastMonth > 0 ? Math.round((diff / trend.lastMonth) * 100) : null;
    const up = diff > 0, flat = diff === 0;
    const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;
    const tone = flat ? "text-muted-foreground bg-muted" : up ? "text-emerald-600 bg-emerald-500/10" : "text-rose-600 bg-rose-500/10";
    const label = trend.lastMonth === 0
        ? (diff > 0 ? "new this month" : "vs last month")
        : `${pct! >= 0 ? "+" : ""}${pct}% vs last month`;
    return (
        <Card>
            <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
                <p className="mt-2 font-display text-3xl font-black tracking-tight tabular-nums">{value}</p>
                <span className={`mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}>
                    <Icon className="h-3 w-3" aria-hidden="true" /> {label}
                </span>
            </CardContent>
        </Card>
    );
}

/** A single alert row in the "Needs attention" band. */
function AlertRow({ count, label, to }: { count: number; label: string; to: string }) {
    if (count === 0) return null;
    return (
        <Link to={to} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-warning/10">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-warning/20 text-warning text-xs font-bold tabular-nums">{count}</span>
            <span className="text-foreground font-medium">{label}</span>
            <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        </Link>
    );
}

export default function AdminOverviewPage() {
    const [data, setData] = useState<AdminOverview | null>(null);
    const [activity, setActivity] = useState<RecentActivity | null>(null);
    const [trends, setTrends] = useState<GrowthTrends | null>(null);
    const [alerts, setAlerts] = useState<PendingAlerts | null>(null);
    const [enrollments, setEnrollments] = useState<RecentEnrollment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const [overview, recent, growth, pending, recentEnroll] = await Promise.all([
                    getAdminOverview(), getRecentActivity(), getGrowthTrends(), getPendingAlerts(), getRecentEnrollments(),
                ]);
                setData(overview);
                setActivity(recent);
                setTrends(growth);
                setAlerts(pending);
                setEnrollments(recentEnroll);
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    const otherRevenue = data ? Object.entries(data.otherRevenue) : [];
    const hasAlerts = alerts && (alerts.openTickets + alerts.pendingMentorApps + alerts.unverifiedAchievements + alerts.pendingInquiries) > 0;

    return (
        <div className="px-4 md:px-8 py-8 md:py-10 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="font-display text-3xl font-black tracking-tight">Overview</h1>
                <p className="mt-1 text-muted-foreground">
                    A quick pulse on Yatri Cloud, then jump straight to what you need.
                </p>
            </div>

            {isLoading || !data ? (
                <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
                <>
                    {/* ── Needs Attention ── */}
                    {hasAlerts && (
                        <Card className="border-warning/30 bg-warning/[0.04]">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />
                                    <span className="text-sm font-semibold">Needs attention</span>
                                </div>
                                <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-4">
                                    <AlertRow count={alerts!.openTickets} label="Open support tickets" to="/admin/tickets" />
                                    <AlertRow count={alerts!.pendingMentorApps} label="Pending mentor applications" to="/admin/mentorship/applications" />
                                    <AlertRow count={alerts!.unverifiedAchievements} label="Unverified achievements" to="/admin/achievements" />
                                    <AlertRow count={alerts!.pendingInquiries} label="Pending inquiries" to="/admin/inquiries" />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* ── Stats grid — 14 tiles ── */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        <StatsCard title="Revenue in INR" value={formatInvoiceMoney(data.inrRevenue, "INR")} icon={IndianRupee} color="bg-emerald-500/10 text-emerald-600" />
                        <StatsCard title="Receipts" value={data.receipts} icon={Receipt} color="bg-primary/10 text-primary" />
                        <StatsCard title="Registered Yatris" value={data.yatris} icon={Users} color="bg-blue-500/10 text-blue-600" />
                        <StatsCard title="Mentorship bookings" value={data.mentorshipBookings} icon={Handshake} color="bg-amber-500/10 text-amber-600" />
                        <StatsCard title="Events" value={data.events} icon={Calendar} color="bg-violet-500/10 text-violet-600" />
                        <StatsCard title="Event registrations" value={data.eventRegistrations} icon={TicketCheck} color="bg-rose-500/10 text-rose-600" />
                        <StatsCard title="Trainings" value={data.trainings} icon={GraduationCap} color="bg-cyan-500/10 text-cyan-600" />
                        <StatsCard title="Enrollments" value={data.enrollments} icon={Users} color="bg-teal-500/10 text-teal-600" />
                        <StatsCard title="Store products" value={data.products} icon={ShoppingBag} color="bg-orange-500/10 text-orange-600" />
                        <StatsCard title="Job postings" value={data.jobPostings} icon={Briefcase} color="bg-indigo-500/10 text-indigo-600" />
                        <StatsCard title="Support tickets" value={data.supportTickets} icon={Inbox} color="bg-pink-500/10 text-pink-600" />
                        <StatsCard title="Mentor applications" value={data.mentorApplications} icon={UserCheck} color="bg-lime-500/10 text-lime-600" />
                        <StatsCard title="Subscribers" value={data.subscribers} icon={Mail} color="bg-sky-500/10 text-sky-600" />
                        <StatsCard title="Coupons" value={data.coupons} icon={Tag} color="bg-fuchsia-500/10 text-fuchsia-600" />
                    </div>

                    {/* ── Trends ── */}
                    {trends && (
                        <div>
                            <h2 className="mb-4 text-lg font-bold">This month</h2>
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                                <TrendTile title="New Yatris" value={String(trends.yatris.thisMonth)} trend={trends.yatris} />
                                <TrendTile title="Revenue in INR" value={formatInvoiceMoney(trends.inrRevenue.thisMonth, "INR")} trend={trends.inrRevenue} />
                                <TrendTile title="Receipts" value={String(trends.receipts.thisMonth)} trend={trends.receipts} />
                            </div>
                        </div>
                    )}

                    {otherRevenue.length > 0 && (
                        <Card>
                            <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 py-4">
                                <span className="text-sm font-medium text-muted-foreground">Also earned in other currencies:</span>
                                {otherRevenue.map(([code, amt]) => (
                                    <span key={code} className="text-sm font-semibold">{formatInvoiceMoney(amt, code)}</span>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* ── Recent activity — 3-column ── */}
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                        {/* Recent receipts */}
                        <Card>
                            <CardHeader className="flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-base">Recent receipts</CardTitle>
                                <Link to="/admin/payments" className="text-sm font-medium text-primary hover:underline">View all</Link>
                            </CardHeader>
                            <CardContent className="space-y-1">
                                {activity && activity.receipts.length > 0 ? (
                                    activity.receipts.map((r, i) => (
                                        <Link
                                            key={r.number || i}
                                            to={r.number ? `/receipt/${r.number}` : "/admin/payments"}
                                            className="flex items-center justify-between gap-3 rounded-lg p-2.5 transition-colors hover:bg-brand-50/50"
                                        >
                                            <span className="min-w-0">
                                                <span className="block truncate font-medium">{r.label}</span>
                                                <span className="block text-xs text-muted-foreground">
                                                    {r.createdAt ? format(new Date(r.createdAt), "dd MMM yyyy") : ""}
                                                </span>
                                            </span>
                                            <span className="shrink-0 font-semibold">{formatInvoiceMoney(r.amount, r.currency)}</span>
                                        </Link>
                                    ))
                                ) : (
                                    <p className="py-6 text-center text-sm text-muted-foreground">No receipts yet.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent enrollments */}
                        <Card>
                            <CardHeader className="flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-base">Recent enrollments</CardTitle>
                                <Link to="/admin/enrollments" className="text-sm font-medium text-primary hover:underline">View all</Link>
                            </CardHeader>
                            <CardContent className="space-y-1">
                                {enrollments.length > 0 ? (
                                    enrollments.map((e, i) => (
                                        <div key={i} className="flex items-center justify-between gap-3 rounded-lg p-2.5">
                                            <span className="min-w-0">
                                                <span className="block truncate font-medium">{e.name}</span>
                                                <span className="block truncate text-xs text-muted-foreground">{e.course}</span>
                                            </span>
                                            <span className="shrink-0">
                                                <Badge variant="secondary" className="text-xs capitalize">{e.status}</Badge>
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="py-6 text-center text-sm text-muted-foreground">No enrollments yet.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Newest Yatris */}
                        <Card>
                            <CardHeader className="flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-base">New Yatris</CardTitle>
                                <Link to="/admin/yatris" className="text-sm font-medium text-primary hover:underline">View all</Link>
                            </CardHeader>
                            <CardContent className="space-y-1">
                                {activity && activity.yatris.length > 0 ? (
                                    activity.yatris.map((y, i) => (
                                        <div key={i} className="flex items-center justify-between gap-3 rounded-lg p-2.5">
                                            <span className="min-w-0">
                                                <span className="block truncate font-medium">{y.name}</span>
                                                <span className="block truncate text-xs text-muted-foreground">{y.email}</span>
                                            </span>
                                            <span className="shrink-0 text-xs text-muted-foreground">
                                                {y.createdAt ? format(new Date(y.createdAt), "dd MMM yyyy") : ""}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="py-6 text-center text-sm text-muted-foreground">No sign-ups yet.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── Jump to — every admin group ── */}
                    <div>
                        <h2 className="mb-4 text-lg font-bold">Jump to</h2>
                        <div className="space-y-6">
                            {ADMIN_NAV_GROUPS.map((group) => (
                                <div key={group.id}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <group.icon className="h-4 w-4 text-primary" aria-hidden="true" />
                                        <span className="text-sm font-semibold text-foreground">{group.label}</span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        {group.items.map((link) => (
                                            <Link key={link.path} to={link.path}>
                                                <Card className="group h-full transition-colors hover:border-primary/40 hover:bg-brand-50/40">
                                                    <CardContent className="flex items-start justify-between gap-3 p-4">
                                                        <div>
                                                            <div className="font-semibold text-sm">{link.name}</div>
                                                            {link.description && (
                                                                <div className="mt-0.5 text-xs text-muted-foreground">{link.description}</div>
                                                            )}
                                                        </div>
                                                        <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
                                                    </CardContent>
                                                </Card>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
