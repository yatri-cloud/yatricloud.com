import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Users, Mic, Layers, Plus, MapPin, Clock, Pencil, Trash2 } from "lucide-react";
import { StatsCard } from "@/components/admin/StatsCard";
import { Button } from "@/components/ui/button";
import { getAllEvents, getEventStatus, Event, deleteEvent } from "@/lib/events-store";
import { Badge } from "@/components/ui/badge";

type TabType = "active" | "draft" | "past";

export default function AdminEvents() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>("active");
    const [events, setEvents] = useState<Event[]>([]);

    useEffect(() => {
        // Fetch events on mount
        const allEvents = getAllEvents();
        setEvents(allEvents);
    }, []);

    const filteredEvents = events.filter(event => {
        const computedStatus = getEventStatus(event);
        if (activeTab === 'active') return computedStatus === 'upcoming';
        if (activeTab === 'past') return computedStatus === 'past';
        return computedStatus === 'draft';
    });

    const handleDelete = (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete "${name}"? This will remove it from the website.`)) {
            deleteEvent(id);
            // Refresh local state
            setEvents(getAllEvents());
        }
    };

    const stats = {
        activeEvents: events.filter(e => getEventStatus(e) === 'upcoming').length,
        totalEvents: events.length,
        pastEvents: events.filter(e => getEventStatus(e) === 'past').length,
        draftEvents: events.filter(e => getEventStatus(e) === 'draft').length,
    };

    const tabs: { id: TabType; label: string }[] = [
        { id: "active", label: "Active Events" },
        { id: "draft", label: "Draft Events" },
        { id: "past", label: "Past Events" },
    ];

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-bold mb-2">My Events</h1>
                    <p className="text-muted-foreground">
                        Manage and track all your events in one place
                    </p>
                </div>
                <Button
                    className="flex items-center gap-2"
                    onClick={() => navigate('/createevent')}
                    size="lg"
                >
                    <Plus className="w-5 h-5" />
                    Create Event
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard
                    title="Active Events"
                    value={stats.activeEvents}
                    icon={Calendar}
                    color="bg-yellow-500/10 text-yellow-500"
                />
                <StatsCard
                    title="Total Events"
                    value={stats.totalEvents}
                    icon={Layers}
                    color="bg-purple-500/10 text-purple-500"
                />
                <StatsCard
                    title="Past Events"
                    value={stats.pastEvents}
                    icon={Clock}
                    color="bg-blue-500/10 text-blue-500"
                />
                <StatsCard
                    title="Draft Events"
                    value={stats.draftEvents}
                    icon={Mic}
                    color="bg-gray-500/10 text-gray-500"
                />
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 mb-6 border-b border-border">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-3 font-medium transition-colors relative ${activeTab === tab.id
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                    </button>
                ))}
            </div>

            {/* Events List */}
            <div className="space-y-4">
                {filteredEvents.length > 0 ? (
                    filteredEvents.map(event => (
                        <div key={event.id} className="bg-card border rounded-xl p-5 hover:shadow-md transition-all flex flex-col md:flex-row gap-6 items-start md:items-center">
                            <div className="w-full md:w-48 aspect-video rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover" />
                            </div>

                            <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold">{event.name}</h3>
                                </div>
                                <p className="text-muted-foreground line-clamp-2 text-sm">{event.description}</p>

                                <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(event.date).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="w-4 h-4" />
                                        {event.location.type === 'online' ? 'Online' : event.location.city}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 shrink-0">
                                {(activeTab === 'draft' || activeTab === 'active') && (
                                    <Button
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                        size="sm"
                                        onClick={() => navigate('/createevent', { state: { event } })}
                                    >
                                        <Pencil className="w-4 h-4 mr-2" /> Edit
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-destructive hover:bg-destructive/10 border-destructive/20"
                                    onClick={() => handleDelete(event.id, event.name)}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </Button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
                        <p className="text-muted-foreground">No {activeTab} events found.</p>
                        {activeTab === 'active' && (
                            <Button variant="link" onClick={() => navigate('/createevent')}>
                                Create one now
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
