import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { sendEmail } from "@/lib/email";
import ScrollReveal from "@/components/ScrollReveal";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type ApplicationStatus = "pending" | "approved" | "rejected";

interface MentorApplication {
    id: string;
    user_id: string | null;
    name: string;
    email: string;
    phone: string | null;
    headline: string | null;
    bio: string | null;
    expertise: string[];
    linkedin_url: string | null;
    photo_url: string | null;
    experience_years: number | null;
    motivation: string | null;
    links: unknown;
    status: ApplicationStatus;
    admin_notes: string | null;
    mentor_id: string | null;
    created_at: string;
}

type StatusFilter = ApplicationStatus | "all";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const kebabCase = (text: string) =>
    text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

const formatDate = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

/** Normalizes the links jsonb column into label + url pairs for display. */
const normalizeLinks = (links: unknown): { label: string; url: string }[] => {
    if (!links) return [];
    if (Array.isArray(links)) {
        return links
            .map((item, index) => {
                if (typeof item === "string") return { label: item, url: item };
                if (item && typeof item === "object") {
                    const record = item as Record<string, unknown>;
                    const url = String(record.url ?? record.href ?? record.link ?? "");
                    const label = String(record.label ?? record.title ?? record.name ?? url);
                    return { label: label || `Link ${index + 1}`, url };
                }
                return { label: "", url: "" };
            })
            .filter((link) => link.url);
    }
    if (typeof links === "object") {
        return Object.entries(links as Record<string, unknown>)
            .map(([label, url]) => ({ label, url: typeof url === "string" ? url : "" }))
            .filter((link) => link.url);
    }
    return [];
};

const saveButtonClass =
    "min-h-[44px] rounded-xl bg-primary hover:bg-brand-600 text-primary-foreground font-semibold shadow-inset-btn";

const STATUS_PILL: Record<ApplicationStatus, { label: string; className: string }> = {
    pending: { label: "Pending", className: "bg-brand-100 text-brand-700" },
    approved: { label: "Approved", className: "bg-primary/10 text-primary" },
    rejected: { label: "Rejected", className: "bg-destructive/10 text-destructive" },
};

const FILTERS: { value: StatusFilter; label: string }[] = [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "all", label: "All" },
];

const StatusPill = ({ status }: { status: ApplicationStatus }) => {
    const pill = STATUS_PILL[status] ?? STATUS_PILL.pending;
    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${pill.className}`}
        >
            {pill.label}
        </span>
    );
};

/* ------------------------------------------------------------------ */
/* Emails — warm, dash free, inline styles for client compatibility    */
/* ------------------------------------------------------------------ */

const emailShell = (title: string, content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.6;">
    <div style="background-color: #1e3a8a; padding: 30px; text-align: center; border-radius: 0 0 20px 20px;">
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">Yatri Cloud</h1>
    </div>
    <div style="background-color: #ffffff; padding: 40px; margin: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      ${content}
    </div>
    <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
      <p style="margin: 5px 0;">© ${new Date().getFullYear()} Yatri Cloud. All rights reserved.</p>
      <p style="margin: 5px 0;">Empowering your cloud journey.</p>
    </div>
  </div>
</body>
</html>
`;

const approvalEmailHtml = (name: string) =>
    emailShell(
        "Welcome to Yatri Cloud Mentorship",
        `
    <h2 style="color: #1e3a8a; margin-top: 0;">Congratulations, you are now a Yatri Cloud mentor</h2>
    <p>Hello ${name},</p>
    <p>We read your application with real joy, and we are delighted to welcome you to the Yatri Cloud mentor family. Thousands of Yatris are working toward their cloud goals, and your experience is about to light the way for many of them.</p>
    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px 20px; margin: 25px 0; border-radius: 8px;">
      <p style="margin: 5px 0;"><strong>Your mentor dashboard is ready.</strong></p>
      <p style="margin: 5px 0;">Sign in with the account you applied with and visit <a href="https://yatricloud.com/mentor/dashboard" style="color: #3b82f6; font-weight: bold; text-decoration: none;">yatricloud.com/mentor/dashboard</a> to set up your services and weekly availability.</p>
    </div>
    <p>Take your time and make your profile shine. Our team will review everything and publish your profile once your services are ready, so it goes live looking its very best.</p>
    <p>We are so glad you are here. Welcome aboard.</p>
    <p style="margin-bottom: 0;">Warm regards,<br><strong>The Yatri Cloud team</strong></p>
  `
    );

const rejectionEmailHtml = (name: string) =>
    emailShell(
        "About your Yatri Cloud mentor application",
        `
    <h2 style="color: #1e3a8a; margin-top: 0;">Thank you for applying to mentor at Yatri Cloud</h2>
    <p>Hello ${name},</p>
    <p>We truly appreciate the time and care you put into your application, and it was a pleasure to read about your journey.</p>
    <p>After careful review, we are unable to move forward right now. Please know this is not a closed door. Our mentorship program keeps growing, and we would be happy to hear from you again in the future.</p>
    <p>Keep learning, keep sharing, and stay close to the community. We are cheering for you.</p>
    <p style="margin-bottom: 0;">Warm regards,<br><strong>The Yatri Cloud team</strong></p>
  `
    );

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const AdminMentorApplications = () => {
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [applications, setApplications] = useState<MentorApplication[]>([]);
    const [filter, setFilter] = useState<StatusFilter>("pending");
    const [search, setSearch] = useState("");

    // Detail dialog
    const [selected, setSelected] = useState<MentorApplication | null>(null);
    const [notes, setNotes] = useState("");
    const [savingNotes, setSavingNotes] = useState(false);

    // Approve confirm
    const [approveTarget, setApproveTarget] = useState<MentorApplication | null>(null);
    const [approving, setApproving] = useState(false);

    // Reject dialog
    const [rejectTarget, setRejectTarget] = useState<MentorApplication | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [rejectEmailApplicant, setRejectEmailApplicant] = useState(true);
    const [rejecting, setRejecting] = useState(false);

    /* ---------------------------- load ---------------------------- */

    const loadApplications = async () => {
        const { data, error } = await supabase
            .from("mentor_applications")
            .select(
                "id, user_id, name, email, phone, headline, bio, expertise, linkedin_url, photo_url, experience_years, motivation, links, status, admin_notes, mentor_id, created_at"
            )
            .order("created_at", { ascending: false });
        if (error) {
            console.error("Failed to load mentor applications", error);
            toast({
                title: "Could not load applications",
                description: "Please refresh the page and try again.",
                variant: "destructive",
            });
            return;
        }
        setApplications(
            (data ?? []).map((row: any) => ({
                id: row.id,
                user_id: row.user_id ?? null,
                name: row.name ?? "",
                email: row.email ?? "",
                phone: row.phone ?? null,
                headline: row.headline ?? null,
                bio: row.bio ?? null,
                expertise: row.expertise ?? [],
                linkedin_url: row.linkedin_url ?? null,
                photo_url: row.photo_url ?? null,
                experience_years: row.experience_years ?? null,
                motivation: row.motivation ?? null,
                links: row.links ?? null,
                status: (row.status ?? "pending") as ApplicationStatus,
                admin_notes: row.admin_notes ?? null,
                mentor_id: row.mentor_id ?? null,
                created_at: row.created_at ?? "",
            }))
        );
    };

    useEffect(() => {
        const init = async () => {
            await loadApplications();
            setLoading(false);
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* --------------------------- derived --------------------------- */

    const visible = useMemo(() => {
        const query = search.trim().toLowerCase();
        return applications.filter((app) => {
            if (filter !== "all" && app.status !== filter) return false;
            if (!query) return true;
            return (
                app.name.toLowerCase().includes(query) || app.email.toLowerCase().includes(query)
            );
        });
    }, [applications, filter, search]);

    const pendingCount = useMemo(
        () => applications.filter((app) => app.status === "pending").length,
        [applications]
    );

    /* ------------------------- detail dialog ------------------------ */

    const openDetail = (app: MentorApplication) => {
        setSelected(app);
        setNotes(app.admin_notes ?? "");
    };

    const saveNotes = async () => {
        if (!selected) return;
        setSavingNotes(true);
        const trimmed = notes.trim();
        const { error } = await supabase
            .from("mentor_applications")
            .update({ admin_notes: trimmed || null })
            .eq("id", selected.id);
        setSavingNotes(false);
        if (error) {
            return toast({
                title: "Notes did not save",
                description: "Please try again.",
                variant: "destructive",
            });
        }
        setApplications((prev) =>
            prev.map((app) =>
                app.id === selected.id ? { ...app, admin_notes: trimmed || null } : app
            )
        );
        setSelected((prev) => (prev ? { ...prev, admin_notes: trimmed || null } : prev));
        toast({ title: "Notes saved", description: "Your notes stay private to the admin team." });
    };

    /* ---------------------------- approve --------------------------- */

    /** Finds a free mentors.slug, suffixing a number when the base is taken. */
    const resolveFreeSlug = async (name: string): Promise<string | null> => {
        const base = kebabCase(name) || "mentor";
        const { data, error } = await supabase
            .from("mentors")
            .select("slug")
            .like("slug", `${base}%`);
        if (error) return null;
        const taken = new Set((data ?? []).map((row: any) => row.slug as string));
        if (!taken.has(base)) return base;
        let suffix = 2;
        while (taken.has(`${base}-${suffix}`)) suffix += 1;
        return `${base}-${suffix}`;
    };

    const confirmApprove = async () => {
        const app = approveTarget;
        if (!app) return;
        setApproving(true);

        // 1. A unique public slug for the new mentor profile.
        const slug = await resolveFreeSlug(app.name);
        if (!slug) {
            setApproving(false);
            return toast({
                title: "Approval did not start",
                description: "Could not check existing mentor slugs. Nothing was changed, please try again.",
                variant: "destructive",
            });
        }

        // 2. Next sort_order so the new mentor lands at the end of the directory.
        const { data: orderRow } = await supabase
            .from("mentors")
            .select("sort_order")
            .order("sort_order", { ascending: false })
            .limit(1)
            .maybeSingle();
        const nextOrder = ((orderRow as any)?.sort_order ?? 0) + 1;

        // 3. Create the mentor as a draft. Admin publishes after review.
        const { data: mentorRow, error: mentorError } = await supabase
            .from("mentors")
            .insert({
                slug,
                name: app.name,
                headline: app.headline ?? "",
                bio: app.bio ?? "",
                photo_url: app.photo_url,
                linkedin_url: app.linkedin_url,
                expertise: app.expertise ?? [],
                user_id: app.user_id,
                status: "draft",
                sort_order: nextOrder,
            })
            .select("id")
            .single();
        if (mentorError || !mentorRow) {
            console.error("Mentor insert failed", mentorError);
            setApproving(false);
            const message = mentorError?.message || "";
            const isRls = message.toLowerCase().includes("row-level security") || (mentorError as any)?.code === "42501";
            return toast({
                title: "Approval did not go through",
                description: isRls
                    ? "Your admin session was replaced by another login in this browser. Please log out of the admin area and log in again as admin."
                    : `The mentor profile could not be created, so nothing was changed. ${message ? `Reason: ${message}` : "Please try again."}`,
                variant: "destructive",
            });
        }
        const mentorId = (mentorRow as any).id as string;

        const failures: string[] = [];

        // 4. Private contact email for booking alerts.
        const { error: privateError } = await supabase
            .from("mentor_private")
            .upsert({ mentor_id: mentorId, contact_email: app.email });
        if (privateError) {
            console.error("mentor_private upsert failed", privateError);
            failures.push("saving the private contact email");
        }

        // 5. Mark the application approved and link it to the mentor.
        const { error: appError } = await supabase
            .from("mentor_applications")
            .update({ status: "approved", mentor_id: mentorId })
            .eq("id", app.id);
        if (appError) {
            console.error("Application update failed", appError);
            failures.push("marking the application approved");
        }

        // 6. Warm welcome email to the applicant.
        const emailResult = await sendEmail({
            to: app.email,
            subject: "Congratulations, you are now a Yatri Cloud mentor",
            html: approvalEmailHtml(app.name),
        });
        if (!emailResult.success) {
            failures.push("sending the welcome email");
        }

        setApproving(false);
        setApproveTarget(null);
        setSelected(null);
        await loadApplications();

        if (failures.length === 0) {
            toast({
                title: `${app.name} is now a mentor`,
                description: "Their draft profile is created and the welcome email is on its way. Publish the profile once their services are ready.",
            });
        } else {
            toast({
                title: "Mentor created, but some steps failed",
                description: `The draft mentor profile exists, yet these steps did not finish: ${failures.join(", ")}. Please fix them by hand.`,
                variant: "destructive",
            });
        }
    };

    /* ---------------------------- reject ---------------------------- */

    const openReject = (app: MentorApplication) => {
        setRejectTarget(app);
        setRejectReason(app.admin_notes ?? "");
        setRejectEmailApplicant(true);
    };

    const confirmReject = async () => {
        const app = rejectTarget;
        if (!app) return;
        const reason = rejectReason.trim();
        if (!reason) {
            return toast({
                title: "A reason is needed",
                description: "Please write a short note on why this application is being declined.",
                variant: "destructive",
            });
        }
        setRejecting(true);
        const { error } = await supabase
            .from("mentor_applications")
            .update({ status: "rejected", admin_notes: reason })
            .eq("id", app.id);
        if (error) {
            setRejecting(false);
            return toast({
                title: "That did not save",
                description: "The application is unchanged. Please try again.",
                variant: "destructive",
            });
        }

        let emailNote = "";
        if (rejectEmailApplicant) {
            const emailResult = await sendEmail({
                to: app.email,
                subject: "About your Yatri Cloud mentor application",
                html: rejectionEmailHtml(app.name),
            });
            emailNote = emailResult.success
                ? " A courteous email is on its way to them."
                : " The email to the applicant failed, so please reach out to them yourself.";
        }

        setRejecting(false);
        setRejectTarget(null);
        setSelected(null);
        await loadApplications();
        toast({
            title: "Application declined",
            description: `Your note is saved on the application.${emailNote}`,
        });
    };

    /* ----------------------------- view ----------------------------- */

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Loading applications…</span>
            </div>
        );
    }

    const selectedLinks = selected ? normalizeLinks(selected.links) : [];

    return (
        <div className="px-4 md:px-8 py-8 md:py-10">
            <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
                {/* Header band */}
                <ScrollReveal>
                    <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-6 md:p-8">
                        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
                        <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-brand-200/20 blur-3xl" />

                        <div className="relative space-y-1.5">
                            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Mentorship
                            </p>
                            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">
                                Mentor <span className="gradient-text">Applications</span>
                            </h1>
                            <p className="text-muted-foreground">
                                Review the people who want to mentor on Yatri Cloud. Approving creates a draft mentor profile you publish once their services are ready.
                            </p>
                        </div>
                    </div>
                </ScrollReveal>

                {/* Applications list */}
                <ScrollReveal delay={0.05}>
                    <div className="bg-card border border-brand-100 rounded-2xl p-5 md:p-6 shadow-card">
                        <div className="-mx-5 md:-mx-6 -mt-5 md:-mt-6 mb-5 rounded-t-2xl border-b border-brand-100 bg-gradient-to-r from-brand-50 to-transparent px-5 md:px-6 py-4">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Inbox</p>
                            <h2 className="mt-0.5 font-display text-lg font-bold tracking-tight text-foreground">Applications</h2>
                            <p className="text-sm text-muted-foreground">
                                {pendingCount === 0
                                    ? "Nothing waiting on you right now."
                                    : `${pendingCount} ${pendingCount === 1 ? "application is" : "applications are"} waiting for your review.`}
                            </p>
                        </div>

                        {/* Filter pills + search */}
                        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter applications by status">
                                {FILTERS.map((option) => {
                                    const active = filter === option.value;
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setFilter(option.value)}
                                            aria-pressed={active}
                                            className={`min-h-[40px] rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active
                                                ? "bg-primary text-primary-foreground shadow-inset-btn"
                                                : "border border-border bg-background text-muted-foreground hover:bg-brand-50 hover:text-foreground"
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="w-full sm:max-w-xs">
                                <Label htmlFor="application-search" className="sr-only">
                                    Search by name or email
                                </Label>
                                <Input
                                    id="application-search"
                                    className="min-h-[44px] rounded-xl"
                                    placeholder="Search by name or email"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        {visible.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                                {applications.length === 0
                                    ? "No applications yet. When someone applies to mentor, they will show up here."
                                    : "No applications match this view. Try another filter or clear the search."}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {visible.map((app) => (
                                    <div
                                        key={app.id}
                                        className="rounded-xl border border-border bg-background odd:bg-brand-50/30 odd:border-brand-100 hover:bg-brand-50/50 transition-colors p-3 md:p-4"
                                    >
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-card">
                                                {app.photo_url ? (
                                                    <img src={app.photo_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                                                ) : (
                                                    <span className="text-sm font-bold text-primary">
                                                        {app.name.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                                                    <span className="truncate">{app.name}</span>
                                                    <StatusPill status={app.status} />
                                                </p>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {app.email}
                                                    {app.headline ? ` · ${app.headline}` : ""}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {app.experience_years !== null
                                                        ? `${app.experience_years} ${app.experience_years === 1 ? "year" : "years"} of experience · `
                                                        : ""}
                                                    Applied {formatDate(app.created_at)}
                                                </p>
                                                {app.status === "approved" && app.mentor_id && (
                                                    <p className="text-xs text-primary">
                                                        Open mentor: find them under Mentors, profile id {app.mentor_id}
                                                    </p>
                                                )}
                                            </div>
                                            <Button
                                                variant="outline"
                                                onClick={() => openDetail(app)}
                                                className="min-h-[40px] rounded-xl"
                                            >
                                                Review
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </ScrollReveal>
            </div>

            {/* ── Detail dialog ── */}
            <Dialog
                open={selected !== null}
                onOpenChange={(open) => {
                    if (!open) setSelected(null);
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-display tracking-tight">
                            {selected?.name ?? "Application"}
                        </DialogTitle>
                        <DialogDescription>
                            Applied {selected ? formatDate(selected.created_at) : ""}. Read everything below, then approve or decline.
                        </DialogDescription>
                    </DialogHeader>

                    {selected && (
                        <div className="space-y-5">
                            {/* Applicant */}
                            <div className="space-y-3">
                                <p className="border-b border-brand-100 pb-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
                                    Applicant
                                </p>
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-card">
                                        {selected.photo_url ? (
                                            <img src={selected.photo_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                                        ) : (
                                            <span className="text-base font-bold text-primary">
                                                {selected.name.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                                            <span>{selected.name}</span>
                                            <StatusPill status={selected.status} />
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {selected.email}
                                            {selected.phone ? ` · ${selected.phone}` : ""}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {selected.headline || "No headline given"}
                                            {selected.experience_years !== null
                                                ? ` · ${selected.experience_years} ${selected.experience_years === 1 ? "year" : "years"} of experience`
                                                : ""}
                                        </p>
                                    </div>
                                </div>
                                {selected.expertise.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {selected.expertise.map((topic) => (
                                            <span
                                                key={topic}
                                                className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary"
                                            >
                                                {topic}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                                    {selected.linkedin_url && (
                                        <a
                                            href={selected.linkedin_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="font-medium text-primary underline-offset-4 hover:underline"
                                        >
                                            LinkedIn profile
                                        </a>
                                    )}
                                    {selected.photo_url && (
                                        <a
                                            href={selected.photo_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="font-medium text-primary underline-offset-4 hover:underline"
                                        >
                                            Photo
                                        </a>
                                    )}
                                    {selectedLinks.map((link) => (
                                        <a
                                            key={`${link.label}-${link.url}`}
                                            href={link.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="font-medium text-primary underline-offset-4 hover:underline"
                                        >
                                            {link.label}
                                        </a>
                                    ))}
                                </div>
                            </div>

                            {/* Story */}
                            <div className="space-y-3">
                                <p className="border-b border-brand-100 pb-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
                                    Their story
                                </p>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bio</p>
                                    <p className="whitespace-pre-wrap text-sm text-foreground">
                                        {selected.bio || "No bio given."}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Why they want to mentor</p>
                                    <p className="whitespace-pre-wrap text-sm text-foreground">
                                        {selected.motivation || "No motivation given."}
                                    </p>
                                </div>
                            </div>

                            {/* Admin notes */}
                            <div className="space-y-3">
                                <p className="border-b border-brand-100 pb-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
                                    Admin notes (private)
                                </p>
                                <Textarea
                                    id="application-notes"
                                    className="min-h-[90px] rounded-xl"
                                    placeholder="Notes for the admin team. Applicants never see these."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                                <Button
                                    variant="outline"
                                    onClick={saveNotes}
                                    disabled={savingNotes}
                                    className="min-h-[44px] rounded-xl"
                                >
                                    {savingNotes && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save notes
                                </Button>
                            </div>

                            {selected.status === "approved" && selected.mentor_id && (
                                <p className="rounded-xl border border-brand-100 bg-brand-50/40 p-3 text-sm text-muted-foreground">
                                    Approved. Their mentor profile lives under Mentors with id {selected.mentor_id}. Publish it once their services are ready.
                                </p>
                            )}
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setSelected(null)}
                            className="min-h-[44px] rounded-xl"
                        >
                            Close
                        </Button>
                        {selected?.status === "pending" && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => openReject(selected)}
                                    className="min-h-[44px] rounded-xl text-destructive border-destructive/20 hover:bg-destructive hover:text-destructive-foreground"
                                >
                                    Decline
                                </Button>
                                <Button onClick={() => setApproveTarget(selected)} className={saveButtonClass}>
                                    Approve as mentor
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Approve confirm ── */}
            <AlertDialog
                open={approveTarget !== null}
                onOpenChange={(open) => {
                    if (!open && !approving) setApproveTarget(null);
                }}
            >
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-display tracking-tight">
                            Approve {approveTarget?.name ?? "this applicant"} as a mentor?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This creates a draft mentor profile from their application, saves their email for booking alerts, and sends them a warm welcome pointing to their dashboard. You publish the profile once their services are ready.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={approving} className="min-h-[44px] rounded-xl">
                            Not yet
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                confirmApprove();
                            }}
                            disabled={approving}
                            className={saveButtonClass}
                        >
                            {approving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Approve and welcome them
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── Reject dialog ── */}
            <Dialog
                open={rejectTarget !== null}
                onOpenChange={(open) => {
                    if (!open && !rejecting) setRejectTarget(null);
                }}
            >
                <DialogContent className="rounded-2xl sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="font-display tracking-tight">
                            Decline {rejectTarget?.name ?? "this application"}?
                        </DialogTitle>
                        <DialogDescription>
                            Write a short reason for the record. It stays private to the admin team and is saved on the application.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="reject-reason" className="text-sm font-medium">
                                Reason (required, private)
                            </Label>
                            <Textarea
                                id="reject-reason"
                                className="min-h-[90px] rounded-xl"
                                placeholder="Why this application is being declined."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                            <Checkbox
                                id="reject-send-email"
                                checked={rejectEmailApplicant}
                                onCheckedChange={(checked) => setRejectEmailApplicant(checked === true)}
                            />
                            <Label htmlFor="reject-send-email" className="text-sm font-medium">
                                Send them a courteous email
                            </Label>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setRejectTarget(null)}
                            disabled={rejecting}
                            className="min-h-[44px] rounded-xl"
                        >
                            Keep it pending
                        </Button>
                        <Button
                            onClick={confirmReject}
                            disabled={rejecting}
                            className="min-h-[44px] rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold"
                        >
                            {rejecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Decline application
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminMentorApplications;
