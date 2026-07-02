import { useEffect, useMemo, useState } from "react";
import { Loader2, Mail, Pencil, Save, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";
import ScrollReveal from "@/components/ScrollReveal";

/* ------------------------------------------------------------------ */
/* Types — local copies of the shared mentorship types.                */
/* src/lib/mentorship.ts is being authored in a parallel batch; the    */
/* integration pass swaps these for imports once both land.            */
/* ------------------------------------------------------------------ */

interface MentorshipBooking {
    id: string;
    service_id: string;
    mentor_id: string;
    user_id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string | null;
    answers: { label?: string; answer?: string; value?: string }[];
    slot_start: string | null;
    slot_end: string | null;
    buyer_timezone: string;
    amount: number;
    currency: string;
    status: string;
    order_id: string | null;
    payment_id: string | null;
    meeting_link: string | null;
    admin_notes: string | null;
    created_at: string;
}

interface MentorOption {
    id: string;
    name: string;
}

interface ServiceOption {
    id: string;
    title: string;
    type: string;
}

const STATUSES = ["pending", "confirmed", "completed", "cancelled", "refunded"] as const;

const STATUS_STYLES: Record<string, string> = {
    pending: "bg-muted text-muted-foreground",
    confirmed: "bg-primary/10 text-primary",
    completed: "bg-brand-100 text-brand-700",
    cancelled: "bg-destructive/10 text-destructive",
    refunded: "bg-destructive/10 text-destructive",
};

const formatSlot = (iso: string | null, timeZone: string) => {
    if (!iso) return "No slot (digital)";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("en-IN", {
        timeZone: timeZone || "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short",
    });
};

const formatAmount = (amount: number, currency: string) =>
    `${currency === "INR" ? "₹" : `${currency} `}${amount.toLocaleString("en-IN")}`;

const escapeHtml = (text: string) =>
    text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const FieldLabel = ({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) => (
    <Label htmlFor={htmlFor} className="text-sm font-medium">
        {children}
    </Label>
);

const saveButtonClass =
    "min-h-[44px] rounded-xl bg-primary hover:bg-brand-600 text-primary-foreground font-semibold shadow-inset-btn";

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const AdminMentorshipBookings = () => {
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState<MentorshipBooking[]>([]);
    const [mentors, setMentors] = useState<MentorOption[]>([]);
    const [services, setServices] = useState<Record<string, ServiceOption>>({});

    // Filters
    const [statusFilter, setStatusFilter] = useState("all");
    const [mentorFilter, setMentorFilter] = useState("all");
    const [search, setSearch] = useState("");

    // Manage dialog
    const [managing, setManaging] = useState<MentorshipBooking | null>(null);
    const [manageStatus, setManageStatus] = useState("pending");
    const [manageMeetingLink, setManageMeetingLink] = useState("");
    const [manageNotes, setManageNotes] = useState("");
    const [saving, setSaving] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);

    const mentorName = (id: string) => mentors.find((m) => m.id === id)?.name ?? "Unknown mentor";
    const serviceTitle = (id: string) => services[id]?.title ?? "Unknown service";

    const saveFailed = () =>
        toast({ title: "That did not save", description: "Please try again.", variant: "destructive" });

    /* ---------------------------- load ---------------------------- */

    const loadBookings = async () => {
        const { data, error } = await supabase
            .from("mentorship_bookings")
            .select(
                "id, service_id, mentor_id, user_id, customer_name, customer_email, customer_phone, answers, slot_start, slot_end, buyer_timezone, amount, currency, status, order_id, payment_id, meeting_link, admin_notes, created_at"
            )
            .order("created_at", { ascending: false })
            .limit(500);
        if (error) {
            console.error("Failed to load bookings", error);
            toast({
                title: "Could not load bookings",
                description: "Please refresh the page and try again.",
                variant: "destructive",
            });
            return;
        }
        setBookings(
            (data ?? []).map((row: any) => ({
                id: row.id,
                service_id: row.service_id,
                mentor_id: row.mentor_id,
                user_id: row.user_id,
                customer_name: row.customer_name ?? "",
                customer_email: row.customer_email ?? "",
                customer_phone: row.customer_phone ?? null,
                answers: Array.isArray(row.answers) ? row.answers : [],
                slot_start: row.slot_start ?? null,
                slot_end: row.slot_end ?? null,
                buyer_timezone: row.buyer_timezone ?? "Asia/Kolkata",
                amount: Number(row.amount ?? 0),
                currency: row.currency ?? "INR",
                status: row.status ?? "pending",
                order_id: row.order_id ?? null,
                payment_id: row.payment_id ?? null,
                meeting_link: row.meeting_link ?? null,
                admin_notes: row.admin_notes ?? null,
                created_at: row.created_at ?? "",
            }))
        );
    };

    useEffect(() => {
        const init = async () => {
            const [{ data: mentorRows }, { data: serviceRows }] = await Promise.all([
                supabase.from("mentors").select("id, name").order("sort_order", { ascending: true }),
                supabase.from("mentorship_services").select("id, title, type"),
            ]);
            setMentors((mentorRows ?? []).map((row: any) => ({ id: row.id, name: row.name ?? "" })));
            const serviceMap: Record<string, ServiceOption> = {};
            (serviceRows ?? []).forEach((row: any) => {
                serviceMap[row.id] = { id: row.id, title: row.title ?? "", type: row.type ?? "call" };
            });
            setServices(serviceMap);
            await loadBookings();
            setLoading(false);
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredBookings = useMemo(() => {
        const query = search.trim().toLowerCase();
        return bookings.filter((b) => {
            if (statusFilter !== "all" && b.status !== statusFilter) return false;
            if (mentorFilter !== "all" && b.mentor_id !== mentorFilter) return false;
            if (!query) return true;
            return (
                b.customer_name.toLowerCase().includes(query) ||
                b.customer_email.toLowerCase().includes(query) ||
                serviceTitle(b.service_id).toLowerCase().includes(query)
            );
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookings, statusFilter, mentorFilter, search, services]);

    /* --------------------------- manage ---------------------------- */

    const openManage = (booking: MentorshipBooking) => {
        setManaging(booking);
        setManageStatus(booking.status);
        setManageMeetingLink(booking.meeting_link ?? "");
        setManageNotes(booking.admin_notes ?? "");
    };

    const saveBooking = async () => {
        if (!managing) return;
        setSaving(true);
        const patch = {
            status: manageStatus,
            meeting_link: manageMeetingLink.trim() || null,
            admin_notes: manageNotes.trim() || null,
        };
        const { error } = await supabase
            .from("mentorship_bookings")
            .update(patch)
            .eq("id", managing.id);
        setSaving(false);
        if (error) return saveFailed();
        setBookings((prev) =>
            prev.map((b) => (b.id === managing.id ? { ...b, ...patch } : b))
        );
        setManaging(null);
        toast({ title: "Saved", description: "The booking is up to date." });
    };

    const resendEmail = async () => {
        if (!managing) return;
        if (!managing.customer_email) {
            toast({
                title: "No email on this booking",
                description: "There is no customer email to send to.",
                variant: "destructive",
            });
            return;
        }
        setSendingEmail(true);
        const service = serviceTitle(managing.service_id);
        const mentor = mentorName(managing.mentor_id);
        const slotLine = managing.slot_start
            ? `<p style="margin:4px 0;"><strong>When:</strong> ${escapeHtml(
                formatSlot(managing.slot_start, managing.buyer_timezone)
            )} (${escapeHtml(managing.buyer_timezone)})</p>`
            : "";
        const meetingLink = manageMeetingLink.trim() || managing.meeting_link || "";
        const linkLine = meetingLink
            ? `<p style="margin:4px 0;"><strong>Meeting link:</strong> <a href="${escapeHtml(meetingLink)}">${escapeHtml(meetingLink)}</a></p>`
            : "";
        const html = `
            <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#0f172a;">
                <h2 style="color:#007CFF;">Your mentorship booking</h2>
                <p>Hi ${escapeHtml(managing.customer_name || "there")},</p>
                <p>Here are the details of your booking on Yatri Cloud:</p>
                <div style="background:#f0f7ff;border-radius:12px;padding:16px;">
                    <p style="margin:4px 0;"><strong>Service:</strong> ${escapeHtml(service)}</p>
                    <p style="margin:4px 0;"><strong>Mentor:</strong> ${escapeHtml(mentor)}</p>
                    ${slotLine}
                    ${linkLine}
                    <p style="margin:4px 0;"><strong>Amount:</strong> ${escapeHtml(formatAmount(managing.amount, managing.currency))}</p>
                    <p style="margin:4px 0;"><strong>Status:</strong> ${escapeHtml(manageStatus)}</p>
                </div>
                <p>See you soon. If anything looks off, just reply to this email.</p>
                <p>Team Yatri Cloud</p>
            </div>
        `;
        const result = await sendEmail({
            to: managing.customer_email,
            subject: `Your mentorship booking with ${mentor} · Yatri Cloud`,
            html,
        });
        setSendingEmail(false);
        if (!result.success) {
            toast({
                title: "The email did not go out",
                description: "Please try again in a moment.",
                variant: "destructive",
            });
            return;
        }
        toast({
            title: "Email sent",
            description: `The booking details are on their way to ${managing.customer_email}.`,
        });
    };

    /* ----------------------------- view --------------------------- */

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Loading bookings…</span>
            </div>
        );
    }

    return (
        <div className="px-4 md:px-8 py-8 md:py-10">
            <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
                {/* Header band */}
                <ScrollReveal>
                    <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-6 md:p-8">
                        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
                        <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-brand-200/20 blur-3xl" />

                        <div className="relative space-y-1.5">
                            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Mentorship
                            </p>
                            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">
                                Mentorship <span className="gradient-text">Bookings</span>
                            </h1>
                            <p className="text-muted-foreground">
                                Every session booked by Yatris. Update statuses, share meeting links, and resend confirmations.
                            </p>
                        </div>
                    </div>
                </ScrollReveal>

                <ScrollReveal delay={0.05}>
                    <div className="bg-card border border-brand-100 rounded-2xl p-5 md:p-6 shadow-card">
                        <div className="-mx-5 md:-mx-6 -mt-5 md:-mt-6 mb-5 rounded-t-2xl border-b border-brand-100 bg-gradient-to-r from-brand-50 to-transparent px-5 md:px-6 py-4">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Orders</p>
                            <h2 className="mt-0.5 font-display text-lg font-bold tracking-tight text-foreground">Bookings</h2>
                            <p className="text-sm text-muted-foreground">
                                {filteredBookings.length} of {bookings.length} bookings shown, newest first.
                            </p>
                        </div>

                        {/* Filters */}
                        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="space-y-1.5">
                                <FieldLabel htmlFor="filter-status">Status</FieldLabel>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger id="filter-status" className="min-h-[44px] rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All statuses</SelectItem>
                                        {STATUSES.map((status) => (
                                            <SelectItem key={status} value={status} className="capitalize">
                                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <FieldLabel htmlFor="filter-mentor">Mentor</FieldLabel>
                                <Select value={mentorFilter} onValueChange={setMentorFilter}>
                                    <SelectTrigger id="filter-mentor" className="min-h-[44px] rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All mentors</SelectItem>
                                        {mentors.map((m) => (
                                            <SelectItem key={m.id} value={m.id}>
                                                {m.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <FieldLabel htmlFor="filter-search">Search</FieldLabel>
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="filter-search"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Name, email, or service…"
                                        className="min-h-[44px] rounded-xl pl-10"
                                    />
                                </div>
                            </div>
                        </div>

                        {filteredBookings.length === 0 ? (
                            <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                                {bookings.length === 0
                                    ? "No bookings yet. Once a Yatri books a session it will show up here."
                                    : "Nothing matches those filters. Try widening them."}
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {filteredBookings.map((booking) => (
                                    <div
                                        key={booking.id}
                                        className="rounded-xl border border-border bg-background odd:bg-brand-50/30 odd:border-brand-100 hover:bg-brand-50/50 transition-colors p-3 md:p-4"
                                    >
                                        <div className="flex flex-wrap items-center gap-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                                                    <span className="truncate">
                                                        {booking.customer_name || booking.customer_email || "Unnamed Yatri"}
                                                    </span>
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${STATUS_STYLES[booking.status] ?? "bg-muted text-muted-foreground"}`}
                                                    >
                                                        {booking.status}
                                                    </span>
                                                    {booking.payment_id && (
                                                        <span className="inline-flex items-center rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                                                            Paid
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {serviceTitle(booking.service_id)} with {mentorName(booking.mentor_id)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatSlot(booking.slot_start, booking.buyer_timezone)} ·{" "}
                                                    {formatAmount(booking.amount, booking.currency)} · booked{" "}
                                                    {formatSlot(booking.created_at, "Asia/Kolkata")}
                                                </p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                onClick={() => openManage(booking)}
                                                className="min-h-[44px] rounded-xl"
                                                aria-label={`Manage the booking for ${booking.customer_name || booking.customer_email}`}
                                            >
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Manage
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </ScrollReveal>
            </div>

            {/* ── Manage booking dialog ── */}
            <Dialog
                open={managing !== null}
                onOpenChange={(open) => {
                    if (!open) setManaging(null);
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="font-display tracking-tight">Manage booking</DialogTitle>
                        <DialogDescription>
                            {managing
                                ? `${serviceTitle(managing.service_id)} with ${mentorName(managing.mentor_id)}.`
                                : ""}
                        </DialogDescription>
                    </DialogHeader>

                    {managing && (
                        <div className="space-y-5">
                            {/* Who booked */}
                            <div className="space-y-2 rounded-xl border border-brand-100 bg-brand-50/40 p-4 text-sm">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Yatri</p>
                                <p className="font-semibold">{managing.customer_name || "No name given"}</p>
                                <p className="text-muted-foreground">{managing.customer_email}</p>
                                {managing.customer_phone && (
                                    <p className="text-muted-foreground">{managing.customer_phone}</p>
                                )}
                                <p className="text-muted-foreground">
                                    {formatSlot(managing.slot_start, managing.buyer_timezone)}
                                    {managing.slot_start ? ` (${managing.buyer_timezone})` : ""} ·{" "}
                                    {formatAmount(managing.amount, managing.currency)}
                                </p>
                            </div>

                            {/* Answers */}
                            {managing.answers.length > 0 && (
                                <div className="space-y-2">
                                    <p className="border-b border-brand-100 pb-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
                                        Their answers
                                    </p>
                                    <div className="space-y-2">
                                        {managing.answers.map((answer, index) => (
                                            <div key={index} className="rounded-xl border border-border p-3 text-sm">
                                                <p className="text-xs font-semibold text-muted-foreground">
                                                    {answer.label ?? `Question ${index + 1}`}
                                                </p>
                                                <p>{answer.answer ?? answer.value ?? ""}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Payment trail */}
                            <div className="space-y-2">
                                <p className="border-b border-brand-100 pb-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
                                    Payment trail
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Order: <span className="font-mono">{managing.order_id ?? "none"}</span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Payment: <span className="font-mono">{managing.payment_id ?? "none"}</span>
                                </p>
                            </div>

                            {/* Manage */}
                            <div className="space-y-4">
                                <p className="border-b border-brand-100 pb-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
                                    Update the booking
                                </p>
                                <div className="space-y-2">
                                    <FieldLabel htmlFor="booking-status">Status</FieldLabel>
                                    <Select value={manageStatus} onValueChange={setManageStatus}>
                                        <SelectTrigger id="booking-status" className="min-h-[44px] rounded-xl capitalize">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {STATUSES.map((status) => (
                                                <SelectItem key={status} value={status}>
                                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <FieldLabel htmlFor="booking-link">Meeting link</FieldLabel>
                                    <Input
                                        id="booking-link"
                                        className="min-h-[44px] rounded-xl"
                                        placeholder="https://meet.google.com/…"
                                        value={manageMeetingLink}
                                        onChange={(e) => setManageMeetingLink(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <FieldLabel htmlFor="booking-notes">Admin notes (internal only)</FieldLabel>
                                    <Textarea
                                        id="booking-notes"
                                        className="min-h-[80px] rounded-xl"
                                        value={manageNotes}
                                        onChange={(e) => setManageNotes(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
                        <Button
                            variant="outline"
                            onClick={resendEmail}
                            disabled={sendingEmail}
                            className="min-h-[44px] rounded-xl"
                        >
                            {sendingEmail ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Mail className="mr-2 h-4 w-4" />
                            )}
                            Resend email
                        </Button>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setManaging(null)}
                                className="min-h-[44px] rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button onClick={saveBooking} disabled={saving} className={saveButtonClass}>
                                {saving ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                )}
                                Save booking
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminMentorshipBookings;
