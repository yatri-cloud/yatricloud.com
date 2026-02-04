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
import { getEventRegistrations, EventRegistration, cancelRegistration, updateRegistration } from "@/lib/registration-store";
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

    const loadData = () => {
        if (!eventId) return;
        // Get event details
        const eventData = getEventById(eventId);
        setEvent(eventData);

        // Get registrations
        const regs = getEventRegistrations(eventId);
        setRegistrations(regs);
        setFilteredRegistrations(regs);
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

    const handleDeleteClick = (reg: EventRegistration) => {
        if (confirm(`Are you sure you want to cancel the registration for ${reg.userDetails.name}?`)) {
            const success = cancelRegistration(reg.id);
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

    const handleSaveEdit = () => {
        if (!editingRegistration) return;

        const updated = updateRegistration(editingRegistration.id, editForm);
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
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Button
                        variant="ghost"
                        className="mb-4"
                        onClick={() => navigate('/admin/events')}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Events
                    </Button>
                    <h1 className="text-3xl font-bold mb-2">{event.name}</h1>
                    <p className="text-muted-foreground">Event Registrations</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Registrations</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                            <User className="w-8 h-8 text-primary" />
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Pending Check-in</p>
                                <p className="text-2xl font-bold">{stats.registered}</p>
                            </div>
                            <Calendar className="w-8 h-8 text-blue-600" />
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Attended</p>
                                <p className="text-2xl font-bold">{stats.attended}</p>
                            </div>
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Cancelled</p>
                                <p className="text-2xl font-bold">{stats.cancelled}</p>
                            </div>
                            <Banknote className="w-8 h-8 text-red-600" />
                        </div>
                    </Card>
                </div>

                {/* Filters and Search */}
                <Card className="p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, email, or code..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select
                            value={statusFilter}
                            onValueChange={(value: any) => setStatusFilter(value)}
                        >
                            <SelectTrigger className="w-[180px]">
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
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by ticket" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Tickets</SelectItem>
                                <SelectItem value="free">Free</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={handleExportCSV} variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                        </Button>
                    </div>
                </Card>

                {/* Registrations Table */}
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Ticket</TableHead>
                                <TableHead>Payment</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRegistrations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                        {searchQuery || statusFilter !== "all"
                                            ? "No registrations match your filters"
                                            : "No registrations yet"}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRegistrations.map((reg) => (
                                    <TableRow key={reg.id}>
                                        <TableCell className="font-mono text-sm">{reg.registrationCode}</TableCell>
                                        <TableCell className="font-medium">{reg.userDetails.name}</TableCell>
                                        <TableCell>{reg.userDetails.email}</TableCell>
                                        <TableCell>{reg.userDetails.phone}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={reg.ticketType === 'paid' ? 'border-primary text-primary' : ''}>
                                                {reg.ticketType === 'paid' && reg.ticketPrice
                                                    ? `Paid (₹${reg.ticketPrice})`
                                                    : 'Free'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {reg.ticketType === 'paid' ? (
                                                <Badge variant={reg.paymentStatus === 'completed' ? 'default' : 'destructive'}
                                                    className={reg.paymentStatus === 'completed' ? 'bg-green-600' : ''}>
                                                    {reg.paymentStatus === 'completed' ? 'Paid' : 'Pending'}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={
                                                reg.status === 'attended'
                                                    ? 'bg-green-600'
                                                    : reg.status === 'cancelled'
                                                        ? 'bg-red-600'
                                                        : 'bg-blue-600'
                                            }>
                                                {reg.status === 'attended' ? 'Attended' : reg.status === 'cancelled' ? 'Cancelled' : 'Registered'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEditClick(reg)}
                                                    title="Edit Details"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                {reg.status !== 'cancelled' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteClick(reg)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        title="Cancel Registration"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedRegistration(reg)}
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
                </Card>
            </div>

            {/* View Modal */}
            <Dialog open={selectedRegistration !== null} onOpenChange={() => setSelectedRegistration(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Registration Details</DialogTitle>
                    </DialogHeader>
                    {selectedRegistration && (
                        <div className="space-y-6">
                            {/* Registration Code */}
                            <div className="bg-muted rounded-lg p-4 text-center">
                                <p className="text-sm text-muted-foreground mb-1">Registration Code</p>
                                <p className="text-2xl font-mono font-bold tracking-wider">
                                    {selectedRegistration.registrationCode}
                                </p>
                            </div>

                            {/* Status Badge */}
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">User Information</h3>
                                <Badge className={
                                    selectedRegistration.status === 'attended'
                                        ? 'bg-green-600'
                                        : selectedRegistration.status === 'cancelled'
                                            ? 'bg-red-600'
                                            : 'bg-blue-600'
                                }>
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
                            <div className="border-t pt-4">
                                <h3 className="text-sm font-semibold mb-3">Registration Timeline</h3>
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
                                            <span className="font-medium text-green-600">
                                                {new Date(selectedRegistration.attendedAt).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setSelectedRegistration(null)}>Close</Button>
                                <Button variant="outline" onClick={() => {
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
                        <DialogTitle>Edit Registration Details</DialogTitle>
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
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveEdit}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
