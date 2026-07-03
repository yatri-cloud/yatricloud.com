import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
    Calendar,
    MapPin,
    Globe,
    Clock,
    ArrowLeft,
    ExternalLink,
    Users,
    Tag,
    Share2,
    Linkedin,
    Check,
    ArrowRight,
    Inbox,
    CalendarX,
    ImageOff,
    CalendarPlus,
    Download
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { SEO } from "@/components/SEO";
import { LoginModal } from "@/components/LoginModal";
import { RegistrationModal } from "@/components/RegistrationModal";
import { WaitlistModal } from "@/components/WaitlistModal";
import {
    getEventCapacity,
    getMyWaitlistEntry,
    leaveWaitlist,
    type EventCapacity,
    type WaitlistEntry,
} from "@/lib/events-api";
import { isAuthenticated, getStoredUser, getRegisteredEvents } from "@/lib/yatris-api";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";
import { getAllEvents, getEventBySlug, Event, EventSpeaker as Speaker, Ticket, Attendee, GalleryAlbum, GalleryMedia } from "@/lib/events-store";
import { googleCalendarUrl, buildIcs, icsDataUri } from "@/lib/calendar";

// Fallback mock events - initially empty
const MOCK_EVENTS: Event[] = [];

const EventDetail = () => {
    const { slug, id } = useParams<{ slug?: string; id?: string }>();
    // Resolve by slug first; keep id as a fallback so old bookmarked links still work.
    const eventParam = slug || id;
    const navigate = useNavigate();
    const { toast } = useToast();
    const reduceMotion = useReducedMotion();
    const [event, setEvent] = useState<Event | null>(null);
    const [allEvents, setAllEvents] = useState<Event[]>([]);
    const [activeTab, setActiveTab] = useState<'about' | 'tickets' | 'speakers' | 'attendees' | 'community' | 'gallery'>('about');
    const [lightboxAlbum, setLightboxAlbum] = useState<GalleryAlbum | null>(null);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRegistrationModal, setShowRegistrationModal] = useState(false);
    const [showWaitlistModal, setShowWaitlistModal] = useState(false);
    const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [capacity, setCapacity] = useState<EventCapacity | null>(null);
    const [waitlistEntry, setWaitlistEntry] = useState<WaitlistEntry | null>(null);

    // Check if user is logged in
    useEffect(() => {
        setIsUserLoggedIn(isAuthenticated());
    }, []);

    useEffect(() => {
        // Resolve the event by slug (getEventBySlug also accepts an id fallback)
        getEventBySlug(eventParam || "").then((foundEvent) => {
            let resolvedId: string | null = null;
            if (foundEvent) {
                // Map store event to detail event if needed, or just use as is
                // For now, the interfaces are mostly compatible for common fields
                setEvent(foundEvent as any);
                resolvedId = foundEvent.id;
            } else {
                // Check if it's one of the internal MOCK_EVENTS as fallback
                const mockEvent = MOCK_EVENTS.find(e => e.id === eventParam);
                if (mockEvent) {
                    setEvent(mockEvent);
                    resolvedId = mockEvent.id;
                } else {
                    navigate('/events');
                }
            }

            // Check registration status against the resolved event id
            if (isAuthenticated() && resolvedId) {
                getRegisteredEvents().then((regs) => {
                    const isReg = regs.some(r => r.eventId === resolvedId && r.status === 'confirmed');
                    setIsRegistered(isReg);
                });
            }

            // Load seat capacity and the Yatri's waitlist entry (if any).
            if (resolvedId) {
                getEventCapacity(resolvedId).then(setCapacity);
                if (isAuthenticated()) {
                    getMyWaitlistEntry(resolvedId).then(setWaitlistEntry);
                }
            }
        });

        // Load related events for the "more events" section
        getAllEvents().then(setAllEvents);

        // Scroll to top
        window.scrollTo(0, 0);
    }, [eventParam, navigate]);

    // Seats are full only when a real cap is set and every seat is taken.
    const isFull = capacity?.isFull ?? false;
    // Treat any non-cancelled entry as being on the waitlist.
    const onWaitlist = Boolean(waitlistEntry && waitlistEntry.status !== 'cancelled');

    const handleRegister = () => {
        if (!isUserLoggedIn) {
            // Show login modal if not logged in
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
            toast({
                title: "You left the waitlist",
                description: "You can join again any time seats are full.",
            });
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
        toast({
            title: "Welcome!",
            description: `Logged in as ${user.fullName}`,
        });
        // After login, open the right flow for the current seat state.
        setTimeout(() => {
            if (isFull) setShowWaitlistModal(true);
            else setShowRegistrationModal(true);
        }, 500);
    };

    if (!event) {
        return null;
    }

    const formatEventDate = (dateString: string, timezone: string) => {
        const date = new Date(dateString);
        const options: Intl.DateTimeFormatOptions = {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        };
        return `${date.toLocaleDateString('en-US', options)}`;
    };

    const formatEventTime = (dateString: string, timezone: string) => {
        const date = new Date(dateString);
        const options: Intl.DateTimeFormatOptions = {
            hour: '2-digit',
            minute: '2-digit',
        };
        return `${date.toLocaleTimeString('en-US', options)} ${timezone}`;
    };

    const isPastEvent = event.status === 'past';

    // Add to calendar for events that carry a real start date. End is +2 hours
    // since events do not store an explicit finish time.
    const hasEventDate = Boolean(event.date) && !isNaN(new Date(event.date).getTime());
    const eventEndISO = hasEventDate
        ? new Date(new Date(event.date).getTime() + 2 * 60 * 60 * 1000).toISOString()
        : "";
    const eventCalLocation = event.location?.type === 'online'
        ? 'Online'
        : (event.location?.venue || event.location?.city || 'Online');
    const eventPageUrl = `https://www.yatricloud.com/events/${event.slug || event.id}`;
    const eventCalDetails = `Your spot at ${event.name}, a Yatri Cloud event. Details and updates at ${eventPageUrl}`;
    const eventGCalUrl = hasEventDate
        ? googleCalendarUrl({ title: event.name, startISO: event.date, endISO: eventEndISO, details: eventCalDetails, location: eventCalLocation })
        : "";
    const eventIcsUri = hasEventDate
        ? icsDataUri(buildIcs({ uid: `event-${event.id}@yatricloud.com`, title: event.name, startISO: event.date, endISO: eventEndISO, details: eventCalDetails, location: eventCalLocation }))
        : "";

    const tabs = [
        { id: 'about', label: 'About' },
        { id: 'tickets', label: 'Tickets' },
        { id: 'speakers', label: 'Speakers' },
        { id: 'attendees', label: 'Attendees' },
        { id: 'community', label: 'Join Community' },
        ...(isPastEvent ? [{ id: 'gallery', label: 'Gallery' }] : []),
    ];

    return (
        <div className="min-h-screen bg-background text-foreground">
            <SEO
                title={`${event.name} · Yatri Cloud Events`}
                description={event.description || `Join us for ${event.name}, a friendly cloud community event by Yatri Cloud. Save your spot for free.`}
                image={event.imageUrl}
                type="article"
                jsonLd={{
                    "@context": "https://schema.org",
                    "@type": "Event",
                    name: event.name,
                    startDate: event.date,
                    ...(event.endDate ? { endDate: event.endDate } : {}),
                    ...(event.description ? { description: event.description } : {}),
                    image: event.imageUrl,
                    eventAttendanceMode:
                        event.location?.type === "online"
                            ? "https://schema.org/OnlineEventAttendanceMode"
                            : "https://schema.org/OfflineEventAttendanceMode",
                    location:
                        event.location?.type === "online"
                            ? {
                                  "@type": "VirtualLocation",
                                  url: `https://www.yatricloud.com/events/${event.slug || event.id}`,
                              }
                            : {
                                  "@type": "Place",
                                  name: event.location?.venue || event.location?.city || "Event venue",
                                  address: [event.location?.city, event.location?.state, event.location?.country]
                                      .filter(Boolean)
                                      .join(", "),
                              },
                    organizer: {
                        "@type": "Organization",
                        name: event.organizer?.name || "Yatri Cloud",
                        url: "https://www.yatricloud.com",
                    },
                    ...(event.tickets && event.tickets.length > 0
                        ? {
                              offers: event.tickets.map((t) => ({
                                  "@type": "Offer",
                                  name: t.type,
                                  price: Number(String(t.price).replace(/[^\d.]/g, "")) || 0,
                                  priceCurrency: "INR",
                                  url: `https://www.yatricloud.com/events/${event.slug || event.id}`,
                                  availability: t.available
                                      ? "https://schema.org/InStock"
                                      : "https://schema.org/SoldOut",
                              })),
                          }
                        : {}),
                }}
            />
            <div className="noise-overlay" />
            <Navbar />

            <main className="container mx-auto px-4 md:px-6 pt-24 pb-12">
                {/* Back Button */}
                <Link to="/events" className="inline-flex items-center gap-2 min-h-[44px] text-muted-foreground hover:text-primary transition-colors mb-6 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span>Back to all events</span>
                </Link>

                {/* Event Title */}
                <ScrollReveal>
                    <h1 className="font-display text-3xl md:text-5xl font-bold tracking-[-0.02em] mb-8">{event.name}</h1>
                </ScrollReveal>

                {/* Hero Section: Image Left + Details Right */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">
                    {/* Event Banner - Left Side (16:9 aspect ratio) */}
                    <div className="lg:col-span-3">
                        <ScrollReveal>
                            <div className="relative w-full aspect-video rounded-3xl overflow-hidden">
                                <img
                                    src={event.imageUrl}
                                    alt={event.name}
                                    className="w-full h-full object-cover"
                                />
                                {/* Category Badge */}
                                <div className="absolute top-6 left-6">
                                    <span className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-lg">
                                        {event.category}
                                    </span>
                                </div>
                            </div>

                            {/* Tech Stack Tags */}
                            {event.techStack && event.techStack.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2 justify-center lg:justify-start">
                                    {event.techStack.map((tech, i) => (
                                        <span key={i} className="px-3 py-1 rounded-full bg-secondary/80 text-secondary-foreground text-xs font-medium border border-secondary">
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </ScrollReveal>
                    </div>

                    {/* Event Details Card - Right Side */}
                    <div className="lg:col-span-2">
                        <ScrollReveal>
                            <div className="bg-card border border-border rounded-3xl p-6 space-y-6 h-full shadow-card">
                                {/* Date */}
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <Calendar className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Date</p>
                                        <p className="font-semibold">{formatEventDate(event.date, event.timezone)}</p>
                                    </div>
                                </div>

                                {/* Time */}
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <Clock className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Time</p>
                                        <p className="font-semibold">{formatEventTime(event.date, event.timezone)}</p>
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        {event.location.type === 'online' ? (
                                            <Globe className="w-5 h-5 text-primary" />
                                        ) : (
                                            <MapPin className="w-5 h-5 text-primary" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Location</p>
                                        {event.location.type === 'online' ? (
                                            <p className="font-semibold">Online Event</p>
                                        ) : (
                                            <>
                                                <p className="font-semibold">{event.location.venue}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {event.location.city}, {event.location.country}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Price */}
                                {event.price && (
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <Tag className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Price</p>
                                            <p className="font-semibold text-2xl text-primary">{event.price}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-border">
                                    {/* Seats left when a cap is set and seats remain */}
                                    {capacity?.capacity != null && !isFull && capacity.seatsLeft !== null && (
                                        <p className={`text-sm mb-4 font-medium ${capacity.seatsLeft <= 10 ? 'text-warning' : 'text-muted-foreground'}`}>
                                            {capacity.seatsLeft} {capacity.seatsLeft === 1 ? 'seat' : 'seats'} left
                                        </p>
                                    )}
                                    {/* Sold out note when full and not already handled */}
                                    {isFull && !isRegistered && !onWaitlist && (
                                        <p className="text-sm mb-4 font-medium text-muted-foreground">
                                            Sold out. Join the waitlist and we will email you if a seat opens.
                                        </p>
                                    )}

                                    {/* Registration Button */}
                                    {isRegistered ? (
                                        <div className="w-full bg-success/10 text-success border border-success/20 px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-default">
                                            <CheckCircle2 className="w-5 h-5" />
                                            <span>You're in, Yatri — see you there!</span>
                                        </div>
                                    ) : onWaitlist ? (
                                        <div className="space-y-2">
                                            <div className="w-full bg-primary/10 text-primary border border-primary/20 px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-default">
                                                <Check className="w-5 h-5" />
                                                <span>You are on the waitlist</span>
                                            </div>
                                            <button
                                                onClick={handleLeaveWaitlist}
                                                className="w-full min-h-[44px] text-sm text-muted-foreground hover:text-foreground transition-colors rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                            >
                                                Leave the waitlist
                                            </button>
                                        </div>
                                    ) : isFull ? (
                                        <button
                                            onClick={handleJoinWaitlist}
                                            className="w-full min-h-[44px] bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold shadow-inset-btn hover:bg-brand-600 transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                        >
                                            Join the waitlist
                                        </button>
                                    ) : event.requiresLogin && !isUserLoggedIn ? (
                                        <button
                                            onClick={() => setShowLoginModal(true)}
                                            className="w-full min-h-[44px] bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold shadow-inset-btn hover:bg-brand-600 transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                        >
                                            Log in to save your spot
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleRegister}
                                            className="w-full min-h-[44px] bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold shadow-inset-btn hover:bg-brand-600 transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                        >
                                            Save my spot <ArrowRight className="w-4 h-4" />
                                        </button>
                                    )}

                                    {event.registrationDeadline && (
                                        <p className="text-xs text-muted-foreground text-center mt-2">
                                            Registration open till {formatEventDate(event.registrationDeadline, event.timezone)}
                                        </p>
                                    )}

                                    {hasEventDate && (
                                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <a
                                                href={eventGCalUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2 min-h-[44px] border border-border hover:bg-brand-50 hover:border-brand-200 px-4 py-3 rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                            >
                                                <CalendarPlus className="w-4 h-4 text-primary" />
                                                Add to Google Calendar
                                            </a>
                                            <a
                                                href={eventIcsUri}
                                                download={`${event.name}.ics`}
                                                className="flex items-center justify-center gap-2 min-h-[44px] border border-border hover:bg-brand-50 hover:border-brand-200 px-4 py-3 rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                            >
                                                <Download className="w-4 h-4 text-primary" />
                                                Download .ics
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </ScrollReveal>
                    </div>
                </div>

                {/* Two Column Layout for Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content - Left Column */}
                    <div className="lg:col-span-2">

                        {/* Tabs */}
                        <div className="border-b border-border mb-8 overflow-x-auto scrollbar-hide">
                            <div className="flex gap-6 md:gap-8">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        aria-pressed={activeTab === tab.id}
                                        className={`min-h-[44px] pb-4 px-2 text-sm font-medium whitespace-nowrap transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm ${activeTab === tab.id
                                            ? 'text-primary'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        {tab.label}
                                        {activeTab === tab.id && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                                                transition={reduceMotion ? { duration: 0 } : undefined}
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="prose prose-lg max-w-none">
                            {activeTab === 'about' && (
                                <ScrollReveal>
                                    <div>
                                        <h2 className="font-display text-2xl font-bold mb-4">What this is about</h2>
                                        <p className="text-muted-foreground leading-relaxed">
                                            {event.fullDescription || event.description}
                                        </p>
                                    </div>
                                </ScrollReveal>
                            )}

                            {activeTab === 'tickets' && (
                                <ScrollReveal>
                                    <div>
                                        <h2 className="font-display text-2xl font-bold mb-6">Pick your ticket</h2>
                                        {event.tickets && event.tickets.length > 0 ? (
                                            <div className="space-y-4">
                                                {event.tickets.map(ticket => (
                                                    <div
                                                        key={ticket.id}
                                                        className="bg-card border border-border rounded-2xl p-6 hover:border-brand-200 hover:shadow-card transition-all"
                                                    >
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div>
                                                                <h3 className="text-xl font-bold text-foreground mb-1">{ticket.type}</h3>
                                                                <p className="text-sm text-muted-foreground">{ticket.description}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-2xl font-bold text-primary">{ticket.price}</div>
                                                                {ticket.available && (
                                                                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-1 text-xs font-semibold rounded-full bg-success/10 text-success">
                                                                        <Check className="w-3 h-3" /> Available
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {ticket.benefits && ticket.benefits.length > 0 && (
                                                            <div className="mt-4 pt-4 border-t border-border">
                                                                <p className="text-sm font-semibold text-foreground mb-2">Includes:</p>
                                                                <ul className="space-y-2">
                                                                    {ticket.benefits.map((benefit, idx) => (
                                                                        <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                                            <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                                                            <span>{benefit}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="rounded-2xl border border-border band-tint p-8 text-center">
                                                <Inbox className="w-8 h-8 text-primary mx-auto mb-3" />
                                                <p className="text-muted-foreground">Tickets aren't live yet, Yatri — they'll drop here soon. Save your spot above and we'll keep you posted.</p>
                                            </div>
                                        )}
                                    </div>
                                </ScrollReveal>
                            )}

                            {activeTab === 'speakers' && (
                                <ScrollReveal>
                                    <div>
                                        <h2 className="font-display text-2xl font-bold mb-6">Who you'll learn from</h2>
                                        {event.speakers && event.speakers.length > 0 ? (
                                            <div className="space-y-6">
                                                {event.speakers.map(speaker => (
                                                    <div
                                                        key={speaker.id}
                                                        className="bg-card border border-border rounded-2xl p-6 hover:border-brand-200 hover:shadow-card transition-all"
                                                    >
                                                        <div className="flex flex-col md:flex-row items-end gap-6">
                                                            <img
                                                                src={speaker.profileImage || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop"}
                                                                alt={speaker.fullName}
                                                                className="w-32 h-32 rounded-2xl bg-muted object-cover flex-shrink-0"
                                                            />
                                                            <div className="flex-1 flex flex-col justify-between h-auto md:h-32">
                                                                <div>
                                                                    <div className="flex justify-between items-start">
                                                                        <h3 className="text-2xl font-bold text-foreground mb-2">{speaker.fullName}</h3>
                                                                        {speaker.linkedinUrl && (
                                                                            <a
                                                                                href={speaker.linkedinUrl}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="inline-flex items-center justify-center w-8 h-8 hover:opacity-80 transition-opacity"
                                                                                aria-label="LinkedIn Profile"
                                                                            >
                                                                                <Linkedin className="w-5 h-5 text-primary" />
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-base font-medium text-muted-foreground mb-1">{speaker.sessionName || "Guest Speaker"}</p>
                                                                    {speaker.companyName && (
                                                                        <p className="text-base text-muted-foreground">{speaker.companyName}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="mt-4 pt-4 border-t border-border">
                                                            <p className="text-sm text-foreground">{speaker.about}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="rounded-2xl border border-border band-tint p-8 text-center">
                                                <Users className="w-8 h-8 text-primary mx-auto mb-3" />
                                                <p className="text-muted-foreground">The speaker line-up is being finalised, Yatri — check back soon to see who's taking the stage.</p>
                                            </div>
                                        )}
                                    </div>
                                </ScrollReveal>
                            )}

                            {activeTab === 'attendees' && (
                                <ScrollReveal>
                                    <div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <h2 className="font-display text-2xl font-bold">Yatris going</h2>
                                            {event.attendees && event.attendees.length > 0 && (
                                                <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-semibold rounded-full bg-primary/10 text-primary border border-primary/20">
                                                    {event.attendees.length} {event.attendees.length === 1 ? 'Person' : 'People'}
                                                </span>
                                            )}
                                        </div>
                                        {event.attendees && event.attendees.length > 0 ? (
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                {event.attendees.map(attendee => (
                                                    <div
                                                        key={attendee.id}
                                                        className="bg-card border border-border rounded-xl p-4 hover:border-brand-200 transition-all hover:shadow-card"
                                                    >
                                                        <div className="flex flex-col items-center text-center">
                                                            <img
                                                                src={attendee.imageUrl}
                                                                alt={attendee.name}
                                                                className="w-16 h-16 rounded-full bg-muted object-cover mb-3"
                                                            />
                                                            <h4 className="font-semibold text-foreground text-sm mb-1">{attendee.name}</h4>
                                                            <p className="text-xs text-primary font-medium mb-0.5">{attendee.role}</p>
                                                            {attendee.company && (
                                                                <p className="text-xs text-muted-foreground">{attendee.company}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="rounded-2xl border border-border band-tint p-8 text-center">
                                                <Users className="w-8 h-8 text-primary mx-auto mb-3" />
                                                <p className="text-muted-foreground">No Yatris have signed up yet — be the first to save your spot and set the tone for this one.</p>
                                            </div>
                                        )}
                                    </div>
                                </ScrollReveal>
                            )}

                            {activeTab === 'community' && (
                                <ScrollReveal>
                                    <div>
                                        <h2 className="font-display text-2xl font-bold mb-4">You're not doing this alone</h2>
                                        <p className="text-muted-foreground leading-relaxed mb-6">
                                            Meet the other Yatris going, swap prep tips, ask the awkward questions, and keep the conversation alive long after the event ends. 50,000+ learners are already inside.
                                        </p>
                                        {event.communityLink && (
                                            <a
                                                href={event.communityLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-3 min-h-[44px] bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-brand-600 transition-colors shadow-inset-btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                            >
                                                <ExternalLink className="w-5 h-5" />
                                                Join the Yatris on Discord
                                            </a>
                                        )}
                                    </div>
                                </ScrollReveal>
                            )}

                            {activeTab === 'gallery' && (
                                <ScrollReveal>
                                    <div>
                                        <h2 className="font-display text-2xl font-bold mb-6">Moments from the day</h2>
                                        {(event as Event).gallery && (event as Event).gallery!.length > 0 ? (
                                            <div className="space-y-8">
                                                {(event as Event).gallery!.map((album) => (
                                                    <div key={album.id}>
                                                        <h3 className="text-xl font-semibold mb-4">{album.name}</h3>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                            {album.media.map((media, idx) => (
                                                                <button
                                                                    key={media.id}
                                                                    onClick={() => {
                                                                        setLightboxAlbum(album);
                                                                        setLightboxIndex(idx);
                                                                    }}
                                                                    className="aspect-square bg-muted rounded-lg overflow-hidden hover:opacity-80 transition-opacity cursor-pointer group relative"
                                                                >
                                                                    {media.type === 'photo' ? (
                                                                        <img src={media.url} alt="" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="relative w-full h-full">
                                                                            <video src={media.url} className="w-full h-full object-cover" />
                                                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                                                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                                                                </svg>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="rounded-2xl border border-border band-tint p-8 text-center">
                                                <ImageOff className="w-8 h-8 text-primary mx-auto mb-3" />
                                                <p className="text-muted-foreground">Photos and highlights from this one are on the way, Yatri — check back soon to relive the day.</p>
                                            </div>
                                        )}
                                    </div>
                                </ScrollReveal>
                            )}
                        </div>
                    </div>

                    {/* Sidebar - Right Column */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">

                            {/* Organizer Card */}
                            {event.organizer && (
                                <ScrollReveal>
                                    <div className="bg-card border border-border rounded-2xl p-6">
                                        <h3 className="text-sm font-semibold text-muted-foreground mb-4">Hosted by</h3>
                                        <div className="flex items-center gap-3">
                                            {event.organizer.logo && (
                                                <img
                                                    src={event.organizer.logo}
                                                    alt={event.organizer.name}
                                                    className="w-12 h-12 rounded-full object-cover"
                                                />
                                            )}
                                            <p className="font-semibold">{event.organizer.name}</p>
                                        </div>
                                    </div>
                                </ScrollReveal>
                            )}

                            {/* Share Button */}
                            <ScrollReveal>
                                <button
                                    onClick={async () => {
                                        try {
                                            if (navigator.share) {
                                                await navigator.share({ title: event.name, url: window.location.href });
                                            } else {
                                                await navigator.clipboard.writeText(window.location.href);
                                                toast({ title: "Link copied!", description: "Share it with a friend." });
                                            }
                                        } catch {
                                            /* user dismissed the share sheet — ignore */
                                        }
                                    }}
                                    className="flex items-center justify-center gap-2 w-full min-h-[44px] border border-border hover:bg-brand-50 hover:border-brand-200 px-6 py-3 rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                >
                                    <Share2 className="w-4 h-4" />
                                    Share with a friend
                                </button>
                            </ScrollReveal>
                        </div>
                    </div>
                </div>
            </main>

            {/* Login Modal */}
            <LoginModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onSuccess={handleLoginSuccess}
            />

            {event && (
                <RegistrationModal
                    open={showRegistrationModal}
                    onClose={() => setShowRegistrationModal(false)}
                    event={event}
                    onSuccess={(registration) => {
                        setIsRegistered(true);
                        // Reuse existing success logic or adapt if needed
                        handleRegistrationSuccess();
                    }}
                />
            )}

            {event && (
                <WaitlistModal
                    open={showWaitlistModal}
                    onClose={() => setShowWaitlistModal(false)}
                    event={event}
                    onSuccess={handleWaitlistSuccess}
                />
            )}

            {/* Upcoming Events Section at Bottom */}
            <section className="container mx-auto px-4 md:px-6 py-16 border-t border-border">
                <ScrollReveal>
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">More ways to connect, Yatri</h2>
                        <Link to="/events" className="text-primary hover:underline font-medium text-sm flex items-center gap-1">
                            View all events <ExternalLink className="w-3 h-3" />
                        </Link>
                    </div>
                </ScrollReveal>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {allEvents
                        .filter(e => e.id !== event.id && e.status === 'upcoming' && new Date(e.date) > new Date())
                        .slice(0, 3)
                        .map((otherEvent, index) => (
                            <ScrollReveal key={otherEvent.id} delay={index * 0.1}>
                                <Link to={`/events/${otherEvent.slug || otherEvent.id}`} className="block h-full">
                                    <div className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-brand-200 hover:shadow-card transition-all duration-300 h-full flex flex-col">
                                        <div className="aspect-video overflow-hidden">
                                            <img
                                                src={otherEvent.imageUrl}
                                                alt={otherEvent.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        </div>
                                        <div className="p-6 flex-1 flex flex-col">
                                            <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                                                <Calendar className="w-3 h-3" />
                                                <span>{new Date(otherEvent.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            </div>
                                            <h3 className="font-display text-lg font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">{otherEvent.name}</h3>
                                            <div className="mt-auto flex items-center text-muted-foreground text-sm">
                                                <MapPin className="w-4 h-4 mr-1 text-primary" />
                                                <span className="truncate">{otherEvent.location.venue || otherEvent.location.city}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </ScrollReveal>
                        ))}

                    {/* Fallback if no local events, show MOCK_EVENTS */}
                    {allEvents.filter(e => e.id !== event.id && e.status === 'upcoming').length === 0 &&
                        MOCK_EVENTS.filter(e => e.id !== event.id).slice(0, 3).map((otherEvent, index) => (
                            <ScrollReveal key={otherEvent.id} delay={index * 0.1}>
                                <Link to={`/events/${otherEvent.slug || otherEvent.id}`} className="block h-full">
                                    <div className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-brand-200 hover:shadow-card transition-all duration-300 h-full flex flex-col">
                                        <div className="aspect-video overflow-hidden">
                                            <img
                                                src={otherEvent.imageUrl}
                                                alt={otherEvent.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        </div>
                                        <div className="p-6 flex-1 flex flex-col">
                                            <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                                                <Calendar className="w-3 h-3" />
                                                <span>{new Date(otherEvent.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            </div>
                                            <h3 className="font-display text-lg font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">{otherEvent.name}</h3>
                                            <div className="mt-auto flex items-center text-muted-foreground text-sm">
                                                <MapPin className="w-4 h-4 mr-1 text-primary" />
                                                <span className="truncate">{otherEvent.location.venue || otherEvent.location.city}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </ScrollReveal>
                        ))
                    }
                </div>
            </section>

            {/* Lightbox Modal */}
            {lightboxAlbum && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
                    onClick={() => setLightboxAlbum(null)}
                >
                    <button
                        onClick={() => setLightboxAlbum(null)}
                        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {lightboxAlbum.media && lightboxAlbum.media[lightboxIndex] && (
                        <div className="max-w-5xl max-h-[90vh] relative" onClick={(e) => e.stopPropagation()}>
                            {lightboxAlbum.media[lightboxIndex].type === 'photo' ? (
                                <img
                                    src={lightboxAlbum.media[lightboxIndex].url}
                                    alt=""
                                    className="max-w-full max-h-[90vh] object-contain mx-auto"
                                />
                            ) : (
                                <video
                                    src={lightboxAlbum.media[lightboxIndex].url}
                                    controls
                                    autoPlay
                                    className="max-w-full max-h-[90vh] mx-auto"
                                />
                            )}

                            {/* Navigation */}
                            {lightboxAlbum.media.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setLightboxIndex((prev) => (prev > 0 ? prev - 1 : lightboxAlbum.media.length - 1));
                                        }}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setLightboxIndex((prev) => (prev < lightboxAlbum.media.length - 1 ? prev + 1 : 0));
                                        }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </>
                            )}

                            {/* Counter */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
                                {lightboxIndex + 1} / {lightboxAlbum.media.length}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <Footer />
        </div>
    );
};

export default EventDetail;
