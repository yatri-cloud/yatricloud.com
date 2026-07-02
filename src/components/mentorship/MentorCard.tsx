import { Link } from "react-router-dom";
import { Mentor, formatServicePrice } from "@/lib/mentorship";

interface MentorCardProps {
  mentor: Mentor;
  /** Lowest published service price for this mentor (null hides the line). */
  fromPrice?: number | null;
}

/**
 * Directory card for one mentor. The whole card is one large tap target
 * that opens the mentor profile.
 */
export const MentorCard = ({ mentor, fromPrice = null }: MentorCardProps) => {
  return (
    <Link
      to={`/mentorship/${mentor.slug}`}
      className="group block h-full rounded-3xl border border-border bg-card overflow-hidden hover:border-brand-200 hover:shadow-card transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        {mentor.photo_url ? (
          <img
            src={mentor.photo_url}
            alt={mentor.name}
            loading="lazy"
            className="w-full h-full object-cover object-top transition-transform duration-500 motion-reduce:transition-none group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-display text-4xl font-bold text-brand-200">
              {mentor.name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col gap-3">
        <div>
          <h3 className="font-display text-xl font-bold text-foreground group-hover:text-primary transition-colors">
            {mentor.name}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {mentor.headline}
          </p>
        </div>

        {mentor.expertise.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {mentor.expertise.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-1 pt-3 border-t border-border flex items-center justify-between gap-3">
          {mentor.review_count > 0 ? (
            <p className="text-sm text-foreground">
              <span className="font-semibold">{mentor.avg_rating.toFixed(1)}</span>
              <span className="text-muted-foreground">
                {" "}
                · {mentor.review_count}{" "}
                {mentor.review_count === 1 ? "review" : "reviews"}
              </span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">New mentor</p>
          )}
          {fromPrice !== null && (
            <p className="text-sm text-muted-foreground">
              From{" "}
              <span className="font-semibold text-foreground">
                {formatServicePrice(fromPrice)}
              </span>
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default MentorCard;
