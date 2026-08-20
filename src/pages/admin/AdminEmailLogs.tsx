import { useState, useEffect } from "react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { sendEmail } from "@/lib/email";
import {
  fetchEmailLogs, countEmailLogs, listEmailLogTemplates,
  deleteEmailLog, clearEmailLogs, type EmailLog, type EmailLogFilters,
} from "@/lib/email-logs-api";
import {
  ClipboardList, Search, RefreshCw, Trash2, Loader2, CheckCircle2,
  XCircle, Filter, Mail, RotateCcw, ChevronDown, ChevronUp,
  AlertTriangle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function AdminEmailLogs() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [counts, setCounts] = useState({ total: 0, sent: 0, failed: 0 });
  const [templateOptions, setTemplateOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<EmailLogFilters>({});
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  const loadData = async (f: EmailLogFilters = filters) => {
    setLoading(true);
    const [logsData, countsData, templates] = await Promise.all([
      fetchEmailLogs(f),
      countEmailLogs(),
      listEmailLogTemplates(),
    ]);
    setLogs(logsData);
    setCounts(countsData);
    setTemplateOptions(templates);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const applyFilters = () => {
    const f: EmailLogFilters = { ...filters, search: search || undefined };
    setFilters(f);
    loadData(f);
  };

  const resetFilters = () => {
    setSearch("");
    setFilters({});
    loadData({});
  };

  const handleRetry = async (log: EmailLog) => {
    setRetrying(log.id);
    toast({ title: "Retrying...", description: `Re-sending to ${log.to_email}` });
    // We don't have the original HTML, so we send a notice email
    const result = await sendEmail({
      to: log.to_email,
      subject: log.subject,
      html: `<p>This is a retry of a previously failed email with subject: <strong>${log.subject}</strong>.</p><p>Please contact support@yatricloud.com if you need the original content.</p>`,
      templateKey: log.template_key ?? undefined,
      metadata: { source: "admin_retry", original_log_id: log.id },
    });
    setRetrying(null);
    if (result.success) {
      toast({ title: "Retried!", description: `Email re-sent to ${log.to_email}` });
      loadData();
    } else {
      toast({ title: "Retry Failed", description: result.error, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    await deleteEmailLog(id);
    setLogs(prev => prev.filter(l => l.id !== id));
    toast({ title: "Deleted", description: "Log entry removed." });
  };

  const handleClearAll = async () => {
    setClearing(true);
    await clearEmailLogs();
    setClearing(false);
    setConfirmClear(false);
    loadData({});
    toast({ title: "Cleared", description: "All email logs deleted." });
  };

  const statCards = [
    { label: "Total Sent", value: counts.total, icon: Mail, color: "text-primary", bg: "bg-primary" },
    { label: "Successful", value: counts.sent, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500" },
    { label: "Failed", value: counts.failed, icon: XCircle, color: "text-red-600", bg: "bg-red-500" },
  ];

  return (
    <div className="px-4 md:px-8 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.05] via-transparent to-card p-6 md:p-8">
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/60 to-brand-400 opacity-80" />
            <div aria-hidden className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-foreground">Email Logs</h1>
                <p className="text-muted-foreground mt-2 text-sm max-w-2xl">Complete audit trail of every email sent by the platform.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-9 rounded-xl gap-2" onClick={() => loadData()} disabled={loading}>
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-xl gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => setConfirmClear(true)}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear All
                </Button>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-4">
          {statCards.map(({ label, value, color }) => (
            <div key={label} className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col justify-center">
              <p className={`text-2xl font-bold font-display ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Email or subject..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && applyFilters()}
                  className="h-9 pl-9 rounded-xl text-sm"
                />
              </div>
            </div>
            <div className="min-w-[130px]">
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Status</label>
              <Select
                value={filters.status ?? "all"}
                onValueChange={v => setFilters(prev => ({ ...prev, status: v === "all" ? undefined : v as "sent" | "failed" }))}
              >
                <SelectTrigger className="h-9 rounded-xl text-sm">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[160px]">
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Template</label>
              <Select
                value={filters.templateKey ?? "all"}
                onValueChange={v => setFilters(prev => ({ ...prev, templateKey: v === "all" ? undefined : v }))}
              >
                <SelectTrigger className="h-9 rounded-xl text-sm">
                  <SelectValue placeholder="All Templates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Templates</SelectItem>
                  {templateOptions.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={applyFilters} size="sm" className="h-9 rounded-xl bg-primary text-white gap-2">
              <Filter className="w-3.5 h-3.5" /> Apply
            </Button>
            <Button onClick={resetFilters} variant="outline" size="sm" className="h-9 rounded-xl gap-2">
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span>Loading logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <Mail className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium">No email logs found</p>
              <p className="text-xs">Logs will appear here as emails are sent by the platform.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-brand-50/50">
                    <th className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground px-5 py-3">Status</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground px-3 py-3">To</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground px-3 py-3">Subject</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground px-3 py-3">Template</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground px-3 py-3">Sent At</th>
                    <th className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map(log => (
                    <>
                      <tr key={log.id} className="hover:bg-brand-50/30 transition-colors group">
                        <td className="px-5 py-3.5">
                          {log.status === "sent" ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 px-2.5 py-1 rounded-full">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Sent
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-100 dark:bg-red-950/40 dark:text-red-400 px-2.5 py-1 rounded-full">
                              <XCircle className="w-3.5 h-3.5" /> Failed
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3.5 max-w-[180px]">
                          <span className="truncate block font-mono text-xs text-muted-foreground">{log.to_email}</span>
                        </td>
                        <td className="px-3 py-3.5 max-w-[220px]">
                          <span className="truncate block text-xs">{log.subject}</span>
                        </td>
                        <td className="px-3 py-3.5">
                          {log.template_key ? (
                            <code className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-md font-mono">{log.template_key}</code>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3.5 text-xs text-muted-foreground whitespace-nowrap">{formatDate(log.sent_at)}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            {log.status === "failed" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 rounded-lg p-0 text-primary hover:bg-primary/10"
                                onClick={() => handleRetry(log)}
                                disabled={retrying === log.id}
                                title="Retry"
                              >
                                {retrying === log.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                              </Button>
                            )}
                            {log.error && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 rounded-lg p-0 text-muted-foreground hover:text-foreground"
                                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                                title="View error"
                              >
                                {expandedId === log.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 rounded-lg p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(log.id)}
                              title="Delete log"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {expandedId === log.id && log.error && (
                        <tr key={`${log.id}-error`} className="bg-red-50/50 dark:bg-red-950/10">
                          <td colSpan={6} className="px-5 py-3">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                              <code className="text-xs text-red-700 dark:text-red-400 font-mono break-all">{log.error}</code>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-3 border-t border-border text-xs text-muted-foreground bg-brand-50/30">
                Showing {logs.length} log{logs.length !== 1 ? "s" : ""}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Clear All Confirm */}
      <AlertDialog open={confirmClear} onOpenChange={o => !o && setConfirmClear(false)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all email logs?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete all {counts.total} log entries. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              disabled={clearing}
              className="rounded-xl bg-destructive text-white hover:bg-destructive/90"
            >
              {clearing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Clear All Logs
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
