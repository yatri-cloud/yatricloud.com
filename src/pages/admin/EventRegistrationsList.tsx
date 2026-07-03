import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Download, Loader2, Mail, Phone, MapPin, Linkedin, User, Calendar, CheckCircle2, CreditCard, Banknote, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { EventRegistration } from "@/lib/registration-store";
import {
    getEventRegistrations,
    cancelRegistration,
    updateRegistrationDetails,
    getEventWaitlist,
    notifyWaitlistEntry,
    type WaitlistEntry,
} from "@/lib/events-api";
import { getEventById } from "@/lib/events-store";

export default function EventRegistrationsList() {
    const { eventId } = useParams<{ eventId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
    const [filteredRegistrations, setFilteredRegistrations] = useState<EventRegistration[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "registered" | "attended" | "cancelled">("all");
    const [ticketFilter, setTicketFilter] = useState<"all" | "free" | "paid">("all");
    const [selectedRegistration, setSelectedRegistration] = useState<EventRegistration | null>(null);
    const [event, setEvent] = useState<any>(null);
    const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
    const [notifyingId, setNotifyingId] = useState<string | null>(null);

    // Edit State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingRegistration, setEditingRegistration] = useState<EventRegistration | null>(null);
    const [editForm, setEditForm] = useState({
        name: "",
        email: "",
        phone: "",
        city: "",
        state: "",
        country: "",
        linkedIn: "",
    });

    useEffect(() => {
        if (eventId) {
            loadData();
        }
    }, [eventId]);

    const loadData = async () => {
        if (!eventId) return;
        // Get event details
        const eventData = await getEventById(eventId);
        setEvent(eventData);

        // Get registrations
        const regs = await getEventRegistrations(eventId);
        setRegistrations(regs);
        setFilteredRegistrations(regs);

        // Get waitlist
        const wl = await getEventWaitlist(eventId);
        setWaitlist(wl);
    };

    const handleNotify = async (entry: WaitlistEntry) => {
        setNotifyingId(entry.id);
        const { ok } = await notifyWaitlistEntry(entry.id);
        setNotifyingId(null);
        if (ok) {
            toast({
                title: "Waitlist guest notified",
                description: `We emailed ${entry.email} that a seat opened.`,
            });
            loadData();
        } else {
            toast({
                title: "Could not notify",
                description: "Please try again in a moment.",
                variant: "destructive",
            });
        }
    };

    useEffect(() => {
        let filtered = registrations;

        // Filter by status
        if (statusFilter !== "all") {
            filtered = filtered.filter(reg => reg.status === statusFilter);
        }

        // Filter by ticket type
        if (ticketFilter !== "all") {
            filtered = filtered.filter(reg => reg.ticketType === ticketFilter);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(reg =>
                reg.userDetails.name.toLowerCase().includes(query) ||
                reg.userDetails.email.toLowerCase().includes(query) ||
                reg.registrationCode.toLowerCase().includes(query)
            );
        }

        setFilteredRegistrations(filtered);
    }, [searchQuery, statusFilter, ticketFilter, registrations]);

    const handleExportCSV = () => {
        const headers = ["Code", "Name", "Email", "Phone", "City", "State", "Country", "LinkedIn", "Status", "Registered At", "Attended At"];
        const rows = filteredRegistrations.map(reg => [
            reg.registrationCode,
            reg.userDetails.name,
            reg.userDetails.email,
            reg.userDetails.phone,
            reg.userDetails.city,
            reg.userDetails.state,
            reg.userDetails.country,
            reg.userDetails.linkedIn || "",
            reg.status,
            new Date(reg.registeredAt).toLocaleString(),
            reg.attendedAt ? new Date(reg.attendedAt).toLocaleString() : ""
        ]);

        const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${event?.name || 'event'}_registrations.csv`;
        a.click();
    };

    const handleDeleteClick = async (reg: EventRegistration) => {
        if (confirm(`Are you sure you want to cancel the registration for ${reg.userDetails.name}?`)) {
            const success = await cancelRegistration(reg.id);
            if (success) {
                toast({
                    title: "Registration Cancelled",
                    description: "The registration has been successfully cancelled.",
                });
                loadData();
            } else {
                toast({
                    title: "Error",
                    description: "Failed to cancel registration.",
                    variant: "destructive",
                });
            }
        }
    };

    const handleEditClick = (reg: EventRegistration) => {
        setEditingRegistration(reg);
        setEditForm({
            name: reg.userDetails.name,
            email: reg.userDetails.email,
            phone: reg.userDetails.phone,
            city: reg.userDetails.city,
            state: reg.userDetails.state,
            country: reg.userDetails.country,
            linkedIn: reg.userDetails.linkedIn || "",
        });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingRegistration) return;

        const updated = await updateRegistrationDetails(editingRegistration.id, editForm);
        if (updated) {
            toast({
                title: "Registration Updated",
                description: "Attendee details have been updated successfully.",
            });
            setIsEditModalOpen(false);
            setEditingRegistration(null);
            loadData();
        } else {
            toast({
                title: "Error",
                description: "Failed to update registration.",
                variant: "destructive",
            });
        }
    };

    const stats = {
        total: registrations.length,
        registered: registrations.filter(r => r.status === 'registered').length,
        attended: registrations.filter(r => r.status === 'attended').length,
        cancelled: registrations.filter(r => r.status === 'cancelled').length,
    };

    if (!event) {
        return (
            <div className="p-6 flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="px-4 md:px-8 py-8 md:py-10">
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
                {/* Header band — distinct blue-tinted workspace panel */}
                <div className="space-y-3">
                    <Button
                        variant="ghost"
                        className="-ml-2 min-h-[44px] focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => navigate('/admin/events')}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Events
                    </Button>
                    <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-6 md:p-8">
                        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
                        <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-brand-200/20 blur-3xl" />

                        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                            <div className="space-y-1.5">
                                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Registrations
                                </p>
                                <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">{event.name}</h1>
                                <p className="text-muted-foreground">Manage attendees, check-ins, and ticket details.</p>
                            </div>
                        </div>

                        {/* Stats Cards inside the band so white cards pop against the tint */}
                        <div className="relative mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-5">
                    <div className="border border-border rounded-2xl bg-card p-5 md:p-6">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Registrations</p>
                                <p className="text-2xl font-bold tabular-nums mt-1">{stats.total}</p>
                            </div>
                            <div className="rounded-2xl bg-primary/10 text-primary p-2.5">
                                <User className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                    <div className="border border-border rounded-2xl bg-card p-5 md:p-6">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Pending Check-in</p>
                                <p className="text-2xl font-bold tabular-nums mt-1">{stats.registered}</p>
                            </div>
                            <div className="rounded-2xl bg-primary/10 text-primary p-2.5">
                                <Calendar className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                    <div className="border border-border rounded-2xl bg-card p-5 md:p-6">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Attended</p>
                                <p className="text-2xl font-bold tabular-nums mt-1">{stats.attended}</p>
                            </div>
                            <div className="rounded-2xl bg-success/10 text-success p-2.5">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                    <div className="border border-border rounded-2xl bg-card p-5 md:p-6">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Cancelled</p>
                                <p className="text-2xl font-bold tabular-nums mt-1">{stats.cancelled}</p>
                            </div>
                            <div className="rounded-2xl bg-destructive/10 text-destructive p-2.5">
                                <Banknote className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                    </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="border border-border rounded-2xl bg-card p-5 md:p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, email, or code..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 min-h-[44px]"
                            />
                        </div>
                        <Select
                            value={statusFilter}
                            onValueChange={(value: any) => setStatusFilter(value)}
                        >
                            <SelectTrigger className="w-full md:w-[180px] min-h-[44px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="registered">Registered</SelectItem>
                                <SelectItem value="attended">Attended</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={ticketFilter}
                            onValueChange={(value: any) => setTicketFilter(value)}
                        >
                            <SelectTrigger className="w-full md:w-[180px] min-h-[44px]">
                                <SelectValue placeholder="Filter by ticket" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Tickets</SelectItem>
                                <SelectItem value="free">Free</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={handleExportCSV} variant="outline" className="rounded-xl min-h-[44px] focus-visible:ring-2 focus-visible:ring-ring">
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                        </Button>
                    </div>
                </div>

                {/* Registrations Table */}
                <div className="border border-border rounded-2xl bg-card overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground px-4 py-3">Code</TableHead>
                                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground px-4 py-3">Name</TableHead>
                                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground px-4 py-3">Email</TableHead>
                                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground px-4 py-3">Phone</TableHead>
                                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground px-4 py-3">Ticket</TableHead>
                                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground px-4 py-3">Payment</TableHead>
                                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground px-4 py-3">Status</TableHead>
                                <TableHead className="text-xs uppercase tracking-wide text-muted-foreground px-4 py-3 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-border">
                            {filteredRegistrations.length === 0 ? (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={8} className="text-center py-16">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="rounded-2xl bg-primary/10 text-primary p-4">
                                                <User className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-display text-lg font-semibold">
                                                    {searchQuery || statusFilter !== "all"
                                                        ? "No matches found"
                                                        : "No registrations yet"}
                                                </h3>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {searchQuery || statusFilter !== "all"
                                                        ? "Try adjusting your search or filters."
                                                        : "Attendees will appear here once they register."}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRegistrations.map((reg) => (
                                    <TableRow key={reg.id} className="text-sm hover:bg-brand-50">
                                        <TableCell className="font-mono text-sm px-4 py-3">{reg.registrationCode}</TableCell>
                                        <TableCell className="font-medium px-4 py-3">{reg.userDetails.name}</TableCell>
                                        <TableCell className="px-4 py-3">{reg.userDetails.email}</TableCell>
                                        <TableCell className="px-4 py-3 tabular-nums">{reg.userDetails.phone}</TableCell>
                                        <TableCell className="px-4 py-3">
                                            <Badge variant="outline" className={`rounded-full text-xs font-medium ${reg.ticketType === 'paid' ? 'border-primary text-primary' : ''}`}>
                                                {reg.ticketType === 'paid' && reg.ticketPrice
                                                    ? `Paid (₹${reg.ticketPrice})`
                                                    : 'Free'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                            {reg.ticketType === 'paid' ? (
                                                <Badge className={`rounded-full text-xs font-medium ${reg.paymentStatus === 'completed' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                                                    {reg.paymentStatus === 'completed' ? 'Paid' : 'Pending'}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                            <Badge className={`rounded-full text-xs font-medium ${
                                                reg.status === 'attended'
                                                    ? 'bg-success/10 text-success'
                                                    : reg.status === 'cancelled'
                                                        ? 'bg-destructive/10 text-destructive'
                                                        : 'bg-primary/10 text-primary'
                                            }`}>
                                                {reg.status === 'attended' ? 'Attended' : reg.status === 'cancelled' ? 'Cancelled' : 'Registered'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEditClick(reg)}
                                                    title="Edit Details"
                                                    aria-label="Edit registration details"
                                                    className="focus-visible:ring-2 focus-visible:ring-ring"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                {reg.status !== 'cancelled' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteClick(reg)}
                                                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground focus-visible:ring-2 focus-visible:ring-ring"
                                                        title="Cancel Registration"
                                                        aria-label="Cancel registration"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedRegistration(reg)}
                                                    className="focus-visible:ring-2 focus-visible:ring-ring"
                                                >
                                                    View
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Waitlist */}
                <div className="border border-border rounded-2xl bg-card overflow-hidden">
                    <div className="flex items-center justify-between gap-3 p-5 md:p-6 border-b border-border">
                        <div>
                            <h2 className="font-display text-lg font-semibold">Waitlist</h2>
                            <p className="text-sm text-muted-foreground mt-0.5">People waiting for a seat to open.</p>
                        </div>
                        <Badge variant="outline" className="rounded-full text-xs font-medium">
                            {waitlist.filter(w => w.status === 'waiting').length} waiting
                        </Badge>
                    </div>
                    {waitlist.length === 0 ? (
                        <div className="text-center py-12 text-sm text-muted-foreground">
                            No one is on the waitlist yet.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="text-xs uppercase tracking-wide text-muted-foreground px-4 py-3">Name</TableHead>
                                    <TableHead className="text-xs uppercase tracking-wide text-muted-foreground px-4 py-3">Email</TableHead>
                                    <TableHead className="text-xs uppercase tracking-wide text-muted-foreground px-4 py-3">Phone</TableHead>
                                    <TableHead className="text-xs uppercase tracking-wide text-muted-foreground px-4 py-3">Status</TableHead>
                                    <TableHead className="text-xs uppercase tracking-wide text-muted-foreground px-4 py-3">Joined</TableHead>
                                    <TableHead className="text-xs uppercase tracking-wide text-muted-foreground px-4 py-3 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-border">
                                {waitlist.map((entry) => (
                                    <TableRow key={entry.id} className="text-sm hover:bg-brand-50">
                                        <TableCell className="font-medium px-4 py-3">{entry.name}</TableCell>
                                        <TableCell className="px-4 py-3">{entry.email}</TableCell>
                                        <TableCell className="px-4 py-3 tabular-nums">{entry.phone || '-'}</TableCell>
                                        <TableCell className="px-4 py-3">
                                            <Badge className={`rounded-full text-xs font-medium ${
                                                entry.status === 'converted'
                                                    ? 'bg-success/10 text-success'
                                                    : entry.status === 'notified'
                                                        ? 'bg-primary/10 text-primary'
                                                        : entry.status === 'cancelled'
                                                            ? 'bg-destructive/10 text-destructive'
                                                            : 'bg-warning/10 text-warning'
                                            }`}>
                                                {entry.status === 'waiting' ? 'Waiting'
                                                    : entry.status === 'notified' ? 'Notified'
                                                    : entry.status === 'converted' ? 'Converted'
                                                    : 'Left'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-4 py-3">{new Date(entry.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell className="px-4 py-3 text-right">
                                            {entry.status === 'waiting' ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleNotify(entry)}
                                                    disabled={notifyingId === entry.id}
                                                    className="rounded-xl min-h-[44px] focus-visible:ring-2 focus-visible:ring-ring"
                                                >
                                                    {notifyingId === entry.id ? (
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    ) : (
                                                        <Mail className="w-4 h-4 mr-2" />
                                                    )}
                                                    Notify
                                                </Button>
                                            ) : entry.status === 'notified' ? (
                                                <span className="text-sm text-muted-foreground">
                                                    Notified{entry.notifiedAt ? ` ${new Date(entry.notifiedAt).toLocaleDateString()}` : ''}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>

            {/* View Modal */}
            <Dialog open={selectedRegistration !== null} onOpenChange={() => setSelectedRegistration(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-display">Registration Details</DialogTitle>
                    </DialogHeader>
                    {selectedRegistration && (
                        <div className="space-y-6">
                            {/* Registration Code */}
                            <div className="bg-muted rounded-2xl p-5 text-center">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Registration Code</p>
                                <p className="text-2xl font-mono font-bold tracking-wider">
                                    {selectedRegistration.registrationCode}
                                </p>
                            </div>

                            {/* Status Badge */}
                            <div className="flex items-center justify-between">
                                <h3 className="font-display text-lg font-semibold">User Information</h3>
                                <Badge className={`rounded-full text-xs font-medium ${
                                    selectedRegistration.status === 'attended'
                                        ? 'bg-success/10 text-success'
                                        : selectedRegistration.status === 'cancelled'
                                            ? 'bg-destructive/10 text-destructive'
                                            : 'bg-primary/10 text-primary'
                                }`}>
                                    {selectedRegistration.status.toUpperCase()}
                                </Badge>
                            </div>

                            {/* User Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3">
                                    <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Full Name</p>
                                        <p className="font-medium">{selectedRegistration.userDetails.name}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Email</p>
                                        <p className="font-medium">{selectedRegistration.userDetails.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Phone</p>
                                        <p className="font-medium">{selectedRegistration.userDetails.phone}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Location</p>
                                        <p className="font-medium">
                                            {selectedRegistration.userDetails.city}, {selectedRegistration.userDetails.state}, {selectedRegistration.userDetails.country}
                                        </p>
                                    </div>
                                </div>

                                {selectedRegistration.userDetails.linkedIn && (
                                    <div className="flex items-start gap-3 md:col-span-2">
                                        <Linkedin className="w-5 h-5 text-muted-foreground mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-sm text-muted-foreground">LinkedIn Profile</p>
                                            <a
                                                href={selectedRegistration.userDetails.linkedIn}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-medium text-primary hover:underline break-all"
                                            >
                                                {selectedRegistration.userDetails.linkedIn}
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Registration Timeline */}
                            <div className="border-t border-border pt-4">
                                <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Registration Timeline</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Registered:</span>
                                        <span className="font-medium">
                                            {new Date(selectedRegistration.registeredAt).toLocaleString()}
                                        </span>
                                    </div>
                                    {selectedRegistration.attendedAt && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Checked In:</span>
                                            <span className="font-medium text-success">
                                                {new Date(selectedRegistration.attendedAt).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" className="rounded-xl min-h-[44px] focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setSelectedRegistration(null)}>Close</Button>
                                <Button variant="outline" className="rounded-xl min-h-[44px] focus-visible:ring-2 focus-visible:ring-ring" onClick={() => {
                                    setSelectedRegistration(null);
                                    handleEditClick(selectedRegistration);
                                }}>Edit</Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-display">Edit Registration Details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                value={editForm.name}
                                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={editForm.email}
                                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                value={editForm.phone}
                                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    value={editForm.city}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="state">State</Label>
                                <Input
                                    id="state"
                                    value={editForm.state}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, state: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="linkedin">LinkedIn</Label>
                            <Input
                                id="linkedin"
                                value={editForm.linkedIn}
                                onChange={(e) => setEditForm(prev => ({ ...prev, linkedIn: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="rounded-xl min-h-[44px] focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                        <Button className="rounded-xl min-h-[44px] bg-primary text-primary-foreground shadow-inset-btn hover:bg-brand-600 focus-visible:ring-2 focus-visible:ring-ring" onClick={handleSaveEdit}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
