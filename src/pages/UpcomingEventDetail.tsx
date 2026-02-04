import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Calendar, MapPin, Clock, ArrowLeft, Users, Building2, Mic, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getEventBySlug, Event } from "@/lib/events-store";
import { motion } from "framer-motion";

export default function UpcomingEventDetail() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (slug) {
            const foundEvent = getEventBySlug(slug);
            if (foundEvent && foundEvent.isUpcoming) {
                setEvent(foundEvent);
            } else {
                // Redirect if not found or not an upcoming event
                navigate('/events');
            }
            setLoading(false);
        }
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

    return (
        <div className="min-h-screen bg-background">
            {/* Header Removed as per request */}

            {/* Event Banner */}
            <div className="relative h-[400px] overflow-hidden">
                <img
                    src={event.imageUrl}
                    alt={event.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-8 container mx-auto">
                    <div className="inline-block px-3 py-1 bg-yellow-500 text-yellow-900 rounded-full text-sm font-semibold mb-4">
                        🚀 Upcoming Event - Help Needed!
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">{event.name}</h1>
                    <p className="text-lg text-muted-foreground max-w-3xl">{event.description}</p>
                    {/* Tech Stack Tags */}
                    {event.techStack && event.techStack.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {event.techStack.map((tech, i) => (
                                <span key={i} className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold backdrop-blur-sm border border-primary/20">
                                    {tech}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Event Details */}
                        <motion.div
                            className="bg-card rounded-xl p-6 shadow-sm border"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <h2 className="text-2xl font-bold mb-6">About This Event</h2>
                            <div className="prose prose-slate dark:prose-invert max-w-none">
                                {event.fullDescription ? (
                                    <p className="whitespace-pre-wrap">{event.fullDescription}</p>
                                ) : (
                                    <p>{event.description}</p>
                                )}
                            </div>
                        </motion.div>

                        {/* Date & Location */}
                        <motion.div
                            className="bg-card rounded-xl p-6 shadow-sm border"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <h2 className="text-2xl font-bold mb-6">When & Where</h2>
                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <Calendar className="w-5 h-5 text-primary mt-1" />
                                    <div>
                                        <p className="font-semibold">{formattedDate}</p>
                                        <p className="text-muted-foreground">{formattedTime}</p>
                                    </div>
                                </div>
                                {event.location.venue && (
                                    <div className="flex items-start gap-4">
                                        <MapPin className="w-5 h-5 text-primary mt-1" />
                                        <div>
                                            <p className="font-semibold">{event.location.venue}</p>
                                            <p className="text-muted-foreground">
                                                {event.location.city}, {event.location.state}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Sidebar - Help Needed */}
                    <div className="space-y-6">
                        <motion.div
                            className="bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-xl p-6 shadow-lg border-2 border-primary/20 sticky top-8"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <Users className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-bold">We Need Your Help!</h3>
                            </div>
                            <p className="text-sm text-muted-foreground mb-6">
                                Want to contribute to making this event amazing? We're looking for support in the following areas:
                            </p>

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

                            <div className="mt-6 pt-6 border-t">
                                <p className="text-xs text-muted-foreground">
                                    Organized by <span className="font-semibold">{event.organizer?.name || 'Yatri Cloud'}</span>
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
