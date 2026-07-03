import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Users, Mic, Layers, Plus, MapPin, Clock, Pencil, Trash2, Loader2, MoreVertical, UserCheck, ClipboardList, Search } from "lucide-react";
import { StatsCard } from "@/components/admin/StatsCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("date");

    useEffect(() => {
        // Fetch events on mount
        getAllEvents().then(setEvents);
    }, []);

    const q = search.trim().toLowerCase();
    const filteredEvents = events.filter(event => {
        const computedStatus = getEventStatus(event);
        const matchesTab = activeTab === 'active' ? computedStatus === 'upcoming'
            : activeTab === 'past' ? computedStatus === 'past'
            : computedStatus === 'draft';
        if (!matchesTab) return false;
        if (!q) return true;
        const city = event.location?.type === 'online' ? 'online' : (event.location?.city || '');
        return event.name.toLowerCase().includes(q)
            || (event.description || '').toLowerCase().includes(q)
            || city.toLowerCase().includes(q);
    }).sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name);
        const ta = a.date ? new Date(a.date).getTime() : 0;
        const tb = b.date ? new Date(b.date).getTime() : 0;
        return tb - ta; // date: soonest/most-recent first
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

                // Delete from Supabase
                await deleteEvent(id);

                // Refresh local state
                setEvents(await getAllEvents());
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
        <div className="px-4 md:px-8 py-8 md:py-10 max-w-7xl mx-auto space-y-6 md:space-y-8">
            {/* Header band — distinct blue-tinted workspace panel */}
            <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-6 md:p-8">
                {/* soft blue glow accents */}
                <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
                <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-brand-200/20 blur-3xl" />

                <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div className="space-y-1.5">
                        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Events workspace
                        </p>
                        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">My Events</h1>
                        <p className="text-muted-foreground">
                            Manage and track all your events in one place.
                        </p>
                    </div>
                    <Button
                        className="flex items-center gap-2 self-start md:self-auto bg-primary text-primary-foreground rounded-xl shadow-inset-btn hover:bg-brand-600 min-h-[44px]"
                        onClick={() => navigate('/createevent')}
                        size="lg"
                    >
                        <Plus className="w-5 h-5" />
                        Create Event
                    </Button>
                </div>

                {/* Stats Cards inside the band so white cards pop against the tint */}
                <div className="relative mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard
                        title="Active Events"
                        value={stats.activeEvents}
                        icon={Calendar}
                        color="bg-warning/10 text-warning"
                    />
                    <StatsCard
                        title="Total Events"
                        value={stats.totalEvents}
                        icon={Layers}
                        color="bg-primary/10 text-primary"
                    />
                    <StatsCard
                        title="Past Events"
                        value={stats.pastEvents}
                        icon={Clock}
                        color="bg-primary/10 text-primary"
                    />
                    <StatsCard
                        title="Draft Events"
                        value={stats.draftEvents}
                        icon={Mic}
                        color="bg-muted text-muted-foreground"
                    />
                </div>
            </div>

            {/* Tabs + search */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-border bg-card p-1">
                {tabs.map((tab) => {
                    const count = tab.id === "active" ? stats.activeEvents : tab.id === "draft" ? stats.draftEvents : stats.pastEvents;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            aria-pressed={isActive}
                            className={`inline-flex items-center gap-2 min-h-[40px] px-4 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive
                                ? "bg-primary text-primary-foreground shadow-inset-btn"
                                : "text-muted-foreground hover:bg-brand-50 hover:text-foreground"
                                }`}
                        >
                            {tab.label}
                            <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums ${isActive ? "bg-white/20 text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events" className="pl-9 h-9" />
                    </div>
                    <Select value={sort} onValueChange={setSort}>
                        <SelectTrigger className="h-9 w-full sm:w-[150px]" aria-label="Sort events"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="date">Event date</SelectItem>
                            <SelectItem value="name">Name: A to Z</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Events List */}
            <div className="space-y-4">
                {filteredEvents.length > 0 ? (
                    filteredEvents.map(event => (
                        <div key={event.id} className="border border-border rounded-2xl bg-card p-5 md:p-6 hover:border-brand-200 hover:shadow-card transition flex flex-col md:flex-row gap-6 items-start md:items-center">
                            <div className="w-full md:w-48 aspect-video rounded-xl overflow-hidden bg-muted flex-shrink-0">
                                <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover" />
                            </div>

                            <div className="flex-1 space-y-2 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg md:text-xl font-bold tracking-tight">{event.name}</h3>
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
                                                {activeTab === 'past' ? 'Manage Gallery' : 'Edit Event'}
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
                                            className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
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
                    <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-card flex flex-col items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                            <Calendar className="w-7 h-7" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-display text-lg font-semibold">No {activeTab} events yet</h3>
                            <p className="text-muted-foreground text-sm">Your {activeTab} events will show up here.</p>
                        </div>
                        {activeTab === 'active' && (
                            <Button
                                onClick={() => navigate('/createevent')}
                                className="bg-primary text-primary-foreground rounded-xl shadow-inset-btn hover:bg-brand-600 min-h-[44px]"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create your first event
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
