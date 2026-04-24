import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
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
    Linkedin
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { SEO } from "@/components/SEO";
import { LoginModal } from "@/components/LoginModal";
import { RegistrationModal } from "@/components/RegistrationModal";
import { isAuthenticated, getStoredUser, getRegisteredEvents } from "@/lib/yatris-api";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";
import { getAllEvents, getEventBySlug, Event, EventSpeaker as Speaker, Ticket, Attendee, GalleryAlbum, GalleryMedia } from "@/lib/events-store";

// Fallback mock events - initially empty
const MOCK_EVENTS: Event[] = [];

const EventDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [event, setEvent] = useState<Event | null>(null);
    const [activeTab, setActiveTab] = useState<'about' | 'tickets' | 'speakers' | 'attendees' | 'community' | 'gallery'>('about');
    const [lightboxAlbum, setLightboxAlbum] = useState<GalleryAlbum | null>(null);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRegistrationModal, setShowRegistrationModal] = useState(false);
    const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);

    // Check if user is logged in
    useEffect(() => {
        setIsUserLoggedIn(isAuthenticated());
    }, []);

    useEffect(() => {
        // Find event by ID or Slug
        const foundEvent = getEventBySlug(id || "");

        if (foundEvent) {
            // Map store event to detail event if needed, or just use as is
            // For now, the interfaces are mostly compatible for common fields
            setEvent(foundEvent as any);
        } else {
            // Check if it's one of the internal MOCK_EVENTS as fallback
            const mockEvent = MOCK_EVENTS.find(e => e.id === id); // Mocks don't have slugs yet usually
            if (mockEvent) {
                setEvent(mockEvent);
            } else {
                navigate('/events');
            }
        }

        // Scroll to top
        window.scrollTo(0, 0);

        // Check registration status
        const checkRegistration = async () => {
            if (isAuthenticated()) {
                const regs = await getRegisteredEvents();
                const isReg = regs.some(r => r.eventId === id && r.status === 'confirmed');
                setIsRegistered(isReg);
            }
        };
        checkRegistration();
    }, [id, navigate]);

    const handleRegister = () => {
        if (!isUserLoggedIn) {
            // Show login modal if not logged in
            setShowLoginModal(true);
            return;
        }
        setShowRegistrationModal(true);
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
        // After login, automatically proceed with registration
        setTimeout(() => {
            handleRegister();
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
            <SEO title={event.name} description={event.description} />
            <div className="noise-overlay" />
            <Navbar />

            <main className="container mx-auto px-4 md:px-6 pt-24 pb-12">
                {/* Back Button */}
                <Link to="/events" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Events</span>
                </Link>

                {/* Event Title */}
                <ScrollReveal>
                    <h1 className="text-3xl md:text-5xl font-bold mb-8">{event.name}</h1>
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
                            <div className="bg-card border-2 border-primary/20 rounded-3xl p-6 space-y-6 h-full">
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
                                    {event.seatsAvailable && event.seatsAvailable < 20 && (
                                        <p className="text-sm text-orange-500 mb-4 flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            Only {event.seatsAvailable} seats left!
                                        </p>
                                    )}

                                    {/* Registration Button */}
                                    {isRegistered ? (
                                        <div className="w-full bg-green-100 text-green-700 border border-green-200 px-6 py-3 rounded-full font-semibold flex items-center justify-center gap-2 cursor-default">
                                            <CheckCircle2 className="w-5 h-5" />
                                            <span>You are going!</span>
                                        </div>
                                    ) : event.requiresLogin && !isUserLoggedIn ? (
                                        <button
                                            onClick={() => setShowLoginModal(true)}
                                            className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                                        >
                                            Login to Register
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleRegister}
                                            className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold hover:bg-primary/90 transition-colors"
                                        >
                                            Register Now
                                        </button>
                                    )}

                                    {event.registrationDeadline && (
                                        <p className="text-xs text-muted-foreground text-center mt-2">
                                            Registration open till {formatEventDate(event.registrationDeadline, event.timezone)}
                                        </p>
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
                        <div className="border-b border-border mb-8">
                            <div className="flex gap-8">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`pb-4 px-2 text-sm font-medium transition-colors relative ${activeTab === tab.id
                                            ? 'text-primary'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        {tab.label}
                                        {activeTab === tab.id && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
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
                                        <h2 className="text-2xl font-bold mb-4">About this Event</h2>
                                        <p className="text-muted-foreground leading-relaxed">
                                            {event.fullDescription || event.description}
                                        </p>
                                    </div>
                                </ScrollReveal>
                            )}

                            {activeTab === 'tickets' && (
                                <ScrollReveal>
                                    <div>
                                        <h2 className="text-2xl font-bold mb-6">Available Tickets</h2>
                                        {event.tickets && event.tickets.length > 0 ? (
                                            <div className="space-y-4">
                                                {event.tickets.map(ticket => (
                                                    <div
                                                        key={ticket.id}
                                                        className="bg-card border-2 border-border rounded-2xl p-6 hover:border-primary/30 transition-all"
                                                    >
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div>
                                                                <h3 className="text-xl font-bold text-foreground mb-1">{ticket.type}</h3>
                                                                <p className="text-sm text-muted-foreground">{ticket.description}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-2xl font-bold text-primary">{ticket.price}</div>
                                                                {ticket.available && (
                                                                    <span className="inline-block mt-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-500/10 text-green-500">
                                                                        Available
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
                                                                            <span className="text-primary mt-1">✓</span>
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
                                            <p className="text-muted-foreground">Ticket information will be available soon.</p>
                                        )}
                                    </div>
                                </ScrollReveal>
                            )}

                            {activeTab === 'speakers' && (
                                <ScrollReveal>
                                    <div>
                                        <h2 className="text-2xl font-bold mb-6">Featured Speakers</h2>
                                        {event.speakers && event.speakers.length > 0 ? (
                                            <div className="space-y-6">
                                                {event.speakers.map(speaker => (
                                                    <div
                                                        key={speaker.id}
                                                        className="bg-card border-2 border-border rounded-2xl p-6 hover:border-primary/30 transition-all"
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
                                                                                <Linkedin className="w-5 h-5 text-blue-600" />
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
                                            <p className="text-muted-foreground">Speaker information will be announced soon.</p>
                                        )}
                                    </div>
                                </ScrollReveal>
                            )}

                            {activeTab === 'attendees' && (
                                <ScrollReveal>
                                    <div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <h2 className="text-2xl font-bold">Attendees</h2>
                                            {event.attendees && event.attendees.length > 0 && (
                                                <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-semibold rounded-full bg-gradient-to-r from-primary/20 to-primary/10 text-primary border border-primary/20">
                                                    {event.attendees.length} {event.attendees.length === 1 ? 'Person' : 'People'}
                                                </span>
                                            )}
                                        </div>
                                        {event.attendees && event.attendees.length > 0 ? (
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                {event.attendees.map(attendee => (
                                                    <div
                                                        key={attendee.id}
                                                        className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all hover:shadow-md"
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
                                            <p className="text-muted-foreground">No attendees yet. Be the first to register!</p>
                                        )}
                                    </div>
                                </ScrollReveal>
                            )}

                            {activeTab === 'community' && (
                                <ScrollReveal>
                                    <div>
                                        <h2 className="text-2xl font-bold mb-4">Join Our Community</h2>
                                        <p className="text-muted-foreground leading-relaxed mb-6">
                                            Connect with fellow learners, share knowledge, and stay updated with the latest news and announcements.
                                        </p>
                                        {event.communityLink && (
                                            <a
                                                href={event.communityLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-3 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl"
                                            >
                                                <ExternalLink className="w-5 h-5" />
                                                Join Discord Community
                                            </a>
                                        )}
                                    </div>
                                </ScrollReveal>
                            )}

                            {activeTab === 'gallery' && (
                                <ScrollReveal>
                                    <div>
                                        <h2 className="text-2xl font-bold mb-6">Event Gallery</h2>
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
                                            <p className="text-muted-foreground">No photos available yet.</p>
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
                                <button className="flex items-center justify-center gap-2 w-full border border-border hover:bg-muted px-6 py-3 rounded-full font-medium transition-colors">
                                    <Share2 className="w-4 h-4" />
                                    Share Event
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

            {/* Upcoming Events Section at Bottom */}
            <section className="container mx-auto px-4 md:px-6 py-16 border-t border-border">
                <ScrollReveal>
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-2xl md:text-3xl font-bold text-foreground">Upcoming Events</h2>
                        <Link to="/events" className="text-primary hover:underline font-medium text-sm flex items-center gap-1">
                            View All Events <ExternalLink className="w-3 h-3" />
                        </Link>
                    </div>
                </ScrollReveal>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {getAllEvents()
                        .filter(e => e.id !== id && e.status === 'upcoming' && new Date(e.date) > new Date())
                        .slice(0, 3)
                        .map((otherEvent, index) => (
                            <ScrollReveal key={otherEvent.id} delay={index * 0.1}>
                                <Link to={`/events/${otherEvent.id}`} className="block h-full">
                                    <div className="group bg-card rounded-3xl overflow-hidden border border-border hover:border-primary/50 transition-all duration-300 h-full flex flex-col">
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
                                            <h3 className="text-lg font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">{otherEvent.name}</h3>
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
                    {getAllEvents().filter(e => e.id !== id && e.status === 'upcoming').length === 0 &&
                        MOCK_EVENTS.filter(e => e.id !== id).slice(0, 3).map((otherEvent, index) => (
                            <ScrollReveal key={otherEvent.id} delay={index * 0.1}>
                                <Link to={`/events/${otherEvent.id}`} className="block h-full">
                                    <div className="group bg-card rounded-3xl overflow-hidden border border-border hover:border-primary/50 transition-all duration-300 h-full flex flex-col">
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
                                            <h3 className="text-lg font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">{otherEvent.name}</h3>
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
