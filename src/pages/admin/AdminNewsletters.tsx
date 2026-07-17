import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ListPager } from "@/components/ui/list-pager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
  Search,
  Loader2,
  Trash2,
  Plus,
  Send,
  Edit,
  Mail,
  ScrollText,
} from "lucide-react";
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
import {
  fetchNewsletters,
  deleteNewsletter,
  sendNewsletter,
  type Newsletter,
} from "@/lib/newsletter";

const PAGE_SIZE = 10;

type Tab = "all" | "draft" | "sent";

type SortKey = "newest" | "oldest" | "title-asc";

const SectionHeader = ({
  eyebrow,
  title,
  hint,
}: {
  eyebrow: string;
  title: string;
  hint?: string;
}) => (
  <div className="mb-4">
    <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
      {eyebrow}
    </p>
    <h3 className="text-lg font-semibold text-foreground">{title}</h3>
    {hint && (
      <p className="text-sm text-muted-foreground mt-1">{hint}</p>
    )}
  </div>
);

const fmt = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", {
        dateStyle: "medium",
      })
    : "—";

const statusBadge = (status: string) => {
  switch (status) {
    case "draft":
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-50 text-amber-700">
          draft
        </span>
      );
    case "sending":
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-700">
          sending
        </span>
      );
    case "sent":
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-50 text-green-700">
          sent
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
          {status}
        </span>
      );
  }
};

export default function AdminNewsletters() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<Newsletter | null>(null);
  const [toSend, setToSend] = useState<Newsletter | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const list = await fetchNewsletters();
    setNewsletters(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleTabChange = (t: Tab) => {
    setTab(t);
    setPage(1);
  };

  const handleSortChange = (v: string) => {
    setSort(v as SortKey);
    setPage(1);
  };

  const filtered = useMemo(() => {
    let result = newsletters;

    if (tab === "draft") result = result.filter((n) => n.status === "draft");
    if (tab === "sent") result = result.filter((n) => n.status === "sent");

    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.subject.toLowerCase().includes(q)
      );
    }

    result = [...result].sort((a, b) => {
      switch (sort) {
        case "newest":
          return (
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
          );
        case "oldest":
          return (
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
          );
        case "title-asc":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return result;
  }, [newsletters, tab, search, sort]);

  const counts = useMemo(
    () => ({
      all: newsletters.length,
      draft: newsletters.filter((n) => n.status === "draft").length,
      sent: newsletters.filter((n) => n.status === "sent").length,
    }),
    [newsletters]
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleDelete = async () => {
    if (!toDelete) return;
    const result = await deleteNewsletter(toDelete.id);
    if (!result.ok) {
      toast({
        title: "Error",
        description: result.error || "Delete failed.",
        variant: "destructive",
      });
      setToDelete(null);
      return;
    }
    setNewsletters((prev) => prev.filter((n) => n.id !== toDelete.id));
    toast({ title: "Done", description: "Newsletter deleted." });
    setToDelete(null);
  };

  const handleSend = async () => {
    if (!toSend) return;
    setSendingId(toSend.id);
    setToSend(null);

    const result = await sendNewsletter(toSend.id, (sent, total) => {
      toast({
        title: "Sending...",
        description: `Sending to ${total} subscribers... (${sent}/${total})`,
      });
    });

    setSendingId(null);

    if (!result.ok) {
      toast({
        title: "Error",
        description: result.error || "Send failed.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sent",
      description: `Newsletter sent to ${result.sent} subscribers${
        result.failed > 0 ? ` (${result.failed} failed)` : ""
      }.`,
    });

    // Refresh list to pick up status change
    load();
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span>Loading newsletters...</span>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-8 md:py-10">
      <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
        {/* Header band */}
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-6 md:p-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
            />
            <div className="relative flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Newsletter
                </p>
                <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight md:text-3xl">
                  Campaigns
                </h1>
                <p className="mt-1 text-muted-foreground">
                  {newsletters.length} newsletters &middot;{" "}
                  {counts.draft} drafts &middot; {counts.sent} sent. Compose,
                  preview, and deliver to your audience.
                </p>
              </div>
              <Button
                className="rounded-xl bg-primary hover:bg-brand-600 text-primary-foreground font-semibold shadow-inset-btn"
                onClick={() => navigate("/admin/newsletters/new")}
                data-testid="newsletter-compose"
              >
                <Plus className="h-4 w-4 mr-2" />
                Compose Newsletter
              </Button>
            </div>
          </div>
        </ScrollReveal>

        {/* Controls */}
        <div className="bg-card border border-brand-100 rounded-2xl p-5 md:p-6 shadow-card">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by title or subject..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-10 rounded-xl pl-9"
                data-testid="newsletters-search"
              />
            </div>
            <Select value={sort} onValueChange={handleSortChange}>
              <SelectTrigger className="h-10 w-[160px] rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="title-asc">Title A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <div className="flex gap-1.5 mb-4">
            {(["all", "draft", "sent"] as const).map((t) => (
              <button
                key={t}
                onClick={() => handleTabChange(t)}
                data-testid={`newsletters-tab-${t}`}
                className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                  tab === t
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}{" "}
                <span
                  className={
                    tab === t
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground/70"
                  }
                >
                  {counts[t]}
                </span>
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-100">
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">
                    Title
                  </th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">
                    Subject
                  </th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">
                    Recipients
                  </th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">
                    Sent
                  </th>
                  <th className="h-10 px-4 text-right font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="h-24 px-4 text-center text-sm text-muted-foreground"
                    >
                      No newsletters match.
                    </td>
                  </tr>
                ) : (
                  paged.map((nl) => (
                    <tr
                      key={nl.id}
                      className="border-b border-brand-100/50 hover:bg-brand-50/30 transition-colors"
                      data-testid={`newsletter-row-${nl.title}`}
                    >
                      <td className="h-12 px-4">
                        <div className="flex items-center gap-2">
                          <ScrollText className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="font-medium text-foreground truncate max-w-[200px]">
                            {nl.title || "Untitled"}
                          </span>
                        </div>
                      </td>
                      <td className="h-12 px-4 text-muted-foreground truncate max-w-[220px]">
                        {nl.subject || "—"}
                      </td>
                      <td className="h-12 px-4">{statusBadge(nl.status)}</td>
                      <td className="h-12 px-4 text-muted-foreground tabular-nums">
                        {nl.recipient_count > 0
                          ? nl.recipient_count.toLocaleString("en-IN")
                          : "—"}
                      </td>
                      <td className="h-12 px-4 text-muted-foreground whitespace-nowrap">
                        {fmt(nl.sent_at)}
                      </td>
                      <td className="h-12 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {nl.status === "draft" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-muted-foreground hover:text-primary rounded-lg"
                                onClick={() =>
                                  navigate(
                                    `/admin/newsletters/edit/${nl.id}`
                                  )
                                }
                                data-testid="newsletter-edit"
                                aria-label={`Edit ${nl.title}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-lg"
                                onClick={() => setToSend(nl)}
                                disabled={sendingId === nl.id}
                                data-testid="newsletter-send"
                                aria-label={`Send ${nl.title}`}
                              >
                                {sendingId === nl.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Send className="h-4 w-4" />
                                )}
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground rounded-lg"
                            onClick={() => setToDelete(nl)}
                            data-testid="newsletter-delete"
                            aria-label={`Delete ${nl.title}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <ListPager
            page={currentPage}
            pageCount={pageCount}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* Delete confirm dialog */}
      <AlertDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display tracking-tight">
              Delete newsletter?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <strong>{toDelete?.title || "this newsletter"}</strong> and all
              its send records. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">
              Keep it
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send confirm dialog */}
      <AlertDialog
        open={!!toSend}
        onOpenChange={(o) => !o && setToSend(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display tracking-tight">
              Send newsletter?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will send{" "}
              <strong>{toSend?.title}</strong> to all active subscribers.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSend}
              className="rounded-xl bg-primary hover:bg-brand-600 text-primary-foreground shadow-inset-btn"
            >
              <Send className="mr-2 h-4 w-4" />
              Send to All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
