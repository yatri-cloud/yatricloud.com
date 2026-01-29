import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import {
  CERTIFICATION_PROVIDER_LOGOS,
  getCertificationLogoUrl,
} from "@/lib/certification-logos";
import { useReviews } from "@/hooks/use-reviews";

const Reviews = () => {
  const { theme } = useTheme();
  const { reviews, loading, error } = useReviews(200);
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const resolvedTheme = theme;

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length).toFixed(1)
    : "0";

  const filteredReviews = selectedProvider === 'all' 
    ? reviews 
    : reviews.filter(r => r.provider === selectedProvider);

  // Only show known certificate providers in the filter (exclude "web" / source)
  const providers = Array.from(
    new Set(
      reviews
        .map((r) => r.provider)
        .filter((p) => p && p in CERTIFICATION_PROVIDER_LOGOS)
    )
  ) as string[];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-24 pb-16">
        <section className="py-12">
          <div className="container mx-auto px-4 md:px-6 max-w-6xl">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-2">What People Say About Yatri</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Our reviews from learners and professionals who build trust and help you
                make confident decisions. Honest, constructive, and human.
              </p>
            </div>

            <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-8 mb-8">
              <div className="bg-card border border-border rounded-2xl p-6 shadow">
                <div className="text-center">
                  <div className="text-4xl font-extrabold">{avg} <span className="text-sm font-medium text-muted-foreground">/ 5</span></div>
                  <div className="text-sm text-muted-foreground mt-1">Average rating</div>
                  <div className="mt-3 text-sm text-muted-foreground">{reviews.length} review{reviews.length === 1 ? '' : 's'}</div>
                </div>
              </div>

              <div className="mt-4 md:mt-0 flex-1">
                <div className="bg-card border border-border rounded-2xl p-6 shadow flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Trusted by learners</h3>
                    <p className="text-muted-foreground">See selected testimonials and full feedback below.</p>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <Button asChild>
                      <a href="/feedback" className="px-4 py-2">Leave your feedback</a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              {loading && <div className="text-center py-12">Loading reviews…</div>}
              {error && <div className="text-center text-destructive py-6">{error}</div>}

              {!loading && !error && (
                <>
                  {/* Provider Filter */}
                  {providers.length > 0 && (
                    <div className="mb-8 flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedProvider('all')}
                        className={`px-4 py-2 rounded-full font-medium transition ${selectedProvider === 'all' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-foreground hover:bg-muted'}`}
                      >
                        All Certifications ({reviews.length})
                      </button>
                      {providers.map((p) => {
                        const count = reviews.filter((r) => r.provider === p).length;
                        const providerInfo = CERTIFICATION_PROVIDER_LOGOS[p];
                        const logoUrl = getCertificationLogoUrl(p, resolvedTheme);
                        if (!providerInfo) return null;
                        return (
                          <button
                            key={p}
                            onClick={() => setSelectedProvider(p)}
                            className={`px-4 py-2 rounded-full font-medium transition flex items-center gap-2 ${selectedProvider === p ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground hover:bg-muted"}`}
                          >
                            {logoUrl && (
                              <img
                                src={logoUrl}
                                alt=""
                                className="w-5 h-5 object-contain flex-shrink-0"
                                width={20}
                                height={20}
                              />
                            )}
                            <span>{providerInfo.label}</span>
                            <span className="opacity-80">({count})</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Reviews Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredReviews.map((r) => {
                    const providerInfo = r.provider
                      ? CERTIFICATION_PROVIDER_LOGOS[r.provider]
                      : null;
                    const logoUrl =
                      r.provider && providerInfo
                        ? getCertificationLogoUrl(r.provider, resolvedTheme)
                        : undefined;
                    return (
                      <article key={r.id ?? Math.random()} className="bg-card border border-border rounded-2xl p-6 shadow hover:shadow-lg transition">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{r.name}</h4>
                            {providerInfo && (
                              <div className="mt-1 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-sm">
                                {logoUrl && (
                                  <img
                                    src={logoUrl}
                                    alt=""
                                    className="w-5 h-5 object-contain flex-shrink-0"
                                    width={20}
                                    height={20}
                                  />
                                )}
                                <span>{providerInfo.label}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <svg key={i} viewBox="0 0 24 24" width={18} height={18} className={i < Number(r.rating) ? 'text-amber-400' : 'text-muted-foreground'} fill={i < Number(r.rating) ? 'currentColor' : 'none'} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                              </svg>
                            ))}
                          </div>
                        </div>

                        <p className="mt-4 text-foreground">{r.feedback}</p>

                        <div className="mt-4 flex items-center justify-start">
                          {r.linkedinProfile ? (
                            <a href={r.linkedinProfile} target="_blank" rel="noreferrer" title="LinkedIn profile" className="hover:opacity-70 transition">
                              <svg viewBox="0 0 24 24" width={20} height={20} className="text-blue-600" fill="currentColor">
                                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                              </svg>
                            </a>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Reviews;
