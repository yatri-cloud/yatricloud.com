import { useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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
import { supabase } from "@/lib/supabase";
import ScrollReveal from "@/components/ScrollReveal";

/* ------------------------------------------------------------------ */
/* Types — local copies of the shared mentorship types.                */
/* src/lib/mentorship.ts is being authored in a parallel batch; the    */
/* integration pass swaps these for imports once both land.            */
/* ------------------------------------------------------------------ */

interface MentorOption {
    id: string;
    name: string;
    slug: string;
}

interface ServiceQuestion {
    label: string;
    required: boolean;
    type: "text";
}

interface MentorshipService {
    id: string;
    mentor_id: string;
    slug: string;
    type: string;
    title: string;
    short_description: string;
    description: string;
    price: number;
    compare_at_price: number | null;
    currency: string;
    duration_min: number | null;
    sessions_count: number;
    webinar_start_at: string | null;
    capacity: number | null;
    cta_label: string;
    badge: string | null;
    cover_url: string | null;
    questions: ServiceQuestion[];
    sort_order: number;
    status: string;
}

interface ServiceFormState {
    mentor_id: string;
    title: string;
    slug: string;
    slugTouched: boolean;
    type: string;
    short_description: string;
    description: string;
    price: string;
    compare_at_price: string;
    currency: string;
    duration_min: string;
    sessions_count: string;
    webinar_start_at: string;
    capacity: string;
    cta_label: string;
    badge: string;
    cover_url: string;
    questions: { label: string; required: boolean }[];
    sort_order: string;
    status: string;
    delivery_url: string;
    meeting_link: string;
}

const EMPTY_FORM: ServiceFormState = {
    mentor_id: "",
    title: "",
    slug: "",
    slugTouched: false,
    type: "call",
    short_description: "",
    description: "",
    price: "",
    compare_at_price: "",
    currency: "INR",
    duration_min: "30",
    sessions_count: "1",
    webinar_start_at: "",
    capacity: "",
    cta_label: "Book Now",
    badge: "none",
    cover_url: "",
    questions: [],
    sort_order: "0",
    status: "published",
    delivery_url: "",
    meeting_link: "",
};

const TYPE_LABELS: Record<string, string> = {
    call: "1 on 1 call",
    package: "Package",
    digital: "Digital product",
    webinar: "Webinar",
};

const kebabCase = (text: string) =>
    text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

/** ISO timestamp → value for a datetime-local input, in local time. */
const isoToLocalInput = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const localInputToIso = (value: string) => {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const formatPrice = (amount: number, currency: string) =>
    `${currency === "INR" ? "₹" : `${currency} `}${amount.toLocaleString("en-IN")}`;

const FieldLabel = ({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) => (
    <Label htmlFor={htmlFor} className="text-sm font-medium">
        {children}
    </Label>
);

const saveButtonClass =
    "min-h-[44px] rounded-xl bg-primary hover:bg-brand-600 text-primary-foreground font-semibold shadow-inset-btn";

const deleteIconButtonClass =
    "h-10 w-10 rounded-xl text-destructive border-destructive/20 hover:bg-destructive hover:text-destructive-foreground";

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const AdminMentorshipServices = () => {
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [mentors, setMentors] = useState<MentorOption[]>([]);
    const [services, setServices] = useState<MentorshipService[]>([]);

    // Filters
    const [mentorFilter, setMentorFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    // Add or edit dialog
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [hadSecrets, setHadSecrets] = useState(false);
    const [form, setForm] = useState<ServiceFormState>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    // Delete confirm
    const [serviceToDelete, setServiceToDelete] = useState<MentorshipService | null>(null);
    const [deleting, setDeleting] = useState(false);

    const mentorName = (id: string) => mentors.find((m) => m.id === id)?.name ?? "Unknown mentor";

    /* --------------------------- toasts --------------------------- */

    const saveDone = () => toast({ title: "Saved", description: "The change is live." });

    const saveFailed = () =>
        toast({ title: "That did not save", description: "Please try again.", variant: "destructive" });

    /* ---------------------------- load ---------------------------- */

    const loadServices = async () => {
        const { data, error } = await supabase
            .from("mentorship_services")
            .select(
                "id, mentor_id, slug, type, title, short_description, description, price, compare_at_price, currency, duration_min, sessions_count, webinar_start_at, capacity, cta_label, badge, cover_url, questions, sort_order, status"
            )
            .order("mentor_id", { ascending: true })
            .order("sort_order", { ascending: true });
        if (error) {
            console.error("Failed to load services", error);
            toast({
                title: "Could not load services",
                description: "Please refresh the page and try again.",
                variant: "destructive",
            });
            return;
        }
        setServices(
            (data ?? []).map((row: any) => ({
                id: row.id,
                mentor_id: row.mentor_id,
                slug: row.slug ?? "",
                type: row.type ?? "call",
                title: row.title ?? "",
                short_description: row.short_description ?? "",
                description: row.description ?? "",
                price: Number(row.price ?? 0),
                compare_at_price: row.compare_at_price === null ? null : Number(row.compare_at_price),
                currency: row.currency ?? "INR",
                duration_min: row.duration_min ?? null,
                sessions_count: row.sessions_count ?? 1,
                webinar_start_at: row.webinar_start_at ?? null,
                capacity: row.capacity ?? null,
                cta_label: row.cta_label ?? "Book Now",
                badge: row.badge ?? null,
                cover_url: row.cover_url ?? null,
                questions: Array.isArray(row.questions) ? row.questions : [],
                sort_order: row.sort_order ?? 0,
                status: row.status ?? "published",
            }))
        );
    };

    useEffect(() => {
        const init = async () => {
            const { data } = await supabase
                .from("mentors")
                .select("id, name, slug")
                .order("sort_order", { ascending: true });
            setMentors(
                (data ?? []).map((row: any) => ({
                    id: row.id,
                    name: row.name ?? "",
                    slug: row.slug ?? "",
                }))
            );
            await loadServices();
            setLoading(false);
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredServices = useMemo(
        () =>
            services.filter(
                (s) =>
                    (mentorFilter === "all" || s.mentor_id === mentorFilter) &&
                    (typeFilter === "all" || s.type === typeFilter) &&
                    (statusFilter === "all" || s.status === statusFilter)
            ),
        [services, mentorFilter, typeFilter, statusFilter]
    );

    /* --------------------------- dialog --------------------------- */

    const openAdd = () => {
        setEditingId(null);
        setHadSecrets(false);
        setForm({
            ...EMPTY_FORM,
            mentor_id: mentorFilter !== "all" ? mentorFilter : mentors[0]?.id ?? "",
        });
        setDialogOpen(true);
    };

    const openEdit = async (service: MentorshipService) => {
        setEditingId(service.id);
        setForm({
            mentor_id: service.mentor_id,
            title: service.title,
            slug: service.slug,
            slugTouched: true,
            type: service.type,
            short_description: service.short_description,
            description: service.description,
            price: String(service.price),
            compare_at_price: service.compare_at_price === null ? "" : String(service.compare_at_price),
            currency: service.currency,
            duration_min: service.duration_min === null ? "" : String(service.duration_min),
            sessions_count: String(service.sessions_count),
            webinar_start_at: isoToLocalInput(service.webinar_start_at),
            capacity: service.capacity === null ? "" : String(service.capacity),
            cta_label: service.cta_label,
            badge: service.badge ?? "none",
            cover_url: service.cover_url ?? "",
            questions: (service.questions ?? []).map((q) => ({
                label: q.label ?? "",
                required: q.required === true,
            })),
            sort_order: String(service.sort_order),
            status: service.status,
            delivery_url: "",
            meeting_link: "",
        });
        setHadSecrets(false);
        setDialogOpen(true);
        // Secrets live in their own table so buyers only see them via RLS.
        const { data } = await supabase
            .from("mentorship_service_secrets")
            .select("delivery_url, meeting_link")
            .eq("service_id", service.id)
            .maybeSingle();
        if (data) {
            setHadSecrets(true);
            setForm((prev) => ({
                ...prev,
                delivery_url: data.delivery_url ?? "",
                meeting_link: data.meeting_link ?? "",
            }));
        }
    };

    const updateTitle = (title: string) => {
        setForm((prev) => ({
            ...prev,
            title,
            slug: prev.slugTouched ? prev.slug : kebabCase(title),
        }));
    };

    const saveService = async () => {
        const title = form.title.trim();
        const slug = form.slug.trim();
        const price = Number.parseFloat(form.price);
        if (!form.mentor_id || !title || !slug || Number.isNaN(price) || price < 0) {
            toast({
                title: "Almost there",
                description: "Please pick a mentor and fill in the title, slug and a valid price.",
                variant: "destructive",
            });
            return;
        }
        const compare = form.compare_at_price.trim()
            ? Number.parseFloat(form.compare_at_price)
            : null;
        if (compare !== null && (Number.isNaN(compare) || compare <= price)) {
            toast({
                title: "Check the compare price",
                description: "The compare at price must be higher than the price, or left empty.",
                variant: "destructive",
            });
            return;
        }

        setSaving(true);
        const payload = {
            mentor_id: form.mentor_id,
            slug,
            type: form.type,
            title,
            short_description: form.short_description.trim(),
            description: form.description.trim(),
            price,
            compare_at_price: compare,
            currency: form.currency.trim() || "INR",
            duration_min: form.duration_min.trim() ? Number.parseInt(form.duration_min, 10) : null,
            sessions_count: Number.parseInt(form.sessions_count, 10) || 1,
            webinar_start_at: form.type === "webinar" ? localInputToIso(form.webinar_start_at) : null,
            capacity: form.capacity.trim() ? Number.parseInt(form.capacity, 10) : null,
            cta_label: form.cta_label.trim() || "Book Now",
            badge: form.badge === "none" ? null : form.badge,
            cover_url: form.cover_url.trim() || null,
            questions: form.questions
                .filter((q) => q.label.trim())
                .map((q) => ({ label: q.label.trim(), required: q.required, type: "text" })),
            sort_order: Number.parseInt(form.sort_order, 10) || 0,
            status: form.status,
        };

        let serviceId = editingId;
        if (editingId) {
            const { error } = await supabase
                .from("mentorship_services")
                .update(payload)
                .eq("id", editingId);
            if (error) {
                setSaving(false);
                return saveFailed();
            }
        } else {
            const { data, error } = await supabase
                .from("mentorship_services")
                .insert(payload)
                .select("id")
                .single();
            if (error || !data) {
                setSaving(false);
                return saveFailed();
            }
            serviceId = data.id;
        }

        // Private delivery details (secrets table, buyer gated by RLS).
        const deliveryUrl = form.delivery_url.trim();
        const meetingLink = form.meeting_link.trim();
        if (serviceId) {
            if (deliveryUrl || meetingLink) {
                const { error } = await supabase.from("mentorship_service_secrets").upsert({
                    service_id: serviceId,
                    delivery_url: deliveryUrl || null,
                    meeting_link: meetingLink || null,
                });
                if (error) {
                    setSaving(false);
                    return saveFailed();
                }
            } else if (hadSecrets) {
                await supabase
                    .from("mentorship_service_secrets")
                    .delete()
                    .eq("service_id", serviceId);
            }
        }

        setSaving(false);
        setDialogOpen(false);
        await loadServices();
        saveDone();
    };

    const toggleStatus = async (service: MentorshipService, published: boolean) => {
        const status = published ? "published" : "draft";
        setServices((prev) => prev.map((s) => (s.id === service.id ? { ...s, status } : s)));
        const { error } = await supabase
            .from("mentorship_services")
            .update({ status })
            .eq("id", service.id);
        if (error) {
            setServices((prev) =>
                prev.map((s) => (s.id === service.id ? { ...s, status: service.status } : s))
            );
            return saveFailed();
        }
        saveDone();
    };

    const confirmDelete = async () => {
        if (!serviceToDelete) return;
        setDeleting(true);
        const { error } = await supabase
            .from("mentorship_services")
            .delete()
            .eq("id", serviceToDelete.id);
        setDeleting(false);
        if (error) {
            setServiceToDelete(null);
            toast({
                title: "Could not delete this service",
                description: "Services with bookings cannot be deleted. Unpublish it instead.",
                variant: "destructive",
            });
            return;
        }
        setServices((prev) => prev.filter((s) => s.id !== serviceToDelete.id));
        setServiceToDelete(null);
        toast({
            title: "Service removed",
            description: "Yatris can no longer book it.",
        });
    };

    /* -------------------------- questions -------------------------- */

    const addQuestion = () =>
        setForm((prev) => ({
            ...prev,
            questions: [...prev.questions, { label: "", required: false }],
        }));

    const updateQuestion = (index: number, patch: Partial<{ label: string; required: boolean }>) =>
        setForm((prev) => ({
            ...prev,
            questions: prev.questions.map((q, i) => (i === index ? { ...q, ...patch } : q)),
        }));

    const removeQuestion = (index: number) =>
        setForm((prev) => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== index),
        }));

    /* ----------------------------- view --------------------------- */

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Loading mentorship services…</span>
            </div>
        );
    }

    const showsSlots = form.type === "call" || form.type === "package" || form.type === "webinar";

    return (
        <div className="px-4 md:px-8 py-8 md:py-10">
            <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
                {/* Header band */}
                <ScrollReveal>
                    <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-6 md:p-8">
                        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
                        <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-brand-200/20 blur-3xl" />

                        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                            <div className="space-y-1.5">
                                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Mentorship
                                </p>
                                <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">
                                    Mentorship <span className="gradient-text">Services</span>
                                </h1>
                                <p className="text-muted-foreground">
                                    Calls, packages, digital products and webinars across every mentor. Every save goes live right away.
                                </p>
                            </div>
                            <Button onClick={openAdd} disabled={mentors.length === 0} className={saveButtonClass}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add service
                            </Button>
                        </div>
                    </div>
                </ScrollReveal>

                <ScrollReveal delay={0.05}>
                    <div className="bg-card border border-brand-100 rounded-2xl p-5 md:p-6 shadow-card">
                        <div className="-mx-5 md:-mx-6 -mt-5 md:-mt-6 mb-5 rounded-t-2xl border-b border-brand-100 bg-gradient-to-r from-brand-50 to-transparent px-5 md:px-6 py-4">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Catalog</p>
                            <h2 className="mt-0.5 font-display text-lg font-bold tracking-tight text-foreground">Services</h2>
                            <p className="text-sm text-muted-foreground">
                                {filteredServices.length} of {services.length} services shown.
                            </p>
                        </div>

                        {/* Filters */}
                        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="space-y-1.5">
                                <FieldLabel htmlFor="filter-mentor">Mentor</FieldLabel>
                                <Select value={mentorFilter} onValueChange={setMentorFilter}>
                                    <SelectTrigger id="filter-mentor" className="min-h-[44px] rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All mentors</SelectItem>
                                        {mentors.map((m) => (
                                            <SelectItem key={m.id} value={m.id}>
                                                {m.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <FieldLabel htmlFor="filter-type">Type</FieldLabel>
                                <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger id="filter-type" className="min-h-[44px] rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All types</SelectItem>
                                        {Object.entries(TYPE_LABELS).map(([value, label]) => (
                                            <SelectItem key={value} value={value}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <FieldLabel htmlFor="filter-status">Status</FieldLabel>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger id="filter-status" className="min-h-[44px] rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All statuses</SelectItem>
                                        <SelectItem value="published">Published</SelectItem>
                                        <SelectItem value="draft">Draft</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {filteredServices.length === 0 ? (
                            <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                                {services.length === 0
                                    ? "No services yet. Add the first one and Yatris can start booking."
                                    : "Nothing matches those filters. Try widening them."}
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {filteredServices.map((service) => (
                                    <div
                                        key={service.id}
                                        className="rounded-xl border border-border bg-background odd:bg-brand-50/30 odd:border-brand-100 hover:bg-brand-50/50 transition-colors p-3 md:p-4"
                                    >
                                        <div className="flex flex-wrap items-center gap-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                                                    <span className="truncate">{service.title}</span>
                                                    <span className="inline-flex items-center rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                                                        {TYPE_LABELS[service.type] ?? service.type}
                                                    </span>
                                                    {service.badge && (
                                                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                                            {service.badge}
                                                        </span>
                                                    )}
                                                    {service.status !== "published" && (
                                                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                                                            Draft
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {mentorName(service.mentor_id)} · /{service.slug}
                                                    {service.duration_min ? ` · ${service.duration_min} min` : ""}
                                                    {service.sessions_count > 1 ? ` · ${service.sessions_count} sessions` : ""}
                                                </p>
                                                <p className="text-sm">
                                                    <span className="font-semibold text-foreground">
                                                        {formatPrice(service.price, service.currency)}
                                                    </span>
                                                    {service.compare_at_price !== null && (
                                                        <span className="ml-2 text-xs text-muted-foreground line-through">
                                                            {formatPrice(service.compare_at_price, service.currency)}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Switch
                                                    checked={service.status === "published"}
                                                    onCheckedChange={(checked) => toggleStatus(service, checked)}
                                                    aria-label={`${service.title} is live on the site`}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEdit(service)}
                                                    aria-label={`Edit ${service.title}`}
                                                    className="h-10 w-10 rounded-xl text-muted-foreground hover:text-primary"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => setServiceToDelete(service)}
                                                    aria-label={`Delete ${service.title}`}
                                                    className={deleteIconButtonClass}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </ScrollReveal>
            </div>

            {/* ── Add or edit service dialog ── */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-display tracking-tight">
                            {editingId ? "Edit service" : "Add a service"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingId
                                ? "Update the details and save. Changes go live right away."
                                : "Fill in the details below and Yatris can book it right away."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5">
                        {/* Basics */}
                        <div className="space-y-4">
                            <p className="border-b border-brand-100 pb-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
                                Basics
                            </p>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <FieldLabel htmlFor="service-mentor">Mentor</FieldLabel>
                                    <Select
                                        value={form.mentor_id}
                                        onValueChange={(value) => setForm({ ...form, mentor_id: value })}
                                    >
                                        <SelectTrigger id="service-mentor" className="min-h-[44px] rounded-xl">
                                            <SelectValue placeholder="Pick a mentor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {mentors.map((m) => (
                                                <SelectItem key={m.id} value={m.id}>
                                                    {m.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <FieldLabel htmlFor="service-type">Type</FieldLabel>
                                    <Select
                                        value={form.type}
                                        onValueChange={(value) => setForm({ ...form, type: value })}
                                    >
                                        <SelectTrigger id="service-type" className="min-h-[44px] rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(TYPE_LABELS).map(([value, label]) => (
                                                <SelectItem key={value} value={value}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <FieldLabel htmlFor="service-title">Title</FieldLabel>
                                    <Input
                                        id="service-title"
                                        className="min-h-[44px] rounded-xl"
                                        placeholder="1 on 1 Career Guidance Call"
                                        value={form.title}
                                        onChange={(e) => updateTitle(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <FieldLabel htmlFor="service-slug">Slug (unique per mentor)</FieldLabel>
                                    <Input
                                        id="service-slug"
                                        className="min-h-[44px] rounded-xl font-mono text-sm"
                                        value={form.slug}
                                        onChange={(e) =>
                                            setForm((prev) => ({ ...prev, slug: e.target.value, slugTouched: true }))
                                        }
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <FieldLabel htmlFor="service-short">Short description (shown on cards)</FieldLabel>
                                <Input
                                    id="service-short"
                                    className="min-h-[44px] rounded-xl"
                                    value={form.short_description}
                                    onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <FieldLabel htmlFor="service-description">Full description</FieldLabel>
                                <Textarea
                                    id="service-description"
                                    className="min-h-[100px] rounded-xl"
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <FieldLabel htmlFor="service-cover">Cover image URL</FieldLabel>
                                <Input
                                    id="service-cover"
                                    className="min-h-[44px] rounded-xl"
                                    value={form.cover_url}
                                    onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Pricing and presentation */}
                        <div className="space-y-4">
                            <p className="border-b border-brand-100 pb-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
                                Pricing and presentation
                            </p>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div className="space-y-2">
                                    <FieldLabel htmlFor="service-price">Price</FieldLabel>
                                    <Input
                                        id="service-price"
                                        type="number"
                                        min={0}
                                        className="min-h-[44px] rounded-xl"
                                        placeholder="499"
                                        value={form.price}
                                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <FieldLabel htmlFor="service-compare">Compare at price (slash pricing)</FieldLabel>
                                    <Input
                                        id="service-compare"
                                        type="number"
                                        min={0}
                                        className="min-h-[44px] rounded-xl"
                                        placeholder="999"
                                        value={form.compare_at_price}
                                        onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <FieldLabel htmlFor="service-currency">Currency</FieldLabel>
                                    <Input
                                        id="service-currency"
                                        className="min-h-[44px] rounded-xl font-mono text-sm"
                                        value={form.currency}
                                        onChange={(e) => setForm({ ...form, currency: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div className="space-y-2">
                                    <FieldLabel htmlFor="service-badge">Badge</FieldLabel>
                                    <Select
                                        value={form.badge}
                                        onValueChange={(value) => setForm({ ...form, badge: value })}
                                    >
                                        <SelectTrigger id="service-badge" className="min-h-[44px] rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No badge</SelectItem>
                                            <SelectItem value="Popular">Popular</SelectItem>
                                            <SelectItem value="Best Seller">Best Seller</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <FieldLabel htmlFor="service-cta">Button label</FieldLabel>
                                    <Input
                                        id="service-cta"
                                        className="min-h-[44px] rounded-xl"
                                        value={form.cta_label}
                                        onChange={(e) => setForm({ ...form, cta_label: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <FieldLabel htmlFor="service-sort">Sort order</FieldLabel>
                                    <Input
                                        id="service-sort"
                                        type="number"
                                        className="min-h-[44px] rounded-xl"
                                        value={form.sort_order}
                                        onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sessions */}
                        {showsSlots && (
                            <div className="space-y-4">
                                <p className="border-b border-brand-100 pb-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
                                    Sessions
                                </p>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <FieldLabel htmlFor="service-duration">Duration (minutes)</FieldLabel>
                                        <Input
                                            id="service-duration"
                                            type="number"
                                            min={0}
                                            className="min-h-[44px] rounded-xl"
                                            value={form.duration_min}
                                            onChange={(e) => setForm({ ...form, duration_min: e.target.value })}
                                        />
                                    </div>
                                    {form.type === "package" && (
                                        <div className="space-y-2">
                                            <FieldLabel htmlFor="service-sessions">Sessions in the package</FieldLabel>
                                            <Input
                                                id="service-sessions"
                                                type="number"
                                                min={1}
                                                className="min-h-[44px] rounded-xl"
                                                value={form.sessions_count}
                                                onChange={(e) => setForm({ ...form, sessions_count: e.target.value })}
                                            />
                                        </div>
                                    )}
                                    {form.type === "webinar" && (
                                        <>
                                            <div className="space-y-2">
                                                <FieldLabel htmlFor="service-webinar-start">Webinar start</FieldLabel>
                                                <Input
                                                    id="service-webinar-start"
                                                    type="datetime-local"
                                                    className="min-h-[44px] rounded-xl"
                                                    value={form.webinar_start_at}
                                                    onChange={(e) => setForm({ ...form, webinar_start_at: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <FieldLabel htmlFor="service-capacity">Capacity (seats)</FieldLabel>
                                                <Input
                                                    id="service-capacity"
                                                    type="number"
                                                    min={1}
                                                    className="min-h-[44px] rounded-xl"
                                                    value={form.capacity}
                                                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Intake questions */}
                        <div className="space-y-4">
                            <p className="border-b border-brand-100 pb-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
                                Intake questions (asked at checkout)
                            </p>
                            {form.questions.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    No questions yet. Add one and buyers will answer it while booking.
                                </p>
                            )}
                            <div className="space-y-2">
                                {form.questions.map((question, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Input
                                            className="min-h-[44px] flex-1 rounded-xl"
                                            placeholder="What would you like to focus on?"
                                            aria-label={`Question ${index + 1}`}
                                            value={question.label}
                                            onChange={(e) => updateQuestion(index, { label: e.target.value })}
                                        />
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={question.required}
                                                onCheckedChange={(checked) => updateQuestion(index, { required: checked })}
                                                aria-label={`Question ${index + 1} is required`}
                                            />
                                            <span className="hidden sm:block text-xs text-muted-foreground">Required</span>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => removeQuestion(index)}
                                            aria-label={`Remove question ${index + 1}`}
                                            className={deleteIconButtonClass}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button variant="outline" onClick={addQuestion} className="min-h-[44px] rounded-xl">
                                <Plus className="mr-2 h-4 w-4" />
                                Add question
                            </Button>
                        </div>

                        {/* Private delivery */}
                        <div className="space-y-4">
                            <p className="border-b border-brand-100 pb-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
                                Private delivery (buyers see these after payment)
                            </p>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <FieldLabel htmlFor="service-delivery">Delivery URL (digital products)</FieldLabel>
                                    <Input
                                        id="service-delivery"
                                        className="min-h-[44px] rounded-xl"
                                        placeholder="https://…"
                                        value={form.delivery_url}
                                        onChange={(e) => setForm({ ...form, delivery_url: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <FieldLabel htmlFor="service-meeting">Default meeting link (calls and webinars)</FieldLabel>
                                    <Input
                                        id="service-meeting"
                                        className="min-h-[44px] rounded-xl"
                                        placeholder="https://meet.google.com/…"
                                        value={form.meeting_link}
                                        onChange={(e) => setForm({ ...form, meeting_link: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Visibility */}
                        <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                            <Switch
                                id="service-form-published"
                                checked={form.status === "published"}
                                onCheckedChange={(checked) =>
                                    setForm({ ...form, status: checked ? "published" : "draft" })
                                }
                                aria-label="Publish this service on the site"
                            />
                            <Label htmlFor="service-form-published" className="text-sm font-medium">
                                {form.status === "published" ? "Published" : "Draft (hidden)"}
                            </Label>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setDialogOpen(false)} className="min-h-[44px] rounded-xl">
                            Cancel
                        </Button>
                        <Button onClick={saveService} disabled={saving} className={saveButtonClass}>
                            {saving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            {editingId ? "Save service" : "Add service"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Delete service confirm ── */}
            <AlertDialog
                open={serviceToDelete !== null}
                onOpenChange={(open) => {
                    if (!open) setServiceToDelete(null);
                }}
            >
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-display tracking-tight">
                            Delete {serviceToDelete?.title ?? "this service"}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Yatris will no longer be able to book it. Existing bookings keep their records. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="min-h-[44px] rounded-xl">Keep it</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={deleting}
                            className="min-h-[44px] rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            Delete service
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default AdminMentorshipServices;
