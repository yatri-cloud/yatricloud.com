import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
    Loader2,
    CheckCircle2,
    Search,
    UserCheck,
    Users,
    Clock,
    Check,
    ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { verifyAttendee, confirmAttendance, AttendeeDetails } from "@/lib/registration-api";
import { updateRegistrationStatus } from "@/lib/registration-store";
import { useToast } from "@/hooks/use-toast";
import { sendEmail } from "@/lib/email";
import { getEventFeedbackEmail } from "@/lib/email-templates";
import { getAllEvents, Event } from "@/lib/events-store";
import { getEventRegistrations } from "@/lib/events-api";
import type { EventRegistration } from "@/lib/registration-store";
import { format } from "date-fns";

export default function AdminAttendees() {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const eventIdParam = searchParams.get("eventId") || "";

    // Event & Registrations State
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string>(eventIdParam);
    const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
    const [loadingList, setLoadingList] = useState(false);
    const [tableSearch, setTableSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "attended" | "registered">("all");

    // Code Verification State
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [checkingInId, setCheckingInId] = useState<string | null>(null);
    const [attendee, setAttendee] = useState<AttendeeDetails | null>(null);
    const [verified, setVerified] = useState(false);
    const [detailAttendee, setDetailAttendee] = useState<EventRegistration | null>(null);

    // Load list of all events
    useEffect(() => {
        getAllEvents().then((all) => {
            setEvents(all);
            if (!selectedEventId && all.length > 0) {
                if (eventIdParam) {
                    setSelectedEventId(eventIdParam);
                } else {
                    setSelectedEventId(all[0].id);
                }
            }
        });
    }, []);

    // Sync URL param with state
    useEffect(() => {
        if (eventIdParam && eventIdParam !== selectedEventId) {
            setSelectedEventId(eventIdParam);
        }
    }, [eventIdParam]);

    // Load registrations when selected event changes
    useEffect(() => {
        if (!selectedEventId) return;
        loadEventRegistrations(selectedEventId);
    }, [selectedEventId]);

    const loadEventRegistrations = async (eventId: string) => {
        setLoadingList(true);
        try {
            const regs = await getEventRegistrations(eventId);
            setRegistrations(regs);
        } catch (err: any) {
            console.error("Failed to load attendees:", err);
            toast({
                title: "Error",
                description: "Could not load attendees for this event",
                variant: "destructive",
            });
        } finally {
            setLoadingList(false);
        }
    };

    const handleEventChange = (eventId: string) => {
        setSelectedEventId(eventId);
        setSearchParams(eventId ? { eventId } : {});
    };

    const currentEvent = useMemo(() => {
        return events.find((e) => e.id === selectedEventId);
    }, [events, selectedEventId]);

    // Filter registrations
    const filteredRegistrations = useMemo(() => {
        let list = registrations;

        if (statusFilter !== "all") {
            list = list.filter((r) => {
                if (statusFilter === "attended") return r.status === "attended";
                if (statusFilter === "registered") return r.status !== "attended";
                return true;
            });
        }

        if (tableSearch.trim()) {
            const q = tableSearch.trim().toLowerCase();
            list = list.filter(
                (r) =>
                    r.userDetails?.name?.toLowerCase().includes(q) ||
                    r.userDetails?.email?.toLowerCase().includes(q) ||
                    r.registrationCode?.toLowerCase().includes(q) ||
                    r.userDetails?.phone?.toLowerCase().includes(q) ||
                    r.userDetails?.city?.toLowerCase().includes(q)
            );
        }

        return list;
    }, [registrations, statusFilter, tableSearch]);

    // Counts
    const stats = useMemo(() => {
        const total = registrations.length;
        const attended = registrations.filter((r) => r.status === "attended").length;
        const pending = total - attended;
        return { total, attended, pending };
    }, [registrations]);

    // Handle single registration code verification
    const handleVerify = async () => {
        if (!code.trim()) {
            toast({
                title: "Error",
                description: "Please enter a registration code",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        setAttendee(null);
        setVerified(false);

        try {
            const result = await verifyAttendee(code.trim().toUpperCase());

            if (result.success && result.attendee) {
                setAttendee(result.attendee);
                toast({
                    title: "Attendee Found!",
                    description: `${result.attendee.name} - ${result.attendee.eventName}`,
                });
            } else {
                toast({
                    title: "Not Found",
                    description: result.error || "Invalid registration code",
                    variant: "destructive",
                });
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to verify attendee",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // Confirm attendance for single attendee
    const handleConfirm = async (targetCode?: string, targetName?: string, targetEmail?: string, targetEventName?: string) => {
        const checkCode = targetCode || attendee?.code;
        const checkName = targetName || attendee?.name || "Attendee";
        const checkEmail = targetEmail || attendee?.email;
        const checkEventName = targetEventName || attendee?.eventName || currentEvent?.name || "Event";

        if (!checkCode) return;

        if (!targetCode) setConfirming(true);
        else setCheckingInId(checkCode);

        try {
            const result = await confirmAttendance(checkCode);

            if (result.success) {
                updateRegistrationStatus(checkCode, "attended", new Date().toISOString());

                // Send feedback / attendance email
                if (checkEmail) {
                    try {
                        const feedbackLink = `${window.location.origin}/events/${encodeURIComponent(checkEventName)}/feedback`;
                        const emailHtml = getEventFeedbackEmail(checkName, checkEventName, feedbackLink);
                        sendEmail({
                            to: checkEmail,
                            subject: `Thanks for attending ${checkEventName}!`,
                            html: emailHtml,
                        }).catch((err) => console.error("Feedback email failed:", err));
                    } catch (emailErr) {
                        console.error("Failed to prepare feedback email:", emailErr);
                    }
                }

                if (!targetCode) setVerified(true);
                toast({
                    title: "✓ Check-in Successful!",
                    description: `${checkName} has been marked as attended`,
                });

                // Refresh the table list
                if (selectedEventId) {
                    loadEventRegistrations(selectedEventId);
                }

                if (!targetCode) {
                    setTimeout(() => {
                        setCode("");
                        setAttendee(null);
                        setVerified(false);
                    }, 3000);
                }
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to confirm attendance",
                    variant: "destructive",
                });
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to confirm attendance",
                variant: "destructive",
            });
        } finally {
            if (!targetCode) setConfirming(false);
            else setCheckingInId(null);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !loading) {
            handleVerify();
        }
    };

    return (
        <div className="px-4 md:px-8 py-8 md:py-10 max-w-7xl mx-auto space-y-8">
            {/* Header band */}
            <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-6 md:p-8">
                <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
                <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-brand-200/20 blur-3xl" />

                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="space-y-1.5">
                        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Attendee Management</h1>
                    </div>

                    {/* Event Selector Dropdown */}
                    <div className="w-full md:w-80 space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Select Event</label>
                        <Select value={selectedEventId} onValueChange={handleEventChange}>
                            <SelectTrigger className="h-11 rounded-xl bg-card border-border">
                                <SelectValue placeholder="Choose an event..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-80">
                                {events.map((evt) => (
                                    <SelectItem key={evt.id} value={evt.id}>
                                        {evt.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Attendance Stats Cards */}
            {selectedEventId && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Card className="border border-border rounded-2xl bg-card p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Registered</p>
                                <p className="text-2xl font-bold mt-1">{stats.total}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="border border-border rounded-2xl bg-card p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Checked In (Attended)</p>
                                <p className="text-2xl font-bold text-success mt-1">{stats.attended}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="border border-border rounded-2xl bg-card p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending Check-in</p>
                                <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Quick Code Verification Card */}
            <Card className="border border-border rounded-2xl bg-card p-5 md:p-6 shadow-sm">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold">Quick Code Check-in</h2>
                            <p className="text-xs text-muted-foreground">Enter an attendee's code to verify and check them in instantly.</p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                        <Input
                            type="text"
                            placeholder="e.g. EVT-XXXX1234"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            onKeyPress={handleKeyPress}
                            className="min-h-[44px] rounded-xl text-base font-mono tracking-wider"
                            disabled={loading || verified}
                        />
                        <Button
                            onClick={handleVerify}
                            disabled={loading || !code.trim() || verified}
                            className="min-h-[44px] rounded-xl px-6"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify Code</>}
                        </Button>
                    </div>
                </div>

                {/* Single Attendee Result */}
                {attendee && !verified && (
                    <div className="mt-5 pt-5 border-t border-border rounded-xl bg-muted/30 p-4 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-bold">{attendee.name}</h3>
                                <p className="text-xs text-muted-foreground">{attendee.eventName} · Code: <span className="font-mono font-semibold">{attendee.code}</span></p>
                            </div>
                            <Badge className={
                                attendee.status === "attended"
                                    ? "rounded-full bg-success text-white text-xs"
                                    : "rounded-full bg-primary/10 text-primary text-xs"
                            }>
                                {attendee.status === "attended" ? "Already Checked In" : "Ready to Check-in"}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
                            <div>
                                <span className="block font-medium text-foreground">Email</span>
                                {attendee.email}
                            </div>
                            <div>
                                <span className="block font-medium text-foreground">Phone</span>
                                {attendee.phone || "—"}
                            </div>
                            <div>
                                <span className="block font-medium text-foreground">Location</span>
                                {[attendee.city, attendee.state, attendee.country].filter(Boolean).join(", ") || "—"}
                            </div>
                        </div>

                        {attendee.status !== "attended" ? (
                            <Button
                                onClick={() => handleConfirm()}
                                disabled={confirming}
                                className="w-full min-h-[44px] rounded-xl"
                            >
                                {confirming ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Confirming...
                                    </>
                                ) : (
                                    <>Confirm Attendance</>
                                )}
                            </Button>
                        ) : (
                            <div className="text-center p-3 bg-warning/10 rounded-lg text-xs font-medium text-warning">
                                Already checked in {attendee.attendedAt ? `on ${new Date(attendee.attendedAt).toLocaleString()}` : ""}
                            </div>
                        )}
                    </div>
                )}

                {/* Verified Success Banner */}
                {verified && (
                    <div className="mt-4 p-4 rounded-xl bg-success/10 border border-success/20 flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-success shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-success">Check-in Confirmed!</p>
                            <p className="text-xs text-muted-foreground">{attendee?.name} has been marked as attended.</p>
                        </div>
                    </div>
                )}
            </Card>

            {/* Attendees Table Card */}
            <Card className="border border-border rounded-2xl bg-card shadow-sm">
                <CardHeader className="p-5 md:p-6 pb-3 gap-4 flex flex-col md:flex-row md:items-center md:justify-between border-b border-border">
                    <div>
                        <CardTitle className="text-lg">
                            {currentEvent ? `Attendees for ${currentEvent.name}` : "Event Attendees"}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {filteredRegistrations.length} {filteredRegistrations.length === 1 ? "attendee" : "attendees"} listed
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                        {/* Search in table */}
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={tableSearch}
                                onChange={(e) => setTableSearch(e.target.value)}
                                placeholder="Search attendee, email, code..."
                                className="pl-9 h-10 rounded-xl"
                            />
                        </div>

                        {/* Status Filter */}
                        <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                            <SelectTrigger className="h-10 w-full sm:w-40 rounded-xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="attended">Checked In</SelectItem>
                                <SelectItem value="registered">Pending Check-in</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* View Registrations Detail Link */}
                        {selectedEventId && (
                            <Button
                                variant="outline"
                                className="h-10 rounded-xl gap-1.5 text-xs font-medium"
                                onClick={() => navigate(`/admin/events/${selectedEventId}/registrations`)}
                            >
                                Registrations
                            </Button>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {loadingList ? (
                        <div className="flex justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filteredRegistrations.length === 0 ? (
                        <div className="py-16 text-center text-sm text-muted-foreground">
                            {registrations.length === 0
                                ? "No registrations or attendees found for this event."
                                : "No attendees match your search filter."}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead>Attendee</TableHead>
                                        <TableHead>Registration Code</TableHead>
                                        <TableHead>Ticket Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRegistrations.map((reg) => {
                                        const isAttended = reg.status === "attended";
                                        const isCheckingIn = checkingInId === reg.registrationCode;

                                        return (
                                            <TableRow
                                                key={reg.id || reg.registrationCode}
                                                className="cursor-pointer hover:bg-muted/40 transition-colors"
                                                onClick={() => setDetailAttendee(reg)}
                                            >
                                                {/* Attendee */}
                                                <TableCell>
                                                    <div className="font-semibold text-foreground">{reg.userDetails?.name || "Attendee"}</div>
                                                    <div className="text-xs text-muted-foreground">{reg.userDetails?.email}</div>
                                                </TableCell>

                                                {/* Code */}
                                                <TableCell>
                                                    <span className="font-mono text-xs font-bold bg-muted px-2 py-1 rounded-md border border-border">
                                                        {reg.registrationCode}
                                                    </span>
                                                </TableCell>

                                                {/* Ticket */}
                                                <TableCell>
                                                    <Badge variant="outline" className={reg.ticketType === "paid" ? "border-primary/40 text-primary" : "border-muted-foreground/30 text-muted-foreground"}>
                                                        {reg.ticketType === "paid" ? "Paid" : "Free"}
                                                    </Badge>
                                                </TableCell>

                                                {/* Status */}
                                                <TableCell>
                                                    {isAttended ? (
                                                        <Badge className="rounded-full bg-success text-white border-0 text-xs font-medium inline-flex items-center gap-1">
                                                            Checked In
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="rounded-full bg-amber-500 text-white border-0 border-0 text-xs font-medium">
                                                            Pending Check-in
                                                        </Badge>
                                                    )}
                                                </TableCell>

                                                {/* Contact */}
                                                <TableCell className="text-xs text-muted-foreground">
                                                    <div>{reg.userDetails?.phone || "—"}</div>
                                                    <div>{[reg.userDetails?.city, reg.userDetails?.country].filter(Boolean).join(", ")}</div>
                                                </TableCell>

                                                {/* Action Button */}
                                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                    {!isAttended ? (
                                                        <Button
                                                            size="sm"
                                                            className="h-8 rounded-lg text-xs font-medium"
                                                            disabled={isCheckingIn}
                                                            onClick={() =>
                                                                handleConfirm(
                                                                    reg.registrationCode,
                                                                    reg.userDetails?.name,
                                                                    reg.userDetails?.email,
                                                                    reg.eventName || currentEvent?.name
                                                                )
                                                            }
                                                        >
                                                            {isCheckingIn ? (
                                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            ) : (
                                                                <>Check-in</>
                                                            )}
                                                        </Button>
                                                    ) : (
                                                        <span className="text-xs font-medium flex items-center justify-end gap-1 text-success">
                                                            Verified
                                                        </span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Attendee Details Modal */}
            {detailAttendee && (
                <Dialog open={!!detailAttendee} onOpenChange={(o) => { if (!o) setDetailAttendee(null); }}>
                    <DialogContent className="max-w-md rounded-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl">{detailAttendee.userDetails?.name}</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 text-sm">
                            <div className="flex items-center justify-between pb-3 border-b">
                                <span className="text-muted-foreground">Status</span>
                                <Badge className={
                                    detailAttendee.status === "attended"
                                        ? "bg-success text-white border-0"
                                        : "bg-primary/10 text-primary border-0"
                                }>
                                    {detailAttendee.status === "attended" ? "Checked In" : "Pending Check-in"}
                                </Badge>
                            </div>

                            <div className="grid gap-2 text-xs">
                                <div><strong className="text-muted-foreground">Email:</strong> {detailAttendee.userDetails?.email}</div>
                                <div><strong className="text-muted-foreground">Phone:</strong> {detailAttendee.userDetails?.phone || "—"}</div>
                                <div><strong className="text-muted-foreground">Code:</strong> <span className="font-mono font-bold">{detailAttendee.registrationCode}</span></div>
                                <div><strong className="text-muted-foreground">Location:</strong> {[detailAttendee.userDetails?.city, detailAttendee.userDetails?.state, detailAttendee.userDetails?.country].filter(Boolean).join(", ") || "—"}</div>
                                {detailAttendee.userDetails?.linkedIn && (
                                    <div>
                                        <strong className="text-muted-foreground">LinkedIn:</strong>{" "}
                                        <a href={detailAttendee.userDetails.linkedIn} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                            {detailAttendee.userDetails.linkedIn}
                                        </a>
                                    </div>
                                )}
                                <div><strong className="text-muted-foreground">Ticket:</strong> {detailAttendee.ticketType === "paid" ? "Paid" : "Free"}</div>
                                {detailAttendee.registeredAt && (
                                    <div><strong className="text-muted-foreground">Registered:</strong> {format(new Date(detailAttendee.registeredAt), "dd MMM yyyy, hh:mm a")}</div>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            {detailAttendee.status !== "attended" && (
                                <Button
                                    className="w-full"
                                    onClick={() => {
                                        handleConfirm(
                                            detailAttendee.registrationCode,
                                            detailAttendee.userDetails?.name,
                                            detailAttendee.userDetails?.email,
                                            detailAttendee.eventName || currentEvent?.name
                                        );
                                        setDetailAttendee(null);
                                    }}
                                >
                                    Confirm Check-in
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
