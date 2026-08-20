import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import ScrollReveal from "@/components/ScrollReveal";
import { useReviews } from "@/hooks/use-reviews";
import { Button } from "@/components/ui/button";

// Soft top/bottom fade so cards enter/exit the wall smoothly.
const WALL_MASK: React.CSSProperties = {
  WebkitMaskImage:
    "linear-gradient(to bottom, transparent, #000 9%, #000 91%, transparent)",
  maskImage:
    "linear-gradient(to bottom, transparent, #000 9%, #000 91%, transparent)",
};

export const HomeReviewsSection = () => {
  const { reviews, loading, error } = useReviews(100);
  const prefersReducedMotion = useReducedMotion();

  // Filter strictly positive reviews (4-5 stars) and dynamically rotate them on each visit
  const displayReviews = useMemo(() => {
    if (!reviews || reviews.length === 0) return [];

    // Strictly positive reviews only (rating >= 4) with non-empty text
    const positiveOnly = reviews.filter(
      (r) => (Number(r.rating) || 5) >= 4 && r.feedback && r.feedback.trim().length > 0
    );

    if (positiveOnly.length === 0) return [];

    // Calculate quality score for each positive review (5-stars, detailed long text, linkedin verification)
    const scored = positiveOnly.map((r) => {
      const rating = Number(r.rating) || 5;
      const len = r.feedback ? r.feedback.trim().length : 0;
      const starBonus = rating === 5 ? 60 : 20;
      const linkedinBonus = r.linkedinProfile ? 40 : 0;
      const textScore = Math.min(len, 250);
      const baseScore = starBonus + textScore + linkedinBonus;
      // Add random factor so each visit yields a fresh, dynamic rotation of top reviews
      const randomJitter = Math.random() * 35;
      return { review: r, totalScore: baseScore + randomJitter };
    });

    // Sort by dynamic score descending
    scored.sort((a, b) => b.totalScore - a.totalScore);

    return scored.slice(0, 18).map((item) => item.review);
  }, [reviews]);

  // Presentational card renderer — clean name, stars, linkedin, feedback
  const renderCard = (
    r: (typeof displayReviews)[number],
    keyPrefix: string,
  ) => {
    return (
      <article
        key={`${keyPrefix}-${r.id ?? Math.random()}`}
        className="bg-card border border-border rounded-2xl p-6 hover:border-primary/40 hover:shadow-card transition-all duration-300 flex flex-col"
      >
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-display font-bold tracking-tight text-lg text-foreground truncate">
              {r.name}
            </h3>
            {r.linkedinProfile && (
              <a
                href={r.linkedinProfile}
                target="_blank"
                rel="noopener noreferrer"
                title="LinkedIn profile"
                className="flex-shrink-0 inline-flex items-center justify-center transition-transform duration-200 hover:scale-110"
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/LinkedIn_logo_initials.png/500px-LinkedIn_logo_initials.png?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=thumbnail"
                  alt="LinkedIn"
                  className="w-4 h-4 object-contain"
                  width={16}
                  height={16}
                />
                <span className="sr-only">LinkedIn</span>
              </a>
            )}
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0" role="img" aria-label={`Rated ${Number(r.rating)} out of 5 stars`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <svg
                key={i}
                viewBox="0 0 24 24"
                width={18}
                height={18}
                className={
                  i < Number(r.rating)
                    ? "text-amber-400"
                    : "text-muted-foreground"
                }
                fill={
                  i < Number(r.rating) ? "currentColor" : "none"
                }
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.2}
                  d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                />
              </svg>
            ))}
          </div>
        </div>

        <p className="mt-3 text-foreground text-sm flex-1 leading-relaxed line-clamp-4">
          {r.feedback}
        </p>
      </article>
    );
  };

  // Helper to guarantee enough cards so columns loop smoothly without blank gaps
  const prepareColCards = (items: typeof displayReviews) => {
    if (items.length === 0) return [];
    let list = [...items];
    while (list.length < 5) {
      list = [...list, ...items];
    }
    // Duplicate set for seamless continuous 50% loop
    return [...list, ...list];
  };

  // Split reviews round-robin into 3 columns for the animated wall.
  const columns: (typeof displayReviews)[] = [[], [], []];
  displayReviews.forEach((r, i) => columns[i % 3].push(r));

  // Column motion: up / down / up at staggered speeds.
  const columnConfig = [
    { className: "wall-up", duration: "44s" },
    { className: "wall-down", duration: "36s" },
    { className: "wall-up", duration: "50s" },
  ];

  return (
    <section className="band-tint py-20 md:py-28 relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <ScrollReveal>
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-foreground">
              Trusted by <span className="gradient-text">Learners</span>
            </h2>
            <p className="text-muted-foreground text-lg mt-4 max-w-2xl mx-auto">
              Our reviews from learners and professionals to build trust.
            </p>
          </div>
        </ScrollReveal>

        {loading && (
          <div className="text-center py-12 text-muted-foreground">
            Loading reviews…
          </div>
        )}
        {error && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {error}
          </div>
        )}

        {!loading && !error && displayReviews.length > 0 && (
          <>
            {prefersReducedMotion ? (
              /* Reduced motion: calm static grid, no auto-scroll. */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {displayReviews.slice(0, 6).map((r, index) => (
                  <ScrollReveal key={r.id ?? Math.random()} delay={index * 0.06}>
                    {renderCard(r, "static")}
                  </ScrollReveal>
                ))}
              </div>
            ) : (
              <ScrollReveal>
                {/* Infinite testimonial wall — hover anywhere pauses every column. */}
                <div
                  className="group relative mx-auto max-w-6xl overflow-hidden h-[540px] md:h-[600px]"
                  style={WALL_MASK}
                >
                  {/* Mobile: single vertical marquee of all reviews. */}
                  <div className="md:hidden flex justify-center h-full">
                    <div
                      className="wall-col wall-up group-hover:[animation-play-state:paused] flex w-full max-w-sm flex-col gap-6 px-1"
                      style={{ animationDuration: "40s" }}
                    >
                      {prepareColCards(displayReviews).map((r, i) =>
                        renderCard(r, `m-${i}`),
                      )}
                    </div>
                  </div>

                  {/* Desktop: 3 columns auto-scrolling at different speeds/directions without gaps. */}
                  <div className="hidden md:grid grid-cols-3 gap-6 h-full">
                    {columns.map((col, ci) => {
                      if (col.length === 0) return null;
                      const cfg = columnConfig[ci];
                      const cards = prepareColCards(col);
                      return (
                        <div
                          key={`col-${ci}`}
                          className="flex justify-center overflow-hidden"
                        >
                          <div
                            className={`wall-col ${cfg.className} group-hover:[animation-play-state:paused] flex w-full flex-col gap-6`}
                            style={{ animationDuration: cfg.duration }}
                          >
                            {cards.map((r, i) =>
                              renderCard(r, `c${ci}-${i}`),
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </ScrollReveal>
            )}

            <ScrollReveal delay={0.2}>
              <div className="flex items-center justify-center mt-10">
                <Button asChild size="lg" className="rounded-xl px-7">
                  <Link to="/reviews">View all reviews</Link>
                </Button>
              </div>
            </ScrollReveal>
          </>
        )}
      </div>
    </section>
  );
};

