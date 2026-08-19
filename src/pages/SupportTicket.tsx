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

const STATUS_STYLES: Record<TicketStatus, string> = {
    open: "bg-primary text-white border-primary/20",
    pending: "bg-warning/10 text-warning border-warning/20",
    resolved: "bg-success text-white border-success/20",
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
            toast({ title: "Please enter a reply", variant: "destructive" });
            return;
        }
        setSending(true);
        const { ok, error } = await replyAsUser(ticket, reply);
        setSending(false);
        if (!ok) {
            toast({ title: "Failed to send reply", description: error || "Please try again.", variant: "destructive" });
            return;
        }
        setReply("");
        toast({ title: "Reply sent", description: "Our team will review and respond shortly." });
        void load();
    };

    const handleClose = async () => {
        if (!ticket) return;
        setClosing(true);
        const ok = await closeMyTicket(ticket);
        setClosing(false);
        if (ok) {
            toast({ title: "Ticket closed", description: "This ticket has been marked as resolved." });
            void load();
        }
    };

    const notFound = !loading && (!ticket || !hasSession());

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
            <SEO title={`Ticket ${ticketNumber || ""} | Support | Yatri Cloud`} noindex />
            <Navbar />
            <main className="flex-1 container mx-auto px-4 md:px-6 pt-28 md:pt-32 pb-20 max-w-3xl">
                <Link
                    to="/support"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-6"
                >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Tickets
                </Link>

                {loading ? (
                    <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading ticket…
                    </div>
                ) : notFound ? (
                    <div className="text-center py-16 border border-border rounded-2xl bg-card/40">
                        <h1 className="font-display text-xl font-bold mb-1">Ticket not found</h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-5">
                            Please check the URL or ensure you are signed into the correct account.
                        </p>
                        <Button asChild className="h-10 rounded-xl px-5 text-sm">
                            <Link to="/support">Back to Support</Link>
                        </Button>
                    </div>
                ) : ticket ? (
                    <>
                        <div className="rounded-2xl border border-border bg-card p-5 md:p-6 mb-6">
                            <div className="flex flex-wrap items-center gap-2.5 mb-2">
                                <span className="font-mono text-xs text-primary font-semibold">{ticket.ticketNumber}</span>
                                <Badge className={`rounded-md text-[11px] font-medium border ${STATUS_STYLES[ticket.status]}`} data-testid="ticket-status">
                                    {TICKET_STATUS_LABELS[ticket.status]}
                                </Badge>
                            </div>
                            <h1 className="font-display text-xl md:text-2xl font-bold tracking-tight text-foreground">{ticket.subject}</h1>
                        </div>

                        <ol className="space-y-3 mb-6" data-testid="ticket-thread">
                            {messages.map((m) => (
                                <li
                                    key={m.id}
                                    className={`rounded-xl border p-4 ${m.sender === "admin" ? "border-primary/20 bg-primary/[0.03]" : "border-border bg-card"}`}
                                >
                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                        <span className="text-xs font-semibold text-foreground">
                                            {m.sender === "admin" ? "Yatri Cloud Support" : "You"}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground">{fmt(m.createdAt)}</span>
                                    </div>
                                    <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/90">{m.body}</p>
                                </li>
                            ))}
                        </ol>

                        {ticket.status === "closed" ? (
                            <div className="rounded-xl border border-border bg-muted/30 p-5 text-center text-xs text-muted-foreground">
                                This ticket is closed. If you need assistance, please{" "}
                                <Link to="/support" className="text-primary font-medium hover:underline">
                                    open a new ticket
                                </Link>
                                .
                            </div>
                        ) : (
                            <div className="rounded-xl border border-border bg-card p-4">
                                <Textarea
                                    value={reply}
                                    onChange={(e) => setReply(e.target.value)}
                                    placeholder={
                                        ticket.status === "resolved"
                                            ? "Add a reply to reopen this ticket..."
                                            : "Type your reply..."
                                    }
                                    className="min-h-[90px] text-sm rounded-xl mb-3"
                                    disabled={sending}
                                    data-testid="ticket-reply"
                                />
                                <div className="flex flex-wrap gap-2 justify-end">
                                    <Button
                                        variant="outline"
                                        className="h-9 rounded-xl text-xs font-medium"
                                        onClick={handleClose}
                                        disabled={closing || sending}
                                        data-testid="ticket-close"
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                        {closing ? "Closing…" : "Mark as Resolved"}
                                    </Button>
                                    <Button
                                        className="h-9 rounded-xl text-xs font-medium"
                                        onClick={handleReply}
                                        disabled={sending || closing}
                                        data-testid="ticket-send"
                                    >
                                        {sending ? (
                                            <>
                                                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Sending
                                            </>
                                        ) : (
                                            "Send Reply"
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
