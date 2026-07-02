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
    sort_order: number;
    active: boolean;
}

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
    const [search, setSearch] = useState("");

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

    useEffect(() => {
        const init = async () => {
            const rows = await loadProviders();
            if (rows.length > 0) setSelectedSlug((prev) => prev ?? rows[0].slug);
            setLoadingProviders(false);
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!selectedSlug) {
            setCerts([]);
            return;
        }
        let cancelled = false;
        const loadCerts = async () => {
            setLoadingCerts(true);
            const { data, error } = await supabase
                .from("provider_certifications")
                .select("id, provider_slug, value, label, exam_code, sort_order, active")
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
        if (!query) return certs;
        return certs.filter(
            (c) =>
                c.label.toLowerCase().includes(query) ||
                c.exam_code.toLowerCase().includes(query) ||
                c.value.toLowerCase().includes(query)
        );
    }, [certs, search]);

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
                sort_order: nextOrder,
                active: true,
            })
            .select("id, provider_slug, value, label, exam_code, sort_order, active")
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
            })
            .eq("id", editingCertId);
        setSavingCert(false);
        if (error) return saveFailed();
        setCerts((prev) =>
            prev.map((c) =>
                c.id === editingCertId
                    ? { ...c, label, value, exam_code: editCertForm.exam_code.trim() }
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
                        <div className="bg-card border border-brand-100 rounded-2xl p-5 md:p-6 shadow-card">
                            <div className="-mx-5 md:-mx-6 -mt-5 md:-mt-6 mb-5 rounded-t-2xl border-b border-brand-100 bg-gradient-to-r from-brand-50 to-transparent px-5 md:px-6 py-4">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Catalog</p>
                                <h2 className="mt-0.5 font-display text-lg font-bold tracking-tight text-foreground">Providers</h2>
                                <p className="text-sm text-muted-foreground">
                                    Pick a provider to manage its exams.
                                </p>
                            </div>

                            <div className="space-y-2">
                                {providers.map((provider) => {
                                    const selected = provider.slug === selectedSlug;
                                    return (
                                        <div
                                            key={provider.id}
                                            className={`rounded-xl border p-3 transition-colors ${selected
                                                ? "border-primary/30 bg-primary/5"
                                                : "border-border bg-background hover:bg-brand-50/50 hover:border-brand-100"
                                                }`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => setSelectedSlug(provider.slug)}
                                                className="flex w-full min-h-[44px] items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                                                aria-pressed={selected}
                                                aria-label={`Manage ${provider.label} certifications`}
                                            >
                                                {provider.logo_url && (
                                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-card">
                                                        <img
                                                            src={provider.logo_url}
                                                            alt=""
                                                            className="h-7 w-7 object-contain"
                                                            loading="lazy"
                                                        />
                                                    </span>
                                                )}
                                                <span className="min-w-0 flex-1">
                                                    <span className={`block truncate text-sm font-semibold ${selected ? "text-primary" : ""}`}>
                                                        {provider.label}
                                                    </span>
                                                    <span className="block truncate text-xs text-muted-foreground">
                                                        {provider.slug} · {provider.cert_count} certs
                                                    </span>
                                                </span>
                                            </button>

                                            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    {provider.show_on_home && (
                                                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                                            On homepage
                                                        </span>
                                                    )}
                                                    {provider.show_in_forms && (
                                                        <span className="inline-flex items-center rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                                                            In forms
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Switch
                                                        checked={provider.active}
                                                        onCheckedChange={(checked) => toggleProviderActive(provider, checked)}
                                                        aria-label={`${provider.label} is live in the catalog`}
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openEditProvider(provider)}
                                                        aria-label={`Edit ${provider.label}`}
                                                        className="h-10 w-10 rounded-xl text-muted-foreground hover:text-primary"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => setProviderToDelete(provider)}
                                                        aria-label={`Delete ${provider.label}`}
                                                        className={deleteIconButtonClass}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
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
                        <div className="bg-card border border-brand-100 rounded-2xl p-5 md:p-6 shadow-card">
                            <div className="-mx-5 md:-mx-6 -mt-5 md:-mt-6 mb-5 flex flex-wrap items-start justify-between gap-3 rounded-t-2xl border-b border-brand-100 bg-gradient-to-r from-brand-50 to-transparent px-5 md:px-6 py-4">
                                <div className="min-w-0 flex-1">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Catalog</p>
                                    <h2 className="mt-0.5 font-display text-lg font-bold tracking-tight text-foreground">
                                        {selectedProvider ? `${selectedProvider.label} certifications` : "Certifications"}
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedProvider
                                            ? `${certs.length} exams in this catalog. Search, reorder, or edit any of them.`
                                            : "Pick a provider on the left to see its exams."}
                                    </p>
                                </div>
                                {selectedProvider && (
                                    <Button onClick={openAddCert} className={saveButtonClass}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add certification
                                    </Button>
                                )}
                            </div>

                            {selectedProvider && (
                                <div className="relative mb-4">
                                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search by name, exam code, or value…"
                                        aria-label="Search certifications"
                                        className="min-h-[44px] rounded-xl pl-10"
                                    />
                                </div>
                            )}

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
                                <div className="space-y-2">
                                    {filteredCerts.map((cert) => {
                                        const orderedIndex = certs.findIndex((c) => c.id === cert.id);
                                        const isEditing = editingCertId === cert.id;
                                        return (
                                            <div
                                                key={cert.id}
                                                className="rounded-xl border border-border bg-background odd:bg-brand-50/30 odd:border-brand-100 hover:bg-brand-50/50 transition-colors p-3 md:p-4"
                                            >
                                                {isEditing ? (
                                                    <div className="space-y-3">
                                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                                            <div className="space-y-1.5 md:col-span-3">
                                                                <FieldLabel htmlFor={`cert-label-${cert.id}`}>Label</FieldLabel>
                                                                <Input
                                                                    id={`cert-label-${cert.id}`}
                                                                    className="min-h-[44px] rounded-xl"
                                                                    value={editCertForm.label}
                                                                    onChange={(e) =>
                                                                        setEditCertForm((prev) => ({ ...prev, label: e.target.value }))
                                                                    }
                                                                />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <FieldLabel htmlFor={`cert-code-${cert.id}`}>Exam code</FieldLabel>
                                                                <Input
                                                                    id={`cert-code-${cert.id}`}
                                                                    className="min-h-[44px] rounded-xl"
                                                                    value={editCertForm.exam_code}
                                                                    onChange={(e) =>
                                                                        setEditCertForm((prev) => ({ ...prev, exam_code: e.target.value }))
                                                                    }
                                                                />
                                                            </div>
                                                            <div className="space-y-1.5 md:col-span-2">
                                                                <FieldLabel htmlFor={`cert-value-${cert.id}`}>Value</FieldLabel>
                                                                <Input
                                                                    id={`cert-value-${cert.id}`}
                                                                    className="min-h-[44px] rounded-xl font-mono text-sm"
                                                                    value={editCertForm.value}
                                                                    onChange={(e) =>
                                                                        setEditCertForm((prev) => ({ ...prev, value: e.target.value }))
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button onClick={saveCertEdit} disabled={savingCert} className={saveButtonClass}>
                                                                {savingCert ? (
                                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <Save className="mr-2 h-4 w-4" />
                                                                )}
                                                                Save changes
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => setEditingCertId(null)}
                                                                className="min-h-[44px] rounded-xl"
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-semibold">{cert.label}</p>
                                                            <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                                {cert.exam_code && (
                                                                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                                                                        {cert.exam_code}
                                                                    </span>
                                                                )}
                                                                <span className="truncate font-mono">{cert.value}</span>
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Switch
                                                                checked={cert.active}
                                                                onCheckedChange={(checked) => toggleCertActive(cert, checked)}
                                                                aria-label={`${cert.label} is live in the catalog`}
                                                            />
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={() => moveCert(cert, -1)}
                                                                disabled={isSearching || orderedIndex <= 0}
                                                                aria-label={`Move ${cert.label} up`}
                                                                className="h-10 w-10 rounded-xl"
                                                            >
                                                                <ArrowUp className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={() => moveCert(cert, 1)}
                                                                disabled={isSearching || orderedIndex === certs.length - 1}
                                                                aria-label={`Move ${cert.label} down`}
                                                                className="h-10 w-10 rounded-xl"
                                                            >
                                                                <ArrowDown className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => startEditCert(cert)}
                                                                aria-label={`Edit ${cert.label}`}
                                                                className="h-10 w-10 rounded-xl text-muted-foreground hover:text-primary"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={() => setCertToDelete(cert)}
                                                                aria-label={`Delete ${cert.label}`}
                                                                className={deleteIconButtonClass}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {isSearching && (
                                        <p className="pt-1 text-xs text-muted-foreground">
                                            Reordering is paused while you search. Clear the search box to move exams around.
                                        </p>
                                    )}
                                </div>
                            )}
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
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
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
