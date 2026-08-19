import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LifeBuoy, Loader2, Plus } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import { LoginModal } from "@/components/LoginModal";
import { useToast } from "@/hooks/use-toast";
import { hasSession } from "@/lib/auth";
import { useSiteContent, getOptionList, FALLBACK_OPTION_LISTS } from "@/lib/site-content";
import {
    createTicket,
    listMyTickets,
    TICKET_STATUS_LABELS,
    type SupportTicket,
    type TicketStatus,
} from "@/lib/support-api";

const STATUS_STYLES: Record<TicketStatus, string> = {
    open: "bg-primary text-white border-primary/20",
    pending: "bg-warning/10 text-warning border-warning/20",
    resolved: "bg-success text-white border-success/20",
    closed: "bg-muted text-muted-foreground border-border",
};

const fmt = (d: string) =>
    new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

export default function Support() {
    const { toast } = useToast();
    const [signedIn, setSignedIn] = useState(false);
    const [loginOpen, setLoginOpen] = useState(false);
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);

    const [createOpen, setCreateOpen] = useState(false);
    const [category, setCategory] = useState("other");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const categories = useSiteContent(
        () => getOptionList("support_category"),
        FALLBACK_OPTION_LISTS.support_category
    );

    const load = async () => {
        setTickets(await listMyTickets());
        setLoading(false);
    };

    useEffect(() => {
        const authed = hasSession();
        setSignedIn(authed);
        if (authed) void load();
        else setLoading(false);
    }, []);

    const openCreate = () => {
        if (!hasSession()) {
            setLoginOpen(true);
            return;
        }
        setCreateOpen(true);
    };

    const handleCreate = async () => {
        if (!subject.trim()) {
            toast({ title: "Subject required", description: "Please enter a subject.", variant: "destructive" });
            return;
        }
        if (!message.trim()) {
            toast({ title: "Details required", description: "Please provide details for your ticket.", variant: "destructive" });
            return;
        }
        setSubmitting(true);
        const { ticket, error } = await createTicket({ category, subject, message });
        setSubmitting(false);
        if (!ticket) {
            toast({ title: "Ticket creation failed", description: error || "Please try again.", variant: "destructive" });
            return;
        }
        toast({
            title: `Ticket ${ticket.ticketNumber} created`,
            description: "We have received your ticket and will respond shortly.",
        });
        setCreateOpen(false);
        setSubject("");
        setMessage("");
        setCategory("other");
        void load();
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
            <SEO
                title="Support | Yatri Cloud"
                description="Open and manage your Yatri Cloud support tickets."
                noindex
            />
            <Navbar />
            <main className="flex-1 container mx-auto px-4 md:px-6 pt-28 md:pt-32 pb-20 max-w-4xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6 mb-8">
                    <div>
                        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                            Support
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Create and manage your support requests.
                        </p>
                    </div>
                    <Button onClick={openCreate} className="h-10 rounded-xl px-4 font-medium" data-testid="ticket-new">
                        <Plus className="w-4 h-4 mr-1.5" /> New Ticket
                    </Button>
                </div>

                {!signedIn ? (
                    <div className="text-center py-16 border border-border rounded-2xl bg-card/40 mb-10">
                        <LifeBuoy className="w-9 h-9 text-muted-foreground mx-auto mb-3" />
                        <h2 className="text-base font-semibold mb-1">Sign in to view tickets</h2>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
                            Sign in to access your support history and submit new requests.
                        </p>
                        <Button className="h-10 rounded-xl px-5 text-sm" onClick={() => setLoginOpen(true)}>
                            Sign In
                        </Button>
                    </div>
                ) : loading ? (
                    <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground mb-10">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading tickets…
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="text-center py-16 border border-border rounded-2xl bg-card/40 mb-10">
                        <h2 className="text-base font-semibold mb-1">No tickets</h2>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            You currently have no active or past support tickets.
                        </p>
                    </div>
                ) : (
                    <ul className="space-y-2.5 mb-10" data-testid="ticket-list">
                        {tickets.map((t) => (
                            <li key={t.id}>
                                <Link
                                    to={`/support/${t.ticketNumber}`}
                                    className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-xs transition"
                                >
                                    <span className="font-mono text-xs font-semibold text-primary">{t.ticketNumber}</span>
                                    <span className="text-sm font-medium flex-1 min-w-[180px]">{t.subject}</span>
                                    <Badge className={`rounded-md text-[11px] font-medium border ${STATUS_STYLES[t.status]}`}>
                                        {TICKET_STATUS_LABELS[t.status]}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">{fmt(t.lastActivityAt)}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}

                {/* About Support Tickets Information Section */}
                <div className="border border-border/70 rounded-2xl bg-card/30 p-6 md:p-8">
                    <h2 className="text-base font-semibold text-foreground mb-2">
                        About Support Tickets
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6 max-w-2xl">
                        A support ticket is a dedicated communication thread created between you and our support team. It ensures your questions, orders, and technical inquiries are systematically tracked, resolved, and documented.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                        <div className="p-4 rounded-xl bg-background/60 border border-border/60">
                            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                                Direct Communication
                            </h3>
                            <p className="text-xs text-muted-foreground leading-normal">
                                Connect directly with administrators regarding practice exams, vouchers, billing, or resource access.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl bg-background/60 border border-border/60">
                            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                                Live Tracking
                            </h3>
                            <p className="text-xs text-muted-foreground leading-normal">
                                View status updates in real time and receive instant email notifications whenever a reply is posted.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl bg-background/60 border border-border/60">
                            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                                Permanent History
                            </h3>
                            <p className="text-xs text-muted-foreground leading-normal">
                                All conversations and resolutions remain securely saved in your account for future reference.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">New Support Ticket</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Fill out the form below to submit a request to our team.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-1">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Category</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="h-10 rounded-xl text-sm" data-testid="ticket-category">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="ticket-subject" className="text-xs font-medium">Subject</Label>
                            <Input
                                id="ticket-subject"
                                data-testid="ticket-subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Brief summary of your inquiry"
                                className="h-10 rounded-xl text-sm"
                                disabled={submitting}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="ticket-message" className="text-xs font-medium">Details</Label>
                            <Textarea
                                id="ticket-message"
                                data-testid="ticket-message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Provide relevant details or context..."
                                className="min-h-[100px] rounded-xl text-sm"
                                disabled={submitting}
                            />
                        </div>
                        <div className="flex gap-2.5 pt-2">
                            <Button variant="outline" className="flex-1 h-10 rounded-xl text-sm font-medium" onClick={() => setCreateOpen(false)} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button className="flex-1 h-10 rounded-xl text-sm font-medium" onClick={handleCreate} disabled={submitting} data-testid="ticket-submit">
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Submitting
                                    </>
                                ) : (
                                    "Submit Ticket"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <LoginModal
                isOpen={loginOpen}
                onClose={() => setLoginOpen(false)}
                onSuccess={() => {
                    setLoginOpen(false);
                    setSignedIn(true);
                    setLoading(true);
                    void load();
                }}
            />

            <Footer />
        </div>
    );
}
