import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Calendar, MapPin, Clock, ArrowLeft, Users, Building2, Mic, Handshake, TicketCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getEventBySlug, Event } from "@/lib/events-store";
import { motion } from "framer-motion";
import { getAllSubmissionsForEvent } from "@/lib/event-submissions-api";
import { getEventRegistrations, getEventCapacity, getMyWaitlistEntry, leaveWaitlist, type EventCapacity, type WaitlistEntry } from "@/lib/events-api";
import { getUpcomingEventViewState } from "@/lib/upcoming-event-view";
import { LoginModal } from "@/components/LoginModal";
import { RegistrationModal } from "@/components/RegistrationModal";
import { WaitlistModal } from "@/components/WaitlistModal";
import { isAuthenticated, getRegisteredEvents } from "@/lib/yatris-api";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";


export default function UpcomingEventDetail() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [submissions, setSubmissions] = useState({ venues: [], speakers: [], sponsors: [] as any[] });
    const [registrations, setRegistrations] = useState<any[]>([]);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRegistrationModal, setShowRegistrationModal] = useState(false);
    const [showWaitlistModal, setShowWaitlistModal] = useState(false);
    const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [capacity, setCapacity] = useState<EventCapacity | null>(null);
    const [waitlistEntry, setWaitlistEntry] = useState<WaitlistEntry | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (!slug) {
            setLoading(false);
            return;
        }

        setIsUserLoggedIn(isAuthenticated());

        getEventBySlug(slug).then(async (foundEvent) => {
            if (foundEvent) {
                setEvent(foundEvent);
                if (foundEvent.id) {
                    const [allSubmissions, eventRegistrations] = await Promise.all([
                        getAllSubmissionsForEvent(foundEvent.id),
                        getEventRegistrations(foundEvent.id),
                    ]);
                    setSubmissions(allSubmissions);
                    setRegistrations(eventRegistrations);

                    if (isAuthenticated() && foundEvent.id) {
                        const regs = await getRegisteredEvents();
                        setIsRegistered(regs.some((registration) => registration.eventId === foundEvent.id && registration.status === 'confirmed'));
                        setCapacity(await getEventCapacity(foundEvent.id));
                        setWaitlistEntry(await getMyWaitlistEntry(foundEvent.id));
                    } else {
                        setCapacity(await getEventCapacity(foundEvent.id));
                    }
                }
            } else {
                navigate('/events');
            }
            setLoading(false);
        });
    }, [slug, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading event...</p>
                </div>
            </div>
        );
    }

    if (!event) {
        return null;
    }

    const eventDate = new Date(event.date);
    const formattedDate = format(eventDate, "EEEE, MMMM d, yyyy");
    const formattedTime = format(eventDate, "h:mm a");
    const viewState = getUpcomingEventViewState(event, submissions, registrations);
    const isFull = capacity?.isFull ?? false;
    const onWaitlist = Boolean(waitlistEntry && waitlistEntry.status !== 'cancelled');

    const handleRegister = () => {
        if (!isUserLoggedIn) {
            setShowLoginModal(true);
            return;
        }
        setShowRegistrationModal(true);
    };

    const handleJoinWaitlist = () => {
        if (!isUserLoggedIn) {
            setShowLoginModal(true);
            return;
        }
        setShowWaitlistModal(true);
    };

    const handleWaitlistSuccess = () => {
        setShowWaitlistModal(false);
        if (event) getMyWaitlistEntry(event.id).then(setWaitlistEntry);
    };

    const handleLeaveWaitlist = async () => {
        if (!waitlistEntry) return;
        const { ok } = await leaveWaitlist(waitlistEntry.id);
        if (ok) {
            setWaitlistEntry(null);
            toast({ title: "You left the waitlist", description: "You can join again any time seats are full." });
            if (event) getEventCapacity(event.id).then(setCapacity);
        } else {
            toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
        }
    };

    const handleRegistrationSuccess = () => {
        setIsRegistered(true);
    };

    const handleLoginSuccess = (user: any) => {
        setIsUserLoggedIn(true);
        toast({ title: "Welcome!", description: `Logged in as ${user.fullName}` });
        setTimeout(() => {
            if (isFull) setShowWaitlistModal(true);
            else setShowRegistrationModal(true);
        }, 500);
    };

    return (
        <div className="min-h-screen bg-background text-foreground pt-20 md:pt-24">
            <Navbar />

            {/* Event Banner */}
            <div className="relative">
                <div className="h-[340px] sm:h-[440px] lg:h-[560px] overflow-hidden rounded-b-[2rem] border-b border-border shadow-xl shadow-slate-900/5">
                    <img
                        src={event.imageUrl}
                        alt={event.name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/15 to-transparent" />
                </div>

                <div className="container mx-auto px-4 md:px-6 -mt-12 md:-mt-16 relative z-10">
                    <div className="rounded-[2rem] border border-border/80 bg-card/95 p-6 md:p-7 shadow-2xl backdrop-blur-2xl">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                            <div className="max-w-3xl space-y-3">
                                <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.03em] text-foreground">
                                    {event.name}
                                </h1>
                                <p className="text-base leading-7 text-muted-foreground max-w-2xl">
                                    {event.description}
                                </p>
                                {event.techStack?.filter((tech) => typeof tech === 'string' && tech.trim().length > 0).length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {event.techStack.filter((tech) => typeof tech === 'string' && tech.trim().length > 0).map((tech, i) => (
                                            <span key={i} className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                                {tech.trim()}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="grid gap-4 min-w-[260px] max-w-full lg:max-w-[320px]">
                                <div className="rounded-3xl border border-border bg-background/90 p-4 shadow-sm">
                                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Event details</p>
                                    <div className="mt-3 space-y-4 text-sm text-foreground">
                                        <div>
                                            <p className="font-medium">When</p>
                                            <p className="text-muted-foreground">{formattedDate} · {formattedTime}</p>
                                        </div>
                                        {event.location?.venue ? (
                                            <div>
                                                <p className="font-medium">Where</p>
                                                <p className="text-muted-foreground">{event.location.venue}, {event.location.city}, {event.location.state}</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="font-medium">Where</p>
                                                <p className="text-muted-foreground">{event.location?.type === 'online' ? 'Online event' : 'Location details coming soon'}</p>
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium">Organized by</p>
                                            <p className="text-muted-foreground">{event.organizer?.name || 'Yatri Cloud'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-3xl border border-border bg-background/90 p-4 shadow-sm">
                                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Next action</p>
                                    <div className="mt-3 space-y-3">
                                        <Button className="w-full" onClick={handleRegister}>
                                            {isRegistered ? 'Already registered' : isFull ? 'Register / Join waitlist' : 'Register now'}
                                        </Button>
                                        {isFull && !onWaitlist && (
                                            <Button variant="outline" className="w-full" onClick={handleJoinWaitlist}>
                                                Join waitlist
                                            </Button>
                                        )}
                                        {viewState.showHelpNeeded && (
                                            <div className="pt-2 border-t space-y-2">
                                                <p className="text-xs text-muted-foreground">Community proposals</p>
                                                {event.lookingForSponsors ? (
                                                    <Link to={`/upcoming-event/${event.slug}/sponsors`}>
                                                        <Button variant="outline" size="sm" className="w-full">Sponsor this event</Button>
                                                    </Link>
                                                ) : (
                                                    <Link to={`/upcoming-event/${event.slug}/venue`}>
                                                        <Button variant="outline" size="sm" className="w-full">Help shape this event</Button>
                                                    </Link>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 md:py-10">
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 lg:gap-10">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Event Details */}
                        <motion.div
                            className="bg-card rounded-xl p-6 shadow-sm border"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <h2 className="text-2xl font-bold mb-6">About This Event</h2>
                            <div className="prose prose-slate dark:prose-invert max-w-none prose-p:text-muted-foreground prose-headings:text-foreground prose-strong:text-foreground prose-ul:list-disc prose-ul:pl-5 prose-ol:list-decimal prose-ol:pl-5 prose-li:my-1.5 prose-headings:font-bold prose-h2:text-xl prose-h3:text-lg prose-headings:mt-6 prose-headings:mb-3">
                                <ReactMarkdown>
                                    {event.fullDescription || event.description || ""}
                                </ReactMarkdown>
                            </div>
                        </motion.div>


                        {viewState.showPublishedState && (
                            <motion.div
                                className="bg-card rounded-xl p-6 shadow-sm border"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <TicketCheck className="w-5 h-5 text-primary" />
                                    <h2 className="text-2xl font-bold">Community Highlights</h2>
                                </div>
                                <div className="space-y-4">
                                    {submissions.venues.filter((venue) => venue.status === 'approved').length > 0 && (
                                        <div>
                                            <h3 className="font-semibold mb-2">Approved Venue Proposals</h3>
                                            <div className="space-y-2">
                                                {submissions.venues.filter((venue) => venue.status === 'approved').map((venue) => (
                                                    <div key={venue.id} className="rounded-lg border bg-muted/30 p-3">
                                                        <p className="font-medium">{venue.venueName}</p>
                                                        <p className="text-sm text-muted-foreground">{venue.address}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {submissions.speakers.filter((speaker) => speaker.status === 'approved').length > 0 && (
                                        <div>
                                            <h3 className="font-semibold mb-2">Approved Speakers</h3>
                                            <div className="space-y-2">
                                                {submissions.speakers.filter((speaker) => speaker.status === 'approved').map((speaker) => (
                                                    <div key={speaker.id} className="rounded-lg border bg-muted/30 p-3">
                                                        <p className="font-medium">{speaker.fullName}</p>
                                                        <p className="text-sm text-muted-foreground">{speaker.talkTitle}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {submissions.sponsors.filter((sponsor) => sponsor.status === 'approved').length > 0 && (
                                        <div>
                                            <h3 className="font-semibold mb-2">Approved Sponsors</h3>
                                            <div className="space-y-2">
                                                {submissions.sponsors.filter((sponsor) => sponsor.status === 'approved').map((sponsor) => (
                                                    <div key={sponsor.id} className="rounded-lg border bg-muted/30 p-3">
                                                        <p className="font-medium">{sponsor.companyName}</p>
                                                        <p className="text-sm text-muted-foreground">{sponsor.sponsorshipTier || 'Sponsor'}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Date & Location */}
                        <motion.div
                            className="bg-card rounded-xl p-6 shadow-sm border"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <h2 className="text-2xl font-bold mb-6">When & Where</h2>
                            <div className="space-y-4">
                                        <div className="space-y-3">
                                    <div>
                                        <p className="font-semibold">{formattedDate}</p>
                                        <p className="text-muted-foreground">{formattedTime}</p>
                                    </div>
                                    {event.location.venue && (
                                        <div>
                                            <p className="font-semibold">{event.location.venue}</p>
                                            <p className="text-muted-foreground">
                                                {event.location.city}, {event.location.state}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <motion.div
                            className={`rounded-xl p-6 shadow-lg border-2 sticky top-8 ${viewState.showPublishedState ? 'bg-card border-border' : 'bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20'}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <Users className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-bold">{viewState.showPublishedState ? 'Event Details' : 'We Need Your Help!'}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground mb-6">
                                {viewState.showPublishedState
                                    ? 'This event is now live with community-backed details and attendee registrations.'
                                    : 'Want to contribute to making this event amazing? We\'re looking for support in the following areas:'}
                            </p>

                            {viewState.showHelpNeeded ? (
                                <div className="space-y-3">
                                    {event.lookingForVenue && (
                                        <Link to={`/upcoming-event/${event.slug}/venue`}>
                                            <Button className="w-full justify-start gap-3 h-auto py-4" variant="outline">
                                                <Building2 className="w-5 h-5 text-primary" />
                                                <div className="text-left">
                                                    <div className="font-semibold">Propose a Venue</div>
                                                    <div className="text-xs text-muted-foreground">Help us find the perfect location</div>
                                                </div>
                                            </Button>
                                        </Link>
                                    )}

                                    {event.lookingForSpeakers && (
                                        <Link to={`/upcoming-event/${event.slug}/speakers`}>
                                            <Button className="w-full justify-start gap-3 h-auto py-4" variant="outline">
                                                <Mic className="w-5 h-5 text-primary" />
                                                <div className="text-left">
                                                    <div className="font-semibold">Apply as Speaker</div>
                                                    <div className="text-xs text-muted-foreground">Share your expertise with attendees</div>
                                                </div>
                                            </Button>
                                        </Link>
                                    )}

                                    {event.lookingForSponsors && (
                                        <Link to={`/upcoming-event/${event.slug}/sponsors`}>
                                            <Button className="w-full justify-start gap-3 h-auto py-4" variant="outline">
                                                <Handshake className="w-5 h-5 text-primary" />
                                                <div className="text-left">
                                                    <div className="font-semibold">Become a Sponsor</div>
                                                    <div className="text-xs text-muted-foreground">Support this amazing event</div>
                                                </div>
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="rounded-lg border bg-muted/30 p-3">
                                        <p className="font-semibold">Registration status</p>
                                        <p className="text-sm text-muted-foreground">Registration is open for this event.</p>
                                    </div>
                                    <div className="rounded-lg border bg-muted/30 p-3">
                                        <p className="font-semibold">Community support</p>
                                        <p className="text-sm text-muted-foreground">Approved venue, speaker, and sponsor proposals are highlighted above.</p>
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 pt-6 border-t space-y-4">
                                <div className="rounded-lg border bg-background/60 p-3">
                                    {isRegistered ? (
                                        <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                                            <CheckCircle2 className="w-4 h-4" />
                                            You're already registered
                                        </div>
                                    ) : onWaitlist ? (
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium">You are on the waitlist</p>
                                            <Button variant="outline" size="sm" className="w-full" onClick={handleLeaveWaitlist}>Leave waitlist</Button>
                                        </div>
                                    ) : isFull ? (
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium">Seats are full</p>
                                            <Button className="w-full" onClick={handleJoinWaitlist}>Join waitlist</Button>
                                        </div>
                                    ) : (
                                        <Button className="w-full" onClick={handleRegister}>Register now</Button>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Organized by <span className="font-semibold">{event.organizer?.name || 'Yatri Cloud'}</span>
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onSuccess={handleLoginSuccess} />
            <RegistrationModal event={event} open={showRegistrationModal} onClose={() => setShowRegistrationModal(false)} onSuccess={handleRegistrationSuccess} />
            <WaitlistModal event={event} open={showWaitlistModal} onClose={() => setShowWaitlistModal(false)} onSuccess={handleWaitlistSuccess} />
            <Footer />
        </div>
    );
}
