import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { hasSession } from "@/lib/auth";
import {
    closeMyTicket,
    getTicketByNumber,
    listMessages,
    replyAsUser,
    TICKET_STATUS_LABELS,
    type SupportMessage,
    type SupportTicket as Ticket,
    type TicketStatus,
} from "@/lib/support-api";

/**
 * /support/:ticketNumber — the ticket thread. The Yatri reads every reply,
 * answers in place (which reopens resolved tickets automatically), and can
 * mark the ticket solved themselves. RLS keeps other Yatris' tickets out.
 */

const STATUS_STYLES: Record<TicketStatus, string> = {
    open: "bg-primary/10 text-primary border-primary/20",
    pending: "bg-warning/10 text-warning border-warning/20",
    resolved: "bg-success/10 text-success border-success/20",
    closed: "bg-muted text-muted-foreground border-border",
};

const fmt = (d: string) =>
    new Date(d).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export default function SupportTicket() {
    const { ticketNumber } = useParams<{ ticketNumber: string }>();
    const { toast } = useToast();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [reply, setReply] = useState("");
    const [sending, setSending] = useState(false);
    const [closing, setClosing] = useState(false);

    const load = async () => {
        const t = await getTicketByNumber(ticketNumber || "");
        setTicket(t);
        if (t) setMessages(await listMessages(t.id));
        setLoading(false);
    };

    useEffect(() => {
        void load();
        window.scrollTo(0, 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ticketNumber]);

    const handleReply = async () => {
        if (!ticket) return;
        if (!reply.trim()) {
            toast({ title: "Write a reply first", variant: "destructive" });
            return;
        }
        setSending(true);
        const { ok, error } = await replyAsUser(ticket, reply);
        setSending(false);
        if (!ok) {
            toast({ title: "Reply not sent", description: error || "Please try again.", variant: "destructive" });
            return;
        }
        setReply("");
        toast({ title: "Reply sent", description: "The team will get back to you soon." });
        void load();
    };

    const handleClose = async () => {
        if (!ticket) return;
        setClosing(true);
        const ok = await closeMyTicket(ticket);
        setClosing(false);
        if (ok) {
            toast({ title: "Glad it's sorted, Yatri!", description: "The ticket is closed. Open a new one any time." });
            void load();
        }
    };

    const notFound = !loading && (!ticket || !hasSession());

    return (
        <div className="min-h-screen bg-background text-foreground">
            <SEO title={`Ticket ${ticketNumber || ""} | Yatri Cloud Support`} noindex />
            <Navbar />
            <main className="container mx-auto px-4 md:px-6 pt-28 md:pt-32 pb-24 max-w-3xl">
                <Link
                    to="/support"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to support
                </Link>

                {loading ? (
                    <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading your ticket…
                    </div>
                ) : notFound ? (
                    <div className="text-center py-16 border rounded-2xl bg-brand-50/40">
                        <h1 className="font-display text-2xl font-bold mb-2">We could not find this ticket</h1>
                        <p className="text-muted-foreground mb-6">
                            Check the link, or sign in with the account that opened it.
                        </p>
                        <Button asChild className="min-h-[44px] rounded-xl">
                            <Link to="/support">Go to support</Link>
                        </Button>
                    </div>
                ) : ticket ? (
                    <>
                        <div className="rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.06] via-brand-50/40 to-card p-6 md:p-8 mb-6">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <span className="font-mono text-sm text-primary font-semibold">{ticket.ticketNumber}</span>
                                <Badge className={`rounded-full border ${STATUS_STYLES[ticket.status]}`} data-testid="ticket-status">
                                    {TICKET_STATUS_LABELS[ticket.status]}
                                </Badge>
                            </div>
                            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">{ticket.subject}</h1>
                        </div>

                        <ol className="space-y-3 mb-6" data-testid="ticket-thread">
                            {messages.map((m) => (
                                <li
                                    key={m.id}
                                    className={`rounded-2xl border p-4 ${m.sender === "admin" ? "border-brand-200 bg-brand-50/50" : "border-border bg-card"}`}
                                >
                                    <div className="flex items-center justify-between gap-3 mb-1.5">
                                        <span className="text-sm font-semibold">
                                            {m.sender === "admin" ? "Yatri Cloud Support" : "You"}
                                        </span>
                                        <span className="text-xs text-muted-foreground">{fmt(m.createdAt)}</span>
                                    </div>
                                    <p className="text-sm leading-relaxed whitespace-pre-line">{m.body}</p>
                                </li>
                            ))}
                        </ol>

                        {ticket.status === "closed" ? (
                            <div className="rounded-2xl border border-border bg-muted/40 p-6 text-center text-muted-foreground">
                                This ticket is closed. Need anything else?{" "}
                                <Link to="/support" className="text-primary font-semibold hover:underline">
                                    Open a new one
                                </Link>
                                .
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-border bg-card p-4 md:p-5">
                                <Textarea
                                    value={reply}
                                    onChange={(e) => setReply(e.target.value)}
                                    placeholder={
                                        ticket.status === "resolved"
                                            ? "Still not right? Reply here and the ticket reopens automatically."
                                            : "Write your reply…"
                                    }
                                    className="min-h-[100px] mb-3"
                                    disabled={sending}
                                    data-testid="ticket-reply"
                                />
                                <div className="flex flex-wrap gap-3 justify-end">
                                    <Button
                                        variant="outline"
                                        className="min-h-[44px] rounded-xl hover:bg-success/10 hover:text-success"
                                        onClick={handleClose}
                                        disabled={closing || sending}
                                        data-testid="ticket-close"
                                    >
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        {closing ? "Closing…" : "My issue is solved"}
                                    </Button>
                                    <Button
                                        className="min-h-[44px] rounded-xl shadow-inset-btn hover:bg-brand-600"
                                        onClick={handleReply}
                                        disabled={sending || closing}
                                        data-testid="ticket-send"
                                    >
                                        {sending ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending
                                            </>
                                        ) : (
                                            "Send reply"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                ) : null}
            </main>
            <Footer />
        </div>
    );
}
