import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
import { useToast } from "@/hooks/use-toast";
import ScrollReveal from "@/components/ScrollReveal";
import {
  ADMIN_STATUS_LABELS,
  listAllTickets,
  listMessages,
  replyAsAdmin,
  setTicketPriority,
  setTicketStatus,
  type SupportMessage,
  type SupportTicket,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/support-api";

/**
 * /admin/tickets — the support queue. Filter by status/priority, search,
 * open a ticket to read the thread (internal notes highlighted), reply
 * (emails the Yatri and flips the ticket to "Waiting on Yatri"), leave
 * internal notes, and set status/priority. Auto-close of quiet resolved
 * tickets runs in /api/cron/support-auto-close.
 */

const STATUS_STYLES: Record<TicketStatus, string> = {
  open: "bg-primary/10 text-primary border-primary/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  resolved: "bg-success/10 text-success border-success/20",
  closed: "bg-muted text-muted-foreground border-border",
};

const PRIORITY_STYLES: Record<TicketPriority, string> = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-brand-50 text-primary",
  high: "bg-warning/10 text-warning",
  urgent: "bg-destructive/10 text-destructive",
};

const fmt = (d: string) =>
  new Date(d).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

const AdminTickets = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TicketStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | TicketPriority>("all");

  const [active, setActive] = useState<SupportTicket | null>(null);
  const [thread, setThread] = useState<SupportMessage[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [internal, setInternal] = useState(false);
  const [sending, setSending] = useState(false);

  const load = async () => {
    setRows(await listAllTickets());
    setLoading(false);
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openTicket = async (t: SupportTicket) => {
    setActive(t);
    setThreadLoading(true);
    setThread(await listMessages(t.id));
    setThreadLoading(false);
  };

  const refreshActive = async (id: string) => {
    const fresh = await listAllTickets();
    setRows(fresh);
    const t = fresh.find((x) => x.id === id) || null;
    setActive(t);
    if (t) setThread(await listMessages(t.id));
  };

  const handleReply = async () => {
    if (!active || !reply.trim()) return;
    setSending(true);
    const { ok, error } = await replyAsAdmin(active, reply, internal);
    setSending(false);
    if (!ok) {
      toast({ title: "Reply failed", description: error || "Please try again.", variant: "destructive" });
      return;
    }
    toast({ title: internal ? "Note saved" : "Reply sent", description: internal ? "Visible to admins only." : "The Yatri was emailed." });
    setReply("");
    setInternal(false);
    void refreshActive(active.id);
  };

  const handleStatus = async (status: TicketStatus) => {
    if (!active) return;
    const ok = await setTicketStatus(active, status);
    if (!ok) { toast({ title: "Update failed", variant: "destructive" }); return; }
    toast({ title: "Saved", description: `Ticket is now ${ADMIN_STATUS_LABELS[status]}.` });
    void refreshActive(active.id);
  };

  const handlePriority = async (priority: TicketPriority) => {
    if (!active) return;
    const ok = await setTicketPriority(active.id, priority);
    if (!ok) { toast({ title: "Update failed", variant: "destructive" }); return; }
    void refreshActive(active.id);
  };

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (
        q &&
        !(
          t.subject.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.email.toLowerCase().includes(q) ||
          t.ticketNumber.toLowerCase().includes(q)
        )
      )
        return false;
      return true;
    });
  }, [rows, search, statusFilter, priorityFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    for (const s of ["open", "pending", "resolved", "closed"]) c[s] = rows.filter((t) => t.status === s).length;
    return c;
  }, [rows]);

  if (loading)
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading tickets…
      </div>
    );

  return (
    <div className="px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-6 md:p-8">
            <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
              Support <span className="gradient-text">tickets</span>
            </h1>
            <p className="mt-1 text-muted-foreground">
              {counts.open} open · {counts.pending} waiting on Yatris · {counts.resolved} resolved. Replies email the Yatri automatically.
            </p>
          </div>
        </ScrollReveal>

        <div className="rounded-2xl border border-brand-100 bg-card shadow-card">
          <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search subject, Yatri, email or ticket number…"
                className="h-10 rounded-lg pl-9"
                data-testid="tickets-search"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["all", "open", "pending", "resolved", "closed"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  data-testid={`tickets-filter-${s}`}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusFilter === s ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
                >
                  {s} <span className={statusFilter === s ? "text-primary-foreground/80" : "text-muted-foreground/70"}>{counts[s]}</span>
                </button>
              ))}
            </div>
            <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as any)}>
              <SelectTrigger className="h-9 w-32 rounded-lg"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="divide-y divide-border">
            {shown.length === 0 ? (
              <p className="p-10 text-center text-sm text-muted-foreground">
                {rows.length === 0 ? "No tickets yet. When a Yatri needs help, their ticket lands here." : "Nothing matches those filters."}
              </p>
            ) : (
              shown.map((t) => (
                <button
                  key={t.id}
                  onClick={() => openTicket(t)}
                  data-testid={`ticket-row-${t.ticketNumber}`}
                  className="flex w-full flex-wrap items-center gap-3 p-4 text-left odd:bg-brand-50/30 hover:bg-brand-50/60 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="font-mono text-sm font-semibold text-primary">{t.ticketNumber}</span>
                  <span className="min-w-[200px] flex-1 font-semibold">{t.subject}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${PRIORITY_STYLES[t.priority]}`}>{t.priority}</span>
                  <Badge className={`rounded-full border ${STATUS_STYLES[t.status]}`}>{ADMIN_STATUS_LABELS[t.status]}</Badge>
                  <span className="text-xs text-muted-foreground">{t.name} · {fmt(t.lastActivityAt)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display tracking-tight">
                  <span className="font-mono text-primary mr-2">{active.ticketNumber}</span>
                  {active.subject}
                </DialogTitle>
                <DialogDescription>
                  {active.name} · {active.email} · {active.category}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[160px]">
                  <Label className="mb-1.5 block text-xs">Status</Label>
                  <Select value={active.status} onValueChange={(v) => handleStatus(v as TicketStatus)}>
                    <SelectTrigger className="min-h-[44px] rounded-xl" data-testid="ticket-admin-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(ADMIN_STATUS_LABELS) as TicketStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>{ADMIN_STATUS_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[160px]">
                  <Label className="mb-1.5 block text-xs">Priority</Label>
                  <Select value={active.priority} onValueChange={(v) => handlePriority(v as TicketPriority)}>
                    <SelectTrigger className="min-h-[44px] rounded-xl" data-testid="ticket-admin-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["low", "normal", "high", "urgent"] as const).map((p) => (
                        <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2.5 border-t border-border pt-4" data-testid="ticket-admin-thread">
                {threadLoading ? (
                  <div className="flex items-center gap-2 py-6 justify-center text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading thread…
                  </div>
                ) : (
                  thread.map((m) => (
                    <div
                      key={m.id}
                      className={`rounded-xl border p-3 ${m.isInternal ? "border-warning/30 bg-warning/5" : m.sender === "admin" ? "border-brand-200 bg-brand-50/50" : "border-border bg-card"}`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold">
                          {m.isInternal ? (
                            <span className="inline-flex items-center gap-1 text-warning"><StickyNote className="h-3 w-3" /> Internal note</span>
                          ) : m.sender === "admin" ? "Support" : active.name}
                        </span>
                        <span className="text-[11px] text-muted-foreground">{fmt(m.createdAt)}</span>
                      </div>
                      <p className="whitespace-pre-line text-sm">{m.body}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-border pt-4">
                <Textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder={internal ? "Internal note — the Yatri never sees this." : "Reply to the Yatri — this emails them too."}
                  className="min-h-[90px] mb-3"
                  disabled={sending}
                  data-testid="ticket-admin-reply"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Checkbox checked={internal} onCheckedChange={(v) => setInternal(v === true)} data-testid="ticket-admin-internal" />
                    Internal note only
                  </label>
                  <Button
                    onClick={handleReply}
                    disabled={sending || !reply.trim()}
                    className="min-h-[44px] rounded-xl shadow-inset-btn hover:bg-brand-600"
                    data-testid="ticket-admin-send"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending
                      </>
                    ) : internal ? "Save note" : "Send reply"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTickets;
