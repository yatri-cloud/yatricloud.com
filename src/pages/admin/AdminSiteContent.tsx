import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    Globe,
    Phone,
    Share2,
    CalendarClock,
    Sparkles,
    BarChart3,
    Megaphone,
    HelpCircle,
    Plus,
    Trash2,
    ArrowUp,
    ArrowDown,
    Loader2,
    Save,
    Users,
    Gift,
    ListOrdered,
    BadgeCheck,
    Award,
    ShieldCheck,
    MessagesSquare,
    Link2,
    ListChecks,
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import ScrollReveal from "@/components/ScrollReveal";
import {
    FALLBACK_SETTINGS,
    FALLBACK_PROMOTION,
} from "@/lib/site-content";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface StatRow {
    id: string;
    key: string;
    value: string;
    label: string;
    sort_order: number;
    active: boolean;
}

interface PromoRow {
    id: string | null;
    slug: string;
    headline: string;
    discount_text: string;
    cta_label: string;
    cta_url: string;
    active: boolean;
}

interface FaqRow {
    id: string | null;
    question: string;
    answer: string;
    listText: string; // list items, one per line (maps to list_items[])
    sort_order: number;
    active: boolean;
}

/* ------------------------------------------------------------------ */
/* Small presentational helpers (match the admin design system)        */
/* ------------------------------------------------------------------ */

const SectionHeader = ({
    icon: Icon,
    title,
    hint,
}: {
    icon: typeof Globe;
    title: string;
    hint: string;
}) => (
    <div className="flex items-start gap-3 border-b border-border pb-4 mb-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
        </span>
        <div>
            <h2 className="font-display text-lg font-bold tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground">{hint}</p>
        </div>
    </div>
);

const FieldLabel = ({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) => (
    <Label htmlFor={htmlFor} className="text-sm font-medium">
        {children}
    </Label>
);

const saveButtonClass =
    "min-h-[44px] rounded-xl bg-primary hover:bg-brand-600 text-primary-foreground font-semibold shadow-inset-btn";

/* ------------------------------------------------------------------ */
/* Generic sortable list editor                                        */
/*                                                                     */
/* One reusable card for the homepage tables that share the same shape */
/* (rows with sort_order + active): team members, package benefits,    */
/* certification steps, eligible exams, recognitions, trust features.  */
/* Mirrors the FAQ card exactly: edit inline, save per row, add,       */
/* delete, show or hide, and reorder with up and down arrows.          */
/* ------------------------------------------------------------------ */

type ContentFieldType = "text" | "textarea" | "number" | "switch" | "select";

interface ContentFieldOption {
    value: string;
    label: string;
}

interface ContentField {
    key: string;
    label: string;
    type?: ContentFieldType;
    half?: boolean;
    required?: boolean;
    /** Choices for a select field. */
    options?: ContentFieldOption[];
    /** On new rows, keep this field filled with a kebab version of another field until it is edited by hand. */
    kebabFrom?: string;
}

const kebabCase = (text: string) =>
    text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

interface ContentRow {
    id: string | null;
    sort_order: number;
    active: boolean;
    values: Record<string, any>;
}

interface ContentListSectionProps {
    icon: typeof Globe;
    title: string;
    hint: string;
    table: string;
    fields: ContentField[];
    itemLabel: string;
    addLabel: string;
    filterColumn?: string;
    filterValue?: string;
    headerExtra?: React.ReactNode;
}

const ContentListSection = ({
    icon,
    title,
    hint,
    table,
    fields,
    itemLabel,
    addLabel,
    filterColumn,
    filterValue,
    headerExtra,
}: ContentListSectionProps) => {
    const { toast } = useToast();
    const [rows, setRows] = useState<ContentRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingKey, setSavingKey] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                let query = supabase
                    .from(table)
                    .select(["id", "sort_order", "active", ...fields.map((f) => f.key)].join(", "))
                    .order("sort_order", { ascending: true });
                if (filterColumn && filterValue) query = query.eq(filterColumn, filterValue);
                const { data, error } = await query;
                if (!error && data) {
                    setRows(
                        (data as any[]).map((row) => ({
                            id: row.id,
                            sort_order: row.sort_order ?? 0,
                            active: row.active !== false,
                            values: Object.fromEntries(
                                fields.map((f) => [f.key, row[f.key] ?? (f.type === "switch" ? false : "")])
                            ),
                        }))
                    );
                }
            } catch (e) {
                console.error(`Failed to load ${table}`, e);
            } finally {
                setLoading(false);
            }
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const failed = () =>
        toast({
            title: "That did not save",
            description: "Please try again in a moment.",
            variant: "destructive",
        });

    const done = () =>
        toast({
            title: "Saved",
            description: "Your changes are live on the site.",
        });

    const rowKey = (row: ContentRow, index: number) => row.id ?? `new-${index}`;

    const updateValue = (index: number, key: string, value: any) => {
        setRows((prev) =>
            prev.map((r, i) => {
                if (i !== index) return r;
                const values = { ...r.values, [key]: value };
                // On new rows, keep kebab fields in step with their source until edited by hand.
                if (r.id === null) {
                    for (const f of fields) {
                        if (f.kebabFrom !== key || f.key === key) continue;
                        const current = String(r.values[f.key] ?? "");
                        const stillAuto =
                            current === "" || current === kebabCase(String(r.values[key] ?? ""));
                        if (stillAuto) values[f.key] = kebabCase(String(value ?? ""));
                    }
                }
                return { ...r, values };
            })
        );
    };

    const setActive = (index: number, active: boolean) => {
        setRows((prev) => prev.map((r, i) => (i === index ? { ...r, active } : r)));
    };

    const addRow = () => {
        const nextOrder = rows.length > 0 ? Math.max(...rows.map((r) => r.sort_order)) + 1 : 1;
        setRows((prev) => [
            ...prev,
            {
                id: null,
                sort_order: nextOrder,
                active: true,
                values: Object.fromEntries(
                    fields.map((f) => [
                        f.key,
                        f.type === "switch"
                            ? false
                            : f.type === "number"
                              ? nextOrder
                              : f.type === "select"
                                ? (f.options?.[0]?.value ?? "")
                                : "",
                    ])
                ),
            },
        ]);
    };

    const payloadFor = (row: ContentRow) => {
        const payload: Record<string, any> = {
            sort_order: row.sort_order,
            active: row.active,
        };
        if (filterColumn && filterValue) payload[filterColumn] = filterValue;
        for (const f of fields) {
            const raw = row.values[f.key];
            if (f.type === "switch") payload[f.key] = raw === true;
            else if (f.type === "number") payload[f.key] = Number(raw) || 0;
            else payload[f.key] = typeof raw === "string" ? raw.trim() : raw;
        }
        // Fill any empty kebab field from its source so a blank value never reaches the database.
        for (const f of fields) {
            if (f.kebabFrom && !payload[f.key]) {
                payload[f.key] = kebabCase(String(payload[f.kebabFrom] ?? ""));
            }
        }
        return payload;
    };

    const saveRow = async (index: number) => {
        const row = rows[index];
        const missing = fields.find((f) => f.required && !String(row.values[f.key] ?? "").trim());
        if (missing) {
            toast({
                title: "Almost there",
                description: `Please fill in the ${missing.label.toLowerCase()} before saving.`,
                variant: "destructive",
            });
            return;
        }
        const key = rowKey(row, index);
        setSavingKey(key);
        if (row.id) {
            const { error } = await supabase.from(table).update(payloadFor(row)).eq("id", row.id);
            setSavingKey(null);
            if (error) return failed();
        } else {
            const { data, error } = await supabase
                .from(table)
                .insert(payloadFor(row))
                .select("id")
                .single();
            setSavingKey(null);
            if (error) return failed();
            if (data?.id) {
                setRows((prev) => prev.map((r, i) => (i === index ? { ...r, id: data.id } : r)));
            }
        }
        done();
    };

    const deleteRow = async (index: number) => {
        const row = rows[index];
        if (row.id) {
            const { error } = await supabase.from(table).delete().eq("id", row.id);
            if (error) return failed();
        }
        setRows((prev) => prev.filter((_, i) => i !== index));
        toast({
            title: "Removed",
            description: `That ${itemLabel} is no longer shown on the site.`,
        });
    };

    const moveRow = async (index: number, direction: -1 | 1) => {
        const target = index + direction;
        if (target < 0 || target >= rows.length) return;
        const a = rows[index];
        const b = rows[target];
        // Swap sort orders locally first, then persist saved rows.
        const next = [...rows];
        next[index] = { ...b, sort_order: a.sort_order };
        next[target] = { ...a, sort_order: b.sort_order };
        setRows(next);
        try {
            const updates: Promise<any>[] = [];
            if (a.id) {
                updates.push(
                    Promise.resolve(
                        supabase.from(table).update({ sort_order: b.sort_order }).eq("id", a.id)
                    )
                );
            }
            if (b.id) {
                updates.push(
                    Promise.resolve(
                        supabase.from(table).update({ sort_order: a.sort_order }).eq("id", b.id)
                    )
                );
            }
            const results = await Promise.all(updates);
            if (results.some((r) => r?.error)) failed();
        } catch {
            failed();
        }
    };

    return (
        <div className="bg-card border border-border rounded-2xl p-5 md:p-6">
            <SectionHeader icon={icon} title={title} hint={hint} />
            {headerExtra}

            {loading ? (
                <div className="flex items-center gap-3 rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span>Loading…</span>
                </div>
            ) : (
                <div className="space-y-4">
                    {rows.map((row, index) => {
                        const key = rowKey(row, index);
                        return (
                            <div key={key} className="rounded-xl border border-border bg-background p-4 md:p-5 space-y-4">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-bold text-primary">
                                        {index + 1}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => moveRow(index, -1)}
                                            disabled={index === 0}
                                            aria-label={`Move this ${itemLabel} up`}
                                            className="h-10 w-10 rounded-xl"
                                        >
                                            <ArrowUp className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => moveRow(index, 1)}
                                            disabled={index === rows.length - 1}
                                            aria-label={`Move this ${itemLabel} down`}
                                            className="h-10 w-10 rounded-xl"
                                        >
                                            <ArrowDown className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => deleteRow(index)}
                                            aria-label={`Delete this ${itemLabel}`}
                                            className="h-10 w-10 rounded-xl text-destructive border-destructive/20 hover:bg-destructive hover:text-destructive-foreground"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {fields.map((field) => {
                                        const inputId = `${table}-${field.key}-${index}`;
                                        const span = field.half ? "" : "md:col-span-2";
                                        if (field.type === "switch") {
                                            return (
                                                <div key={field.key} className={`flex items-center gap-3 ${span}`}>
                                                    <Switch
                                                        id={inputId}
                                                        checked={row.values[field.key] === true}
                                                        onCheckedChange={(checked) => updateValue(index, field.key, checked)}
                                                        aria-label={field.label}
                                                    />
                                                    <Label htmlFor={inputId} className="text-sm font-medium">
                                                        {field.label}
                                                    </Label>
                                                </div>
                                            );
                                        }
                                        if (field.type === "select") {
                                            return (
                                                <div key={field.key} className={`space-y-2 ${span}`}>
                                                    <FieldLabel htmlFor={inputId}>{field.label}</FieldLabel>
                                                    <Select
                                                        value={String(row.values[field.key] ?? "")}
                                                        onValueChange={(value) => updateValue(index, field.key, value)}
                                                    >
                                                        <SelectTrigger id={inputId} className="min-h-[44px] rounded-xl" aria-label={field.label}>
                                                            <SelectValue placeholder={field.label} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {(field.options ?? []).map((option) => (
                                                                <SelectItem key={option.value} value={option.value}>
                                                                    {option.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            );
                                        }
                                        if (field.type === "textarea") {
                                            return (
                                                <div key={field.key} className={`space-y-2 ${span}`}>
                                                    <FieldLabel htmlFor={inputId}>{field.label}</FieldLabel>
                                                    <Textarea
                                                        id={inputId}
                                                        className="min-h-[80px] rounded-xl"
                                                        value={String(row.values[field.key] ?? "")}
                                                        onChange={(e) => updateValue(index, field.key, e.target.value)}
                                                    />
                                                </div>
                                            );
                                        }
                                        return (
                                            <div key={field.key} className={`space-y-2 ${span}`}>
                                                <FieldLabel htmlFor={inputId}>{field.label}</FieldLabel>
                                                <Input
                                                    id={inputId}
                                                    type={field.type === "number" ? "number" : "text"}
                                                    className="min-h-[44px] rounded-xl"
                                                    value={String(row.values[field.key] ?? "")}
                                                    onChange={(e) => updateValue(index, field.key, e.target.value)}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <Switch
                                            id={`${table}-active-${index}`}
                                            checked={row.active}
                                            onCheckedChange={(checked) => setActive(index, checked)}
                                            aria-label={`Show this ${itemLabel} on the site`}
                                        />
                                        <Label htmlFor={`${table}-active-${index}`} className="text-sm font-medium">
                                            Show on the site
                                        </Label>
                                    </div>
                                    <Button
                                        onClick={() => saveRow(index)}
                                        disabled={savingKey === key}
                                        className={saveButtonClass}
                                    >
                                        {savingKey === key ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Save className="mr-2 h-4 w-4" />
                                        )}
                                        Save {itemLabel}
                                    </Button>
                                </div>
                            </div>
                        );
                    })}

                    {rows.length === 0 && (
                        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                            Nothing here yet. Add your first {itemLabel} below.
                        </p>
                    )}

                    <Button variant="outline" onClick={addRow} className="min-h-[44px] rounded-xl">
                        <Plus className="mr-2 h-4 w-4" />
                        {addLabel}
                    </Button>
                </div>
            )}
        </div>
    );
};

/* ------------------------------------------------------------------ */
/* Trust features — same editor with a kind toggle                     */
/* ------------------------------------------------------------------ */

const TrustFeaturesEditor = () => {
    const [kind, setKind] = useState<"feature" | "not_for_you">("feature");

    const kindToggle = (
        <div className="mb-5 inline-flex rounded-xl border border-border bg-background p-1" role="group" aria-label="Choose which trust list to edit">
            {([
                ["feature", "Features"],
                ["not_for_you", "Not for you"],
            ] as const).map(([value, label]) => (
                <button
                    key={value}
                    type="button"
                    onClick={() => setKind(value)}
                    aria-pressed={kind === value}
                    className={`min-h-[40px] rounded-lg px-4 text-sm font-semibold transition-colors duration-300 ${
                        kind === value
                            ? "bg-primary text-primary-foreground shadow-inset-btn"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    {label}
                </button>
            ))}
        </div>
    );

    return (
        <ContentListSection
            key={kind}
            icon={ShieldCheck}
            title="Trust Features"
            hint={
                kind === "feature"
                    ? "The benefit pills that scroll across the trust section."
                    : "The honest points that tell Yatris who this offer is not for."
            }
            table="trust_features"
            fields={
                kind === "feature"
                    ? [
                          { key: "title", label: "Title", required: true },
                          { key: "description", label: "Description", type: "textarea" },
                      ]
                    : [{ key: "title", label: "Point", type: "textarea", required: true }]
            }
            itemLabel={kind === "feature" ? "feature" : "point"}
            addLabel={kind === "feature" ? "Add a feature" : "Add a point"}
            filterColumn="kind"
            filterValue={kind}
            headerExtra={kindToggle}
        />
    );
};

/* ------------------------------------------------------------------ */
/* Communities — same editor with a group select on every row          */
/* ------------------------------------------------------------------ */

const COMMUNITY_GROUPS: ContentFieldOption[] = [
    { value: "channel", label: "Channel" },
    { value: "main", label: "Main" },
    { value: "ms_subs", label: "Microsoft groups" },
];

const CommunitiesEditor = () => (
    <ContentListSection
        icon={MessagesSquare}
        title="Communities"
        hint="The community channels and groups Yatris can join across the site."
        table="communities"
        fields={[
            { key: "name", label: "Name", half: true, required: true },
            { key: "url", label: "Link URL", half: true, required: true },
            { key: "tagline", label: "Tagline" },
            { key: "logo_url", label: "Logo URL", half: true },
            { key: "grp", label: "Group", type: "select", half: true, options: COMMUNITY_GROUPS },
        ]}
        itemLabel="community"
        addLabel="Add a community"
    />
);

/* ------------------------------------------------------------------ */
/* Navigation links — same editor with a location toggle               */
/* ------------------------------------------------------------------ */

type NavLocation = "navbar" | "footer_explore" | "footer_quick" | "footer_legal";

const NAV_LOCATIONS: [NavLocation, string][] = [
    ["navbar", "Navbar"],
    ["footer_explore", "Footer Explore"],
    ["footer_quick", "Footer Quick"],
    ["footer_legal", "Footer Legal"],
];

const NavLinksEditor = () => {
    const [location, setLocation] = useState<NavLocation>("navbar");
    const locationLabel = NAV_LOCATIONS.find(([value]) => value === location)?.[1] ?? "Navbar";

    const locationToggle = (
        <div
            className="mb-5 inline-flex flex-wrap gap-1 rounded-xl border border-border bg-background p-1"
            role="group"
            aria-label="Choose where these links live"
        >
            {NAV_LOCATIONS.map(([value, label]) => (
                <button
                    key={value}
                    type="button"
                    onClick={() => setLocation(value)}
                    aria-pressed={location === value}
                    className={`min-h-[40px] rounded-lg px-4 text-sm font-semibold transition-colors duration-300 ${
                        location === value
                            ? "bg-primary text-primary-foreground shadow-inset-btn"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    {label}
                </button>
            ))}
        </div>
    );

    return (
        <ContentListSection
            key={location}
            icon={Link2}
            title="Navigation Links"
            hint={`The links Yatris see in the ${locationLabel} area. Reorder them within this spot.`}
            table="nav_links"
            fields={[
                { key: "label", label: "Label", half: true, required: true },
                { key: "href", label: "Link (href)", half: true, required: true },
            ]}
            itemLabel="link"
            addLabel="Add a link"
            filterColumn="location"
            filterValue={location}
            headerExtra={locationToggle}
        />
    );
};

/* ------------------------------------------------------------------ */
/* Dropdown options — same editor with a list picker                   */
/* ------------------------------------------------------------------ */

const OPTION_LISTS: ContentFieldOption[] = [
    { value: "udemy_creator", label: "Udemy creators" },
    { value: "course_tech", label: "Course technologies" },
    { value: "course_category", label: "Course categories" },
    { value: "store_category", label: "Store categories" },
    { value: "product_level", label: "Product levels" },
    { value: "event_category", label: "Event categories" },
    { value: "sponsor_tier", label: "Sponsor tiers" },
    { value: "sponsorship_area", label: "Sponsorship areas" },
];

const OptionListsEditor = () => {
    const [list, setList] = useState("udemy_creator");
    const listLabel = OPTION_LISTS.find((o) => o.value === list)?.label ?? "Udemy creators";

    const listPicker = (
        <div className="mb-5 max-w-sm space-y-2">
            <FieldLabel htmlFor="option-list-picker">Which list to edit</FieldLabel>
            <Select value={list} onValueChange={setList}>
                <SelectTrigger id="option-list-picker" className="min-h-[44px] rounded-xl" aria-label="Which list to edit">
                    <SelectValue placeholder="Pick a list" />
                </SelectTrigger>
                <SelectContent>
                    {OPTION_LISTS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );

    return (
        <ContentListSection
            key={list}
            icon={ListChecks}
            title="Dropdown Options"
            hint={`The choices shown in the ${listLabel} dropdown. Reorder them within this list.`}
            table="option_lists"
            fields={[
                { key: "label", label: "Label (what Yatris see)", half: true, required: true },
                { key: "value", label: "Value (used behind the scenes)", half: true, kebabFrom: "label" },
            ]}
            itemLabel="option"
            addLabel="Add an option"
            filterColumn="list"
            filterValue={list}
            headerExtra={listPicker}
        />
    );
};

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const AdminSiteContent = () => {
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);
    const [savingStats, setSavingStats] = useState(false);
    const [savingPromo, setSavingPromo] = useState(false);
    const [savingFaqId, setSavingFaqId] = useState<string | null>(null);

    const [contact, setContact] = useState({ ...FALLBACK_SETTINGS.contact });
    const [social, setSocial] = useState({ ...FALLBACK_SETTINGS.social });
    const [booking, setBooking] = useState({ ...FALLBACK_SETTINGS.booking });
    const [brand, setBrand] = useState({ ...FALLBACK_SETTINGS.brand });

    const [stats, setStats] = useState<StatRow[]>([]);
    const [promo, setPromo] = useState<PromoRow>({
        id: null,
        slug: "voucher-offer",
        headline: FALLBACK_PROMOTION.headline,
        discount_text: FALLBACK_PROMOTION.discount_text,
        cta_label: FALLBACK_PROMOTION.cta_label,
        cta_url: FALLBACK_PROMOTION.cta_url,
        active: true,
    });
    const [faqs, setFaqs] = useState<FaqRow[]>([]);

    /* ---------------------------- load ---------------------------- */

    useEffect(() => {
        const load = async () => {
            try {
                const [settingsRes, statsRes, promoRes, faqsRes] = await Promise.all([
                    supabase.from("site_settings").select("key, value"),
                    supabase
                        .from("site_stats")
                        .select("id, key, value, label, sort_order, active")
                        .order("sort_order", { ascending: true }),
                    supabase
                        .from("promotions")
                        .select("id, slug, headline, discount_text, cta_label, cta_url, active")
                        .order("sort_order", { ascending: true })
                        .limit(1),
                    supabase
                        .from("faqs")
                        .select("id, question, answer, list_items, sort_order, active")
                        .order("sort_order", { ascending: true }),
                ]);

                if (settingsRes.data) {
                    for (const row of settingsRes.data) {
                        const value = row.value ?? {};
                        if (row.key === "contact") setContact((prev: any) => ({ ...prev, ...value }));
                        if (row.key === "social") setSocial((prev: any) => ({ ...prev, ...value }));
                        if (row.key === "booking") setBooking((prev: any) => ({ ...prev, ...value }));
                        if (row.key === "brand") setBrand((prev: any) => ({ ...prev, ...value }));
                    }
                }

                if (statsRes.data) {
                    setStats(
                        statsRes.data.map((row: any) => ({
                            id: row.id,
                            key: row.key,
                            value: row.value ?? "",
                            label: row.label ?? "",
                            sort_order: row.sort_order ?? 0,
                            active: row.active !== false,
                        }))
                    );
                }

                if (promoRes.data && promoRes.data.length > 0) {
                    const row: any = promoRes.data[0];
                    setPromo({
                        id: row.id,
                        slug: row.slug ?? "voucher-offer",
                        headline: row.headline ?? "",
                        discount_text: row.discount_text ?? "",
                        cta_label: row.cta_label ?? "",
                        cta_url: row.cta_url ?? "",
                        active: row.active !== false,
                    });
                }

                if (faqsRes.data) {
                    setFaqs(
                        faqsRes.data.map((row: any) => ({
                            id: row.id,
                            question: row.question ?? "",
                            answer: row.answer ?? "",
                            listText: Array.isArray(row.list_items) ? row.list_items.join("\n") : "",
                            sort_order: row.sort_order ?? 0,
                            active: row.active !== false,
                        }))
                    );
                }
            } catch (e) {
                console.error("Failed to load site content", e);
                toast({
                    title: "Could not load everything",
                    description: "Some values may be missing. Please refresh and try again.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const saveFailed = () =>
        toast({
            title: "That did not save",
            description: "Please try again in a moment.",
            variant: "destructive",
        });

    const saveDone = () =>
        toast({
            title: "Saved",
            description: "Your changes are live on the site.",
        });

    /* -------------------------- settings -------------------------- */

    const saveSettings = async () => {
        setSavingSettings(true);
        const { error } = await supabase.from("site_settings").upsert(
            [
                { key: "contact", value: contact },
                { key: "social", value: social },
                { key: "booking", value: booking },
                { key: "brand", value: brand },
            ],
            { onConflict: "key" }
        );
        setSavingSettings(false);
        if (error) return saveFailed();
        saveDone();
    };

    /* ---------------------------- stats --------------------------- */

    const updateStat = (id: string, field: "value" | "label", next: string) => {
        setStats((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: next } : s)));
    };

    const toggleStat = (id: string, active: boolean) => {
        setStats((prev) => prev.map((s) => (s.id === id ? { ...s, active } : s)));
    };

    const saveStats = async () => {
        setSavingStats(true);
        try {
            const results = await Promise.all(
                stats.map((s) =>
                    supabase
                        .from("site_stats")
                        .update({ value: s.value, label: s.label, active: s.active })
                        .eq("id", s.id)
                )
            );
            setSavingStats(false);
            if (results.some((r) => r.error)) return saveFailed();
            saveDone();
        } catch {
            setSavingStats(false);
            saveFailed();
        }
    };

    /* -------------------------- promotion ------------------------- */

    const savePromo = async () => {
        setSavingPromo(true);
        const payload = {
            slug: promo.slug || "voucher-offer",
            headline: promo.headline,
            discount_text: promo.discount_text,
            cta_label: promo.cta_label,
            cta_url: promo.cta_url,
            active: promo.active,
        };
        const { error } = promo.id
            ? await supabase.from("promotions").update(payload).eq("id", promo.id)
            : await supabase.from("promotions").upsert(payload, { onConflict: "slug" });
        setSavingPromo(false);
        if (error) return saveFailed();
        saveDone();
    };

    /* ----------------------------- FAQs --------------------------- */

    const updateFaq = (index: number, patch: Partial<FaqRow>) => {
        setFaqs((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
    };

    const addFaq = () => {
        const nextOrder = faqs.length > 0 ? Math.max(...faqs.map((f) => f.sort_order)) + 1 : 1;
        setFaqs((prev) => [
            ...prev,
            { id: null, question: "", answer: "", listText: "", sort_order: nextOrder, active: true },
        ]);
    };

    const faqPayload = (faq: FaqRow) => {
        const listItems = faq.listText
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean);
        return {
            question: faq.question.trim(),
            answer: faq.answer.trim(),
            list_items: listItems.length > 0 ? listItems : null,
            sort_order: faq.sort_order,
            active: faq.active,
        };
    };

    const saveFaq = async (index: number) => {
        const faq = faqs[index];
        if (!faq.question.trim() || !faq.answer.trim()) {
            toast({
                title: "Almost there",
                description: "Please fill in both the question and the answer before saving.",
                variant: "destructive",
            });
            return;
        }
        setSavingFaqId(faq.id ?? `new-${index}`);
        if (faq.id) {
            const { error } = await supabase.from("faqs").update(faqPayload(faq)).eq("id", faq.id);
            setSavingFaqId(null);
            if (error) return saveFailed();
        } else {
            const { data, error } = await supabase
                .from("faqs")
                .insert(faqPayload(faq))
                .select("id")
                .single();
            setSavingFaqId(null);
            if (error) return saveFailed();
            if (data?.id) updateFaq(index, { id: data.id });
        }
        saveDone();
    };

    const deleteFaq = async (index: number) => {
        const faq = faqs[index];
        if (faq.id) {
            const { error } = await supabase.from("faqs").delete().eq("id", faq.id);
            if (error) return saveFailed();
        }
        setFaqs((prev) => prev.filter((_, i) => i !== index));
        toast({
            title: "Question removed",
            description: "That FAQ is no longer shown on the site.",
        });
    };

    const moveFaq = async (index: number, direction: -1 | 1) => {
        const target = index + direction;
        if (target < 0 || target >= faqs.length) return;
        const a = faqs[index];
        const b = faqs[target];
        // Swap sort orders locally first, then persist saved rows.
        const next = [...faqs];
        next[index] = { ...b, sort_order: a.sort_order };
        next[target] = { ...a, sort_order: b.sort_order };
        setFaqs(next);
        try {
            const updates: Promise<any>[] = [];
            if (a.id) {
                updates.push(
                    Promise.resolve(
                        supabase.from("faqs").update({ sort_order: b.sort_order }).eq("id", a.id)
                    )
                );
            }
            if (b.id) {
                updates.push(
                    Promise.resolve(
                        supabase.from("faqs").update({ sort_order: a.sort_order }).eq("id", b.id)
                    )
                );
            }
            const results = await Promise.all(updates);
            if (results.some((r) => r?.error)) saveFailed();
        } catch {
            saveFailed();
        }
    };

    /* ----------------------------- view --------------------------- */

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Loading your site content…</span>
            </div>
        );
    }

    return (
        <div className="px-4 md:px-8 py-8 md:py-10">
            <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
                {/* Header band — matches the admin workspace panels */}
                <ScrollReveal>
                    <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-6 md:p-8">
                        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
                        <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-brand-200/20 blur-3xl" />

                        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                            <div className="space-y-1.5">
                                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Site content
                                </p>
                                <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">
                                    Site & <span className="gradient-text">Homepage</span>
                                </h1>
                                <p className="text-muted-foreground">
                                    Edit the words and numbers Yatris see across the site. Every save goes live right away.
                                </p>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>

                {/* ── Site settings ── */}
                <ScrollReveal delay={0.05}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card border border-border rounded-2xl p-5 md:p-6"
                    >
                        <SectionHeader
                            icon={Globe}
                            title="Site Settings"
                            hint="Contact details, social links, booking, and brand copy."
                        />

                        <div className="space-y-8">
                            {/* Contact */}
                            <div>
                                <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                                    <Phone className="h-3.5 w-3.5" /> Contact
                                </p>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <FieldLabel htmlFor="contact-email">Email</FieldLabel>
                                        <Input id="contact-email" className="min-h-[44px] rounded-xl" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <FieldLabel htmlFor="contact-phone">Phone</FieldLabel>
                                        <Input id="contact-phone" className="min-h-[44px] rounded-xl" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <FieldLabel htmlFor="contact-phone-href">Phone link (tel: format)</FieldLabel>
                                        <Input id="contact-phone-href" className="min-h-[44px] rounded-xl" value={contact.phone_href} onChange={(e) => setContact({ ...contact, phone_href: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <FieldLabel htmlFor="contact-location">Location</FieldLabel>
                                        <Input id="contact-location" className="min-h-[44px] rounded-xl" value={contact.location} onChange={(e) => setContact({ ...contact, location: e.target.value })} />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <FieldLabel htmlFor="contact-hours">Office hours</FieldLabel>
                                        <Input id="contact-hours" className="min-h-[44px] rounded-xl" value={contact.hours} onChange={(e) => setContact({ ...contact, hours: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            {/* Social */}
                            <div>
                                <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                                    <Share2 className="h-3.5 w-3.5" /> Social links
                                </p>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <FieldLabel htmlFor="social-youtube">YouTube</FieldLabel>
                                        <Input id="social-youtube" className="min-h-[44px] rounded-xl" value={social.youtube} onChange={(e) => setSocial({ ...social, youtube: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <FieldLabel htmlFor="social-linkedin">LinkedIn</FieldLabel>
                                        <Input id="social-linkedin" className="min-h-[44px] rounded-xl" value={social.linkedin} onChange={(e) => setSocial({ ...social, linkedin: e.target.value })} />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <FieldLabel htmlFor="social-whatsapp">WhatsApp</FieldLabel>
                                        <Input id="social-whatsapp" className="min-h-[44px] rounded-xl" value={social.whatsapp} onChange={(e) => setSocial({ ...social, whatsapp: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            {/* Booking */}
                            <div>
                                <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                                    <CalendarClock className="h-3.5 w-3.5" /> Booking
                                </p>
                                <div className="space-y-2">
                                    <FieldLabel htmlFor="booking-calendly">Calendly URL</FieldLabel>
                                    <Input id="booking-calendly" className="min-h-[44px] rounded-xl" value={booking.calendly_url} onChange={(e) => setBooking({ ...booking, calendly_url: e.target.value })} />
                                </div>
                            </div>

                            {/* Brand */}
                            <div>
                                <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                                    <Sparkles className="h-3.5 w-3.5" /> Brand
                                </p>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <FieldLabel htmlFor="brand-name">Brand name</FieldLabel>
                                        <Input id="brand-name" className="min-h-[44px] rounded-xl" value={brand.name} onChange={(e) => setBrand({ ...brand, name: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <FieldLabel htmlFor="brand-designed-by">Designed by</FieldLabel>
                                        <Input id="brand-designed-by" className="min-h-[44px] rounded-xl" value={brand.designed_by} onChange={(e) => setBrand({ ...brand, designed_by: e.target.value })} />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <FieldLabel htmlFor="brand-tagline">Tagline (shown in the footer)</FieldLabel>
                                        <Textarea id="brand-tagline" className="min-h-[80px] rounded-xl" value={brand.tagline} onChange={(e) => setBrand({ ...brand, tagline: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            <Button onClick={saveSettings} disabled={savingSettings} className={saveButtonClass}>
                                {savingSettings ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save site settings
                            </Button>
                        </div>
                    </motion.div>
                </ScrollReveal>

                {/* ── Stats ── */}
                <ScrollReveal delay={0.05}>
                    <div className="bg-card border border-border rounded-2xl p-5 md:p-6">
                        <SectionHeader
                            icon={BarChart3}
                            title="Stats"
                            hint="The numbers shown on the homepage, community, and training pages."
                        />

                        <div className="space-y-3">
                            {stats.map((stat) => (
                                <div
                                    key={stat.id}
                                    className="grid grid-cols-1 items-center gap-3 rounded-xl border border-border bg-background p-4 sm:grid-cols-[110px_1fr_1fr_auto]"
                                >
                                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        {stat.key}
                                    </span>
                                    <div className="space-y-1">
                                        <FieldLabel htmlFor={`stat-value-${stat.id}`}>Value</FieldLabel>
                                        <Input
                                            id={`stat-value-${stat.id}`}
                                            className="min-h-[44px] rounded-xl"
                                            value={stat.value}
                                            onChange={(e) => updateStat(stat.id, "value", e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <FieldLabel htmlFor={`stat-label-${stat.id}`}>Label</FieldLabel>
                                        <Input
                                            id={`stat-label-${stat.id}`}
                                            className="min-h-[44px] rounded-xl"
                                            value={stat.label}
                                            onChange={(e) => updateStat(stat.id, "label", e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 sm:flex-col sm:gap-1">
                                        <span className="text-xs text-muted-foreground">Visible</span>
                                        <Switch
                                            checked={stat.active}
                                            onCheckedChange={(checked) => toggleStat(stat.id, checked)}
                                            aria-label={`Show the ${stat.key} stat on the site`}
                                        />
                                    </div>
                                </div>
                            ))}
                            {stats.length === 0 && (
                                <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                                    No stats found yet. They will appear here once the table has rows.
                                </p>
                            )}

                            <Button onClick={saveStats} disabled={savingStats || stats.length === 0} className={saveButtonClass}>
                                {savingStats ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save stats
                            </Button>
                        </div>
                    </div>
                </ScrollReveal>

                {/* ── Promotion ── */}
                <ScrollReveal delay={0.05}>
                    <div className="bg-card border border-border rounded-2xl p-5 md:p-6">
                        <SectionHeader
                            icon={Megaphone}
                            title="Promotion"
                            hint="The voucher offer shown in the homepage hero."
                        />

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <FieldLabel htmlFor="promo-headline">Headline</FieldLabel>
                                <Input id="promo-headline" className="min-h-[44px] rounded-xl" value={promo.headline} onChange={(e) => setPromo({ ...promo, headline: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <FieldLabel htmlFor="promo-discount">Discount text</FieldLabel>
                                    <Input id="promo-discount" className="min-h-[44px] rounded-xl" value={promo.discount_text} onChange={(e) => setPromo({ ...promo, discount_text: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <FieldLabel htmlFor="promo-cta-label">Button label</FieldLabel>
                                    <Input id="promo-cta-label" className="min-h-[44px] rounded-xl" value={promo.cta_label} onChange={(e) => setPromo({ ...promo, cta_label: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <FieldLabel htmlFor="promo-cta-url">Button URL</FieldLabel>
                                <Input id="promo-cta-url" className="min-h-[44px] rounded-xl" value={promo.cta_url} onChange={(e) => setPromo({ ...promo, cta_url: e.target.value })} />
                            </div>
                            <div className="flex items-center gap-3">
                                <Switch
                                    id="promo-active"
                                    checked={promo.active}
                                    onCheckedChange={(checked) => setPromo({ ...promo, active: checked })}
                                    aria-label="Promotion is live"
                                />
                                <Label htmlFor="promo-active" className="text-sm font-medium">
                                    Promotion is live
                                </Label>
                            </div>

                            <Button onClick={savePromo} disabled={savingPromo} className={saveButtonClass}>
                                {savingPromo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save promotion
                            </Button>
                        </div>
                    </div>
                </ScrollReveal>

                {/* ── FAQs ── */}
                <ScrollReveal delay={0.05}>
                    <div className="bg-card border border-border rounded-2xl p-5 md:p-6">
                        <SectionHeader
                            icon={HelpCircle}
                            title="FAQs"
                            hint="The questions and answers shown on the homepage. Save each card after editing."
                        />

                        <div className="space-y-4">
                            {faqs.map((faq, index) => (
                                <div key={faq.id ?? `new-${index}`} className="rounded-xl border border-border bg-background p-4 md:p-5 space-y-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-bold text-primary">
                                            {index + 1}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => moveFaq(index, -1)}
                                                disabled={index === 0}
                                                aria-label="Move this question up"
                                                className="h-10 w-10 rounded-xl"
                                            >
                                                <ArrowUp className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => moveFaq(index, 1)}
                                                disabled={index === faqs.length - 1}
                                                aria-label="Move this question down"
                                                className="h-10 w-10 rounded-xl"
                                            >
                                                <ArrowDown className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => deleteFaq(index)}
                                                aria-label="Delete this question"
                                                className="h-10 w-10 rounded-xl text-destructive border-destructive/20 hover:bg-destructive hover:text-destructive-foreground"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <FieldLabel htmlFor={`faq-q-${index}`}>Question</FieldLabel>
                                        <Textarea
                                            id={`faq-q-${index}`}
                                            className="min-h-[60px] rounded-xl"
                                            value={faq.question}
                                            onChange={(e) => updateFaq(index, { question: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <FieldLabel htmlFor={`faq-a-${index}`}>Answer (type the word list to show bullet points instead)</FieldLabel>
                                        <Textarea
                                            id={`faq-a-${index}`}
                                            className="min-h-[100px] rounded-xl"
                                            value={faq.answer}
                                            onChange={(e) => updateFaq(index, { answer: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <FieldLabel htmlFor={`faq-list-${index}`}>List items, one per line (optional)</FieldLabel>
                                        <Textarea
                                            id={`faq-list-${index}`}
                                            className="min-h-[80px] rounded-xl"
                                            value={faq.listText}
                                            onChange={(e) => updateFaq(index, { listText: e.target.value })}
                                        />
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <Switch
                                                id={`faq-active-${index}`}
                                                checked={faq.active}
                                                onCheckedChange={(checked) => updateFaq(index, { active: checked })}
                                                aria-label="Show this question on the site"
                                            />
                                            <Label htmlFor={`faq-active-${index}`} className="text-sm font-medium">
                                                Show on the site
                                            </Label>
                                        </div>
                                        <Button
                                            onClick={() => saveFaq(index)}
                                            disabled={savingFaqId === (faq.id ?? `new-${index}`)}
                                            className={saveButtonClass}
                                        >
                                            {savingFaqId === (faq.id ?? `new-${index}`) ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Save className="mr-2 h-4 w-4" />
                                            )}
                                            Save question
                                        </Button>
                                    </div>
                                </div>
                            ))}

                            <Button variant="outline" onClick={addFaq} className="min-h-[44px] rounded-xl">
                                <Plus className="mr-2 h-4 w-4" />
                                Add a question
                            </Button>
                        </div>
                    </div>
                </ScrollReveal>

                {/* ── Team ── */}
                <ScrollReveal delay={0.05}>
                    <ContentListSection
                        icon={Users}
                        title="Team"
                        hint="The people shown in the Meet the Team section on the homepage."
                        table="team_members"
                        fields={[
                            { key: "name", label: "Name", half: true, required: true },
                            { key: "role", label: "Role", half: true, required: true },
                            { key: "image_url", label: "Photo URL" },
                            { key: "portfolio_url", label: "Portfolio URL" },
                        ]}
                        itemLabel="team member"
                        addLabel="Add a team member"
                    />
                </ScrollReveal>

                {/* ── Package benefits ── */}
                <ScrollReveal delay={0.05}>
                    <ContentListSection
                        icon={Gift}
                        title="Package Benefits"
                        hint="The flip cards under What's Included in the certification flow."
                        table="package_benefits"
                        fields={[
                            { key: "title", label: "Title", required: true },
                            { key: "description", label: "Description", type: "textarea" },
                        ]}
                        itemLabel="benefit"
                        addLabel="Add a benefit"
                    />
                </ScrollReveal>

                {/* ── Certification steps ── */}
                <ScrollReveal delay={0.05}>
                    <ContentListSection
                        icon={ListOrdered}
                        title="Certification Steps"
                        hint="The numbered journey from picking a time to exam scheduling."
                        table="certification_steps"
                        fields={[
                            { key: "step_number", label: "Step number", type: "number", half: true },
                            { key: "title", label: "Title", half: true, required: true },
                            { key: "description", label: "Description", type: "textarea" },
                            { key: "action_label", label: "Button label (leave empty for no button)", half: true },
                            { key: "action_is_popup", label: "Button opens the Calendly popup", type: "switch", half: true },
                        ]}
                        itemLabel="step"
                        addLabel="Add a step"
                    />
                </ScrollReveal>

                {/* ── Eligible exams ── */}
                <ScrollReveal delay={0.05}>
                    <ContentListSection
                        icon={BadgeCheck}
                        title="Eligible Exams"
                        hint="The AWS exams covered by the 50% OFF offer."
                        table="eligible_exams"
                        fields={[
                            { key: "title", label: "Exam title", required: true },
                            { key: "exam_code", label: "Exam code (optional)", half: true },
                        ]}
                        itemLabel="exam"
                        addLabel="Add an exam"
                    />
                </ScrollReveal>

                {/* ── Recognitions ── */}
                <ScrollReveal delay={0.05}>
                    <ContentListSection
                        icon={Award}
                        title="Recognitions"
                        hint="The instructor recognition badges on the blue band."
                        table="recognitions"
                        fields={[
                            { key: "label", label: "Label", half: true, required: true },
                            { key: "logo_url", label: "Logo URL", half: true },
                        ]}
                        itemLabel="recognition"
                        addLabel="Add a recognition"
                    />
                </ScrollReveal>

                {/* ── Trust features ── */}
                <ScrollReveal delay={0.05}>
                    <TrustFeaturesEditor />
                </ScrollReveal>

                {/* ── Communities ── */}
                <ScrollReveal delay={0.05}>
                    <CommunitiesEditor />
                </ScrollReveal>

                {/* ── Navigation links ── */}
                <ScrollReveal delay={0.05}>
                    <NavLinksEditor />
                </ScrollReveal>

                {/* ── Dropdown options ── */}
                <ScrollReveal delay={0.05}>
                    <OptionListsEditor />
                </ScrollReveal>
            </div>
        </div>
    );
};

export default AdminSiteContent;
