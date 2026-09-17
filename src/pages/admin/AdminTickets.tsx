import { useEffect, useMemo, useState } from "react";
import { CheckCircle, Loader2, Search, StickyNote, Trash2, XCircle } from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  deleteTicket,
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
 * internal notes, close manually, and delete tickets.
 */

const STATUS_STYLES: Record<TicketStatus, string> = {
  open: "bg-primary text-white border-primary/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  resolved: "bg-success text-white border-0",
  closed: "bg-muted text-muted-foreground border-border",
};

const PRIORITY_STYLES: Record<TicketPriority, string> = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-brand-50 text-primary",
  high: "bg-warning/10 text-warning",
  urgent: "bg-destructive text-white",
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [ticketToDelete, setTicketToDelete] = useState<SupportTicket | null>(null);

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

  const handleQuickClose = async (t: SupportTicket, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const ok = await setTicketStatus(t, "closed");
    if (!ok) {
      toast({ title: "Update failed", variant: "destructive" });
      return;
    }
    toast({ title: "Ticket closed", description: `Ticket ${t.ticketNumber} is now Closed.` });
    setRows((prev) =>
      prev.map((r) => (r.id === t.id ? { ...r, status: "closed", lastActivityAt: new Date().toISOString() } : r))
    );
    if (active?.id === t.id) {
      setActive((prev) => (prev ? { ...prev, status: "closed" } : null));
    }
  };

  const handleDelete = async (t: SupportTicket) => {
    setDeletingId(t.id);
    const ok = await deleteTicket(t.id);
    setDeletingId(null);
    setTicketToDelete(null);
    if (!ok) {
      toast({ title: "Delete failed", description: "Could not delete ticket.", variant: "destructive" });
      return;
    }
    toast({ title: "Deleted", description: `Ticket ${t.ticketNumber} was permanently removed.` });
    setRows((prev) => prev.filter((r) => r.id !== t.id));
    if (active?.id === t.id) {
      setActive(null);
    }
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
                <div
                  key={t.id}
                  data-testid={`ticket-row-${t.ticketNumber}`}
                  onClick={() => openTicket(t)}
                  className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left odd:bg-brand-50/30 hover:bg-brand-50/60 transition cursor-pointer group"
                >
                  <div className="flex flex-wrap items-center gap-3 min-w-[280px] flex-1">
                    <span className="font-mono text-sm font-semibold text-primary">{t.ticketNumber}</span>
                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">{t.subject}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${PRIORITY_STYLES[t.priority]}`}>{t.priority}</span>
                    <Badge className={`rounded-full border ${STATUS_STYLES[t.status]}`}>{ADMIN_STATUS_LABELS[t.status]}</Badge>
                    <span className="text-xs text-muted-foreground">{t.name} · {fmt(t.lastActivityAt)}</span>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {t.status !== "closed" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => handleQuickClose(t, e)}
                        className="h-8 text-xs font-medium rounded-lg text-muted-foreground hover:text-foreground hover:border-foreground/30"
                        title="Close Ticket"
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1 text-muted-foreground" /> Close
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleStatus("open");
                        }}
                        className="h-8 text-xs font-medium rounded-lg text-muted-foreground hover:text-primary"
                        title="Reopen Ticket"
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1 text-emerald-500" /> Reopen
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTicketToDelete(t);
                      }}
                      disabled={deletingId === t.id}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                      title="Delete Ticket"
                    >
                      {deletingId === t.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Ticket Details & Discussion Modal */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {active && (
            <>
              <DialogHeader className="flex flex-row items-start justify-between gap-4 border-b border-border/80 pb-4">
                <div className="space-y-1 pr-6">
                  <DialogTitle className="font-display tracking-tight text-lg">
                    <span className="font-mono text-primary mr-2">{active.ticketNumber}</span>
                    {active.subject}
                  </DialogTitle>
                  <DialogDescription>
                    {active.name} · {active.email} · <span className="capitalize">{active.category}</span>
                  </DialogDescription>
                </div>
              </DialogHeader>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap gap-3 flex-1">
                  <div className="flex-1 min-w-[140px]">
                    <Label className="mb-1.5 block text-xs">Status</Label>
                    <Select value={active.status} onValueChange={(v) => handleStatus(v as TicketStatus)}>
                      <SelectTrigger className="min-h-[40px] rounded-xl" data-testid="ticket-admin-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(ADMIN_STATUS_LABELS) as TicketStatus[]).map((s) => (
                          <SelectItem key={s} value={s}>{ADMIN_STATUS_LABELS[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[140px]">
                    <Label className="mb-1.5 block text-xs">Priority</Label>
                    <Select value={active.priority} onValueChange={(v) => handlePriority(v as TicketPriority)}>
                      <SelectTrigger className="min-h-[40px] rounded-xl" data-testid="ticket-admin-priority">
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

                <div className="flex items-end gap-2 pt-5">
                  {active.status !== "closed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickClose(active)}
                      className="rounded-xl font-medium text-xs h-10 border-border hover:bg-muted/80"
                    >
                      <XCircle className="h-4 w-4 mr-1.5 text-muted-foreground" /> Close Ticket
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setTicketToDelete(active)}
                    className="rounded-xl font-medium text-xs h-10 border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" /> Delete Ticket
                  </Button>
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

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!ticketToDelete} onOpenChange={(o) => !o && setTicketToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Delete Support Ticket
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete ticket{" "}
              <strong>{ticketToDelete?.ticketNumber}</strong> ({ticketToDelete?.subject})?
              All messages and records associated with this ticket will be removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => ticketToDelete && handleDelete(ticketToDelete)}
              disabled={!!deletingId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminTickets;
