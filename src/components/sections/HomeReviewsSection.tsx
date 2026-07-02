import { Link } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import ScrollReveal from "@/components/ScrollReveal";
import { useTheme } from "@/components/ThemeProvider";
import {
  CERTIFICATION_PROVIDER_LOGOS,
  getCertificationLogoUrl,
} from "@/lib/certification-logos";
import { getCountryFlag, getCountryName } from "@/lib/country-flag";
import { useReviews } from "@/hooks/use-reviews";
import { Button } from "@/components/ui/button";

const REVIEWS_LIMIT = 6;

// Soft top/bottom fade so cards enter/exit the wall smoothly.
const WALL_MASK: React.CSSProperties = {
  WebkitMaskImage:
    "linear-gradient(to bottom, transparent, #000 9%, #000 91%, transparent)",
  maskImage:
    "linear-gradient(to bottom, transparent, #000 9%, #000 91%, transparent)",
};

export const HomeReviewsSection = () => {
  const { theme } = useTheme();
  const { reviews, loading, error } = useReviews(REVIEWS_LIMIT);
  const resolvedTheme = theme;
  const displayReviews = reviews.slice(0, REVIEWS_LIMIT);
  const prefersReducedMotion = useReducedMotion();

  // Presentational card renderer — identical markup/data to the previous grid.
  const renderCard = (
    r: (typeof displayReviews)[number],
    keyPrefix: string,
  ) => {
    const providerInfo = r.provider
      ? CERTIFICATION_PROVIDER_LOGOS[r.provider]
      : null;
    const logoUrl =
      r.provider && providerInfo
        ? getCertificationLogoUrl(r.provider, resolvedTheme)
        : undefined;
    return (
      <article
        key={`${keyPrefix}-${r.id ?? Math.random()}`}
        className="bg-card border border-border rounded-2xl p-6 hover:border-primary/40 hover:shadow-card transition-all duration-300 flex flex-col"
      >
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-display font-bold tracking-tight text-lg text-foreground truncate">
                {r.name}
              </h4>
              {r.linkedinProfile && (
                <a href={r.linkedinProfile} target="_blank" rel="noreferrer" title="LinkedIn profile" className="flex-shrink-0 hover:opacity-80 transition">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/LinkedIn_icon.svg/960px-LinkedIn_icon.svg.png" alt="LinkedIn" className="w-4 h-4 object-contain" width={16} height={16} />
                </a>
              )}
            </div>
            {/* Provider on left */}
            {providerInfo && (
              <div className="mt-1 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-sm w-fit">
                {logoUrl && (
                  <img
                    src={logoUrl}
                    alt=""
                    className="w-5 h-5 object-contain flex-shrink-0"
                    width={20}
                    height={20}
                  />
                )}
                <span className="text-foreground">
                  {providerInfo.label}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <div className="flex items-center gap-0.5" role="img" aria-label={`Rated ${Number(r.rating)} out of 5 stars`}>
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
            {r.country && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background/60 border border-border/60 text-sm" title={getCountryName(r.country)}>
                <span className="text-lg leading-none">{getCountryFlag(r.country)}</span>
                <span className="text-muted-foreground">{getCountryName(r.country) || r.country}</span>
              </div>
            )}
          </div>
        </div>

        <p className="mt-4 text-foreground text-sm flex-1 line-clamp-3">
          {r.feedback}
        </p>
      </article>
    );
  };

  // Split reviews round-robin into 3 columns for the animated wall.
  const columns: (typeof displayReviews)[] = [[], [], []];
  displayReviews.forEach((r, i) => columns[i % 3].push(r));
  // Column motion: up / down / up at staggered speeds.
  const columnConfig = [
    { className: "wall-up", duration: "44s" },
    { className: "wall-down", duration: "34s" },
    { className: "wall-up", duration: "52s" },
  ];

  return (
    <section className="band-tint py-20 md:py-28 relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <ScrollReveal>
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">What People Say</p>
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
                {displayReviews.map((r, index) => (
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
                      {[...displayReviews, ...displayReviews].map((r, i) =>
                        renderCard(r, `m-${i}`),
                      )}
                    </div>
                  </div>

                  {/* Desktop: 3 columns auto-scrolling at different speeds/directions. */}
                  <div className="hidden md:grid grid-cols-3 gap-6 h-full">
                    {columns.map((col, ci) => {
                      if (col.length === 0) return null;
                      const cfg = columnConfig[ci];
                      return (
                        <div
                          key={`col-${ci}`}
                          className="flex justify-center overflow-hidden"
                        >
                          <div
                            className={`wall-col ${cfg.className} group-hover:[animation-play-state:paused] flex w-full flex-col gap-6`}
                            style={{ animationDuration: cfg.duration }}
                          >
                            {[...col, ...col].map((r, i) =>
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
              <div className="text-center mt-10">
                <Button asChild variant="outline" size="lg">
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
