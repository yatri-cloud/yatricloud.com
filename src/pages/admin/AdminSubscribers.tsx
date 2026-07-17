import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { ListPager } from "@/components/ui/list-pager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
  Search,
  Loader2,
  Trash2,
  Download,
  Users,
  UserCheck,
  UserX,
  Plus,
  RotateCcw,
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
import {
  fetchSubscribers,
  deleteSubscriber,
  exportSubscribersCsv,
  countSubscribers,
  type Subscriber,
} from "@/lib/newsletter";
import { supabase } from "@/lib/supabase";

const PAGE_SIZE = 15;

type Tab = "all" | "active" | "unsubscribed";

type SortKey = "newest" | "oldest" | "email-asc" | "email-desc";

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

export default function AdminSubscribers() {
  const { toast } = useToast();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    total: 0,
    active: 0,
    unsubscribed: 0,
  });
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<Subscriber | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    const [subs, cnt] = await Promise.all([
      fetchSubscribers(),
      countSubscribers(),
    ]);
    setSubscribers(subs);
    setCounts(cnt);
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
    let result = subscribers;

    // Tab filter
    if (tab === "active") result = result.filter((s) => s.status === "active");
    if (tab === "unsubscribed")
      result = result.filter((s) => s.status === "unsubscribed");

    // Search filter
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (s) =>
          s.email.toLowerCase().includes(q) ||
          (s.name || "").toLowerCase().includes(q)
      );
    }

    // Sort
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
        case "email-asc":
          return a.email.localeCompare(b.email);
        case "email-desc":
          return b.email.localeCompare(a.email);
        default:
          return 0;
      }
    });

    return result;
  }, [subscribers, tab, search, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleExport = () => {
    const csv = exportSubscribersCsv(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${filtered.length} subscribers exported.` });
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    const result = await deleteSubscriber(toDelete.id);
    if (!result.ok) {
      toast({ title: "Error", description: result.error || "Delete failed.", variant: "destructive" });
      setToDelete(null);
      return;
    }
    setSubscribers((prev) => prev.filter((s) => s.id !== toDelete.id));
    setCounts((prev) => ({
      ...prev,
      total: prev.total - 1,
      active: prev.active - (toDelete.status === "active" ? 1 : 0),
      unsubscribed:
        prev.unsubscribed - (toDelete.status === "unsubscribed" ? 1 : 0),
    }));
    toast({ title: "Done", description: "Subscriber deleted." });
    setToDelete(null);
  };

  const handleAdd = async () => {
    if (!newEmail.trim()) {
      toast({ title: "Error", description: "Email is required.", variant: "destructive" });
      return;
    }
    setAdding(true);
    const { error } = await supabase.from("subscribers").insert({
      email: newEmail.trim(),
      name: newName.trim() || null,
    });
    setAdding(false);

    if (error) {
      toast({ title: "Error", description: error.message || "Could not add subscriber.", variant: "destructive" });
      return;
    }

    toast({ title: "Done", description: `${newEmail} added as subscriber.` });
    setNewEmail("");
    setNewName("");
    setShowAddDialog(false);
    load();
  };

  const handleReactivate = async (sub: Subscriber) => {
    const { error } = await supabase
      .from("subscribers")
      .update({ status: "active", unsubscribed_at: null })
      .eq("id", sub.id);

    if (error) {
      toast({ title: "Error", description: error.message || "Reactivate failed.", variant: "destructive" });
      return;
    }

    setSubscribers((prev) =>
      prev.map((s) => (s.id === sub.id ? { ...s, status: "active" as const, unsubscribed_at: null } : s))
    );
    setCounts((prev) => ({
      ...prev,
      active: prev.active + 1,
      unsubscribed: prev.unsubscribed - 1,
    }));
    toast({ title: "Done", description: `${sub.email} reactivated.` });
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span>Loading subscribers...</span>
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
            <div className="relative">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Newsletter
              </p>
              <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight md:text-3xl">
                Subscribers
              </h1>
              <p className="mt-1 text-muted-foreground">
                Manage your newsletter audience. Search, export, or remove subscribers.
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: "Total",
              value: counts.total,
              icon: Users,
              color: "text-primary",
            },
            {
              label: "Active",
              value: counts.active,
              icon: UserCheck,
              color: "text-green-600",
            },
            {
              label: "Unsubscribed",
              value: counts.unsubscribed,
              icon: UserX,
              color: "text-muted-foreground",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-card border border-brand-100 rounded-2xl p-5 md:p-6 shadow-card"
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums text-foreground">
                    {stat.value.toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="bg-card border border-brand-100 rounded-2xl p-5 md:p-6 shadow-card">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by email or name..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-10 rounded-xl pl-9"
                data-testid="subscribers-search"
              />
            </div>
            <Select value={sort} onValueChange={handleSortChange}>
              <SelectTrigger className="h-10 w-[160px] rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="email-asc">Email A-Z</SelectItem>
                <SelectItem value="email-desc">Email Z-A</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="h-10 rounded-xl"
              onClick={() => setShowAddDialog(true)}
              data-testid="add-subscriber-trigger"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Subscriber
            </Button>
            <Button
              variant="outline"
              className="h-10 rounded-xl"
              onClick={handleExport}
              data-testid="subscribers-export"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1.5 mb-4">
            {(["all", "active", "unsubscribed"] as const).map((t) => (
              <button
                key={t}
                onClick={() => handleTabChange(t)}
                data-testid={`subscribers-tab-${t}`}
                className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                  tab === t
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}{" "}
                <span
                  className={tab === t ? "text-primary-foreground/80" : "text-muted-foreground/70"}
                >
                  {t === "all"
                    ? counts.total
                    : t === "active"
                    ? counts.active
                    : counts.unsubscribed}
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
                    Email
                  </th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="h-10 px-4 text-left font-medium text-muted-foreground">
                    Subscribed
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
                      colSpan={5}
                      className="h-24 px-4 text-center text-sm text-muted-foreground"
                    >
                      No subscribers match.
                    </td>
                  </tr>
                ) : (
                  paged.map((sub) => (
                    <tr
                      key={sub.id}
                      className="border-b border-brand-100/50 hover:bg-brand-50/30 transition-colors"
                      data-testid={`subscriber-row-${sub.email}`}
                    >
                      <td className="h-12 px-4 font-medium text-foreground">
                        {sub.email}
                      </td>
                      <td className="h-12 px-4 text-muted-foreground">
                        {sub.name || "—"}
                      </td>
                      <td className="h-12 px-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            sub.status === "active"
                              ? "bg-green-50 text-green-700"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="h-12 px-4 text-muted-foreground whitespace-nowrap">
                        {fmt(sub.created_at)}
                      </td>
                      <td className="h-12 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {sub.status === "unsubscribed" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-muted-foreground hover:bg-green-50 hover:text-green-600 rounded-lg"
                              onClick={() => handleReactivate(sub)}
                              data-testid="subscriber-reactivate"
                              aria-label={`Reactivate ${sub.email}`}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground rounded-lg"
                            onClick={() => setToDelete(sub)}
                            data-testid="subscriber-delete"
                            aria-label={`Delete ${sub.email}`}
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
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display tracking-tight">
              Delete subscriber?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <strong>{toDelete?.email}</strong> from the subscriber list.
              This cannot be undone.
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

      {/* Add Subscriber dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display tracking-tight">
              Add Subscriber
            </DialogTitle>
            <DialogDescription>
              Add a new subscriber to your newsletter list.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="add-subscriber-email" className="text-sm font-medium">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="add-subscriber-email"
                type="email"
                placeholder="subscriber@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="h-10 rounded-xl"
                data-testid="add-subscriber-email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-subscriber-name" className="text-sm font-medium">
                Name <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="add-subscriber-name"
                placeholder="John Doe"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-10 rounded-xl"
                data-testid="add-subscriber-name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setShowAddDialog(false);
                setNewEmail("");
                setNewName("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={adding || !newEmail.trim()}
              className="rounded-xl bg-primary hover:bg-brand-600 text-primary-foreground font-semibold shadow-inset-btn"
              data-testid="add-subscriber-submit"
            >
              {adding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Subscribe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
