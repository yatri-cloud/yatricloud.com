/**
 * Admin mentorship overview — /admin/mentorship/overview.
 *
 * Read only. Platform wide analytics derived from the booking rows an admin
 * can already read per RLS: gross revenue, platform fees earned, bookings,
 * active mentors, top mentors by revenue, and revenue over the last six
 * months. Mirrors the AdminCertCatalog design system (brand header band,
 * eyebrow, card stats, tables with odd-row tints).
 */

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import {
    getMentorshipPlatformStats,
    type MentorshipPlatformStats,
} from "@/lib/mentorship";

const formatINR = (n: number) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;

const StatCard = ({ label, value }: { label: string; value: string }) => (
    <div className="rounded-2xl border border-brand-100 bg-card p-5 shadow-card">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">{label}</p>
        <p className="mt-1.5 font-display text-2xl font-bold tracking-tight">{value}</p>
    </div>
);

const AdminMentorshipOverview = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<MentorshipPlatformStats | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const data = await getMentorshipPlatformStats();
            if (!cancelled) {
                setStats(data);
                setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Loading the mentorship overview…</span>
            </div>
        );
    }

    const s = stats;
    const maxMonth = s ? Math.max(1, ...s.revenueByMonth.map((m) => m.revenue)) : 1;

    return (
        <div className="px-4 md:px-8 py-8 md:py-10">
            <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
                {/* Header band */}
                <ScrollReveal>
                    <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-6 md:p-8">
                        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
                        <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-brand-200/20 blur-3xl" />

                        <div className="relative space-y-1.5">
                            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Mentorship
                            </p>
                            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">
                                Mentorship <span className="gradient-text">Overview</span>
                            </h1>
                            <p className="text-muted-foreground">
                                Earnings and activity across every mentor. These figures update as bookings clear.
                            </p>
                        </div>
                    </div>
                </ScrollReveal>

                {/* Platform totals band */}
                <ScrollReveal delay={0.05}>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard label="Gross revenue" value={formatINR(s?.grossRevenue ?? 0)} />
                        <StatCard label="Platform fees earned" value={formatINR(s?.platformFees ?? 0)} />
                        <StatCard label="Bookings" value={String(s?.totalBookings ?? 0)} />
                        <StatCard label="Active mentors" value={String(s?.activeMentors ?? 0)} />
                    </div>
                </ScrollReveal>

                <ScrollReveal delay={0.1}>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] items-start">
                        {/* Top mentors */}
                        <div className="bg-card border border-brand-100 rounded-2xl p-5 md:p-6 shadow-card">
                            <div className="-mx-5 md:-mx-6 -mt-5 md:-mt-6 mb-5 rounded-t-2xl border-b border-brand-100 bg-gradient-to-r from-brand-50 to-transparent px-5 md:px-6 py-4">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Leaderboard</p>
                                <h2 className="mt-0.5 font-display text-lg font-bold tracking-tight text-foreground">Top mentors by revenue</h2>
                                <p className="text-sm text-muted-foreground">The mentors bringing in the most on the platform.</p>
                            </div>

                            {!s || s.topMentors.length === 0 ? (
                                <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                                    No bookings yet. Numbers will appear here as mentors get booked.
                                </p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                <th className="py-2.5 pr-3">Mentor</th>
                                                <th className="py-2.5 px-3 text-right">Bookings</th>
                                                <th className="py-2.5 px-3 text-right">Revenue</th>
                                                <th className="py-2.5 pl-3 text-right">Rating</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {s.topMentors.map((m) => (
                                                <tr
                                                    key={m.mentorId}
                                                    className="border-b border-border/60 odd:bg-brand-50/30"
                                                >
                                                    <td className="py-3 pr-3 font-medium">{m.name}</td>
                                                    <td className="py-3 px-3 text-right text-muted-foreground">{m.bookings}</td>
                                                    <td className="py-3 px-3 text-right font-semibold">{formatINR(m.revenue)}</td>
                                                    <td className="py-3 pl-3 text-right text-muted-foreground">
                                                        {m.rating > 0 ? m.rating.toFixed(1) : "—"}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Last six months revenue */}
                        <div className="bg-card border border-brand-100 rounded-2xl p-5 md:p-6 shadow-card">
                            <div className="-mx-5 md:-mx-6 -mt-5 md:-mt-6 mb-5 rounded-t-2xl border-b border-brand-100 bg-gradient-to-r from-brand-50 to-transparent px-5 md:px-6 py-4">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Trend</p>
                                <h2 className="mt-0.5 font-display text-lg font-bold tracking-tight text-foreground">Revenue by month</h2>
                                <p className="text-sm text-muted-foreground">Gross revenue over the last six months.</p>
                            </div>

                            <div className="flex flex-col gap-3">
                                {(s?.revenueByMonth ?? []).map((m) => (
                                    <div key={m.key} className="flex items-center gap-3">
                                        <span className="w-20 shrink-0 text-sm text-muted-foreground">{m.label}</span>
                                        <div className="h-2.5 flex-1 rounded-full bg-muted overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-primary"
                                                style={{ width: `${Math.round((m.revenue / maxMonth) * 100)}%` }}
                                            />
                                        </div>
                                        <span className="w-24 shrink-0 text-right text-sm font-medium">
                                            {formatINR(m.revenue)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </ScrollReveal>

                <p className="text-sm text-muted-foreground">
                    Payout figures fall back to the full booking value until the platform enables Razorpay Route.
                </p>
            </div>
        </div>
    );
};

export default AdminMentorshipOverview;
