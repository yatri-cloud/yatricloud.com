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

/**
 * /support — a Yatri's help desk: open a ticket, see every ticket they have
 * raised with its live status, and jump into the thread. Signed-in only
 * (tickets live with the account); guests get the login modal.
 */

const STATUS_STYLES: Record<TicketStatus, string> = {
    open: "bg-primary/10 text-primary border-primary/20",
    pending: "bg-warning/10 text-warning border-warning/20",
    resolved: "bg-success/10 text-success border-success/20",
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
            toast({ title: "Add a subject", description: "A short line about what you need.", variant: "destructive" });
            return;
        }
        if (!message.trim()) {
            toast({ title: "Tell us what happened", description: "A few details help us fix it faster.", variant: "destructive" });
            return;
        }
        setSubmitting(true);
        const { ticket, error } = await createTicket({ category, subject, message });
        setSubmitting(false);
        if (!ticket) {
            toast({ title: "Ticket not created", description: error || "Please try again.", variant: "destructive" });
            return;
        }
        toast({
            title: `Ticket ${ticket.ticketNumber} is in`,
            description: "We emailed you a confirmation and will reply soon.",
        });
        setCreateOpen(false);
        setSubject("");
        setMessage("");
        setCategory("other");
        void load();
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <SEO
                title="Support | Yatri Cloud"
                description="Open a support ticket and track it end to end. The Yatri Cloud team replies fast."
                noindex
            />
            <Navbar />
            <main className="container mx-auto px-4 md:px-6 pt-28 md:pt-32 pb-24 max-w-4xl">
                <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-6 md:p-10 mb-8">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Support</p>
                    <h1 className="font-display text-3xl md:text-4xl font-bold tracking-[-0.02em] mb-3">
                        We've got your back, Yatri
                    </h1>
                    <p className="text-muted-foreground max-w-xl">
                        Stuck on a payment, an event, a course, or anything in between? Open a ticket
                        and track every reply here — we also email you at each step.
                    </p>
                    <Button onClick={openCreate} className="mt-6 min-h-[44px] rounded-xl shadow-inset-btn hover:bg-brand-600" data-testid="ticket-new">
                        <Plus className="w-4 h-4 mr-2" /> Open a ticket
                    </Button>
                </div>

                {!signedIn ? (
                    <div className="text-center py-16 border rounded-2xl bg-brand-50/40">
                        <LifeBuoy className="w-10 h-10 text-primary mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Please sign in first</h2>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                            Your tickets live with your Yatri Cloud account so nothing gets lost.
                        </p>
                        <Button className="min-h-[44px] rounded-xl" onClick={() => setLoginOpen(true)}>
                            Sign in to continue
                        </Button>
                    </div>
                ) : loading ? (
                    <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading your tickets…
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="text-center py-16 border rounded-2xl bg-card">
                        <h2 className="font-display text-xl font-bold mb-2">No tickets yet</h2>
                        <p className="text-muted-foreground">
                            When you open one, its full history lives here.
                        </p>
                    </div>
                ) : (
                    <ul className="space-y-3" data-testid="ticket-list">
                        {tickets.map((t) => (
                            <li key={t.id}>
                                <Link
                                    to={`/support/${t.ticketNumber}`}
                                    className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 md:p-5 hover:border-brand-200 hover:shadow-card transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <span className="font-mono text-sm text-primary font-semibold">{t.ticketNumber}</span>
                                    <span className="font-semibold flex-1 min-w-[180px]">{t.subject}</span>
                                    <Badge className={`rounded-full border ${STATUS_STYLES[t.status]}`}>
                                        {TICKET_STATUS_LABELS[t.status]}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">Updated {fmt(t.lastActivityAt)}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </main>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Open a support ticket</DialogTitle>
                        <DialogDescription>
                            We reply by email and right here on your ticket page.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label className="mb-2 block">What is this about?</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="min-h-[44px] rounded-xl" data-testid="ticket-category">
                                    <SelectValue placeholder="Pick a topic" />
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
                        <div>
                            <Label htmlFor="ticket-subject" className="mb-2 block">Subject</Label>
                            <Input
                                id="ticket-subject"
                                data-testid="ticket-subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="e.g. Payment went through but no voucher email"
                                className="min-h-[44px] rounded-xl"
                                disabled={submitting}
                            />
                        </div>
                        <div>
                            <Label htmlFor="ticket-message" className="mb-2 block">What happened?</Label>
                            <Textarea
                                id="ticket-message"
                                data-testid="ticket-message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Share what you tried, what you expected, and any order or event details."
                                className="min-h-[120px]"
                                disabled={submitting}
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1 min-h-[44px] rounded-xl" onClick={() => setCreateOpen(false)} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button className="flex-1 min-h-[44px] rounded-xl" onClick={handleCreate} disabled={submitting} data-testid="ticket-submit">
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Opening
                                    </>
                                ) : (
                                    "Open ticket"
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
