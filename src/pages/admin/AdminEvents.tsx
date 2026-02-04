import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Users, Mic, Layers, Plus, MapPin, Clock, Pencil, Trash2, Loader2, MoreVertical, UserCheck, ClipboardList } from "lucide-react";
import { StatsCard } from "@/components/admin/StatsCard";
import { Button } from "@/components/ui/button";
import { getAllEvents, getEventStatus, Event, deleteEvent } from "@/lib/events-store";
import { Badge } from "@/components/ui/badge";
import { deleteEventFolder } from "@/lib/event-automation-api";
import { useToast } from "@/hooks/use-toast";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type TabType = "active" | "draft" | "past";

export default function AdminEvents() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<TabType>("active");
    const [events, setEvents] = useState<Event[]>([]);
    const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

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

    const handleDelete = async (id: string, name: string, driveFolderId?: string) => {
        const confirmMessage = driveFolderId
            ? `Are you sure you want to delete "${name}"? This will also permanently delete the Google Drive folder with all event files.`
            : `Are you sure you want to delete "${name}"? This will remove it from the website.`;

        if (window.confirm(confirmMessage)) {
            setDeletingEventId(id);

            try {
                // Delete from Drive if folder exists
                if (driveFolderId) {
                    const driveResult = await deleteEventFolder(driveFolderId);

                    if (!driveResult.success) {
                        toast({
                            title: "Partial Deletion",
                            description: `Event removed from UI, but Drive folder deletion failed: ${driveResult.error}`,
                            variant: "destructive"
                        });
                    } else {
                        toast({
                            title: "Event Deleted",
                            description: "Event and Drive folder deleted successfully"
                        });
                    }
                } else {
                    toast({
                        title: "Event Deleted",
                        description: "Event removed successfully"
                    });
                }

                // Delete from localStorage
                deleteEvent(id);

                // Refresh local state
                setEvents(getAllEvents());
            } catch (error: any) {
                toast({
                    title: "Error",
                    description: error.message || "Failed to delete event",
                    variant: "destructive"
                });
            } finally {
                setDeletingEventId(null);
            }
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
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            disabled={deletingEventId === event.id}
                                        >
                                            {deletingEventId === event.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <MoreVertical className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        {(activeTab === 'draft' || activeTab === 'active' || activeTab === 'past') && (
                                            <DropdownMenuItem
                                                onClick={() => navigate('/createevent', { state: { event } })}
                                            >
                                                <Pencil className="w-4 h-4 mr-2" />
                                                {activeTab === 'past' ? 'View Details' : 'Edit Event'}
                                            </DropdownMenuItem>
                                        )}

                                        <DropdownMenuItem
                                            onClick={() => navigate(`/admin/events/${event.id}/registrations`)}
                                        >
                                            <ClipboardList className="w-4 h-4 mr-2" />
                                            View Registered Details
                                        </DropdownMenuItem>

                                        <DropdownMenuItem
                                            onClick={() => navigate(`/admin/attendees?eventId=${event.id}`)}
                                        >
                                            <UserCheck className="w-4 h-4 mr-2" />
                                            View Attendees
                                        </DropdownMenuItem>

                                        {(event.isUpcoming || getEventStatus(event) === 'upcoming') && (
                                            <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        const url = `${window.location.origin}/upcoming-event/${event.slug || event.id}`;
                                                        navigator.clipboard.writeText(url);
                                                        toast({ title: "Link Copied", description: "Upcoming event link copied to clipboard" });
                                                    }}
                                                >
                                                    <ClipboardList className="w-4 h-4 mr-2" />
                                                    Get Share Link
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => navigate(`/upcoming-event/${event.slug || event.id}`)}
                                                >
                                                    <Calendar className="w-4 h-4 mr-2" />
                                                    View Upcoming Page
                                                </DropdownMenuItem>
                                            </>
                                        )}

                                        {event.spreadsheetId && (
                                            <DropdownMenuItem
                                                onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${event.spreadsheetId}`, '_blank')}
                                            >
                                                <ClipboardList className="w-4 h-4 mr-2" />
                                                View Spreadsheet
                                            </DropdownMenuItem>
                                        )}

                                        <DropdownMenuSeparator />

                                        <DropdownMenuItem
                                            onClick={() => handleDelete(event.id, event.name, event.driveFolderId)}
                                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete Event
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
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
