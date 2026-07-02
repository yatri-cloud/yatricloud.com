import { useEffect, useState } from "react";
import {
    ArrowDown,
    ArrowUp,
    CalendarClock,
    Loader2,
    Pencil,
    Plus,
    Save,
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
import type {
    Mentor as MentorRecord,
    AvailabilityRule as AvailabilityRuleRecord,
} from "@/lib/mentorship";

/* ------------------------------------------------------------------ */
/* Types — canonical shapes from @/lib/mentorship, narrowed to the     */
/* columns this admin page actually selects.                           */
/* ------------------------------------------------------------------ */

type Mentor = Omit<MentorRecord, "created_at" | "updated_at">;

type AvailabilityRule = Omit<AvailabilityRuleRecord, "updated_at">;

interface MentorFormState {
    slug: string;
    slugTouched: boolean;
    name: string;
    headline: string;
    bio: string;
    photo_url: string;
    linkedin_url: string;
    expertise: string;
    languages: string;
    timezone: string;
    notice_hours: string;
    booking_window_days: string;
    buffer_min: string;
    contact_email: string;
    login_email: string;
    razorpay_account_id: string;
    commission_percent: string;
    is_featured: boolean;
    status: string;
}

const EMPTY_FORM: MentorFormState = {
    slug: "",
    slugTouched: false,
    name: "",
    headline: "",
    bio: "",
    photo_url: "",
    linkedin_url: "",
    expertise: "",
    languages: "English, Hindi",
    timezone: "Asia/Kolkata",
    notice_hours: "12",
    booking_window_days: "30",
    buffer_min: "15",
    contact_email: "",
    login_email: "",
    razorpay_account_id: "",
    commission_percent: "",
    is_featured: false,
    status: "published",
};

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const kebabCase = (text: string) =>
    text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

const listToText = (list: string[]) => (list ?? []).join(", ");
const textToList = (text: string) =>
    text
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

/** "18:00:00" → "18:00" for time inputs. */
const toTimeInput = (value: string) => (value ?? "").slice(0, 5);

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

const AdminMentors = () => {
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [mentors, setMentors] = useState<Mentor[]>([]);
    const [contactEmails, setContactEmails] = useState<Record<string, string>>({});
    const [loginEmails, setLoginEmails] = useState<Record<string, string>>({});
    const [totals, setTotals] = useState<{
        mentors: number;
        published: number;
        services: number;
        bookings: number;
    } | null>(null);

    // Add or edit dialog
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<MentorFormState>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    // Delete confirm
    const [mentorToDelete, setMentorToDelete] = useState<Mentor | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Availability dialog
    const [availabilityMentor, setAvailabilityMentor] = useState<Mentor | null>(null);
    const [rules, setRules] = useState<AvailabilityRule[]>([]);
    const [loadingRules, setLoadingRules] = useState(false);
    const [newRule, setNewRule] = useState({ weekday: "1", start_time: "18:00", end_time: "21:00" });
    const [savingRule, setSavingRule] = useState(false);

    /* --------------------------- toasts --------------------------- */

    const saveDone = () => toast({ title: "Saved", description: "The change is live." });

    const saveFailed = () =>
        toast({ title: "That did not save", description: "Please try again.", variant: "destructive" });

    /* ---------------------------- load ---------------------------- */

    /** Oversight totals for the band under the header (count only queries). */
    const loadTotals = async () => {
        const [allMentors, publishedMentors, allServices, allBookings] = await Promise.all([
            supabase.from("mentors").select("id", { count: "exact", head: true }),
            supabase
                .from("mentors")
                .select("id", { count: "exact", head: true })
                .eq("status", "published"),
            supabase.from("mentorship_services").select("id", { count: "exact", head: true }),
            supabase.from("mentorship_bookings").select("id", { count: "exact", head: true }),
        ]);
        setTotals({
            mentors: allMentors.count ?? 0,
            published: publishedMentors.count ?? 0,
            services: allServices.count ?? 0,
            bookings: allBookings.count ?? 0,
        });
    };

    const loadMentors = async () => {
        void loadTotals();
        const { data, error } = await supabase
            .from("mentors")
            .select(
                "id, user_id, slug, name, headline, bio, photo_url, linkedin_url, expertise, languages, timezone, notice_hours, booking_window_days, buffer_min, avg_rating, review_count, is_featured, sort_order, status, razorpay_account_id, commission_percent"
            )
            .order("sort_order", { ascending: true });
        if (error) {
            console.error("Failed to load mentors", error);
            toast({
                title: "Could not load mentors",
                description: "Please refresh the page and try again.",
                variant: "destructive",
            });
            return [] as Mentor[];
        }
        const rows: Mentor[] = (data ?? []).map((row: any) => ({
            id: row.id,
            user_id: row.user_id ?? null,
            slug: row.slug ?? "",
            name: row.name ?? "",
            headline: row.headline ?? "",
            bio: row.bio ?? "",
            photo_url: row.photo_url ?? null,
            linkedin_url: row.linkedin_url ?? null,
            expertise: row.expertise ?? [],
            languages: row.languages ?? [],
            timezone: row.timezone ?? "Asia/Kolkata",
            notice_hours: row.notice_hours ?? 12,
            booking_window_days: row.booking_window_days ?? 30,
            buffer_min: row.buffer_min ?? 15,
            avg_rating: Number(row.avg_rating ?? 0),
            review_count: row.review_count ?? 0,
            is_featured: row.is_featured === true,
            sort_order: row.sort_order ?? 0,
            status: row.status ?? "published",
            razorpay_account_id: row.razorpay_account_id ?? null,
            commission_percent: row.commission_percent ?? null,
        }));
        setMentors(rows);

        // Private contact emails (admin readable) and linked login emails.
        const { data: privateRows } = await supabase
            .from("mentor_private")
            .select("mentor_id, contact_email");
        const contacts: Record<string, string> = {};
        (privateRows ?? []).forEach((row: any) => {
            contacts[row.mentor_id] = row.contact_email ?? "";
        });
        setContactEmails(contacts);

        const userIds = rows.map((m) => m.user_id).filter(Boolean) as string[];
        if (userIds.length > 0) {
            const { data: profileRows } = await supabase
                .from("profiles")
                .select("id, email")
                .in("id", userIds);
            const logins: Record<string, string> = {};
            (profileRows ?? []).forEach((row: any) => {
                logins[row.id] = row.email ?? "";
            });
            setLoginEmails(logins);
        } else {
            setLoginEmails({});
        }
        return rows;
    };

    useEffect(() => {
        const init = async () => {
            await loadMentors();
            setLoading(false);
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* --------------------------- mentors --------------------------- */

    const openAdd = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setDialogOpen(true);
    };

    const openEdit = (mentor: Mentor) => {
        setEditingId(mentor.id);
        setForm({
            slug: mentor.slug,
            slugTouched: true,
            name: mentor.name,
            headline: mentor.headline,
            bio: mentor.bio,
            photo_url: mentor.photo_url ?? "",
            linkedin_url: mentor.linkedin_url ?? "",
            expertise: listToText(mentor.expertise),
            languages: listToText(mentor.languages),
            timezone: mentor.timezone,
            notice_hours: String(mentor.notice_hours),
            booking_window_days: String(mentor.booking_window_days),
            buffer_min: String(mentor.buffer_min),
            contact_email: contactEmails[mentor.id] ?? "",
            login_email: mentor.user_id ? loginEmails[mentor.user_id] ?? "" : "",
            razorpay_account_id: mentor.razorpay_account_id ?? "",
            commission_percent: mentor.commission_percent != null ? String(mentor.commission_percent) : "",
            is_featured: mentor.is_featured,
            status: mentor.status,
        });
        setDialogOpen(true);
    };

    const updateName = (name: string) => {
        setForm((prev) => ({
            ...prev,
            name,
            slug: prev.slugTouched ? prev.slug : kebabCase(name),
        }));
    };

    /** Look up a profile by email so the mentor can sign in and self serve. */
    const resolveLoginUserId = async (
        email: string,
        currentUserId: string | null
    ): Promise<{ ok: boolean; userId: string | null }> => {
        const trimmed = email.trim().toLowerCase();
        if (!trimmed) return { ok: true, userId: null };
        const { data, error } = await supabase
            .from("profiles")
            .select("id")
            .ilike("email", trimmed)
            .maybeSingle();
        if (error || !data) {
            toast({
                title: "No account with that email",
                description: "The mentor was saved, but ask them to sign up first, then link the login here.",
                variant: "destructive",
            });
            return { ok: false, userId: currentUserId };
        }
        return { ok: true, userId: data.id };
    };

    const saveMentor = async () => {
        const name = form.name.trim();
        const slug = form.slug.trim();
        if (!name || !slug) {
            toast({
                title: "Almost there",
                description: "Please fill in the name and the slug before saving.",
                variant: "destructive",
            });
            return;
        }
        setSaving(true);
        const editing = editingId ? mentors.find((m) => m.id === editingId) ?? null : null;
        const { userId } = await resolveLoginUserId(form.login_email, editing?.user_id ?? null);

        const payload = {
            slug,
            name,
            headline: form.headline.trim(),
            bio: form.bio.trim(),
            photo_url: form.photo_url.trim() || null,
            linkedin_url: form.linkedin_url.trim() || null,
            expertise: textToList(form.expertise),
            languages: textToList(form.languages),
            timezone: form.timezone.trim() || "Asia/Kolkata",
            notice_hours: Number.parseInt(form.notice_hours, 10) || 0,
            booking_window_days: Number.parseInt(form.booking_window_days, 10) || 30,
            buffer_min: Number.parseInt(form.buffer_min, 10) || 0,
            razorpay_account_id: form.razorpay_account_id.trim() || null,
            commission_percent: form.commission_percent.trim() === "" ? null : Number(form.commission_percent),
            is_featured: form.is_featured,
            status: form.status,
            user_id: userId,
        };

        let mentorId = editingId;
        if (editingId) {
            const { error } = await supabase.from("mentors").update(payload).eq("id", editingId);
            if (error) {
                setSaving(false);
                return saveFailed();
            }
        } else {
            const nextOrder =
                mentors.length > 0 ? Math.max(...mentors.map((m) => m.sort_order)) + 1 : 1;
            const { data, error } = await supabase
                .from("mentors")
                .insert({ ...payload, sort_order: nextOrder })
                .select("id")
                .single();
            if (error || !data) {
                setSaving(false);
                return saveFailed();
            }
            mentorId = data.id;
        }

        // Private contact email lives in mentor_private (never public).
        const contactEmail = form.contact_email.trim();
        if (mentorId) {
            if (contactEmail) {
                const { error } = await supabase
                    .from("mentor_private")
                    .upsert({ mentor_id: mentorId, contact_email: contactEmail });
                if (error) {
                    setSaving(false);
                    return saveFailed();
                }
            } else if (contactEmails[mentorId]) {
                await supabase.from("mentor_private").delete().eq("mentor_id", mentorId);
            }
        }

        setSaving(false);
        setDialogOpen(false);
        await loadMentors();
        saveDone();
    };

    const toggleStatus = async (mentor: Mentor, published: boolean) => {
        const status = published ? "published" : "draft";
        setMentors((prev) => prev.map((m) => (m.id === mentor.id ? { ...m, status } : m)));
        const { error } = await supabase.from("mentors").update({ status }).eq("id", mentor.id);
        if (error) {
            setMentors((prev) =>
                prev.map((m) => (m.id === mentor.id ? { ...m, status: mentor.status } : m))
            );
            return saveFailed();
        }
        void loadTotals();
        saveDone();
    };

    const toggleFeatured = async (mentor: Mentor, is_featured: boolean) => {
        setMentors((prev) => prev.map((m) => (m.id === mentor.id ? { ...m, is_featured } : m)));
        const { error } = await supabase.from("mentors").update({ is_featured }).eq("id", mentor.id);
        if (error) {
            setMentors((prev) =>
                prev.map((m) => (m.id === mentor.id ? { ...m, is_featured: !is_featured } : m))
            );
            return saveFailed();
        }
        saveDone();
    };

    const moveMentor = async (mentor: Mentor, direction: -1 | 1) => {
        const index = mentors.findIndex((m) => m.id === mentor.id);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= mentors.length) return;
        const a = mentors[index];
        const b = mentors[target];
        const orderA = a.sort_order === b.sort_order ? target + 1 : b.sort_order;
        const orderB = a.sort_order === b.sort_order ? index + 1 : a.sort_order;
        const next = [...mentors];
        next[index] = { ...b, sort_order: orderB };
        next[target] = { ...a, sort_order: orderA };
        setMentors(next);
        const [resA, resB] = await Promise.all([
            supabase.from("mentors").update({ sort_order: orderA }).eq("id", a.id),
            supabase.from("mentors").update({ sort_order: orderB }).eq("id", b.id),
        ]);
        if (resA.error || resB.error) {
            setMentors(mentors);
            return saveFailed();
        }
        saveDone();
    };

    const confirmDelete = async () => {
        if (!mentorToDelete) return;
        setDeleting(true);
        const { error } = await supabase.from("mentors").delete().eq("id", mentorToDelete.id);
        setDeleting(false);
        if (error) {
            setMentorToDelete(null);
            return saveFailed();
        }
        setMentorToDelete(null);
        await loadMentors();
        toast({
            title: "Mentor removed",
            description: "Their profile, services and availability are no longer on the site.",
        });
    };

    /* ------------------------- availability ------------------------ */

    const openAvailability = async (mentor: Mentor) => {
        setAvailabilityMentor(mentor);
        setLoadingRules(true);
        setRules([]);
        const { data, error } = await supabase
            .from("mentor_availability")
            .select("id, mentor_id, weekday, start_time, end_time, active")
            .eq("mentor_id", mentor.id)
            .order("weekday", { ascending: true })
            .order("start_time", { ascending: true });
        if (error) {
            console.error("Failed to load availability", error);
            toast({
                title: "Could not load availability",
                description: "Please close the dialog and try again.",
                variant: "destructive",
            });
        } else {
            setRules(
                (data ?? []).map((row: any) => ({
                    id: row.id,
                    mentor_id: row.mentor_id,
                    weekday: row.weekday ?? 0,
                    start_time: row.start_time ?? "",
                    end_time: row.end_time ?? "",
                    active: row.active !== false,
                }))
            );
        }
        setLoadingRules(false);
    };

    const addRule = async () => {
        if (!availabilityMentor) return;
        if (!newRule.start_time || !newRule.end_time || newRule.end_time <= newRule.start_time) {
            toast({
                title: "Check the times",
                description: "The end time must come after the start time.",
                variant: "destructive",
            });
            return;
        }
        setSavingRule(true);
        const { data, error } = await supabase
            .from("mentor_availability")
            .insert({
                mentor_id: availabilityMentor.id,
                weekday: Number.parseInt(newRule.weekday, 10),
                start_time: newRule.start_time,
                end_time: newRule.end_time,
                active: true,
            })
            .select("id, mentor_id, weekday, start_time, end_time, active")
            .single();
        setSavingRule(false);
        if (error || !data) return saveFailed();
        setRules((prev) =>
            [...prev, {
                id: data.id,
                mentor_id: data.mentor_id,
                weekday: data.weekday ?? 0,
                start_time: data.start_time ?? "",
                end_time: data.end_time ?? "",
                active: data.active !== false,
            }].sort((a, b) => a.weekday - b.weekday || a.start_time.localeCompare(b.start_time))
        );
        saveDone();
    };

    const toggleRule = async (rule: AvailabilityRule, active: boolean) => {
        setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, active } : r)));
        const { error } = await supabase
            .from("mentor_availability")
            .update({ active })
            .eq("id", rule.id);
        if (error) {
            setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, active: !active } : r)));
            return saveFailed();
        }
        saveDone();
    };

    const deleteRule = async (rule: AvailabilityRule) => {
        const { error } = await supabase.from("mentor_availability").delete().eq("id", rule.id);
        if (error) return saveFailed();
        setRules((prev) => prev.filter((r) => r.id !== rule.id));
        toast({ title: "Window removed", description: "That weekly window is gone." });
    };

    /* ----------------------------- view --------------------------- */

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Loading your mentors…</span>
            </div>
        );
    }

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
                                    Mentor <span className="gradient-text">Profiles</span>
                                </h1>
                                <p className="text-muted-foreground">
                                    Manage who mentors on Yatri Cloud, their weekly availability, and how they appear in the directory.
                                </p>
                            </div>
                            <Button onClick={openAdd} className={saveButtonClass}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add mentor
                            </Button>
                        </div>
                    </div>
                </ScrollReveal>

                {/* Oversight totals */}
                <ScrollReveal delay={0.03}>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        {[
                            { label: "Total mentors", value: totals?.mentors },
                            { label: "Published mentors", value: totals?.published },
                            { label: "Total services", value: totals?.services },
                            { label: "Total bookings", value: totals?.bookings },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="rounded-2xl border border-brand-100 bg-card px-4 py-3 shadow-card"
                            >
                                <p className="font-display text-2xl font-bold tracking-tight text-foreground">
                                    {item.value ?? "…"}
                                </p>
                                <p className="text-xs text-muted-foreground">{item.label}</p>
                            </div>
                        ))}
                    </div>
                </ScrollReveal>

                {/* Mentors list */}
                <ScrollReveal delay={0.05}>
                    <div className="bg-card border border-brand-100 rounded-2xl p-5 md:p-6 shadow-card">
                        <div className="-mx-5 md:-mx-6 -mt-5 md:-mt-6 mb-5 rounded-t-2xl border-b border-brand-100 bg-gradient-to-r from-brand-50 to-transparent px-5 md:px-6 py-4">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Directory</p>
                            <h2 className="mt-0.5 font-display text-lg font-bold tracking-tight text-foreground">Mentors</h2>
                            <p className="text-sm text-muted-foreground">
                                {mentors.length} mentors. Featured mentors appear first on the public directory.
                            </p>
                        </div>

                        {mentors.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                                <p>No mentors yet. Add your first mentor and their profile will show up here.</p>
                                <Button variant="outline" onClick={openAdd} className="mt-4 min-h-[44px] rounded-xl">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add mentor
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {mentors.map((mentor, index) => (
                                    <div
                                        key={mentor.id}
                                        className="rounded-xl border border-border bg-background odd:bg-brand-50/30 odd:border-brand-100 hover:bg-brand-50/50 transition-colors p-3 md:p-4"
                                    >
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-card">
                                                {mentor.photo_url ? (
                                                    <img src={mentor.photo_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                                                ) : (
                                                    <span className="text-sm font-bold text-primary">
                                                        {mentor.name.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                                                    <span className="truncate">{mentor.name}</span>
                                                    {mentor.is_featured && (
                                                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                                            Featured
                                                        </span>
                                                    )}
                                                    {mentor.status !== "published" && (
                                                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                                                            Draft
                                                        </span>
                                                    )}
                                                    {mentor.user_id ? (
                                                        <span className="inline-flex items-center rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                                                            Login linked
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                                                            No login
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    /{mentor.slug} · {mentor.headline || "No headline yet"}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Rated {mentor.avg_rating.toFixed(2)} of 5 from {mentor.review_count} reviews
                                                    {contactEmails[mentor.id] ? ` · ${contactEmails[mentor.id]}` : ""}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="mr-1 flex items-center gap-2">
                                                    <Label
                                                        htmlFor={`mentor-featured-${mentor.id}`}
                                                        className="hidden md:block text-xs text-muted-foreground"
                                                    >
                                                        Featured
                                                    </Label>
                                                    <Switch
                                                        id={`mentor-featured-${mentor.id}`}
                                                        checked={mentor.is_featured}
                                                        onCheckedChange={(checked) => toggleFeatured(mentor, checked)}
                                                        aria-label={`${mentor.name} is featured in the directory`}
                                                    />
                                                </div>
                                                <div className="mr-1 flex items-center gap-2">
                                                    <Label
                                                        htmlFor={`mentor-live-${mentor.id}`}
                                                        className="hidden md:block text-xs text-muted-foreground"
                                                    >
                                                        Live
                                                    </Label>
                                                    <Switch
                                                        id={`mentor-live-${mentor.id}`}
                                                        checked={mentor.status === "published"}
                                                        onCheckedChange={(checked) => toggleStatus(mentor, checked)}
                                                        aria-label={`${mentor.name} is published on the site`}
                                                    />
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => moveMentor(mentor, -1)}
                                                    disabled={index === 0}
                                                    aria-label={`Move ${mentor.name} up`}
                                                    className="h-10 w-10 rounded-xl"
                                                >
                                                    <ArrowUp className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => moveMentor(mentor, 1)}
                                                    disabled={index === mentors.length - 1}
                                                    aria-label={`Move ${mentor.name} down`}
                                                    className="h-10 w-10 rounded-xl"
                                                >
                                                    <ArrowDown className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openAvailability(mentor)}
                                                    aria-label={`Edit ${mentor.name} availability`}
                                                    className="h-10 w-10 rounded-xl text-muted-foreground hover:text-primary"
                                                >
                                                    <CalendarClock className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEdit(mentor)}
                                                    aria-label={`Edit ${mentor.name}`}
                                                    className="h-10 w-10 rounded-xl text-muted-foreground hover:text-primary"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => setMentorToDelete(mentor)}
                                                    aria-label={`Delete ${mentor.name}`}
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

            {/* ── Add or edit mentor dialog ── */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-display tracking-tight">
                            {editingId ? "Edit mentor" : "Add a mentor"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingId
                                ? "Update the profile and save. Changes go live right away."
                                : "Fill in the profile below. You can add services and availability right after."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5">
                        {/* Profile */}
                        <div className="space-y-4">
                            <p className="border-b border-brand-100 pb-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
                                Profile
                            </p>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <FieldLabel htmlFor="mentor-name">Name</FieldLabel>
                                    <Input
                                        id="mentor-name"
                                        className="min-h-[44px] rounded-xl"
                                        placeholder="Yatharth Chauhan"
                                        value={form.name}
                                        onChange={(e) => updateName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <FieldLabel htmlFor="mentor-slug">Slug (public URL)</FieldLabel>
                                    <Input
                                        id="mentor-slug"
                                        className="min-h-[44px] rounded-xl font-mono text-sm"
                                        placeholder="yatharth-chauhan"
                                        value={form.slug}
                                        onChange={(e) =>
                                            setForm((prev) => ({ ...prev, slug: e.target.value, slugTouched: true }))
                                        }
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <FieldLabel htmlFor="mentor-headline">Headline</FieldLabel>
                                <Input
                                    id="mentor-headline"
                                    className="min-h-[44px] rounded-xl"
                                    placeholder="AWS, Azure and DevOps mentor"
                                    value={form.headline}
                                    onChange={(e) => setForm({ ...form, headline: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <FieldLabel htmlFor="mentor-bio">Bio</FieldLabel>
                                <Textarea
                                    id="mentor-bio"
                                    className="min-h-[100px] rounded-xl"
                                    placeholder="A few warm lines about how this mentor helps Yatris."
                                    value={form.bio}
                                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <FieldLabel htmlFor="mentor-photo">Photo URL</FieldLabel>
                                    <Input
                                        id="mentor-photo"
                                        className="min-h-[44px] rounded-xl"
                                        value={form.photo_url}
                                        onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <FieldLabel htmlFor="mentor-linkedin">LinkedIn or website URL</FieldLabel>
                                    <Input
                                        id="mentor-linkedin"
                                        className="min-h-[44px] rounded-xl"
                                        value={form.linkedin_url}
                                        onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <FieldLabel htmlFor="mentor-expertise">Expertise (comma separated)</FieldLabel>
                                    <Input
                                        id="mentor-expertise"
                                        className="min-h-[44px] rounded-xl"
                                        placeholder="AWS, Azure, DevOps"
                                        value={form.expertise}
                                        onChange={(e) => setForm({ ...form, expertise: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <FieldLabel htmlFor="mentor-languages">Languages (comma separated)</FieldLabel>
                                    <Input
                                        id="mentor-languages"
                                        className="min-h-[44px] rounded-xl"
                                        value={form.languages}
                                        onChange={(e) => setForm({ ...form, languages: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Scheduling */}
                        <div className="space-y-4">
                            <p className="border-b border-brand-100 pb-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
                                Scheduling
                            </p>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <FieldLabel htmlFor="mentor-timezone">Timezone</FieldLabel>
                                    <Input
                                        id="mentor-timezone"
                                        className="min-h-[44px] rounded-xl font-mono text-sm"
                                        value={form.timezone}
                                        onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <FieldLabel htmlFor="mentor-notice">Notice hours (min lead time)</FieldLabel>
                                    <Input
                                        id="mentor-notice"
                                        type="number"
                                        min={0}
                                        className="min-h-[44px] rounded-xl"
                                        value={form.notice_hours}
                                        onChange={(e) => setForm({ ...form, notice_hours: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <FieldLabel htmlFor="mentor-window">Booking window (days ahead)</FieldLabel>
                                    <Input
                                        id="mentor-window"
                                        type="number"
                                        min={1}
                                        className="min-h-[44px] rounded-xl"
                                        value={form.booking_window_days}
                                        onChange={(e) => setForm({ ...form, booking_window_days: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <FieldLabel htmlFor="mentor-buffer">Buffer between calls (minutes)</FieldLabel>
                                    <Input
                                        id="mentor-buffer"
                                        type="number"
                                        min={0}
                                        className="min-h-[44px] rounded-xl"
                                        value={form.buffer_min}
                                        onChange={(e) => setForm({ ...form, buffer_min: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Access */}
                        <div className="space-y-4">
                            <p className="border-b border-brand-100 pb-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
                                Access and notifications
                            </p>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <FieldLabel htmlFor="mentor-contact">Contact email (private, gets booking alerts)</FieldLabel>
                                    <Input
                                        id="mentor-contact"
                                        type="email"
                                        className="min-h-[44px] rounded-xl"
                                        placeholder="mentor@example.com"
                                        value={form.contact_email}
                                        onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <FieldLabel htmlFor="mentor-login">Login email (links a Yatri account)</FieldLabel>
                                    <Input
                                        id="mentor-login"
                                        type="email"
                                        className="min-h-[44px] rounded-xl"
                                        placeholder="Leave empty to unlink"
                                        value={form.login_email}
                                        onChange={(e) => setForm({ ...form, login_email: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        The account must already exist. Once linked, the mentor can manage their own page at /mentor/dashboard.
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <FieldLabel htmlFor="mentor-route">Razorpay linked account id</FieldLabel>
                                    <Input
                                        id="mentor-route"
                                        className="min-h-[44px] rounded-xl font-mono text-sm"
                                        placeholder="acc_XXXXXXXXXXXXXX"
                                        value={form.razorpay_account_id}
                                        onChange={(e) => setForm({ ...form, razorpay_account_id: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Create the account in the Razorpay dashboard under Route, then paste its id here. Leave empty to pay this mentor manually.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <FieldLabel htmlFor="mentor-commission">Commission percent (override)</FieldLabel>
                                    <Input
                                        id="mentor-commission"
                                        type="number"
                                        min={0}
                                        max={100}
                                        step="0.5"
                                        className="min-h-[44px] rounded-xl"
                                        placeholder="Leave empty for the platform default"
                                        value={form.commission_percent}
                                        onChange={(e) => setForm({ ...form, commission_percent: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        The platform keeps this percent of each booking. Empty uses the site default.
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                                    <Switch
                                        id="mentor-form-featured"
                                        checked={form.is_featured}
                                        onCheckedChange={(checked) => setForm({ ...form, is_featured: checked })}
                                        aria-label="Feature this mentor in the directory"
                                    />
                                    <Label htmlFor="mentor-form-featured" className="text-sm font-medium">
                                        Featured in the directory
                                    </Label>
                                </div>
                                <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                                    <Switch
                                        id="mentor-form-published"
                                        checked={form.status === "published"}
                                        onCheckedChange={(checked) =>
                                            setForm({ ...form, status: checked ? "published" : "draft" })
                                        }
                                        aria-label="Publish this mentor on the site"
                                    />
                                    <Label htmlFor="mentor-form-published" className="text-sm font-medium">
                                        {form.status === "published" ? "Published" : "Draft (hidden)"}
                                    </Label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setDialogOpen(false)} className="min-h-[44px] rounded-xl">
                            Cancel
                        </Button>
                        <Button onClick={saveMentor} disabled={saving} className={saveButtonClass}>
                            {saving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            {editingId ? "Save mentor" : "Add mentor"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Availability dialog ── */}
            <Dialog
                open={availabilityMentor !== null}
                onOpenChange={(open) => {
                    if (!open) setAvailabilityMentor(null);
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="font-display tracking-tight">
                            {availabilityMentor ? `${availabilityMentor.name}'s availability` : "Availability"}
                        </DialogTitle>
                        <DialogDescription>
                            Weekly windows in the mentor's timezone ({availabilityMentor?.timezone ?? "Asia/Kolkata"}). Slots are computed from these on the booking page.
                        </DialogDescription>
                    </DialogHeader>

                    {loadingRules ? (
                        <div className="flex min-h-[120px] items-center justify-center gap-3 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            <span>Loading availability…</span>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {rules.length === 0 ? (
                                <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                                    No weekly windows yet. Add the first one below and slots will open up for Yatris.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {rules.map((rule) => (
                                        <div
                                            key={rule.id}
                                            className="flex items-center gap-3 rounded-xl border border-border bg-background odd:bg-brand-50/30 odd:border-brand-100 p-3"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold">{WEEKDAYS[rule.weekday]}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {toTimeInput(rule.start_time)} to {toTimeInput(rule.end_time)}
                                                </p>
                                            </div>
                                            <Switch
                                                checked={rule.active}
                                                onCheckedChange={(checked) => toggleRule(rule, checked)}
                                                aria-label={`${WEEKDAYS[rule.weekday]} window is active`}
                                            />
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => deleteRule(rule)}
                                                aria-label={`Delete the ${WEEKDAYS[rule.weekday]} window`}
                                                className={deleteIconButtonClass}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-3 rounded-xl border border-brand-100 bg-brand-50/40 p-4">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Add a window</p>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <div className="space-y-1.5">
                                        <FieldLabel htmlFor="rule-weekday">Day</FieldLabel>
                                        <Select
                                            value={newRule.weekday}
                                            onValueChange={(value) => setNewRule({ ...newRule, weekday: value })}
                                        >
                                            <SelectTrigger id="rule-weekday" className="min-h-[44px] rounded-xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {WEEKDAYS.map((day, i) => (
                                                    <SelectItem key={day} value={String(i)}>
                                                        {day}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <FieldLabel htmlFor="rule-start">Start</FieldLabel>
                                        <Input
                                            id="rule-start"
                                            type="time"
                                            className="min-h-[44px] rounded-xl"
                                            value={newRule.start_time}
                                            onChange={(e) => setNewRule({ ...newRule, start_time: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <FieldLabel htmlFor="rule-end">End</FieldLabel>
                                        <Input
                                            id="rule-end"
                                            type="time"
                                            className="min-h-[44px] rounded-xl"
                                            value={newRule.end_time}
                                            onChange={(e) => setNewRule({ ...newRule, end_time: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <Button onClick={addRule} disabled={savingRule} className={saveButtonClass}>
                                    {savingRule ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Plus className="mr-2 h-4 w-4" />
                                    )}
                                    Add window
                                </Button>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setAvailabilityMentor(null)}
                            className="min-h-[44px] rounded-xl"
                        >
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Delete mentor confirm ── */}
            <AlertDialog
                open={mentorToDelete !== null}
                onOpenChange={(open) => {
                    if (!open) setMentorToDelete(null);
                }}
            >
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-display tracking-tight">
                            Delete {mentorToDelete?.name ?? "this mentor"}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This removes the mentor along with their services, availability and reviews. Yatris will no longer see them anywhere on the site. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="min-h-[44px] rounded-xl">Keep them</AlertDialogCancel>
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
                            Delete mentor
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default AdminMentors;
