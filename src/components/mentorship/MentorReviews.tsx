import { Mentor, MentorReview } from "@/lib/mentorship";

interface MentorReviewsProps {
  mentor: Mentor;
  reviews: MentorReview[];
}

function formatReviewDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Public reviews for a mentor. A review linked to a booking carries a
 * Verified pill because only real buyers can create it.
 */
export const MentorReviews = ({ mentor, reviews }: MentorReviewsProps) => {
  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-border band-tint p-8 text-center">
        <p className="text-muted-foreground">
          No reviews yet, Yatri. Book a session and be the first to share how
          it went.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-baseline gap-3">
        <p className="font-display text-4xl font-bold text-foreground">
          {mentor.avg_rating.toFixed(1)}
        </p>
        <p className="text-sm text-muted-foreground">
          out of 5, from {mentor.review_count}{" "}
          {mentor.review_count === 1 ? "review" : "reviews"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <p className="font-semibold text-foreground truncate">
                  {review.name || "A Yatri"}
                </p>
                {review.booking_id && (
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold">
                    Verified
                  </span>
                )}
              </div>
              <span className="shrink-0 px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold">
                {review.rating}/5
              </span>
            </div>
            {review.review && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {review.review}
              </p>
            )}
            <p className="mt-auto text-xs text-muted-foreground">
              {formatReviewDate(review.created_at)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MentorReviews;
