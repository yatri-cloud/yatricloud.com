import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2, Users, Calendar, GraduationCap, Handshake, Receipt, IndianRupee, TicketCheck, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatsCard } from "@/components/admin/StatsCard";
import { getAdminOverview, type AdminOverview } from "@/lib/admin-overview";
import { formatInvoiceMoney } from "@/lib/invoices-api";

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
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                setData(await getAdminOverview());
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    const otherRevenue = data ? Object.entries(data.otherRevenue) : [];

    return (
        <div className="space-y-8">
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
