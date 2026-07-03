import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import type { MentorReview } from "@/lib/mentorship";

interface MentorOption {
    id: string;
    name: string;
}

const formatDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-IN", { dateStyle: "medium" });
};

const FieldLabel = ({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) => (
    <Label htmlFor={htmlFor} className="text-sm font-medium">
        {children}
    </Label>
);

const deleteIconButtonClass =
    "h-10 w-10 rounded-xl text-destructive border-destructive/20 hover:bg-destructive hover:text-destructive-foreground";

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const AdminMentorReviews = () => {
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState<MentorReview[]>([]);
    const [mentors, setMentors] = useState<MentorOption[]>([]);
    const [serviceTitles, setServiceTitles] = useState<Record<string, string>>({});

    // Filters
    const [search, setSearch] = useState("");
    const [mentorFilter, setMentorFilter] = useState("all");
    const [visibilityFilter, setVisibilityFilter] = useState("all");
    const [sort, setSort] = useState("newest");

    // Delete confirm
    const [reviewToDelete, setReviewToDelete] = useState<MentorReview | null>(null);
    const [deleting, setDeleting] = useState(false);

    const mentorName = (id: string) => mentors.find((m) => m.id === id)?.name ?? "Unknown mentor";

    const saveFailed = () =>
        toast({ title: "That did not save", description: "Please try again.", variant: "destructive" });

    /* ---------------------------- load ---------------------------- */

    useEffect(() => {
        const init = async () => {
            const [{ data: mentorRows }, { data: serviceRows }, { data: reviewRows, error }] =
                await Promise.all([
                    supabase.from("mentors").select("id, name").order("sort_order", { ascending: true }),
                    supabase.from("mentorship_services").select("id, title"),
                    supabase
                        .from("mentor_reviews")
                        .select(
                            "id, mentor_id, service_id, booking_id, user_id, name, rating, review, is_public, created_at"
                        )
                        .order("created_at", { ascending: false }),
                ]);
            setMentors((mentorRows ?? []).map((row: any) => ({ id: row.id, name: row.name ?? "" })));
            const titles: Record<string, string> = {};
            (serviceRows ?? []).forEach((row: any) => {
                titles[row.id] = row.title ?? "";
            });
            setServiceTitles(titles);
            if (error) {
                console.error("Failed to load reviews", error);
                toast({
                    title: "Could not load reviews",
                    description: "Please refresh the page and try again.",
                    variant: "destructive",
                });
            } else {
                setReviews(
                    (reviewRows ?? []).map((row: any) => ({
                        id: row.id,
                        mentor_id: row.mentor_id,
                        service_id: row.service_id ?? null,
                        booking_id: row.booking_id ?? null,
                        user_id: row.user_id ?? null,
                        name: row.name ?? "",
                        rating: row.rating ?? 0,
                        review: row.review ?? "",
                        is_public: row.is_public !== false,
                        created_at: row.created_at ?? "",
                    }))
                );
            }
            setLoading(false);
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredReviews = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = reviews.filter(
            (r) =>
                (mentorFilter === "all" || r.mentor_id === mentorFilter) &&
                (visibilityFilter === "all" ||
                    (visibilityFilter === "public" ? r.is_public : !r.is_public)) &&
                (!q ||
                    (r.name || "").toLowerCase().includes(q) ||
                    (r.review || "").toLowerCase().includes(q) ||
                    mentorName(r.mentor_id).toLowerCase().includes(q))
        );
        const sorted = [...list];
        if (sort === "rating-desc") sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        else if (sort === "rating-asc") sorted.sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));
        // "newest" keeps the created_at desc order from the query
        return sorted;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reviews, mentors, search, mentorFilter, visibilityFilter, sort]);

    /* -------------------------- moderation ------------------------- */

    const togglePublic = async (review: MentorReview, is_public: boolean) => {
        setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, is_public } : r)));
        const { error } = await supabase
            .from("mentor_reviews")
            .update({ is_public })
            .eq("id", review.id);
        if (error) {
            setReviews((prev) =>
                prev.map((r) => (r.id === review.id ? { ...r, is_public: !is_public } : r))
            );
            return saveFailed();
        }
        toast({
            title: is_public ? "Review is public" : "Review hidden",
            description: is_public
                ? "It now counts toward the mentor's rating."
                : "It no longer counts toward the mentor's rating.",
        });
    };

    const confirmDelete = async () => {
        if (!reviewToDelete) return;
        setDeleting(true);
        const { error } = await supabase
            .from("mentor_reviews")
            .delete()
            .eq("id", reviewToDelete.id);
        setDeleting(false);
        if (error) {
            setReviewToDelete(null);
            return saveFailed();
        }
        setReviews((prev) => prev.filter((r) => r.id !== reviewToDelete.id));
        setReviewToDelete(null);
        toast({
            title: "Review removed",
            description: "The mentor's rating has been recalculated.",
        });
    };

    /* ----------------------------- view --------------------------- */

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Loading reviews…</span>
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

                        <div className="relative space-y-1.5">
                            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Mentorship
                            </p>
                            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">
                                Mentor <span className="gradient-text">Reviews</span>
                            </h1>
                            <p className="text-muted-foreground">
                                Moderate what Yatris say about mentors. Public reviews shape each mentor's average rating.
                            </p>
                        </div>
                    </div>
                </ScrollReveal>

                <ScrollReveal delay={0.05}>
                    <div className="bg-card border border-brand-100 rounded-2xl p-5 md:p-6 shadow-card">
                        <div className="-mx-5 md:-mx-6 -mt-5 md:-mt-6 mb-5 rounded-t-2xl border-b border-brand-100 bg-gradient-to-r from-brand-50 to-transparent px-5 md:px-6 py-4">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Moderation</p>
                            <h2 className="mt-0.5 font-display text-lg font-bold tracking-tight text-foreground">Reviews</h2>
                            <p className="text-sm text-muted-foreground">
                                {filteredReviews.length} of {reviews.length} reviews shown, newest first.
                            </p>
                        </div>

                        {/* Search */}
                        <div className="mb-3 relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by reviewer, text or mentor"
                                className="min-h-[44px] rounded-xl pl-9"
                            />
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
                                <FieldLabel htmlFor="filter-visibility">Visibility</FieldLabel>
                                <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
                                    <SelectTrigger id="filter-visibility" className="min-h-[44px] rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All reviews</SelectItem>
                                        <SelectItem value="public">Public</SelectItem>
                                        <SelectItem value="hidden">Hidden</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <FieldLabel htmlFor="filter-sort">Sort</FieldLabel>
                                <Select value={sort} onValueChange={setSort}>
                                    <SelectTrigger id="filter-sort" className="min-h-[44px] rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="newest">Newest first</SelectItem>
                                        <SelectItem value="rating-desc">Highest rated</SelectItem>
                                        <SelectItem value="rating-asc">Lowest rated</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {filteredReviews.length === 0 ? (
                            <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                                {reviews.length === 0
                                    ? "No reviews yet. They arrive after Yatris complete their sessions."
                                    : "Nothing matches those filters. Try widening them."}
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {filteredReviews.map((review) => (
                                    <div
                                        key={review.id}
                                        className="rounded-xl border border-border bg-background odd:bg-brand-50/30 odd:border-brand-100 hover:bg-brand-50/50 transition-colors p-3 md:p-4"
                                    >
                                        <div className="flex flex-wrap items-start gap-3">
                                            <div className="min-w-0 flex-1 space-y-1">
                                                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                                                    <span className="truncate">{review.name || "Anonymous Yatri"}</span>
                                                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                                        Rated {review.rating} of 5
                                                    </span>
                                                    {review.booking_id && (
                                                        <span className="inline-flex items-center rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                                                            Verified booking
                                                        </span>
                                                    )}
                                                    {!review.is_public && (
                                                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                                                            Hidden
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    For {mentorName(review.mentor_id)}
                                                    {review.service_id && serviceTitles[review.service_id]
                                                        ? ` · ${serviceTitles[review.service_id]}`
                                                        : ""}
                                                    {review.created_at ? ` · ${formatDate(review.created_at)}` : ""}
                                                </p>
                                                {review.review && (
                                                    <p className="text-sm text-foreground">{review.review}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-2">
                                                    <Label
                                                        htmlFor={`review-public-${review.id}`}
                                                        className="hidden md:block text-xs text-muted-foreground"
                                                    >
                                                        Public
                                                    </Label>
                                                    <Switch
                                                        id={`review-public-${review.id}`}
                                                        checked={review.is_public}
                                                        onCheckedChange={(checked) => togglePublic(review, checked)}
                                                        aria-label={`Review by ${review.name || "Anonymous"} is public`}
                                                    />
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => setReviewToDelete(review)}
                                                    aria-label={`Delete the review by ${review.name || "Anonymous"}`}
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

            {/* ── Delete review confirm ── */}
            <AlertDialog
                open={reviewToDelete !== null}
                onOpenChange={(open) => {
                    if (!open) setReviewToDelete(null);
                }}
            >
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-display tracking-tight">
                            Delete this review?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            The review by {reviewToDelete?.name || "this Yatri"} will be gone for good and the mentor's rating will be recalculated. This cannot be undone.
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
                            Delete review
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default AdminMentorReviews;
