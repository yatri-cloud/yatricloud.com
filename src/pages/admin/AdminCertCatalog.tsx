import { useEffect, useMemo, useState } from "react";
import {
    ArrowDown,
    ArrowUp,
    Loader2,
    Pencil,
    Plus,
    Save,
    Search,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import ScrollReveal from "@/components/ScrollReveal";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface ProviderRow {
    id: string;
    slug: string;
    label: string;
    logo_url: string;
    logo_light_url: string;
    brand_color: string;
    blurb: string;
    cert_count: number;
    show_on_home: boolean;
    show_in_forms: boolean;
    sort_order: number;
    active: boolean;
}

interface CertRow {
    id: string;
    provider_slug: string;
    value: string;
    label: string;
    exam_code: string;
    level: string;
    sort_order: number;
    active: boolean;
}

/** Level grouping for the certification list — the "table of contents" order.
 *  Superset across providers: Microsoft uses fundamentals/associate/expert,
 *  AWS uses foundational/associate/professional/specialty. Each provider only
 *  shows the levels it actually uses. */
const LEVEL_ORDER = [
    "fundamentals",
    "foundational",
    "associate",
    "professional",
    "expert",
    "specialty",
    "business",
] as const;
const LEVEL_LABELS: Record<string, string> = {
    fundamentals: "Fundamentals",
    foundational: "Foundational",
    associate: "Associate",
    professional: "Professional",
    expert: "Expert",
    specialty: "Specialty",
    business: "Business",
};
const levelRank = (level: string) => {
    const i = LEVEL_ORDER.indexOf(level as (typeof LEVEL_ORDER)[number]);
    return i === -1 ? LEVEL_ORDER.length : i;
};

interface ProviderFormState {
    slug: string;
    label: string;
    logo_url: string;
    logo_light_url: string;
    brand_color: string;
    blurb: string;
    cert_count: string;
    show_on_home: boolean;
    show_in_forms: boolean;
}

interface CertFormState {
    label: string;
    exam_code: string;
    value: string;
    level: string;
    valueTouched: boolean;
}

const EMPTY_PROVIDER_FORM: ProviderFormState = {
    slug: "",
    label: "",
    logo_url: "",
    logo_light_url: "",
    brand_color: "",
    blurb: "",
    cert_count: "0",
    show_on_home: false,
    show_in_forms: false,
};

const EMPTY_CERT_FORM: CertFormState = {
    label: "",
    exam_code: "",
    value: "",
    level: "",
    valueTouched: false,
};

const kebabCase = (text: string) =>
    text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

/* ------------------------------------------------------------------ */
/* Small presentational helpers (match the admin design system)        */
/* ------------------------------------------------------------------ */

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

const AdminCertCatalog = () => {
    const { toast } = useToast();

    const [loadingProviders, setLoadingProviders] = useState(true);
    const [loadingCerts, setLoadingCerts] = useState(false);
    const [providers, setProviders] = useState<ProviderRow[]>([]);
    const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
    const [certs, setCerts] = useState<CertRow[]>([]);
    const [certCounts, setCertCounts] = useState<Record<string, number>>({});
    const [search, setSearch] = useState("");
    const [levelFilter, setLevelFilter] = useState<string>("all");

    // Provider dialog (add or edit)
    const [providerDialogOpen, setProviderDialogOpen] = useState(false);
    const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
    const [providerForm, setProviderForm] = useState<ProviderFormState>(EMPTY_PROVIDER_FORM);
    const [savingProvider, setSavingProvider] = useState(false);
    const [providerToDelete, setProviderToDelete] = useState<ProviderRow | null>(null);
    const [deletingProvider, setDeletingProvider] = useState(false);

    // Certification editing
    const [addCertOpen, setAddCertOpen] = useState(false);
    const [newCert, setNewCert] = useState<CertFormState>(EMPTY_CERT_FORM);
    const [savingCert, setSavingCert] = useState(false);
    const [editingCertId, setEditingCertId] = useState<string | null>(null);
    const [editCertForm, setEditCertForm] = useState<CertFormState>(EMPTY_CERT_FORM);
    const [certToDelete, setCertToDelete] = useState<CertRow | null>(null);
    const [deletingCert, setDeletingCert] = useState(false);

    const selectedProvider = providers.find((p) => p.slug === selectedSlug) ?? null;

    /* --------------------------- toasts --------------------------- */

    const saveDone = () =>
        toast({
            title: "Saved",
            description: "The catalog is live.",
        });

    const saveFailed = () =>
        toast({
            title: "That did not save",
            description: "Please try again.",
            variant: "destructive",
        });

    /* ---------------------------- load ---------------------------- */

    const loadProviders = async () => {
        const { data, error } = await supabase
            .from("cert_providers")
            .select(
                "id, slug, label, logo_url, logo_light_url, brand_color, blurb, cert_count, show_on_home, show_in_forms, sort_order, active"
            )
            .order("sort_order", { ascending: true });
        if (error) {
            console.error("Failed to load providers", error);
            toast({
                title: "Could not load providers",
                description: "Please refresh the page and try again.",
                variant: "destructive",
            });
            return [] as ProviderRow[];
        }
        const rows: ProviderRow[] = (data ?? []).map((row: any) => ({
            id: row.id,
            slug: row.slug ?? "",
            label: row.label ?? "",
            logo_url: row.logo_url ?? "",
            logo_light_url: row.logo_light_url ?? "",
            brand_color: row.brand_color ?? "",
            blurb: row.blurb ?? "",
            cert_count: row.cert_count ?? 0,
            show_on_home: row.show_on_home === true,
            show_in_forms: row.show_in_forms === true,
            sort_order: row.sort_order ?? 0,
            active: row.active !== false,
        }));
        setProviders(rows);
        return rows;
    };

    // Real per-provider certification counts (the cert_providers.cert_count
    // column is a marketing figure and can be stale; the sidebar shows truth).
    const loadCertCounts = async () => {
        const { data, error } = await supabase.from("provider_certifications").select("provider_slug");
        if (error || !data) return;
        const counts: Record<string, number> = {};
        for (const row of data as { provider_slug: string }[]) {
            counts[row.provider_slug] = (counts[row.provider_slug] ?? 0) + 1;
        }
        setCertCounts(counts);
    };

    useEffect(() => {
        const init = async () => {
            const rows = await loadProviders();
            if (rows.length > 0) setSelectedSlug((prev) => prev ?? rows[0].slug);
            await loadCertCounts();
            setLoadingProviders(false);
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Keep the selected provider's count exact as certs are added/removed.
    useEffect(() => {
        if (selectedSlug) setCertCounts((prev) => ({ ...prev, [selectedSlug]: certs.length }));
    }, [certs, selectedSlug]);

    useEffect(() => {
        if (!selectedSlug) {
            setCerts([]);
            return;
        }
        setSearch("");
        setLevelFilter("all");
        let cancelled = false;
        const loadCerts = async () => {
            setLoadingCerts(true);
            const { data, error } = await supabase
                .from("provider_certifications")
                .select("id, provider_slug, value, label, exam_code, level, sort_order, active")
                .eq("provider_slug", selectedSlug)
                .order("sort_order", { ascending: true });
            if (cancelled) return;
            if (error) {
                console.error("Failed to load certifications", error);
                toast({
                    title: "Could not load certifications",
                    description: "Please pick the provider again or refresh the page.",
                    variant: "destructive",
                });
                setCerts([]);
            } else {
                setCerts(
                    (data ?? []).map((row: any) => ({
                        id: row.id,
                        provider_slug: row.provider_slug ?? "",
                        value: row.value ?? "",
                        label: row.label ?? "",
                        exam_code: row.exam_code ?? "",
                        level: row.level ?? "",
                        sort_order: row.sort_order ?? 0,
                        active: row.active !== false,
                    }))
                );
            }
            setLoadingCerts(false);
        };
        loadCerts();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSlug]);

    /* -------------------------- providers -------------------------- */

    const openAddProvider = () => {
        setEditingProviderId(null);
        setProviderForm(EMPTY_PROVIDER_FORM);
        setProviderDialogOpen(true);
    };

    const openEditProvider = (provider: ProviderRow) => {
        setEditingProviderId(provider.id);
        setProviderForm({
            slug: provider.slug,
            label: provider.label,
            logo_url: provider.logo_url,
            logo_light_url: provider.logo_light_url,
            brand_color: provider.brand_color,
            blurb: provider.blurb,
            cert_count: String(provider.cert_count ?? 0),
            show_on_home: provider.show_on_home,
            show_in_forms: provider.show_in_forms,
        });
        setProviderDialogOpen(true);
    };

    const saveProvider = async () => {
        const slug = providerForm.slug.trim();
        const label = providerForm.label.trim();
        if (!slug || !label) {
            toast({
                title: "Almost there",
                description: "Please fill in both the slug and the label before saving.",
                variant: "destructive",
            });
            return;
        }
        setSavingProvider(true);
        const payload = {
            slug,
            label,
            logo_url: providerForm.logo_url.trim() || null,
            logo_light_url: providerForm.logo_light_url.trim() || null,
            brand_color: providerForm.brand_color.trim() || null,
            blurb: providerForm.blurb.trim() || null,
            cert_count: Number.parseInt(providerForm.cert_count, 10) || 0,
            show_on_home: providerForm.show_on_home,
            show_in_forms: providerForm.show_in_forms,
        };
        if (editingProviderId) {
            const { error } = await supabase
                .from("cert_providers")
                .update(payload)
                .eq("id", editingProviderId);
            setSavingProvider(false);
            if (error) return saveFailed();
        } else {
            const nextOrder =
                providers.length > 0 ? Math.max(...providers.map((p) => p.sort_order)) + 1 : 1;
            const { error } = await supabase
                .from("cert_providers")
                .insert({ ...payload, sort_order: nextOrder, active: true });
            setSavingProvider(false);
            if (error) return saveFailed();
        }
        setProviderDialogOpen(false);
        await loadProviders();
        if (!editingProviderId) setSelectedSlug(slug);
        saveDone();
    };

    const toggleProviderActive = async (provider: ProviderRow, active: boolean) => {
        setProviders((prev) => prev.map((p) => (p.id === provider.id ? { ...p, active } : p)));
        const { error } = await supabase
            .from("cert_providers")
            .update({ active })
            .eq("id", provider.id);
        if (error) {
            setProviders((prev) =>
                prev.map((p) => (p.id === provider.id ? { ...p, active: !active } : p))
            );
            return saveFailed();
        }
        saveDone();
    };

    const confirmDeleteProvider = async () => {
        if (!providerToDelete) return;
        setDeletingProvider(true);
        const { error } = await supabase
            .from("cert_providers")
            .delete()
            .eq("id", providerToDelete.id);
        setDeletingProvider(false);
        if (error) {
            setProviderToDelete(null);
            return saveFailed();
        }
        const deletedSlug = providerToDelete.slug;
        setProviderToDelete(null);
        const rows = await loadProviders();
        if (selectedSlug === deletedSlug) {
            setSelectedSlug(rows.length > 0 ? rows[0].slug : null);
        }
        toast({
            title: "Provider removed",
            description: "The provider and its certifications are no longer in the catalog.",
        });
    };

    /* ------------------------ certifications ----------------------- */

    const filteredCerts = useMemo(() => {
        const query = search.trim().toLowerCase();
        return certs.filter((c) => {
            if (levelFilter !== "all" && (c.level || "other") !== levelFilter) return false;
            if (!query) return true;
            return (
                c.label.toLowerCase().includes(query) ||
                c.exam_code.toLowerCase().includes(query) ||
                c.value.toLowerCase().includes(query)
            );
        });
    }, [certs, search, levelFilter]);

    /** Filtered certs grouped into level sections, in TOC order. */
    const groupedCerts = useMemo(() => {
        const groups = new Map<string, CertRow[]>();
        for (const cert of filteredCerts) {
            const key = cert.level && LEVEL_LABELS[cert.level] ? cert.level : "other";
            (groups.get(key) ?? groups.set(key, []).get(key)!).push(cert);
        }
        return [...groups.entries()].sort((a, b) => levelRank(a[0]) - levelRank(b[0]));
    }, [filteredCerts]);

    /** Counts per level across the whole provider (for the filter chips). */
    const levelCounts = useMemo(() => {
        const counts: Record<string, number> = { all: certs.length };
        for (const c of certs) {
            const key = c.level && LEVEL_LABELS[c.level] ? c.level : "other";
            counts[key] = (counts[key] ?? 0) + 1;
        }
        return counts;
    }, [certs]);

    const openAddCert = () => {
        setNewCert(EMPTY_CERT_FORM);
        setAddCertOpen(true);
    };

    const updateNewCertLabel = (label: string) => {
        setNewCert((prev) => ({
            ...prev,
            label,
            value: prev.valueTouched ? prev.value : kebabCase(label),
        }));
    };

    const addCertification = async () => {
        if (!selectedSlug) return;
        const label = newCert.label.trim();
        const value = newCert.value.trim();
        if (!label || !value) {
            toast({
                title: "Almost there",
                description: "Please fill in the label and the value before saving.",
                variant: "destructive",
            });
            return;
        }
        setSavingCert(true);
        const nextOrder = certs.length > 0 ? Math.max(...certs.map((c) => c.sort_order)) + 1 : 1;
        const { data, error } = await supabase
            .from("provider_certifications")
            .insert({
                provider_slug: selectedSlug,
                value,
                label,
                exam_code: newCert.exam_code.trim() || null,
                level: newCert.level.trim() || null,
                sort_order: nextOrder,
                active: true,
            })
            .select("id, provider_slug, value, label, exam_code, level, sort_order, active")
            .single();
        setSavingCert(false);
        if (error || !data) return saveFailed();
        setCerts((prev) => [
            ...prev,
            {
                id: data.id,
                provider_slug: data.provider_slug ?? selectedSlug,
                value: data.value ?? value,
                label: data.label ?? label,
                exam_code: data.exam_code ?? "",
                level: data.level ?? "",
                sort_order: data.sort_order ?? nextOrder,
                active: data.active !== false,
            },
        ]);
        setAddCertOpen(false);
        saveDone();
    };

    const startEditCert = (cert: CertRow) => {
        setEditingCertId(cert.id);
        setEditCertForm({
            label: cert.label,
            exam_code: cert.exam_code,
            value: cert.value,
            level: cert.level,
            valueTouched: true,
        });
    };

    const saveCertEdit = async () => {
        if (!editingCertId) return;
        const label = editCertForm.label.trim();
        const value = editCertForm.value.trim();
        if (!label || !value) {
            toast({
                title: "Almost there",
                description: "Please fill in the label and the value before saving.",
                variant: "destructive",
            });
            return;
        }
        setSavingCert(true);
        const { error } = await supabase
            .from("provider_certifications")
            .update({
                label,
                value,
                exam_code: editCertForm.exam_code.trim() || null,
                level: editCertForm.level.trim() || null,
            })
            .eq("id", editingCertId);
        setSavingCert(false);
        if (error) return saveFailed();
        setCerts((prev) =>
            prev.map((c) =>
                c.id === editingCertId
                    ? { ...c, label, value, exam_code: editCertForm.exam_code.trim(), level: editCertForm.level.trim() }
                    : c
            )
        );
        setEditingCertId(null);
        saveDone();
    };

    const toggleCertActive = async (cert: CertRow, active: boolean) => {
        setCerts((prev) => prev.map((c) => (c.id === cert.id ? { ...c, active } : c)));
        const { error } = await supabase
            .from("provider_certifications")
            .update({ active })
            .eq("id", cert.id);
        if (error) {
            setCerts((prev) => prev.map((c) => (c.id === cert.id ? { ...c, active: !active } : c)));
            return saveFailed();
        }
        saveDone();
    };

    const moveCert = async (cert: CertRow, direction: -1 | 1) => {
        const index = certs.findIndex((c) => c.id === cert.id);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= certs.length) return;
        const a = certs[index];
        const b = certs[target];
        // Guard against duplicate sort orders so the swap always changes something.
        const orderA = a.sort_order === b.sort_order ? target + 1 : b.sort_order;
        const orderB = a.sort_order === b.sort_order ? index + 1 : a.sort_order;
        const next = [...certs];
        next[index] = { ...b, sort_order: orderB };
        next[target] = { ...a, sort_order: orderA };
        setCerts(next);
        const [resA, resB] = await Promise.all([
            supabase.from("provider_certifications").update({ sort_order: orderA }).eq("id", a.id),
            supabase.from("provider_certifications").update({ sort_order: orderB }).eq("id", b.id),
        ]);
        if (resA.error || resB.error) {
            setCerts(certs);
            return saveFailed();
        }
        saveDone();
    };

    const confirmDeleteCert = async () => {
        if (!certToDelete) return;
        setDeletingCert(true);
        const { error } = await supabase
            .from("provider_certifications")
            .delete()
            .eq("id", certToDelete.id);
        setDeletingCert(false);
        if (error) {
            setCertToDelete(null);
            return saveFailed();
        }
        setCerts((prev) => prev.filter((c) => c.id !== certToDelete.id));
        setCertToDelete(null);
        toast({
            title: "Certification removed",
            description: "It is no longer offered in the catalog.",
        });
    };

    const isSearching = search.trim().length > 0;
    // Reordering swaps global neighbours, so only allow it on the full unfiltered list.
    const reorderLocked = isSearching || levelFilter !== "all";

    /* ----------------------------- view --------------------------- */

    if (loadingProviders) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Loading your certification catalog…</span>
            </div>
        );
    }

    return (
        <div className="px-4 md:px-8 py-8 md:py-10">
            <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
                {/* Header band — matches the admin workspace panels */}
                <ScrollReveal>
                    <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-6 md:p-8">
                        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
                        <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-brand-200/20 blur-3xl" />

                        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                            <div className="space-y-1.5">
                                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Certifications
                                </p>
                                <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">
                                    Certification <span className="gradient-text">Catalog</span>
                                </h1>
                                <p className="text-muted-foreground">
                                    Manage the providers and exams Yatris can choose across the site. Every save goes live right away.
                                </p>
                            </div>
                            <Button onClick={openAddProvider} className={saveButtonClass}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add provider
                            </Button>
                        </div>
                    </div>
                </ScrollReveal>

                <ScrollReveal delay={0.05}>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] items-start">
                        {/* ── Providers list ── */}
                        <div className="bg-card border border-brand-100 rounded-2xl shadow-card lg:sticky lg:top-6">
                            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                                <h2 className="font-display text-sm font-bold tracking-tight text-foreground">
                                    Providers
                                    <span className="ml-1.5 font-sans text-xs font-medium text-muted-foreground">{providers.length}</span>
                                </h2>
                            </div>

                            <div className="max-h-[70vh] overflow-y-auto p-2">
                                {providers.map((provider) => {
                                    const selected = provider.slug === selectedSlug;
                                    return (
                                        <div
                                            key={provider.id}
                                            className={`group relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-colors ${selected
                                                ? "bg-primary/10"
                                                : "hover:bg-muted"
                                                }`}
                                        >
                                            {selected && <span aria-hidden className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary" />}
                                            <button
                                                type="button"
                                                onClick={() => setSelectedSlug(provider.slug)}
                                                className="flex min-w-0 flex-1 items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                                                aria-pressed={selected}
                                                aria-label={`Manage ${provider.label} certifications`}
                                            >
                                                <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-card">
                                                    {provider.logo_url ? (
                                                        <img src={provider.logo_url} alt="" className="h-5 w-5 object-contain" loading="lazy" />
                                                    ) : (
                                                        <span className="text-xs font-bold text-muted-foreground">{provider.label.charAt(0)}</span>
                                                    )}
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="flex items-center gap-1.5">
                                                        <span className={`truncate text-sm font-semibold ${selected ? "text-primary" : "text-foreground"}`}>
                                                            {provider.label}
                                                        </span>
                                                        {!provider.active && (
                                                            <span className="rounded bg-muted px-1 py-px text-[10px] font-semibold uppercase text-muted-foreground">off</span>
                                                        )}
                                                    </span>
                                                    <span className="block truncate text-xs text-muted-foreground">
                                                        {certCounts[provider.slug] ?? provider.cert_count} exams
                                                        {provider.show_on_home && " · home"}
                                                        {provider.show_in_forms && " · forms"}
                                                    </span>
                                                </span>
                                            </button>

                                            {/* Actions — quiet until row hover/selection */}
                                            <div className={`flex shrink-0 items-center gap-0.5 transition-opacity ${selected ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100"}`}>
                                                <Switch
                                                    checked={provider.active}
                                                    onCheckedChange={(checked) => toggleProviderActive(provider, checked)}
                                                    aria-label={`${provider.label} is live in the catalog`}
                                                    className="scale-90"
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEditProvider(provider)}
                                                    aria-label={`Edit ${provider.label}`}
                                                    className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-primary hover:text-primary-foreground"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setProviderToDelete(provider)}
                                                    aria-label={`Delete ${provider.label}`}
                                                    className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}

                                {providers.length === 0 && (
                                    <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                                        <p>No providers yet. Add your first one and its exams will live here.</p>
                                        <Button variant="outline" onClick={openAddProvider} className="mt-4 min-h-[44px] rounded-xl">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add provider
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Selected provider's certifications ── */}
                        <div className="bg-card border border-brand-100 rounded-2xl shadow-card">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-5">
                                <div className="min-w-0">
                                    <h2 className="font-display text-base font-bold tracking-tight text-foreground">
                                        {selectedProvider ? selectedProvider.label : "Certifications"}
                                        <span className="ml-1.5 font-sans text-sm font-medium text-muted-foreground">
                                            {selectedProvider ? `${certs.length} exams` : ""}
                                        </span>
                                    </h2>
                                </div>
                                {selectedProvider && (
                                    <Button onClick={openAddCert} size="sm" className="rounded-lg bg-primary hover:bg-brand-600 text-primary-foreground font-semibold shadow-inset-btn">
                                        <Plus className="mr-1.5 h-4 w-4" />
                                        Add certification
                                    </Button>
                                )}
                            </div>

                            {selectedProvider && (
                                <div className="space-y-3 border-b border-border px-4 py-3 md:px-5">
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Search by name or exam code…"
                                            aria-label="Search certifications"
                                            className="h-10 rounded-lg pl-10"
                                        />
                                    </div>
                                    {/* Level filter chips */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {[["all", "All"], ...LEVEL_ORDER.map((l) => [l, LEVEL_LABELS[l]] as const), ["other", "Other"]]
                                            .filter(([key]) => key === "all" || (levelCounts[key] ?? 0) > 0)
                                            .map(([key, label]) => {
                                                const activeChip = levelFilter === key;
                                                return (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        onClick={() => setLevelFilter(key)}
                                                        aria-pressed={activeChip}
                                                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${activeChip
                                                            ? "border-primary bg-primary text-primary-foreground"
                                                            : "border-border bg-background text-muted-foreground hover:border-brand-200 hover:text-foreground"
                                                            }`}
                                                    >
                                                        {label}
                                                        <span className={activeChip ? "text-primary-foreground/80" : "text-muted-foreground/70"}>
                                                            {levelCounts[key] ?? 0}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}

                            <div className="p-4 md:p-5">

                            {loadingCerts ? (
                                <div className="flex min-h-[200px] items-center justify-center gap-3 text-muted-foreground">
                                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                    <span>Loading certifications…</span>
                                </div>
                            ) : !selectedProvider ? (
                                <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                                    Choose a provider from the list and its exams will show up here.
                                </p>
                            ) : filteredCerts.length === 0 ? (
                                <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                                    {isSearching
                                        ? "Nothing matches that search. Try a shorter word or clear the box."
                                        : "No certifications yet for this provider. Add the first one to get started."}
                                </p>
                            ) : (
                                <div className="space-y-5">
                                    {groupedCerts.map(([level, rows]) => (
                                        <section key={level}>
                                            {/* Level heading — the "table of contents" divider */}
                                            <div className="mb-1.5 flex items-center gap-2">
                                                <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                                    {level === "other" ? "Other" : LEVEL_LABELS[level]}
                                                </h3>
                                                <span className="text-[11px] font-medium text-muted-foreground/60">{rows.length}</span>
                                                <div className="h-px flex-1 bg-border" />
                                            </div>
                                            <div className="overflow-hidden rounded-xl border border-border">
                                                {rows.map((cert, gi) => {
                                                    const isEditing = editingCertId === cert.id;
                                                    const name = cert.label.replace(/^[A-Za-z]{2,3}-\d+:\s*/, "");
                                                    return (
                                                        <div
                                                            key={cert.id}
                                                            className={`group/row border-border transition-colors ${gi > 0 ? "border-t" : ""} ${isEditing ? "bg-muted/40" : "hover:bg-muted/50"} ${!cert.active && !isEditing ? "opacity-60" : ""}`}
                                                        >
                                                            {isEditing ? (
                                                                <div className="space-y-3 p-3">
                                                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                                        <div className="space-y-1.5 sm:col-span-2">
                                                                            <FieldLabel htmlFor={`cert-label-${cert.id}`}>Label</FieldLabel>
                                                                            <Input id={`cert-label-${cert.id}`} className="h-10 rounded-lg" value={editCertForm.label}
                                                                                onChange={(e) => setEditCertForm((prev) => ({ ...prev, label: e.target.value }))} />
                                                                        </div>
                                                                        <div className="space-y-1.5">
                                                                            <FieldLabel htmlFor={`cert-code-${cert.id}`}>Exam code</FieldLabel>
                                                                            <Input id={`cert-code-${cert.id}`} className="h-10 rounded-lg" value={editCertForm.exam_code}
                                                                                onChange={(e) => setEditCertForm((prev) => ({ ...prev, exam_code: e.target.value }))} />
                                                                        </div>
                                                                        <div className="space-y-1.5">
                                                                            <FieldLabel htmlFor={`cert-level-${cert.id}`}>Level</FieldLabel>
                                                                            <Select value={editCertForm.level || "none"} onValueChange={(v) => setEditCertForm((prev) => ({ ...prev, level: v === "none" ? "" : v }))}>
                                                                                <SelectTrigger id={`cert-level-${cert.id}`} className="h-10 rounded-lg"><SelectValue placeholder="Level" /></SelectTrigger>
                                                                                <SelectContent>
                                                                                    <SelectItem value="none">No level</SelectItem>
                                                                                    {LEVEL_ORDER.map((l) => <SelectItem key={l} value={l}>{LEVEL_LABELS[l]}</SelectItem>)}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </div>
                                                                        <div className="space-y-1.5 sm:col-span-2">
                                                                            <FieldLabel htmlFor={`cert-value-${cert.id}`}>Value (slug)</FieldLabel>
                                                                            <Input id={`cert-value-${cert.id}`} className="h-10 rounded-lg font-mono text-sm" value={editCertForm.value}
                                                                                onChange={(e) => setEditCertForm((prev) => ({ ...prev, value: e.target.value }))} />
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Button onClick={saveCertEdit} disabled={savingCert} size="sm" className="rounded-lg bg-primary hover:bg-brand-600 text-primary-foreground font-semibold shadow-inset-btn">
                                                                            {savingCert && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                                            Save
                                                                        </Button>
                                                                        <Button variant="outline" size="sm" onClick={() => setEditingCertId(null)} className="rounded-lg">Cancel</Button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-3 px-3 py-2.5">
                                                                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                                                                        {cert.exam_code && (
                                                                            <span className="shrink-0 rounded-md bg-primary/10 px-2 py-1 text-xs font-bold tabular-nums text-primary">
                                                                                {cert.exam_code}
                                                                            </span>
                                                                        )}
                                                                        <span className="min-w-0 truncate text-sm font-medium text-foreground">{name}</span>
                                                                        {!cert.active && (
                                                                            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">off</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex shrink-0 items-center gap-0.5">
                                                                        <Switch
                                                                            checked={cert.active}
                                                                            onCheckedChange={(checked) => toggleCertActive(cert, checked)}
                                                                            aria-label={`${cert.label} is live in the catalog`}
                                                                            className="scale-90"
                                                                        />
                                                                        <div className="flex items-center opacity-0 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100">
                                                                            <Button variant="ghost" size="icon" onClick={() => moveCert(cert, -1)} disabled={reorderLocked || gi <= 0}
                                                                                aria-label={`Move ${cert.label} up`} className="h-8 w-8 rounded-lg text-muted-foreground">
                                                                                <ArrowUp className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                            <Button variant="ghost" size="icon" onClick={() => moveCert(cert, 1)} disabled={reorderLocked || gi >= rows.length - 1}
                                                                                aria-label={`Move ${cert.label} down`} className="h-8 w-8 rounded-lg text-muted-foreground">
                                                                                <ArrowDown className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                            <Button variant="ghost" size="icon" onClick={() => startEditCert(cert)}
                                                                                aria-label={`Edit ${cert.label}`} className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-primary hover:text-primary-foreground">
                                                                                <Pencil className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                            <Button variant="ghost" size="icon" onClick={() => setCertToDelete(cert)}
                                                                                aria-label={`Delete ${cert.label}`} className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-destructive hover:text-destructive-foreground">
                                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </section>
                                    ))}
                                    {reorderLocked && (
                                        <p className="text-xs text-muted-foreground">
                                            Reordering is paused while filtering. Clear the search and set the level to “All” to move exams.
                                        </p>
                                    )}
                                </div>
                            )}
                            </div>
                        </div>
                    </div>
                </ScrollReveal>
            </div>

            {/* ── Provider add/edit dialog ── */}
            <Dialog open={providerDialogOpen} onOpenChange={setProviderDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="font-display tracking-tight">
                            {editingProviderId ? "Edit provider" : "Add a provider"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingProviderId
                                ? "Update the details and save. Changes go live right away."
                                : "Fill in the details below. You can add its exams right after."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <FieldLabel htmlFor="provider-slug">Slug</FieldLabel>
                                <Input
                                    id="provider-slug"
                                    className="min-h-[44px] rounded-xl font-mono text-sm"
                                    placeholder="aws"
                                    value={providerForm.slug}
                                    onChange={(e) => setProviderForm({ ...providerForm, slug: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <FieldLabel htmlFor="provider-label">Label</FieldLabel>
                                <Input
                                    id="provider-label"
                                    className="min-h-[44px] rounded-xl"
                                    placeholder="Amazon Web Services"
                                    value={providerForm.label}
                                    onChange={(e) => setProviderForm({ ...providerForm, label: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <FieldLabel htmlFor="provider-logo">Logo URL</FieldLabel>
                            <Input
                                id="provider-logo"
                                className="min-h-[44px] rounded-xl"
                                value={providerForm.logo_url}
                                onChange={(e) => setProviderForm({ ...providerForm, logo_url: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <FieldLabel htmlFor="provider-logo-light">Light logo URL (for dark backgrounds)</FieldLabel>
                            <Input
                                id="provider-logo-light"
                                className="min-h-[44px] rounded-xl"
                                value={providerForm.logo_light_url}
                                onChange={(e) => setProviderForm({ ...providerForm, logo_light_url: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <FieldLabel htmlFor="provider-color">Brand color</FieldLabel>
                                <Input
                                    id="provider-color"
                                    className="min-h-[44px] rounded-xl font-mono text-sm"
                                    placeholder="#FF9900"
                                    value={providerForm.brand_color}
                                    onChange={(e) => setProviderForm({ ...providerForm, brand_color: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <FieldLabel htmlFor="provider-count">Cert count (shown on cards)</FieldLabel>
                                <Input
                                    id="provider-count"
                                    type="number"
                                    min={0}
                                    className="min-h-[44px] rounded-xl"
                                    value={providerForm.cert_count}
                                    onChange={(e) => setProviderForm({ ...providerForm, cert_count: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <FieldLabel htmlFor="provider-blurb">Blurb</FieldLabel>
                            <Textarea
                                id="provider-blurb"
                                className="min-h-[80px] rounded-xl"
                                placeholder="One warm line about this provider."
                                value={providerForm.blurb}
                                onChange={(e) => setProviderForm({ ...providerForm, blurb: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                                <Switch
                                    id="provider-show-home"
                                    checked={providerForm.show_on_home}
                                    onCheckedChange={(checked) =>
                                        setProviderForm({ ...providerForm, show_on_home: checked })
                                    }
                                    aria-label="Show this provider on the homepage"
                                />
                                <Label htmlFor="provider-show-home" className="text-sm font-medium">
                                    Show on homepage
                                </Label>
                            </div>
                            <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                                <Switch
                                    id="provider-show-forms"
                                    checked={providerForm.show_in_forms}
                                    onCheckedChange={(checked) =>
                                        setProviderForm({ ...providerForm, show_in_forms: checked })
                                    }
                                    aria-label="Show this provider in forms"
                                />
                                <Label htmlFor="provider-show-forms" className="text-sm font-medium">
                                    Show in forms
                                </Label>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setProviderDialogOpen(false)}
                            className="min-h-[44px] rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button onClick={saveProvider} disabled={savingProvider} className={saveButtonClass}>
                            {savingProvider ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            {editingProviderId ? "Save provider" : "Add provider"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Add certification dialog ── */}
            <Dialog open={addCertOpen} onOpenChange={setAddCertOpen}>
                <DialogContent className="rounded-2xl sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-display tracking-tight">Add a certification</DialogTitle>
                        <DialogDescription>
                            {selectedProvider
                                ? `This exam will be added to ${selectedProvider.label}.`
                                : "Pick a provider first."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <FieldLabel htmlFor="new-cert-label">Label</FieldLabel>
                            <Input
                                id="new-cert-label"
                                className="min-h-[44px] rounded-xl"
                                placeholder="AWS Certified Solutions Architect Associate"
                                value={newCert.label}
                                onChange={(e) => updateNewCertLabel(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <FieldLabel htmlFor="new-cert-code">Exam code (optional)</FieldLabel>
                                <Input
                                    id="new-cert-code"
                                    className="min-h-[44px] rounded-xl"
                                    placeholder="SAA-C03"
                                    value={newCert.exam_code}
                                    onChange={(e) => setNewCert((prev) => ({ ...prev, exam_code: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <FieldLabel htmlFor="new-cert-level">Level (optional)</FieldLabel>
                                <Select value={newCert.level || "none"} onValueChange={(v) => setNewCert((prev) => ({ ...prev, level: v === "none" ? "" : v }))}>
                                    <SelectTrigger id="new-cert-level" className="min-h-[44px] rounded-xl"><SelectValue placeholder="Level" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No level</SelectItem>
                                        {LEVEL_ORDER.map((l) => <SelectItem key={l} value={l}>{LEVEL_LABELS[l]}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <FieldLabel htmlFor="new-cert-value">Value (filled in from the label, edit if needed)</FieldLabel>
                            <Input
                                id="new-cert-value"
                                className="min-h-[44px] rounded-xl font-mono text-sm"
                                value={newCert.value}
                                onChange={(e) =>
                                    setNewCert((prev) => ({ ...prev, value: e.target.value, valueTouched: true }))
                                }
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setAddCertOpen(false)}
                            className="min-h-[44px] rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button onClick={addCertification} disabled={savingCert} className={saveButtonClass}>
                            {savingCert ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Plus className="mr-2 h-4 w-4" />
                            )}
                            Add certification
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Delete provider confirm ── */}
            <AlertDialog
                open={providerToDelete !== null}
                onOpenChange={(open) => {
                    if (!open) setProviderToDelete(null);
                }}
            >
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-display tracking-tight">
                            Delete {providerToDelete?.label ?? "this provider"}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This removes the provider and every certification under it. Yatris will no longer see them anywhere on the site. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="min-h-[44px] rounded-xl">Keep it</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteProvider}
                            disabled={deletingProvider}
                            className="min-h-[44px] rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deletingProvider ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            Delete provider
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── Delete certification confirm ── */}
            <AlertDialog
                open={certToDelete !== null}
                onOpenChange={(open) => {
                    if (!open) setCertToDelete(null);
                }}
            >
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-display tracking-tight">
                            Delete {certToDelete?.label ?? "this certification"}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Yatris will no longer see this exam anywhere on the site. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="min-h-[44px] rounded-xl">Keep it</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteCert}
                            disabled={deletingCert}
                            className="min-h-[44px] rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deletingCert ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            Delete certification
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default AdminCertCatalog;
