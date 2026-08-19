import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { ListPager } from "@/components/ui/list-pager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
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
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        Loading subscribers...
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-8 md:py-10">
      <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-transparent p-6 md:p-8">
            <div className="relative">
              <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl text-foreground">
                Subscribers
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage newsletter subscribers, waitlist contacts, and exports.
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
            },
            {
              label: "Active",
              value: counts.active,
            },
            {
              label: "Unsubscribed",
              value: counts.unsubscribed,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-transparent border border-border/80 rounded-2xl p-5 md:p-6"
            >
              <p className="text-2xl font-bold tabular-nums text-foreground">
                {stat.value.toLocaleString("en-IN")}
              </p>
              <h3 className="text-xs font-medium text-muted-foreground mt-1">
                {stat.label}
              </h3>
            </div>
          ))}
        </div>

        {/* Controls & Table Container */}
        <div className="bg-transparent border border-border/80 rounded-2xl p-5 md:p-6 space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Input
                placeholder="Search by email or name..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-10 rounded-xl bg-transparent border-border"
                data-testid="subscribers-search"
              />
            </div>
            <Select value={sort} onValueChange={handleSortChange}>
              <SelectTrigger className="h-10 w-[160px] rounded-xl bg-transparent border-border">
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
              className="h-10 rounded-xl bg-transparent hover:bg-muted/40 border-border text-foreground"
              onClick={() => setShowAddDialog(true)}
              data-testid="add-subscriber-trigger"
            >
              Add Subscriber
            </Button>
            <Button
              variant="outline"
              className="h-10 rounded-xl bg-transparent hover:bg-muted/40 border-border text-foreground"
              onClick={handleExport}
              data-testid="subscribers-export"
            >
              Export CSV
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {(["all", "active", "unsubscribed"] as const).map((t) => (
              <button
                key={t}
                onClick={() => handleTabChange(t)}
                data-testid={`subscribers-tab-${t}`}
                className={`rounded-xl border px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
                  tab === t
                    ? "border-foreground bg-foreground text-background"
                    : "border-border/80 bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                {t}{" "}
                <span
                  className={tab === t ? "text-background/80 ml-1" : "text-muted-foreground/80 ml-1"}
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
                <tr className="border-b border-border/70">
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
                      className="border-b border-border/50 hover:bg-muted/20 transition-colors"
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
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border ${
                            sub.status === "active"
                              ? "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400"
                              : "border-border bg-muted/40 text-muted-foreground"
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="h-12 px-4 text-muted-foreground whitespace-nowrap">
                        {fmt(sub.created_at)}
                      </td>
                      <td className="h-12 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {sub.status === "unsubscribed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 text-xs bg-transparent hover:bg-muted/40 border-border text-foreground rounded-lg"
                              onClick={() => handleReactivate(sub)}
                              data-testid="subscriber-reactivate"
                              aria-label={`Reactivate ${sub.email}`}
                            >
                              Reactivate
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="h-8 px-2.5 text-xs bg-transparent hover:bg-muted/40 border-border">
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover border-border">
                              <DropdownMenuItem
                                onClick={() => setToDelete(sub)}
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                              >
                                Delete Subscriber
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
        <AlertDialogContent className="rounded-2xl border-border bg-card">
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
            <AlertDialogCancel className="rounded-xl bg-transparent border-border hover:bg-muted/40">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Subscriber dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="rounded-2xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-display tracking-tight">
              Add Subscriber
            </DialogTitle>
            <DialogDescription>
              Add a new subscriber to your newsletter and waitlist roster.
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
                className="h-10 rounded-xl bg-transparent border-border"
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
                className="h-10 rounded-xl bg-transparent border-border"
                data-testid="add-subscriber-name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl bg-transparent border-border hover:bg-muted/40"
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
              className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              data-testid="add-subscriber-submit"
            >
              {adding ? "Adding..." : "Subscribe"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
