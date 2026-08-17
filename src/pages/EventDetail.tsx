import { useState, useEffect, useRef } from "react";
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
    Linkedin,
    Check,
    ArrowRight,
    Inbox,
    CalendarX,
    ImageOff,
    Lock,
    X,
    ChevronLeft,
    ChevronRight,
    Image,
    Star,
    Share2,
    Play
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
import { isAuthenticated, getStoredUser, getRegisteredEvents, type EventRegistration } from "@/lib/yatris-api";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";
import { getAllEvents, getEventBySlug, Event, EventSpeaker as Speaker, Ticket, Attendee, GalleryAlbum, GalleryMedia } from "@/lib/events-store";
import { canViewEventGallery, listEventGalleryMedia, type EventGalleryItem } from "@/lib/events-api";
import { formatEventPrice } from "@/lib/razorpay";
import { EntityReviews } from "@/components/reviews/EntityReviews";
import { googleCalendarUrl, buildIcs, icsDataUri } from "@/lib/calendar";
import { CountdownTimer } from "@/components/CountdownTimer";

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
    const [activeTab, setActiveTab] = useState<'about' | 'tickets' | 'speakers' | 'attendees' | 'community' | 'gallery' | 'reviews'>('about');
    const [lightboxAlbum, setLightboxAlbum] = useState<GalleryAlbum | null>(null);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRegistrationModal, setShowRegistrationModal] = useState(false);
    const [showWaitlistModal, setShowWaitlistModal] = useState(false);
    const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [registrationCode, setRegistrationCode] = useState<string | null>(null);
    const [capacity, setCapacity] = useState<EventCapacity | null>(null);
    const [waitlistEntry, setWaitlistEntry] = useState<WaitlistEntry | null>(null);
    // Attendees-only gallery (migration 074): only checked-in attendees + admins
    // can see a past event's photos, served as short-lived signed URLs.
    const [galleryItems, setGalleryItems] = useState<EventGalleryItem[]>([]);
    const [canViewGallery, setCanViewGallery] = useState(false);
    const [galleryLoaded, setGalleryLoaded] = useState(false);
    const [galleryLightbox, setGalleryLightbox] = useState<number | null>(null);
    const [sliderIndex, setSliderIndex] = useState(0);
    const sliderRef = useRef<HTMLDivElement>(null);
    // 'light' = dark background image → white navbar text
    // 'dark'  = light background image → dark navbar text
    const [heroTheme, setHeroTheme] = useState<'light' | 'dark'>('light');

    // Detect hero image brightness so we can flip the navbar text colour.
    useEffect(() => {
        if (!event?.imageUrl) return;
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                // Only sample the top-left 200×80 px (where the navbar sits)
                canvas.width = 200;
                canvas.height = 80;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                ctx.drawImage(img, 0, 0, 200, 80);
                const { data } = ctx.getImageData(0, 0, 200, 80);
                let total = 0;
                for (let i = 0; i < data.length; i += 4) {
                    // Perceived luminance formula
                    total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                }
                const avg = total / (data.length / 4);
                // avg < 128 → dark image → use light/white text
                setHeroTheme(avg < 140 ? 'light' : 'dark');
            } catch {
                setHeroTheme('light'); // safe fallback: assume dark
            }
        };
        img.onerror = () => setHeroTheme('light');
        img.src = event.imageUrl;
    }, [event?.imageUrl]);

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
                    const registration = regs.find(r => r.eventId === resolvedId && r.status === 'confirmed');
                    setIsRegistered(Boolean(registration));
                    setRegistrationCode(registration?.attendees?.[0]?.ticketId ?? null);
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

    useEffect(() => {
        if (event) {
            const hidden = event.hiddenSections || [];
            if (hidden.includes(activeTab)) {
                const availableTabs = [
                    'about', 'tickets', 'speakers', 'attendees', 'community',
                    ...(event.status === 'past' ? ['gallery'] : []), 'reviews'
                ].filter(id => !hidden.includes(id));
                if (availableTabs.length > 0) {
                    setActiveTab(availableTabs[0] as any);
                }
            }
        }
    }, [event, activeTab]);

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

    const handleRegistrationSuccess = (registration: EventRegistration) => {
        setIsRegistered(true);
        setRegistrationCode(registration.attendees?.[0]?.ticketId ?? null);
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

    // For past events load gallery immediately (not tab-gated)
    useEffect(() => {
        if (!event || event.status !== "past" || galleryLoaded) return;
        let active = true;
        (async () => {
            const can = await canViewEventGallery(event.id);
            if (!active) return;
            setCanViewGallery(can);
            if (can) setGalleryItems(await listEventGalleryMedia(event.id));
            setGalleryLoaded(true);
        })();
        return () => { active = false; };
    }, [event, galleryLoaded]);

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

    // ─── PAST EVENT RECAP UI ───────────────────────────────────────────────────
    if (isPastEvent) {
        const pastTabs = [
            { id: 'about', label: 'About' },
            { id: 'speakers', label: 'Speakers' },
            { id: 'attendees', label: 'Attendees' },
            { id: 'reviews', label: 'Reviews' },
        ].filter(tab => !(event.hiddenSections || []).includes(tab.id));

        const sliderPrev = () => setSliderIndex(i => Math.max(0, i - 1));
        const sliderNext = () => setSliderIndex(i => Math.min(galleryItems.length - 1, i + 1));

        const locationDisplay = event.location?.type === 'online'
            ? 'Online Event'
            : [event.location?.city, event.location?.country].filter(Boolean).join(', ');

        return (
            <div className="min-h-screen bg-background text-foreground">
                <SEO
                    title={`${event.name} — Event Recap · Yatri Cloud`}
                    description={event.description || `Relive ${event.name}, a Yatri Cloud community event.`}
                    image={event.imageUrl}
                    type="article"
                    noindex={event.visibility === 'private'}
                />
                <div className="noise-overlay" />
                <Navbar heroTheme={heroTheme} />

                {/* ── Cinematic hero ───────────────────────────────────── */}
                <div className="relative min-h-[60vh] md:min-h-[70vh] flex items-end overflow-hidden">
                    {/* background image */}
                    <img
                        src={event.imageUrl}
                        alt={event.name}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    {/* gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />

                    {/* back link */}
                    <Link
                        to="/events"
                        className="absolute top-24 left-6 md:left-10 inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">All events</span>
                    </Link>

                    <div className="relative z-10 w-full container mx-auto px-4 md:px-6 pb-10 md:pb-14">
                        {/* badges row */}
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold">
                                <CalendarX className="w-3.5 h-3.5" /> Event Recap
                            </span>
                            {event.category && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/80 backdrop-blur-sm text-white text-xs font-semibold">
                                    {event.category}
                                </span>
                            )}
                            {event.techStack?.slice(0, 3).map((t, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-white/80 text-xs font-medium">{t}</span>
                            ))}
                        </div>

                        <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4 max-w-4xl leading-tight">
                            {event.name}
                        </h1>

                        {/* Event meta — clean, no icons */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-white/60 text-sm font-medium">
                            <span className="text-white/90">{formatEventDate(event.date, event.timezone)}</span>
                            <span className="text-white/30">·</span>
                            <span>{locationDisplay}</span>
                            {event.attendees && event.attendees.length > 0 && (
                                <>
                                    <span className="text-white/30">·</span>
                                    <span>{event.attendees.length} Attendees</span>
                                </>
                            )}
                            {event.speakers && event.speakers.length > 0 && (
                                <>
                                    <span className="text-white/30">·</span>
                                    <span>{event.speakers.length} {event.speakers.length === 1 ? 'Speaker' : 'Speakers'}</span>
                                </>
                            )}
                            {canViewGallery && galleryItems.length > 0 && (
                                <>
                                    <span className="text-white/30">·</span>
                                    <span>{galleryItems.length} Photos</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Gallery Spotlight Slider ─────────────────────────── */}
                {canViewGallery && galleryItems.length > 0 && !( event.hiddenSections || []).includes('gallery') && (
                    <div className="bg-background border-t border-border py-8">
                        <div className="container mx-auto px-4 md:px-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-2 text-foreground font-semibold text-lg">
                                        <Image className="w-5 h-5 text-primary" /> Moments from the day
                                    </span>
                                    <span className="text-muted-foreground text-sm tabular-nums">{sliderIndex + 1} / {galleryItems.length}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={sliderPrev}
                                        disabled={sliderIndex === 0}
                                        className="w-9 h-9 flex items-center justify-center rounded-full bg-muted hover:bg-muted/60 text-foreground disabled:opacity-30 transition border border-border"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={sliderNext}
                                        disabled={sliderIndex >= galleryItems.length - 1}
                                        className="w-9 h-9 flex items-center justify-center rounded-full bg-muted hover:bg-muted/60 text-foreground disabled:opacity-30 transition border border-border"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* main featured image */}
                            <button
                                className="relative w-full aspect-video rounded-2xl overflow-hidden mb-3 group focus:outline-none"
                                onClick={() => setGalleryLightbox(sliderIndex)}
                            >
                                {galleryItems[sliderIndex]?.mediaType === 'photo' ? (
                                    <img src={galleryItems[sliderIndex].url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                ) : (
                                    <div className="relative w-full h-full">
                                        <video src={galleryItems[sliderIndex].url} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/30 transition">
                                            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                                <Play className="w-7 h-7 text-white fill-white" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {galleryItems[sliderIndex]?.caption && (
                                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                                        <p className="text-white text-sm">{galleryItems[sliderIndex].caption}</p>
                                    </div>
                                )}
                            </button>

                            {/* thumbnail strip */}
                            <div ref={sliderRef} className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                                {galleryItems.map((item, idx) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setSliderIndex(idx)}
                                        className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden transition-all ${
                                            idx === sliderIndex
                                                ? 'ring-2 ring-primary ring-offset-2 ring-offset-background opacity-100'
                                                : 'opacity-50 hover:opacity-80'
                                        }`}
                                    >
                                        {item.mediaType === 'photo' ? (
                                            <img src={item.url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-muted flex items-center justify-center">
                                                <Play className="w-4 h-4 text-muted-foreground" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Main content ─────────────────────────────────────── */}
                <main className="container mx-auto px-4 md:px-6 py-10">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                        {/* Left: Tabbed content */}
                        <div className="lg:col-span-2">
                            {pastTabs.length > 0 && (
                                <div className="border-b border-border mb-8 overflow-x-auto scrollbar-hide">
                                    <div className="flex gap-6 md:gap-8">
                                        {pastTabs.map(tab => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id as any)}
                                                aria-pressed={activeTab === tab.id}
                                                className={`min-h-[44px] pb-4 px-2 text-sm font-medium whitespace-nowrap transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm ${
                                                    activeTab === tab.id
                                                        ? 'text-primary'
                                                        : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                            >
                                                {tab.label}
                                                {activeTab === tab.id && (
                                                    <motion.div
                                                        layoutId="pastActiveTab"
                                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                                                        transition={reduceMotion ? { duration: 0 } : undefined}
                                                    />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* About */}
                            {activeTab === 'about' && (
                                <ScrollReveal>
                                    <div className="space-y-6">
                                        <div>
                                            <h2 className="font-display text-2xl font-bold mb-3">What this event was about</h2>
                                            <p className="text-muted-foreground leading-relaxed text-base">{event.fullDescription || event.description}</p>
                                        </div>
                                        {event.techStack && event.techStack.length > 0 && (
                                            <div>
                                                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Topics covered</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {event.techStack.map((t, i) => (
                                                        <span key={i} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">{t}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </ScrollReveal>
                            )}

                            {/* Speakers */}
                            {activeTab === 'speakers' && (
                                <ScrollReveal>
                                    <div>
                                        <h2 className="font-display text-2xl font-bold mb-6">Who took the stage</h2>
                                        {event.speakers && event.speakers.length > 0 ? (
                                            <div className="space-y-4">
                                                {event.speakers.map(speaker => (
                                                    <div key={speaker.id} className="bg-card border border-border rounded-2xl p-6 hover:border-brand-200 hover:shadow-card transition-all">
                                                        <div className="flex gap-5 items-start">
                                                            {speaker.profileImage ? (
                                                                <img src={speaker.profileImage} alt={speaker.fullName} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
                                                            ) : (
                                                                <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10 font-display text-3xl font-bold text-primary">
                                                                    {(speaker.fullName || '?').charAt(0).toUpperCase()}
                                                                </div>
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                                    <h3 className="text-lg font-bold text-foreground">{speaker.fullName}</h3>
                                                                    {speaker.linkedinUrl && (
                                                                        <a href={speaker.linkedinUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 hover:opacity-80" aria-label="LinkedIn">
                                                                            <Linkedin className="w-4 h-4 text-primary" />
                                                                        </a>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm font-medium text-primary mb-0.5">{speaker.sessionName || 'Speaker'}</p>
                                                                {speaker.companyName && <p className="text-sm text-muted-foreground mb-2">{speaker.companyName}</p>}
                                                                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{speaker.about}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="rounded-2xl border border-border bg-muted/30 p-8 text-center">
                                                <Users className="w-8 h-8 text-primary mx-auto mb-3" />
                                                <p className="text-muted-foreground">Speaker details haven't been added for this event yet.</p>
                                            </div>
                                        )}
                                    </div>
                                </ScrollReveal>
                            )}

                            {/* Attendees */}
                            {activeTab === 'attendees' && (
                                <ScrollReveal>
                                    <div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <h2 className="font-display text-2xl font-bold">Yatris who were there</h2>
                                            {event.attendees && event.attendees.length > 0 && (
                                                <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-semibold rounded-full bg-primary/10 text-primary border border-primary/20">
                                                    {event.attendees.length}
                                                </span>
                                            )}
                                        </div>
                                        {event.attendees && event.attendees.length > 0 ? (
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                {event.attendees.map(attendee => (
                                                    <div key={attendee.id} className="bg-card border border-border rounded-xl p-4 hover:border-brand-200 transition-all hover:shadow-card">
                                                        <div className="flex flex-col items-center text-center">
                                                            <img src={attendee.imageUrl} alt={attendee.name} className="w-14 h-14 rounded-full object-cover mb-2" />
                                                            <p className="font-semibold text-sm truncate w-full">{attendee.name}</p>
                                                            <p className="text-xs text-primary font-medium">{attendee.role}</p>
                                                            {attendee.company && <p className="text-xs text-muted-foreground truncate w-full">{attendee.company}</p>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="rounded-2xl border border-border bg-muted/30 p-8 text-center">
                                                <Users className="w-8 h-8 text-primary mx-auto mb-3" />
                                                <p className="text-muted-foreground">Attendee list not available.</p>
                                            </div>
                                        )}
                                    </div>
                                </ScrollReveal>
                            )}

                            {/* Reviews */}
                            {activeTab === 'reviews' && (
                                <ScrollReveal>
                                    <div>
                                        <h2 className="font-display text-2xl font-bold mb-6">What Yatris said</h2>
                                        <EntityReviews
                                            entityType="event"
                                            entityId={event.id}
                                            entityName={event.name}
                                            gateHint="Reviews are open to Yatris who attended this event."
                                        />
                                    </div>
                                </ScrollReveal>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-24 space-y-4">

                                {/* Event details card */}
                                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                                    <div className="px-5 py-4 border-b border-border">
                                        <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">About this event</p>
                                    </div>
                                    <div className="divide-y divide-border">
                                        <div className="px-5 py-4">
                                            <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/70 mb-1">Held on</p>
                                            <p className="text-sm font-semibold text-foreground">{formatEventDate(event.date, event.timezone)}</p>
                                        </div>
                                        <div className="px-5 py-4">
                                            <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/70 mb-1">Location</p>
                                            <p className="text-sm font-semibold text-foreground">{locationDisplay}</p>
                                            {event.location?.venue && (
                                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{event.location.venue}</p>
                                            )}
                                        </div>
                                        {event.organizer && (
                                            <div className="px-5 py-4">
                                                <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/70 mb-2">Organised by</p>
                                                <div className="flex items-center gap-3">
                                                    {event.organizer.logo ? (
                                                        <img src={event.organizer.logo} alt={event.organizer.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-border" />
                                                    ) : null}
                                                    <p className="text-sm font-semibold text-foreground">{event.organizer.name}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Gallery locked note */}
                                {!canViewGallery && !(event.hiddenSections || []).includes('gallery') && (
                                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                                        <div className="px-5 py-4 border-b border-border">
                                            <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Gallery</p>
                                        </div>
                                        <div className="px-5 py-4">
                                            <p className="text-sm font-semibold text-foreground mb-1">Photos for attendees only</p>
                                            <p className="text-xs text-muted-foreground leading-relaxed">Sign in with the account you used to attend this event to view the photo gallery.</p>
                                        </div>
                                    </div>
                                )}

                                {/* Share */}
                                <div className="space-y-2">
                                    <button
                                        onClick={async () => {
                                            try {
                                                if (navigator.share) {
                                                    await navigator.share({ title: event.name, url: window.location.href });
                                                } else {
                                                    await navigator.clipboard.writeText(window.location.href);
                                                    toast({ title: 'Link copied!', description: 'Share it with a friend.' });
                                                }
                                            } catch { /* dismissed */ }
                                        }}
                                        className="flex items-center justify-center gap-2 w-full min-h-[44px] border border-border hover:bg-brand-50 hover:border-brand-200 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                                    >
                                        <Share2 className="w-4 h-4" /> Share recap
                                    </button>
                                    <a
                                        href={`https://wa.me/?text=${encodeURIComponent(`Check out the recap for ${event.name} — a Yatri Cloud event: ${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
                                        target="_blank" rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 w-full min-h-[44px] border border-border hover:bg-brand-50 hover:border-brand-200 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                                    >
                                        Share on WhatsApp
                                    </a>
                                </div>

                                {/* Upcoming events CTA */}
                                <div className="bg-gradient-to-br from-primary/10 to-brand-50/50 border border-primary/20 rounded-2xl p-5 text-center">
                                    <p className="font-semibold text-sm mb-1">Missed this one?</p>
                                    <p className="text-xs text-muted-foreground mb-3">Don't miss the next one — join the Yatri community.</p>
                                    <Link
                                        to="/events"
                                        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-600 transition-colors"
                                    >
                                        See upcoming events <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* More events */}
                {allEvents.filter(e => e.id !== event.id && e.status === 'upcoming').length > 0 && (
                    <section className="container mx-auto px-4 md:px-6 py-14 border-t border-border">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="font-display text-2xl font-bold">Up next, Yatri</h2>
                            <Link to="/events" className="text-primary hover:underline font-medium text-sm flex items-center gap-1">
                                View all <ExternalLink className="w-3 h-3" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {allEvents
                                .filter(e => e.id !== event.id && e.status === 'upcoming' && new Date(e.date) > new Date())
                                .slice(0, 3)
                                .map((ev, i) => (
                                    <ScrollReveal key={ev.id} delay={i * 0.1}>
                                        <Link to={`/events/${ev.slug || ev.id}`} className="block h-full">
                                            <div className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-brand-200 hover:shadow-card transition-all h-full flex flex-col">
                                                <div className="aspect-video overflow-hidden">
                                                    <img src={ev.imageUrl} alt={ev.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                                </div>
                                                <div className="p-5 flex-1 flex flex-col">
                                                    <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </div>
                                                    <h3 className="font-display text-base font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">{ev.name}</h3>
                                                    <div className="mt-auto flex items-center text-muted-foreground text-sm">
                                                        <MapPin className="w-3.5 h-3.5 mr-1 text-primary" />
                                                        <span className="truncate">{ev.location?.venue || ev.location?.city}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </ScrollReveal>
                                ))}
                        </div>
                    </section>
                )}

                {/* Lightbox for past-event gallery */}
                {galleryLightbox !== null && galleryItems[galleryLightbox] && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4" onClick={() => setGalleryLightbox(null)}>
                        <button className="absolute right-4 top-4 text-white/70 hover:text-white" onClick={() => setGalleryLightbox(null)}>
                            <X className="h-7 w-7" />
                        </button>
                        <button
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white disabled:opacity-30"
                            onClick={e => { e.stopPropagation(); setGalleryLightbox(i => Math.max(0, (i ?? 0) - 1)); }}
                            disabled={galleryLightbox === 0}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        {galleryItems[galleryLightbox].mediaType === 'photo' ? (
                            <img src={galleryItems[galleryLightbox].url} alt="" className="max-h-[88vh] max-w-full rounded-lg object-contain" onClick={e => e.stopPropagation()} />
                        ) : (
                            <video src={galleryItems[galleryLightbox].url} controls autoPlay className="max-h-[88vh] max-w-full rounded-lg" onClick={e => e.stopPropagation()} />
                        )}
                        <button
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white disabled:opacity-30"
                            onClick={e => { e.stopPropagation(); setGalleryLightbox(i => Math.min(galleryItems.length - 1, (i ?? 0) + 1)); }}
                            disabled={galleryLightbox >= galleryItems.length - 1}
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-1.5 rounded-full text-sm">
                            {galleryLightbox + 1} / {galleryItems.length}
                        </div>
                    </div>
                )}

                <Footer />
            </div>
        );
    }
    // ─────────────────────────────────────────────────────────────────────────

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
        { id: 'reviews', label: 'Reviews' },
    ].filter(tab => !(event.hiddenSections || []).includes(tab.id));

    return (
        <div className="min-h-screen bg-background text-foreground">
            <SEO
                title={`${event.name} · Yatri Cloud Events`}
                description={event.description || `Join us for ${event.name}, a friendly cloud community event by Yatri Cloud. Save your spot for free.`}
                image={event.imageUrl}
                type="article"
                noindex={event.visibility === "private"}
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
                                {event.price != null && (
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <Tag className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Price</p>
                                            <p className="font-semibold text-2xl text-primary tracking-tight">
                                                {formatEventPrice(event.price)}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-border">
                                    {/* Countdown to the start — a reason to decide now */}
                                    {!isPastEvent && hasEventDate && (
                                        <div className="mb-4">
                                            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">Starts in</p>
                                            <CountdownTimer targetDate={new Date(event.date)} />
                                        </div>
                                    )}

                                    {/* Seats meter when a cap is set and seats remain */}
                                    {capacity?.capacity != null && !isFull && capacity.seatsLeft !== null && (
                                        <div className="mb-4">
                                            <div className="flex items-baseline justify-between text-sm font-medium">
                                                <span className={capacity.seatsLeft <= 10 ? 'text-warning' : 'text-muted-foreground'}>
                                                    {capacity.seatsLeft <= 10
                                                        ? `Filling fast — only ${capacity.seatsLeft} ${capacity.seatsLeft === 1 ? 'seat' : 'seats'} left`
                                                        : `${capacity.seatsLeft} of ${capacity.capacity} seats still open`}
                                                </span>
                                                <span className="tabular-nums text-xs text-muted-foreground">
                                                    {capacity.registered} registered
                                                </span>
                                            </div>
                                            <div
                                                role="progressbar"
                                                aria-label="Seats taken"
                                                aria-valuemin={0}
                                                aria-valuemax={capacity.capacity}
                                                aria-valuenow={capacity.registered}
                                                className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted"
                                            >
                                                <div
                                                    className={`h-full rounded-full transition-[width] duration-500 ${capacity.seatsLeft <= 10 ? 'bg-warning' : 'bg-primary'}`}
                                                    style={{ width: `${Math.min(100, Math.round((capacity.registered / capacity.capacity) * 100))}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {/* Sold out note when full and not already handled */}
                                    {isFull && !isRegistered && !onWaitlist && (
                                        <p className="text-sm mb-4 font-medium text-muted-foreground">
                                            Sold out. Join the waitlist and we will email you if a seat opens.
                                        </p>
                                    )}

                                    {/* Registration Button */}
                                    {isRegistered ? (
                                        <div className="space-y-4">
                                            <div className="w-full bg-success/10 text-success border border-success/20 px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-default">
                                                <CheckCircle2 className="w-5 h-5" />
                                                <span>You're in, Yatri — see you there!</span>
                                            </div>
                                            {registrationCode && (
                                                <div className="rounded-2xl border border-success/20 bg-success/5 p-4">
                                                    <p className="text-xs text-success/80 uppercase tracking-[0.18em] font-semibold mb-2">Registration code</p>
                                                    <p className="font-mono text-lg font-semibold text-success tracking-[0.18em]">
                                                        {registrationCode}
                                                    </p>
                                                </div>
                                            )}
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
                                                Add to Google Calendar
                                            </a>
                                            <a
                                                href={eventIcsUri}
                                                download={`${event.name}.ics`}
                                                className="flex items-center justify-center gap-2 min-h-[44px] border border-border hover:bg-brand-50 hover:border-brand-200 px-4 py-3 rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                            >
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
                                                                <div className="text-2xl font-bold tracking-tight text-primary">
                                                                {formatEventPrice(ticket.price)}
                                                            </div>
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
                                                            {speaker.profileImage ? (
                                                                <img
                                                                    src={speaker.profileImage}
                                                                    alt={speaker.fullName}
                                                                    className="w-32 h-32 rounded-2xl bg-muted object-cover flex-shrink-0"
                                                                />
                                                            ) : (
                                                                // No stock-photo strangers: an initial avatar until a real photo is set
                                                                <div aria-hidden="true" className="flex h-32 w-32 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10 font-display text-4xl font-bold text-primary">
                                                                    {(speaker.fullName || "?").charAt(0).toUpperCase()}
                                                                </div>
                                                            )}
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
                                                Join the Yatris on Discord
                                            </a>
                                        )}
                                    </div>
                                </ScrollReveal>
                            )}

                            {activeTab === 'reviews' && (
                                <ScrollReveal>
                                    <div>
                                        <h2 className="font-display text-2xl font-bold mb-6">What Yatris say about this event</h2>
                                        <EntityReviews
                                            entityType="event"
                                            entityId={event.id}
                                            entityName={event.name}
                                            gateHint="Reviews are open to Yatris registered for this event."
                                        />
                                    </div>
                                </ScrollReveal>
                            )}

                            {activeTab === 'gallery' && (
                                <ScrollReveal>
                                    <div>
                                        <h2 className="font-display text-2xl font-bold mb-6">Moments from the day</h2>
                                        {!canViewGallery ? (
                                            <div className="rounded-2xl border border-border band-tint p-8 text-center" data-testid="gallery-locked">
                                                <Lock className="w-8 h-8 text-primary mx-auto mb-3" />
                                                <p className="font-semibold text-foreground mb-1">Photos are shared with attendees</p>
                                                <p className="text-muted-foreground text-sm">Only Yatris who attended this event can view the gallery. If you were there and checked in, sign in with that account to relive the day.</p>
                                            </div>
                                        ) : galleryItems.length > 0 ? (
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" data-testid="gallery-grid">
                                                {galleryItems.map((item, idx) => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => setGalleryLightbox(idx)}
                                                        className="aspect-square bg-muted rounded-lg overflow-hidden hover:opacity-80 transition-opacity cursor-pointer relative"
                                                    >
                                                        {item.mediaType === 'photo' ? (
                                                            <img src={item.url} alt={item.caption || ''} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="relative w-full h-full">
                                                                <video src={item.url} className="w-full h-full object-cover" />
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
                                        ) : (
                                            <div className="rounded-2xl border border-border band-tint p-8 text-center">
                                                <ImageOff className="w-8 h-8 text-primary mx-auto mb-3" />
                                                <p className="text-muted-foreground">Photos and highlights from this one are on the way, Yatri — check back soon to relive the day.</p>
                                            </div>
                                        )}
                                        {galleryLightbox !== null && galleryItems[galleryLightbox] && (
                                            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4" onClick={() => setGalleryLightbox(null)}>
                                                <button className="absolute right-4 top-4 text-white/80 hover:text-white" onClick={() => setGalleryLightbox(null)}><X className="h-7 w-7" /></button>
                                                {galleryItems[galleryLightbox].mediaType === 'photo' ? (
                                                    <img src={galleryItems[galleryLightbox].url} alt="" className="max-h-[88vh] max-w-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
                                                ) : (
                                                    <video src={galleryItems[galleryLightbox].url} controls autoPlay className="max-h-[88vh] max-w-full rounded-lg" onClick={(e) => e.stopPropagation()} />
                                                )}
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
                                    Share with a friend
                                </button>
                                <a
                                    href={`https://wa.me/?text=${encodeURIComponent(`Join me at ${event.name} — a Yatri Cloud event: ${typeof window !== "undefined" ? window.location.href : ""}`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 flex items-center justify-center gap-2 w-full min-h-[44px] border border-border hover:bg-brand-50 hover:border-brand-200 px-6 py-3 rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                >
                                    Share on WhatsApp
                                </a>
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
                    onSuccess={handleRegistrationSuccess as any}
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
