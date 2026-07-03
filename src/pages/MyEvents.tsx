import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListPager } from "@/components/ui/list-pager";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    isAuthenticated,
    getStoredUser,
    getRegisteredEvents,
    issueEventCertificate,
    getMyEventCertificate,
    type EventRegistration,
} from "@/lib/yatris-api";
import { cancelRegistration } from "@/lib/events-api";
import { googleCalendarUrl, buildIcs, icsDataUri } from "@/lib/calendar";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

/** Two hours after a start time, since events store no explicit finish time. */
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const PAGE_SIZE = 9;

/**
 * Build add to calendar links when a registration is confirmed and carries a
 * real, upcoming event date. Returns null otherwise so the buttons stay hidden.
 */
function getEventCalendar(reg: EventRegistration) {
    if (reg.status !== "confirmed" || !reg.eventDate) return null;
    const start = new Date(reg.eventDate);
    if (isNaN(start.getTime()) || start.getTime() <= Date.now()) return null;
    const startISO = start.toISOString();
    const endISO = new Date(start.getTime() + TWO_HOURS_MS).toISOString();
    const location = reg.eventLocation || "Online";
    const details = `Your spot at ${reg.eventName}, a Yatri Cloud event.`;
    return {
        gcal: googleCalendarUrl({ title: reg.eventName, startISO, endISO, details, location }),
        ics: icsDataUri(
            buildIcs({
                uid: `event-${reg.id}@yatricloud.com`,
                title: reg.eventName,
                startISO,
                endISO,
                details,
                location,
            })
        ),
    };
}

/** Format an event date for display, falling back gracefully when missing. */
function formatEventDate(value: string): string {
    if (!value) return "Date to be announced";
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) return "Date to be announced";
    return format(parsed, "EEEE, MMM dd, yyyy · h:mm a");
}

export default function MyEvents() {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [signedIn, setSignedIn] = useState(false);
    const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("newest");
    const [page, setPage] = useState(1);

    useEffect(() => { setPage(1); }, [search, sort]);

    // Cancel confirmation state
    const [pendingCancel, setPendingCancel] = useState<EventRegistration | null>(null);
    const [cancelling, setCancelling] = useState(false);

    // Certificate serials by event id, plus which events are being claimed.
    const [certSerials, setCertSerials] = useState<Record<string, string>>({});
    const [claiming, setClaiming] = useState<Record<string, boolean>>({});

    const load = useCallback(async () => {
        setLoading(true);
        const data = await getRegisteredEvents();
        // Newest first by registration date.
        data.sort(
            (a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime()
        );
        setRegistrations(data);
        setLoading(false);

        // Look up any certificates already issued for attended events.
        const attended = data.filter((r) => r.rawStatus === "attended" && r.eventId);
        const found = await Promise.all(
            attended.map(async (r) => {
                const cert = await getMyEventCertificate(r.eventId);
                return cert ? ([r.eventId, cert.serial] as const) : null;
            })
        );
        const map: Record<string, string> = {};
        for (const entry of found) {
            if (entry) map[entry[0]] = entry[1];
        }
        setCertSerials(map);
    }, []);

    const claimCertificate = async (reg: EventRegistration) => {
        if (!reg.eventId) return;
        setClaiming((prev) => ({ ...prev, [reg.eventId]: true }));
        const result = await issueEventCertificate(reg.eventId);
        setClaiming((prev) => ({ ...prev, [reg.eventId]: false }));
        if (result.ok && result.serial) {
            setCertSerials((prev) => ({ ...prev, [reg.eventId]: result.serial! }));
            navigate(`/certificate/${result.serial}`);
            return;
        }
        toast({
            title: "We could not issue your certificate",
            description: result.message || "Please try again in a moment.",
            variant: "destructive",
        });
    };

    useEffect(() => {
        const authed = isAuthenticated() && !!getStoredUser();
        setSignedIn(authed);
        if (!authed) {
            setLoading(false);
            return;
        }
        load();
    }, [load]);

    const confirmCancel = async () => {
        if (!pendingCancel) return;
        setCancelling(true);
        const ok = await cancelRegistration(pendingCancel.id);
        setCancelling(false);
        if (!ok) {
            toast({
                title: "We could not cancel that",
                description: "Something went wrong on our side. Please try again in a moment.",
                variant: "destructive",
            });
            return;
        }
        setRegistrations((prev) =>
            prev.map((r) => (r.id === pendingCancel.id ? { ...r, status: "cancelled" } : r))
        );
        toast({
            title: "Registration cancelled",
            description: `Your spot for ${pendingCancel.eventName} has been released. We hope to see you at another Yatri Cloud event.`,
        });
        setPendingCancel(null);
    };

    const query = search.trim().toLowerCase();
    const matched = query
        ? registrations.filter((reg) =>
            (reg.eventName || "").toLowerCase().includes(query) ||
            (reg.eventLocation || "").toLowerCase().includes(query) ||
            (reg.attendees[0]?.ticketId || "").toLowerCase().includes(query)
        )
        : registrations;
    const regTime = (r: EventRegistration) => (r.registrationDate ? new Date(r.registrationDate).getTime() : 0);
    const evtTime = (r: EventRegistration) => (r.eventDate ? new Date(r.eventDate).getTime() : 0);
    const filteredRegistrations = [...matched].sort((a, b) => {
        if (sort === "oldest") return regTime(a) - regTime(b);
        if (sort === "event-date") return evtTime(a) - evtTime(b);
        if (sort === "name") return (a.eventName || "").localeCompare(b.eventName || "");
        return regTime(b) - regTime(a); // newest registration first (default)
    });
    const pageCount = Math.max(1, Math.ceil(filteredRegistrations.length / PAGE_SIZE));
    const currentPage = Math.min(page, pageCount);
    const pagedRegistrations = filteredRegistrations.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <SEO
                title="My Events · Yatri Cloud"
                description="See and manage your event registrations."
                noindex
            />
            <Navbar />

            <main className="pt-24 pb-16">
                <div className="container mx-auto px-4 md:px-6 max-w-5xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">My Registered Events</h1>
                        <p className="text-muted-foreground text-lg">
                            Track your upcoming events, keep your registration codes handy, and manage
                            your spots.
                        </p>
                    </motion.div>

                    {!signedIn ? (
                        <div className="text-center py-16 border rounded-xl bg-brand-50/40">
                            <h2 className="text-xl font-semibold mb-2">Please sign in first</h2>
                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                Your event registrations live with your Yatri Cloud account. Sign in to
                                see everything you have booked.
                            </p>
                            <Button asChild className="min-h-[44px]">
                                <Link to="/login">Sign in to continue</Link>
                            </Button>
                        </div>
                    ) : loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[0, 1, 2].map((i) => (
                                <div
                                    key={i}
                                    className="h-64 rounded-xl border bg-muted/40 animate-pulse"
                                />
                            ))}
                        </div>
                    ) : registrations.length === 0 ? (
                        <div className="text-center py-16 border rounded-xl bg-brand-50/40">
                            <h2 className="text-xl font-semibold mb-2">No registrations yet</h2>
                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                You have not registered for any events. Browse what is coming up and grab
                                your spot.
                            </p>
                            <Button
                                className="min-h-[44px]"
                                onClick={() => navigate("/events")}
                            >
                                Browse events
                            </Button>
                        </div>
                    ) : (
                        <>
                        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center">
                            <div className="relative w-full max-w-md">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search events by name, location or code"
                                    aria-label="Search registered events"
                                    className="h-10 pl-9"
                                />
                            </div>
                            <Select value={sort} onValueChange={setSort}>
                                <SelectTrigger className="h-10 w-full sm:w-[190px]" aria-label="Sort registered events">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest">Recently registered</SelectItem>
                                    <SelectItem value="oldest">Oldest registered</SelectItem>
                                    <SelectItem value="event-date">Event date</SelectItem>
                                    <SelectItem value="name">Name: A to Z</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {filteredRegistrations.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                            No events match your search.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pagedRegistrations.map((reg) => {
                                const cal = getEventCalendar(reg);
                                const code = reg.attendees[0]?.ticketId;
                                const isConfirmed = reg.status === "confirmed";
                                const isAttended = reg.rawStatus === "attended";
                                const certSerial = reg.eventId ? certSerials[reg.eventId] : undefined;
                                const isClaiming = reg.eventId ? !!claiming[reg.eventId] : false;
                                return (
                                    <Card
                                        key={reg.id}
                                        className="flex flex-col overflow-hidden hover:shadow-md transition-shadow"
                                    >
                                        {reg.eventImage ? (
                                            <div className="h-36 w-full overflow-hidden bg-brand-50">
                                                <img
                                                    src={reg.eventImage}
                                                    alt={reg.eventName}
                                                    className="h-full w-full object-cover"
                                                    loading="lazy"
                                                />
                                            </div>
                                        ) : (
                                            <div className="h-1.5 bg-brand-500" />
                                        )}
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start mb-2">
                                                {isConfirmed ? (
                                                    <Badge className="bg-brand-600 text-white hover:bg-brand-600">
                                                        Confirmed
                                                    </Badge>
                                                ) : (
                                                    <Badge
                                                        variant="outline"
                                                        className="text-muted-foreground"
                                                    >
                                                        Cancelled
                                                    </Badge>
                                                )}
                                            </div>
                                            <CardTitle className="text-xl line-clamp-2">
                                                {reg.eventName}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex-grow space-y-4 text-sm">
                                            <div className="text-muted-foreground">
                                                {formatEventDate(reg.eventDate)}
                                            </div>
                                            <div className="text-muted-foreground">
                                                {reg.eventLocation || "Online"}
                                            </div>
                                            {code && (
                                                <div className="bg-brand-50/70 border border-brand-200/40 p-3 rounded-md">
                                                    <p className="text-xs text-muted-foreground">
                                                        Registration code
                                                    </p>
                                                    <p className="font-mono font-bold text-lg tracking-wider">
                                                        {code}
                                                    </p>
                                                </div>
                                            )}
                                            {cal && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        size="sm"
                                                        className="min-h-[44px]"
                                                    >
                                                        <a
                                                            href={cal.gcal}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            Add to Google Calendar
                                                        </a>
                                                    </Button>
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        size="sm"
                                                        className="min-h-[44px]"
                                                    >
                                                        <a
                                                            href={cal.ics}
                                                            download={`${reg.eventName}.ics`}
                                                        >
                                                            Download .ics
                                                        </a>
                                                    </Button>
                                                </div>
                                            )}
                                            {isAttended && (
                                                <div className="rounded-md border border-brand-200/40 bg-brand-50/70 p-3">
                                                    <p className="text-xs text-muted-foreground mb-2">
                                                        Certificate of attendance
                                                    </p>
                                                    {certSerial ? (
                                                        <Button
                                                            asChild
                                                            size="sm"
                                                            className="w-full min-h-[44px]"
                                                        >
                                                            <Link to={`/certificate/${certSerial}`}>
                                                                View certificate
                                                            </Link>
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            className="w-full min-h-[44px]"
                                                            disabled={isClaiming}
                                                            onClick={() => claimCertificate(reg)}
                                                        >
                                                            {isClaiming ? "Getting your certificate…" : "Get your certificate"}
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                        <CardFooter className="pt-2 gap-2">
                                            {reg.eventSlug && (
                                                <Button
                                                    asChild
                                                    variant="secondary"
                                                    className="flex-1 min-h-[44px]"
                                                >
                                                    <Link to={`/events/${reg.eventSlug}`}>
                                                        View event
                                                    </Link>
                                                </Button>
                                            )}
                                            {isConfirmed && (
                                                <Button
                                                    variant="outline"
                                                    className="flex-1 min-h-[44px]"
                                                    onClick={() => setPendingCancel(reg)}
                                                >
                                                    Cancel
                                                </Button>
                                            )}
                                        </CardFooter>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                        <ListPager page={currentPage} pageCount={pageCount} onPageChange={setPage} />
                        </>
                    )}
                </div>
            </main>

            {/* Cancel confirmation */}
            <Dialog
                open={!!pendingCancel}
                onOpenChange={(open) => {
                    if (!open && !cancelling) setPendingCancel(null);
                }}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Cancel this registration?</DialogTitle>
                        <DialogDescription>
                            You are about to release your spot for {pendingCancel?.eventName}. This
                            frees the seat for another Yatri and cannot be undone here.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            className="min-h-[44px]"
                            disabled={cancelling}
                            onClick={() => setPendingCancel(null)}
                        >
                            Keep my spot
                        </Button>
                        <Button
                            variant="destructive"
                            className="min-h-[44px]"
                            disabled={cancelling}
                            onClick={confirmCancel}
                        >
                            {cancelling ? "Cancelling…" : "Yes, cancel"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Footer />
        </div>
    );
}
