import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ListPager } from "@/components/ui/list-pager";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const PAGE_SIZE = 10;

interface PartnerInquiry {
    id: string;
    name: string;
    email: string;
    company_name: string | null;
    kind: string | null;
    role: string | null;
    phone: string | null;
    headcount: number | null;
    focus: string | null;
    message: string | null;
    state: string | null;
    status: string;
    created_at: string;
}

interface ContactMessage {
    id: string;
    name: string;
    email: string;
    subject: string | null;
    message: string;
    status: string;
    created_at: string;
}

const KIND_LABELS: Record<string, string> = {
    college: "Campus",
    corporate: "Team",
    other: "Other",
};

const STATUS_META: Record<string, { label: string; dot: string }> = {
    pending: { label: "New", dot: "bg-warning" },
    approved: { label: "Handled", dot: "bg-success" },
    rejected: { label: "Closed", dot: "bg-muted-foreground" },
};

const StatusPill = ({ status }: { status: string }) => {
    const meta = STATUS_META[status] || { label: status, dot: "bg-muted-foreground" };
    return (
        <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
            <span className={`h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
            {meta.label}
        </span>
    );
};

const formatDate = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-IN", { dateStyle: "medium" });
};

export default function AdminInquiries() {
    const [loading, setLoading] = useState(true);
    const [inquiries, setInquiries] = useState<PartnerInquiry[]>([]);
    const [contacts, setContacts] = useState<ContactMessage[]>([]);

    // Partner inquiries tab filters
    const [pSearch, setPSearch] = useState("");
    const [pKind, setPKind] = useState("all");
    const [pStatus, setPStatus] = useState("all");
    const [pSort, setPSort] = useState("newest");
    const [pPage, setPPage] = useState(1);
    useEffect(() => { setPPage(1); }, [pSearch, pKind, pStatus, pSort]);

    // Contact messages tab filters
    const [cSearch, setCSearch] = useState("");
    const [cStatus, setCStatus] = useState("all");
    const [cSort, setCSort] = useState("newest");
    const [cPage, setCPage] = useState(1);
    useEffect(() => { setCPage(1); }, [cSearch, cStatus, cSort]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const [consult, contact] = await Promise.all([
                supabase
                    .from("consultation_requests")
                    .select("id, name, email, company_name, kind, role, phone, headcount, focus, message, state, status, created_at")
                    .order("created_at", { ascending: false }),
                supabase
                    .from("contact_messages")
                    .select("id, name, email, subject, message, status, created_at")
                    .order("created_at", { ascending: false }),
            ]);
            if (consult.error || contact.error) {
                toast.error("Could not load inquiries. Please refresh and try again.");
            }
            setInquiries((consult.data as PartnerInquiry[]) || []);
            setContacts((contact.data as ContactMessage[]) || []);
            setLoading(false);
        };
        load();
    }, []);

    const setInquiryStatus = async (row: PartnerInquiry, status: string) => {
        const { error } = await supabase.from("consultation_requests").update({ status }).eq("id", row.id);
        if (error) { toast.error("That did not save. Please try again."); return; }
        setInquiries((prev) => prev.map((r) => (r.id === row.id ? { ...r, status } : r)));
    };

    const setContactStatus = async (row: ContactMessage, status: string) => {
        const { error } = await supabase.from("contact_messages").update({ status }).eq("id", row.id);
        if (error) { toast.error("That did not save. Please try again."); return; }
        setContacts((prev) => prev.map((r) => (r.id === row.id ? { ...r, status } : r)));
    };

    // Delete confirmation: { table, id, label } — one dialog serves both tabs.
    const [toDelete, setToDelete] = useState<{ table: "consultation_requests" | "contact_messages"; id: string; label: string } | null>(null);
    const confirmDelete = async () => {
        if (!toDelete) return;
        const { table, id } = toDelete;
        const { error } = await supabase.from(table).delete().eq("id", id);
        if (error) { toast.error("Could not delete. Please try again."); setToDelete(null); return; }
        if (table === "consultation_requests") setInquiries((prev) => prev.filter((r) => r.id !== id));
        else setContacts((prev) => prev.filter((r) => r.id !== id));
        toast.success("Deleted.");
        setToDelete(null);
    };

    const filteredInquiries = useMemo(() => {
        const q = pSearch.trim().toLowerCase();
        const list = inquiries.filter((r) => {
            if (pKind !== "all" && (r.kind || "other") !== pKind) return false;
            if (pStatus !== "all" && r.status !== pStatus) return false;
            if (!q) return true;
            return (r.name || "").toLowerCase().includes(q)
                || (r.email || "").toLowerCase().includes(q)
                || (r.company_name || "").toLowerCase().includes(q)
                || (r.focus || "").toLowerCase().includes(q)
                || (r.message || "").toLowerCase().includes(q);
        });
        const t = (r: PartnerInquiry) => new Date(r.created_at).getTime() || 0;
        return pSort === "oldest" ? [...list].sort((a, b) => t(a) - t(b)) : list; // newest = query order
    }, [inquiries, pSearch, pKind, pStatus, pSort]);

    const filteredContacts = useMemo(() => {
        const q = cSearch.trim().toLowerCase();
        const list = contacts.filter((r) => {
            if (cStatus !== "all" && r.status !== cStatus) return false;
            if (!q) return true;
            return (r.name || "").toLowerCase().includes(q)
                || (r.email || "").toLowerCase().includes(q)
                || (r.subject || "").toLowerCase().includes(q)
                || (r.message || "").toLowerCase().includes(q);
        });
        const t = (r: ContactMessage) => new Date(r.created_at).getTime() || 0;
        return cSort === "oldest" ? [...list].sort((a, b) => t(a) - t(b)) : list;
    }, [contacts, cSearch, cStatus, cSort]);

    const pPageCount = Math.max(1, Math.ceil(filteredInquiries.length / PAGE_SIZE));
    const pCurrent = Math.min(pPage, pPageCount);
    const pagedInquiries = filteredInquiries.slice((pCurrent - 1) * PAGE_SIZE, pCurrent * PAGE_SIZE);

    const cPageCount = Math.max(1, Math.ceil(filteredContacts.length / PAGE_SIZE));
    const cCurrent = Math.min(cPage, cPageCount);
    const pagedContacts = filteredContacts.slice((cCurrent - 1) * PAGE_SIZE, cCurrent * PAGE_SIZE);

    const pendingInquiries = inquiries.filter((r) => r.status === "pending").length;
    const pendingContacts = contacts.filter((r) => r.status === "pending").length;

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Loading inquiries…</span>
            </div>
        );
    }

    return (
        <div className="px-4 md:px-8 py-8 md:py-10 max-w-7xl mx-auto space-y-6 md:space-y-8">
            {/* Header band */}
            <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-6 md:p-8">
                <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
                <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-brand-200/20 blur-3xl" />
                <div className="relative space-y-1.5">
                    <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Inquiries</h1>
                    <p className="text-muted-foreground">
                        Partner requests from the campus and team forms, plus contact messages from the site.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="partners" className="space-y-6">
                <TabsList className="h-auto flex-wrap gap-1">
                    <TabsTrigger value="partners" className="min-h-[40px]">
                        Partner inquiries
                        <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-xs font-semibold tabular-nums">
                            {pendingInquiries} new
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="contacts" className="min-h-[40px]">
                        Contact messages
                        <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-xs font-semibold tabular-nums">
                            {pendingContacts} new
                        </span>
                    </TabsTrigger>
                </TabsList>

                {/* ── Partner inquiries ── */}
                <TabsContent value="partners" className="space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                            <Input value={pSearch} onChange={(e) => setPSearch(e.target.value)} placeholder="Search by name, email, company or message" className="h-10 rounded-xl pl-9" />
                        </div>
                        <Select value={pKind} onValueChange={setPKind}>
                            <SelectTrigger className="h-10 w-full rounded-xl sm:w-[140px]" aria-label="Filter by kind"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All kinds</SelectItem>
                                <SelectItem value="college">Campus</SelectItem>
                                <SelectItem value="corporate">Team</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={pStatus} onValueChange={setPStatus}>
                            <SelectTrigger className="h-10 w-full rounded-xl sm:w-[140px]" aria-label="Filter by status"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                <SelectItem value="pending">New</SelectItem>
                                <SelectItem value="approved">Handled</SelectItem>
                                <SelectItem value="rejected">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={pSort} onValueChange={setPSort}>
                            <SelectTrigger className="h-10 w-full rounded-xl sm:w-[140px]" aria-label="Sort inquiries"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Newest first</SelectItem>
                                <SelectItem value="oldest">Oldest first</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {filteredInquiries.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                            {inquiries.length === 0
                                ? "No partner inquiries yet. Campus and team form submissions will show up here."
                                : "No inquiries match your search."}
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {pagedInquiries.map((r) => (
                                <div key={r.id} className="rounded-xl border border-border bg-background odd:bg-brand-50/30 odd:border-brand-100 p-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1 space-y-1">
                                            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                                                <span className="truncate">{r.name}</span>
                                                <span className="inline-flex items-center rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                                                    {KIND_LABELS[r.kind || "other"] || r.kind}
                                                </span>
                                                {r.company_name && (
                                                    <span className="text-xs font-normal text-muted-foreground">· {r.company_name}</span>
                                                )}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                <a href={`mailto:${r.email}`} className="hover:text-primary hover:underline">{r.email}</a>
                                                {r.phone ? ` · ${r.phone}` : ""}
                                                {r.role ? ` · ${r.role}` : ""}
                                                {r.headcount ? ` · ${r.headcount} people` : ""}
                                                {r.focus ? ` · Focus: ${r.focus}` : ""}
                                                {` · ${formatDate(r.created_at)}`}
                                            </p>
                                            {r.message && <p className="text-sm text-foreground">{r.message}</p>}
                                        </div>
                                        <div className="flex shrink-0 items-center gap-3">
                                            <StatusPill status={r.status} />
                                            {r.status === "pending" ? (
                                                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setInquiryStatus(r, "approved")}>
                                                    Mark handled
                                                </Button>
                                            ) : (
                                                <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => setInquiryStatus(r, "pending")}>
                                                    Reopen
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-destructive hover:text-destructive-foreground" aria-label="Delete inquiry" onClick={() => setToDelete({ table: "consultation_requests", id: r.id, label: r.name || r.email || "this inquiry" })}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <ListPager page={pCurrent} pageCount={pPageCount} onPageChange={setPPage} />
                        </div>
                    )}
                </TabsContent>

                {/* ── Contact messages ── */}
                <TabsContent value="contacts" className="space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                            <Input value={cSearch} onChange={(e) => setCSearch(e.target.value)} placeholder="Search by name, email, subject or message" className="h-10 rounded-xl pl-9" />
                        </div>
                        <Select value={cStatus} onValueChange={setCStatus}>
                            <SelectTrigger className="h-10 w-full rounded-xl sm:w-[140px]" aria-label="Filter by status"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                <SelectItem value="pending">New</SelectItem>
                                <SelectItem value="approved">Handled</SelectItem>
                                <SelectItem value="rejected">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={cSort} onValueChange={setCSort}>
                            <SelectTrigger className="h-10 w-full rounded-xl sm:w-[140px]" aria-label="Sort messages"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Newest first</SelectItem>
                                <SelectItem value="oldest">Oldest first</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {filteredContacts.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                            {contacts.length === 0
                                ? "No contact messages yet. Contact form submissions will show up here."
                                : "No messages match your search."}
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {pagedContacts.map((r) => (
                                <div key={r.id} className="rounded-xl border border-border bg-background odd:bg-brand-50/30 odd:border-brand-100 p-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1 space-y-1">
                                            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                                                <span className="truncate">{r.name}</span>
                                                {r.subject && (
                                                    <span className="text-xs font-normal text-muted-foreground">· {r.subject}</span>
                                                )}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                <a href={`mailto:${r.email}`} className="hover:text-primary hover:underline">{r.email}</a>
                                                {` · ${formatDate(r.created_at)}`}
                                            </p>
                                            <p className="text-sm text-foreground">{r.message}</p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-3">
                                            <StatusPill status={r.status} />
                                            {r.status === "pending" ? (
                                                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setContactStatus(r, "approved")}>
                                                    Mark handled
                                                </Button>
                                            ) : (
                                                <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => setContactStatus(r, "pending")}>
                                                    Reopen
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-destructive hover:text-destructive-foreground" aria-label="Delete message" onClick={() => setToDelete({ table: "contact_messages", id: r.id, label: r.name || r.email || "this message" })}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <ListPager page={cCurrent} pageCount={cPageCount} onPageChange={setCPage} />
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-display tracking-tight">Delete this permanently?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {toDelete ? `“${toDelete.label}” will be removed for good. Use “Mark handled” instead if you just want it out of the way.` : ""}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Keep it</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
