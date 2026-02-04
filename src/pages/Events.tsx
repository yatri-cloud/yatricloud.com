import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, MapPin, Globe, Clock, Sparkles, Search, X, Filter, Ticket } from "lucide-react";
import { getStoredUser, getRegisteredEvents, EventRegistration, fetchPublishedEvents } from "@/lib/yatris-api";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { SEO } from "@/components/SEO";
import { getAllEvents, Event } from "@/lib/events-store";

const Events = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedCountry, setSelectedCountry] = useState("All");
    const [selectedState, setSelectedState] = useState("All");
    const [selectedTechStack, setSelectedTechStack] = useState("All");
    const [countrySearchQuery, setCountrySearchQuery] = useState("");
    const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
    const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);
    const [isTechStackDropdownOpen, setIsTechStackDropdownOpen] = useState(false);
    const [myRegistrations, setMyRegistrations] = useState<EventRegistration[]>([]);
    const [user, setUser] = useState(getStoredUser());

    useEffect(() => {
        // Scroll to top when component mounts
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Load local events (drafts/local storage)
        const localEvents = getAllEvents();
        setEvents(localEvents);

        // Fetch published events from Sheets
        fetchPublishedEvents().then(publishedEvents => {
            if (publishedEvents.length > 0) {
                // Merge and remove duplicates (by ID or name)
                setEvents(prev => {
                    const combined = [...prev];
                    publishedEvents.forEach(pub => {
                        if (!combined.some(e => e.id === pub.id || e.name === pub.name)) {
                            combined.push(pub);
                        }
                    });
                    return combined;
                });
            }
        });

        // Fetch registrations if logged in
        if (user) {
            getRegisteredEvents().then(setMyRegistrations);
        }
    }, [user]);

    // Get unique countries, states, and tech stacks for filters
    const uniqueCountries = Array.from(new Set(events
        .map(event => event.location.country)
        .filter((country): country is string => !!country)
    )).sort();

    const uniqueStates = Array.from(new Set(events
        .filter(event => selectedCountry === "All" || event.location.country === selectedCountry)
        .map(event => event.location.state)
        .filter((state): state is string => !!state)
    )).sort();

    const uniqueTechStacks = Array.from(new Set(events
        .flatMap(event => event.techStack || [])
    )).sort();

    // Filter events
    const filterEvents = (events: Event[]) => {
        return events.filter(event => {
            // Category filter
            if (selectedCategory !== "All" && event.category !== selectedCategory) return false;

            // Search query filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesName = event.name.toLowerCase().includes(query);
                const matchesDescription = event.description?.toLowerCase().includes(query);
                if (!matchesName && !matchesDescription) return false;
            }

            // Country filter
            if (selectedCountry !== "All" && event.location.country !== selectedCountry) return false;

            // State filter
            if (selectedState !== "All" && event.location.state !== selectedState) return false;

            // Tech Stack filter
            if (selectedTechStack !== "All" && !event.techStack?.includes(selectedTechStack)) return false;

            return true;
        });
    };

    const filteredUpcomingCount = filterEvents(events.filter(e => e.status === 'upcoming' && new Date(e.date) > new Date())).length;
    const filteredPastCount = filterEvents(events.filter(e => e.status === 'past' || new Date(e.date) <= new Date())).length;

    const upcomingEvents = filterEvents(events
        .filter(event => event.status === 'upcoming' && new Date(event.date) > new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));

    const pastEvents = filterEvents(events
        .filter(event => event.status === 'past' || new Date(event.date) <= new Date())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

    const categories = ["All", "Concert", "Conference", "Hackathon", "Marathon", "Workshop"];

    const formatEventDate = (dateString: string, timezone: string) => {
        const date = new Date(dateString);
        const options: Intl.DateTimeFormatOptions = {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        };
        return `${date.toLocaleDateString('en-US', options)} ${timezone}`;
    };

    const EventCard = ({ event, index }: { event: Event; index: number }) => (
        <ScrollReveal delay={index * 0.1}>
            <Link to={`/events/${event.slug || event.id}`} className="block h-full">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{
                        scale: 1.03,
                        y: -8,
                        transition: { duration: 0.4, ease: "easeOut" }
                    }}
                    className="group relative bg-card rounded-3xl overflow-hidden h-full flex flex-col border-2 border-primary/20 hover:border-primary/40 transition-colors duration-300 cursor-pointer"
                >
                    {/* Enhanced border with gradient glow on hover */}
                    <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none z-10"
                        style={{
                            background: 'linear-gradient(135deg, hsl(var(--primary) / 0.4), hsl(var(--primary) / 0.2), hsl(var(--primary) / 0.4))',
                            padding: '2px',
                            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                            WebkitMaskComposite: 'xor',
                            maskComposite: 'exclude',
                        }}
                    />

                    {/* Floating shadow effect */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-70 transition-all duration-500 -z-10" />

                    {/* Event Image - 16:9 aspect ratio */}
                    <div className="relative w-full aspect-video overflow-hidden bg-muted rounded-t-3xl">
                        <img
                            src={event.imageUrl}
                            alt={event.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    </div>

                    {/* Event Details */}
                    <div className="p-6 flex-1 flex flex-col relative z-20">
                        {/* Event Name */}
                        <motion.h3
                            className="text-xl font-bold text-foreground mb-3 line-clamp-2"
                            whileHover={{ color: 'hsl(var(--primary))' }}
                            transition={{ duration: 0.3 }}
                        >
                            {event.name}
                        </motion.h3>

                        {/* Date & Time */}
                        <div className="flex items-center gap-2 text-muted-foreground mb-3">
                            <Calendar className="w-4 h-4 flex-shrink-0 text-primary group-hover:scale-110 transition-transform duration-300" />
                            <span className="text-sm font-medium">
                                {formatEventDate(event.date, event.timezone)}
                            </span>
                        </div>

                        {/* Location */}
                        <div className="flex items-start gap-2 text-muted-foreground mb-4">
                            {event.location.type === 'online' ? (
                                <>
                                    <Globe className="w-4 h-4 flex-shrink-0 text-primary mt-0.5 group-hover:scale-110 transition-transform duration-300" />
                                    <div className="flex-1">
                                        <motion.span
                                            className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold"
                                            whileHover={{ scale: 1.05, backgroundColor: 'hsl(var(--primary) / 0.2)' }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            Online Event
                                        </motion.span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <MapPin className="w-4 h-4 flex-shrink-0 text-primary mt-0.5 group-hover:scale-110 transition-transform duration-300" />
                                    <div className="flex-1 text-sm">
                                        <div className="font-medium text-foreground">{event.location.venue}</div>
                                        <div className="text-xs text-muted-foreground mt-0.5">
                                            {event.location.city}, {event.location.country}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>


                    </div>
                </motion.div>
            </Link>
        </ScrollReveal>
    );

    return (
        <div className="min-h-screen bg-background text-foreground">
            <SEO />
            <div className="noise-overlay" />
            <Navbar />

            <main className="container mx-auto px-4 md:px-6 pt-32 pb-12">

                {/* My Registered Events Section */}
                {user && myRegistrations.length > 0 && (
                    <section className="mb-16">
                        <ScrollReveal>
                            <div className="mb-8">
                                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
                                    My Registrations
                                    <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-semibold rounded-full bg-primary/10 text-primary border border-primary/20 shadow-sm">
                                        {myRegistrations.length}
                                    </span>
                                </h2>
                                <p className="text-muted-foreground">Events you are attending</p>
                            </div>
                        </ScrollReveal>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myRegistrations.map((reg, index) => (
                                <ScrollReveal key={reg.id} delay={index * 0.1}>
                                    <Link to={`/events/${reg.eventSlug || reg.eventId}`} className="block h-full">
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5, delay: index * 0.1 }}
                                            whileHover={{ y: -5 }}
                                            className="group relative bg-card rounded-3xl overflow-hidden h-full flex flex-col border border-border hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-primary/10"
                                        >
                                            <div className="relative w-full aspect-video overflow-hidden bg-muted">
                                                <img
                                                    src={reg.eventImage}
                                                    alt={reg.eventName}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute top-4 right-4 bg-green-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                                                    <Ticket className="w-3 h-3" />
                                                    Confirmed
                                                </div>
                                            </div>

                                            <div className="p-6 flex-1 flex flex-col">
                                                <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-1">
                                                    {reg.eventName}
                                                </h3>

                                                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-primary" />
                                                        <span>{new Date(reg.eventDate).toLocaleDateString(undefined, {
                                                            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                                                        })}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4 text-primary" />
                                                        <span className="truncate">{reg.eventLocation}</span>
                                                    </div>
                                                </div>

                                                <div className="mt-auto pt-4 border-t border-border flex items-center justify-between text-xs font-medium">
                                                    <span className="text-muted-foreground">
                                                        {reg.attendees.length} {reg.attendees.length === 1 ? 'Ticket' : 'Tickets'}
                                                    </span>
                                                    <span className="text-primary group-hover:underline">View Ticket</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </Link>
                                </ScrollReveal>
                            ))}
                        </div>
                    </section>
                )}

                {/* Filters & Search Section - Single Row */}
                <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 mb-12 lg:items-center lg:justify-between">
                    {/* Category Tabs - Left Side */}
                    <div className="overflow-x-auto pb-2 lg:pb-0 flex-1 scrollbar-hide">
                        <div className="flex gap-2">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${selectedCategory === category
                                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105'
                                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                                        }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Search & Country Filter - Right Side */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:flex-shrink-0">
                        {/* Search Bar */}
                        <div className="relative w-full sm:w-64">
                            <input
                                type="text"
                                placeholder="Search events..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm shadow-sm hover:shadow-md"
                            />
                            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Country Dropdown */}
                        <div className="relative z-50 w-full sm:w-auto">
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setIsCountryDropdownOpen(!isCountryDropdownOpen);
                                        if (!isCountryDropdownOpen) { // If opening
                                            setTimeout(() => document.getElementById('country-search-input')?.focus(), 50);
                                        }
                                    }}
                                    className={`w-full sm:w-auto flex items-center gap-2 pl-4 pr-3 py-2.5 border rounded-full transition-all text-sm font-medium shadow-sm hover:shadow-md min-w-[160px] justify-between ${selectedCountry !== "All"
                                        ? 'bg-primary/10 border-primary/20 text-primary'
                                        : 'bg-background border-border text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <Globe className="w-4 h-4 flex-shrink-0" />
                                        <span className="truncate max-w-[100px]">
                                            {selectedCountry === "All" ? "All Countries" : selectedCountry}
                                        </span>
                                    </div>
                                    <Filter className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                                </button>

                                {/* Dropdown Menu */}
                                {isCountryDropdownOpen && (
                                    <div id="country-dropdown" className="absolute right-0 mt-2 w-72 bg-card border border-border rounded-2xl shadow-xl p-4 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                        <h4 className="font-medium mb-3 text-sm px-1">Filter by Country</h4>

                                        {/* Country Search */}
                                        <div className="relative mb-3">
                                            <input
                                                id="country-search-input"
                                                type="text"
                                                placeholder="Find a country..."
                                                value={countrySearchQuery}
                                                onChange={(e) => setCountrySearchQuery(e.target.value)}
                                                className="w-full pl-9 pr-3 py-2 bg-muted/50 border border-transparent rounded-lg focus:bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                                            />
                                            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                                        </div>

                                        {/* Country List */}
                                        <div className="space-y-1 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                            <button
                                                onClick={() => {
                                                    setSelectedCountry("All");
                                                    setIsCountryDropdownOpen(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between group ${selectedCountry === "All"
                                                    ? 'bg-primary/10 text-primary font-medium'
                                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                                    }`}
                                            >
                                                <span>All Countries</span>
                                                {selectedCountry === "All" && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                            </button>

                                            {uniqueCountries
                                                .filter(country => country.toLowerCase().includes(countrySearchQuery.toLowerCase()))
                                                .map(country => (
                                                    <button
                                                        key={country}
                                                        onClick={() => {
                                                            setSelectedCountry(country);
                                                            setIsCountryDropdownOpen(false);
                                                        }}
                                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between group ${selectedCountry === country
                                                            ? 'bg-primary/10 text-primary font-medium'
                                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                                            }`}
                                                    >
                                                        <span>{country}</span>
                                                        {selectedCountry === country && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                                    </button>
                                                ))}

                                            {uniqueCountries.filter(c => c.toLowerCase().includes(countrySearchQuery.toLowerCase())).length === 0 && (
                                                <p className="text-xs text-muted-foreground text-center py-2">
                                                    No countries found
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Backdrop to close dropdown */}
                            {isCountryDropdownOpen && (
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setIsCountryDropdownOpen(false)}
                                />
                            )}
                        </div>

                        {/* State Dropdown */}
                        {selectedCountry !== "All" && uniqueStates.length > 0 && (
                            <div className="relative z-40 w-full sm:w-auto">
                                <div className="relative">
                                    <button
                                        onClick={() => setIsStateDropdownOpen(!isStateDropdownOpen)}
                                        className={`w-full sm:w-auto flex items-center gap-2 pl-4 pr-3 py-2.5 border rounded-full transition-all text-sm font-medium shadow-sm hover:shadow-md min-w-[160px] justify-between ${selectedState !== "All"
                                            ? 'bg-primary/10 border-primary/20 text-primary'
                                            : 'bg-background border-border text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            <MapPin className="w-4 h-4 flex-shrink-0" />
                                            <span className="truncate max-w-[100px]">
                                                {selectedState === "All" ? "All States" : selectedState}
                                            </span>
                                        </div>
                                        <Filter className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                                    </button>

                                    {isStateDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-2xl shadow-xl p-4 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                            <h4 className="font-medium mb-3 text-sm px-1">Filter by State</h4>
                                            <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                                                <button
                                                    onClick={() => {
                                                        setSelectedState("All");
                                                        setIsStateDropdownOpen(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${selectedState === "All"
                                                        ? 'bg-primary/10 text-primary font-medium'
                                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                                        }`}
                                                >
                                                    <span>All States</span>
                                                    {selectedState === "All" && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                                </button>

                                                {uniqueStates.map(state => (
                                                    <button
                                                        key={state}
                                                        onClick={() => {
                                                            setSelectedState(state);
                                                            setIsStateDropdownOpen(false);
                                                        }}
                                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${selectedState === state
                                                            ? 'bg-primary/10 text-primary font-medium'
                                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                                            }`}
                                                    >
                                                        <span>{state}</span>
                                                        {selectedState === state && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {isStateDropdownOpen && (
                                    <div
                                        className="fixed inset-0 z-30"
                                        onClick={() => setIsStateDropdownOpen(false)}
                                    />
                                )}
                            </div>
                        )}

                        {/* Tech Stack Dropdown */}
                        <div className="relative z-30 w-full sm:w-auto">
                            <div className="relative">
                                <button
                                    onClick={() => setIsTechStackDropdownOpen(!isTechStackDropdownOpen)}
                                    className={`w-full sm:w-auto flex items-center gap-2 pl-4 pr-3 py-2.5 border rounded-full transition-all text-sm font-medium shadow-sm hover:shadow-md min-w-[160px] justify-between ${selectedTechStack !== "All"
                                        ? 'bg-primary/10 border-primary/20 text-primary'
                                        : 'bg-background border-border text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <Sparkles className="w-4 h-4 flex-shrink-0" />
                                        <span className="truncate max-w-[100px]">
                                            {selectedTechStack === "All" ? "Tech Stack" : selectedTechStack}
                                        </span>
                                    </div>
                                    <Filter className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                                </button>

                                {isTechStackDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-2xl shadow-xl p-4 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                        <h4 className="font-medium mb-3 text-sm px-1">Filter by Tech Stack</h4>
                                        <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                                            <button
                                                onClick={() => {
                                                    setSelectedTechStack("All");
                                                    setIsTechStackDropdownOpen(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${selectedTechStack === "All"
                                                    ? 'bg-primary/10 text-primary font-medium'
                                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                                    }`}
                                            >
                                                <span>All Tech Stacks</span>
                                                {selectedTechStack === "All" && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                            </button>

                                            {uniqueTechStacks.map(tech => (
                                                <button
                                                    key={tech}
                                                    onClick={() => {
                                                        setSelectedTechStack(tech);
                                                        setIsTechStackDropdownOpen(false);
                                                    }}
                                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${selectedTechStack === tech
                                                        ? 'bg-primary/10 text-primary font-medium'
                                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                                        }`}
                                                >
                                                    <span>{tech}</span>
                                                    {selectedTechStack === tech && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {isTechStackDropdownOpen && (
                                <div
                                    className="fixed inset-0 z-20"
                                    onClick={() => setIsTechStackDropdownOpen(false)}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Upcoming Events Section */}
                {filteredUpcomingCount > 0 && (
                    <section className="mb-12">
                        <ScrollReveal>
                            <div className="mb-8">
                                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
                                    Upcoming Events
                                    <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-semibold rounded-full bg-gradient-to-r from-primary/20 to-primary/10 text-primary border border-primary/20 shadow-sm">
                                        {filteredUpcomingCount} {filteredUpcomingCount === 1 ? 'Event' : 'Events'}
                                    </span>
                                </h2>
                            </div>
                        </ScrollReveal>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {upcomingEvents.map((event, index) => (
                                <EventCard key={event.id} event={event} index={index} />
                            ))}
                        </div>
                    </section>
                )
                }

                {/* Past Events Section */}
                {
                    filteredPastCount > 0 && (
                        <section>
                            <ScrollReveal>
                                <div className="mb-8">
                                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
                                        Past Events
                                        <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-semibold rounded-full bg-gradient-to-r from-muted-foreground/10 to-muted-foreground/5 text-muted-foreground border border-muted-foreground/20 shadow-sm">
                                            {filteredPastCount} {filteredPastCount === 1 ? 'Event' : 'Events'}
                                        </span>
                                    </h2>
                                </div>
                            </ScrollReveal>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {pastEvents.map((event, index) => (
                                    <EventCard key={event.id} event={event} index={index} />
                                ))}
                            </div>
                        </section>
                    )
                }

                {
                    filteredUpcomingCount === 0 && filteredPastCount === 0 && (
                        <div className="text-center py-20 bg-muted/10 rounded-2xl border border-border mt-8">
                            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                            <h3 className="text-xl font-semibold mb-2">No events found</h3>
                            <p className="text-muted-foreground">
                                Try adjusting your search or filters to find what you're looking for.
                            </p>
                            <button
                                onClick={() => {
                                    setSearchQuery("");
                                    setSelectedCategory("All");
                                    setSelectedCountry("All");
                                }}
                                className="mt-6 text-primary hover:underline font-medium"
                            >
                                Clear all filters
                            </button>
                        </div>
                    )
                }
            </main >

            <Footer />
        </div >
    );
};

export default Events;
