import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, BookOpen, Calendar, Receipt, ArrowRight, MapPin, GraduationCap, ShoppingBag, Handshake } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getStoredUser } from "@/lib/yatris-api";
import { getRegisteredEvents, type EventRegistration } from "@/lib/yatris-api";
import { listMyEnrollments } from "@/lib/training-api";
import { getMyInvoices, formatInvoiceMoney, type Invoice } from "@/lib/invoices-api";
import { format } from "date-fns";

const BROWSE_LINKS = [
    { name: "Training", path: "/training", icon: GraduationCap, description: "Live and self paced courses." },
    { name: "Events", path: "/events", icon: Calendar, description: "Workshops and community events." },
    { name: "Store", path: "/yatristore", icon: ShoppingBag, description: "Vouchers, guides and more." },
    { name: "Mentorship", path: "/mentorship", icon: Handshake, description: "Book a session with a mentor." },
];

export default function YatriDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [events, setEvents] = useState<EventRegistration[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const stored = getStoredUser();
        if (stored) setUser(stored);
        else setIsLoading(false);
    }, []);

    useEffect(() => {
        if (!user) { setIsLoading(false); return; }
        (async () => {
            setIsLoading(true);
            try {
                const [enr, evts, invs] = await Promise.all([
                    listMyEnrollments().catch(() => ({ enrollments: [], trainings: {} })),
                    getRegisteredEvents().catch(() => []),
                    getMyInvoices().catch(() => []),
                ]);
                setEnrollments(enr.enrollments || []);
                setEvents(evts || []);
                setInvoices(invs || []);
            } finally {
                setIsLoading(false);
            }
        })();
    }, [user]);

    const now = Date.now();
    const upcoming = events
        .filter((e) => e.status !== "cancelled" && e.eventDate && new Date(e.eventDate).getTime() >= now - 12 * 3600 * 1000)
        .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

    const firstName = (user?.fullName || "").trim().split(" ")[0] || "Yatri";

    if (!isLoading && !user) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <SEO title="My Dashboard | Yatri Cloud" description="Your learning at a glance" />
                <Navbar />
                <main className="pt-24 pb-12">
                    <div className="container mx-auto max-w-lg px-4 py-16 text-center">
                        <h1 className="mb-2 text-2xl font-bold">Sign in to see your dashboard</h1>
                        <p className="mb-6 text-muted-foreground">Your trainings, events and receipts all live here once you sign in.</p>
                        <Button onClick={() => navigate("/")}>Go to home</Button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <SEO title="My Dashboard | Yatri Cloud" description="Your learning at a glance" />
            <Navbar />

            <main className="pt-24 pb-12">
                <div className="container mx-auto max-w-5xl px-4 md:px-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome back, {firstName}</h1>
                        <p className="text-lg text-muted-foreground">Here is everything you are learning and attending, in one place.</p>
                    </motion.div>

                    {isLoading ? (
                        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : (
                        <div className="space-y-8">
                            {/* Summary tiles */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <Link to="/my-trainings">
                                    <Card className="group transition-colors hover:border-primary/40 hover:bg-brand-50/40">
                                        <CardContent className="flex items-center gap-4 p-5">
                                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><BookOpen className="h-5 w-5" /></span>
                                            <span><span className="block text-2xl font-black tabular-nums">{enrollments.length}</span><span className="text-sm text-muted-foreground">Trainings</span></span>
                                        </CardContent>
                                    </Card>
                                </Link>
                                <Link to="/profile/my-events">
                                    <Card className="group transition-colors hover:border-primary/40 hover:bg-brand-50/40">
                                        <CardContent className="flex items-center gap-4 p-5">
                                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Calendar className="h-5 w-5" /></span>
                                            <span><span className="block text-2xl font-black tabular-nums">{upcoming.length}</span><span className="text-sm text-muted-foreground">Upcoming events</span></span>
                                        </CardContent>
                                    </Card>
                                </Link>
                                <Link to="/profile/purchases">
                                    <Card className="group transition-colors hover:border-primary/40 hover:bg-brand-50/40">
                                        <CardContent className="flex items-center gap-4 p-5">
                                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Receipt className="h-5 w-5" /></span>
                                            <span><span className="block text-2xl font-black tabular-nums">{invoices.length}</span><span className="text-sm text-muted-foreground">Receipts</span></span>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                {/* Upcoming events */}
                                <Card>
                                    <CardHeader className="flex-row items-center justify-between space-y-0">
                                        <CardTitle className="text-base">Upcoming events</CardTitle>
                                        <Link to="/profile/my-events" className="text-sm font-medium text-primary hover:underline">View all</Link>
                                    </CardHeader>
                                    <CardContent className="space-y-1">
                                        {upcoming.length > 0 ? upcoming.slice(0, 4).map((e) => (
                                            <Link key={e.id} to={e.eventSlug ? `/events/${e.eventSlug}` : "/profile/my-events"} className="block rounded-lg p-2.5 transition-colors hover:bg-brand-50/50">
                                                <span className="block truncate font-medium">{e.eventName}</span>
                                                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    {e.eventDate ? format(new Date(e.eventDate), "dd MMM yyyy") : ""}
                                                    {e.eventLocation && <><span aria-hidden="true">·</span><MapPin className="h-3 w-3" />{e.eventLocation}</>}
                                                </span>
                                            </Link>
                                        )) : (
                                            <div className="py-6 text-center">
                                                <p className="mb-3 text-sm text-muted-foreground">No upcoming events yet.</p>
                                                <Button variant="outline" size="sm" onClick={() => navigate("/events")}>Browse events</Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Your trainings */}
                                <Card>
                                    <CardHeader className="flex-row items-center justify-between space-y-0">
                                        <CardTitle className="text-base">Your trainings</CardTitle>
                                        <Link to="/my-trainings" className="text-sm font-medium text-primary hover:underline">View all</Link>
                                    </CardHeader>
                                    <CardContent className="space-y-1">
                                        {enrollments.length > 0 ? enrollments.slice(0, 4).map((en, i) => (
                                            <Link key={i} to="/my-trainings" className="block rounded-lg p-2.5 transition-colors hover:bg-brand-50/50">
                                                <span className="block truncate font-medium">{en.trainingName || "Training"}</span>
                                                <span className="text-xs text-muted-foreground">{en.paymentStatus === "Paid" ? "Enrolled" : "Free"}</span>
                                            </Link>
                                        )) : (
                                            <div className="py-6 text-center">
                                                <p className="mb-3 text-sm text-muted-foreground">You are not enrolled in any training yet.</p>
                                                <Button variant="outline" size="sm" onClick={() => navigate("/training")}>Explore training</Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Browse */}
                            <div>
                                <h2 className="mb-4 text-lg font-bold">Keep exploring</h2>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    {BROWSE_LINKS.map((link) => {
                                        const Icon = link.icon;
                                        return (
                                            <Link key={link.path} to={link.path}>
                                                <Card className="group h-full transition-colors hover:border-primary/40 hover:bg-brand-50/40">
                                                    <CardContent className="p-5">
                                                        <div className="mb-2 flex items-center justify-between">
                                                            <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                                                            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
                                                        </div>
                                                        <div className="font-semibold">{link.name}</div>
                                                        <div className="mt-0.5 text-sm text-muted-foreground">{link.description}</div>
                                                    </CardContent>
                                                </Card>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
