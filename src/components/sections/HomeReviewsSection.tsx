import { Link } from "react-router-dom";
import ScrollReveal from "@/components/ScrollReveal";
import { useTheme } from "@/components/ThemeProvider";
import {
  CERTIFICATION_PROVIDER_LOGOS,
  getCertificationLogoUrl,
} from "@/lib/certification-logos";
import { useReviews } from "@/hooks/use-reviews";
import { Button } from "@/components/ui/button";

const REVIEWS_LIMIT = 6;

export const HomeReviewsSection = () => {
  const { theme } = useTheme();
  const { reviews, loading, error } = useReviews(REVIEWS_LIMIT);
  const resolvedTheme = theme;
  const displayReviews = reviews.slice(0, REVIEWS_LIMIT);

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <ScrollReveal>
          <div className="text-center mb-12">
            <p className="text-muted-foreground text-lg mb-2">What People Say</p>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground">
              Trusted by <span className="text-primary">Learners</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {displayReviews.map((r) => {
                const providerInfo = r.provider
                  ? CERTIFICATION_PROVIDER_LOGOS[r.provider]
                  : null;
                const logoUrl =
                  r.provider && providerInfo
                    ? getCertificationLogoUrl(r.provider, resolvedTheme)
                    : undefined;
                return (
                  <ScrollReveal key={r.id ?? Math.random()} delay={0.1}>
                    <article className="bg-card border border-border rounded-2xl p-6 shadow hover:shadow-lg transition h-full flex flex-col">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-lg text-foreground truncate">
                            {r.name}
                          </h4>
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
                        <div className="flex items-center gap-0.5 flex-shrink-0 ml-2">
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

                      <p className="mt-4 text-foreground text-sm flex-1 line-clamp-3">
                        {r.feedback}
                      </p>

                      <div className="mt-4 flex items-center justify-between">
                        {r.linkedinProfile ? (
                          <a
                            href={r.linkedinProfile}
                            target="_blank"
                            rel="noreferrer"
                            title="LinkedIn profile"
                            className="hover:opacity-70 transition"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              width={20}
                              height={20}
                              className="text-[#0A66C2]"
                              fill="currentColor"
                            >
                              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                            </svg>
                          </a>
                        ) : (
                          <span />
                        )}
                      </div>
                    </article>
                  </ScrollReveal>
                );
              })}
            </div>

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
