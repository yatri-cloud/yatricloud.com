import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2, Users, Calendar, GraduationCap, Handshake, Receipt, IndianRupee, TicketCheck, ArrowRight, UserPlus, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/admin/StatsCard";
import { getAdminOverview, getRecentActivity, getGrowthTrends, type AdminOverview, type RecentActivity, type GrowthTrends, type Trend } from "@/lib/admin-overview";
import { formatInvoiceMoney } from "@/lib/invoices-api";
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

const QUICK_LINKS = [
    { name: "Payments & Revenue", path: "/admin/payments", description: "Receipts and revenue in one place." },
    { name: "Transactions", path: "/admin/transactions", description: "All payments, with refunds." },
    { name: "Razorpay Invoices", path: "/admin/razorpay-invoices", description: "Raise and track invoices." },
    { name: "All Events", path: "/admin/events", description: "Create and manage events." },
    { name: "Course list", path: "/admin/training", description: "Manage training courses." },
    { name: "Site & Homepage", path: "/admin/site", description: "Edit site wide content." },
];

export default function AdminOverview() {
    const [data, setData] = useState<AdminOverview | null>(null);
    const [activity, setActivity] = useState<RecentActivity | null>(null);
    const [trends, setTrends] = useState<GrowthTrends | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const [overview, recent, growth] = await Promise.all([getAdminOverview(), getRecentActivity(), getGrowthTrends()]);
                setData(overview);
                setActivity(recent);
                setTrends(growth);
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    const otherRevenue = data ? Object.entries(data.otherRevenue) : [];

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
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        <StatsCard title="Revenue in INR" value={formatInvoiceMoney(data.inrRevenue, "INR")} icon={IndianRupee} color="bg-emerald-500/10 text-emerald-600" />
                        <StatsCard title="Receipts" value={data.receipts} icon={Receipt} color="bg-primary/10 text-primary" />
                        <StatsCard title="Registered Yatris" value={data.yatris} icon={Users} color="bg-blue-500/10 text-blue-600" />
                        <StatsCard title="Mentorship bookings" value={data.mentorshipBookings} icon={Handshake} color="bg-amber-500/10 text-amber-600" />
                        <StatsCard title="Events" value={data.events} icon={Calendar} color="bg-violet-500/10 text-violet-600" />
                        <StatsCard title="Event registrations" value={data.eventRegistrations} icon={TicketCheck} color="bg-rose-500/10 text-rose-600" />
                        <StatsCard title="Trainings" value={data.trainings} icon={GraduationCap} color="bg-cyan-500/10 text-cyan-600" />
                        <StatsCard title="Enrollments" value={data.enrollments} icon={Users} color="bg-teal-500/10 text-teal-600" />
                    </div>

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

                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                        {/* Recent receipts */}
                        <Card>
                            <CardHeader className="flex-row items-center justify-between space-y-0">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Receipt className="h-4 w-4 text-primary" aria-hidden="true" /> Recent receipts
                                </CardTitle>
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

                        {/* Newest Yatris */}
                        <Card>
                            <CardHeader className="space-y-0">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <UserPlus className="h-4 w-4 text-primary" aria-hidden="true" /> New Yatris
                                </CardTitle>
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

                    <div>
                        <h2 className="mb-4 text-lg font-bold">Jump to</h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {QUICK_LINKS.map((link) => (
                                <Link key={link.path} to={link.path}>
                                    <Card className="group h-full transition-colors hover:border-primary/40 hover:bg-brand-50/40">
                                        <CardContent className="flex items-start justify-between gap-3 p-5">
                                            <div>
                                                <div className="font-semibold">{link.name}</div>
                                                <div className="mt-0.5 text-sm text-muted-foreground">{link.description}</div>
                                            </div>
                                            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
