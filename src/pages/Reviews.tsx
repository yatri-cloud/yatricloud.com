import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import {
  CERTIFICATION_PROVIDER_LOGOS,
  getCertificationLogoUrl,
} from "@/lib/certification-logos";
import { getCountryFlag, getCountryName } from "@/lib/country-flag";
import { useReviews } from "@/hooks/use-reviews";

const Reviews = () => {
  const { theme } = useTheme();
  const { reviews, loading, error } = useReviews(200);
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const resolvedTheme = theme;

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length).toFixed(1)
    : "0";

  const filteredByProvider =
    selectedProvider === "all"
      ? reviews
      : reviews.filter((r) => r.provider === selectedProvider);
  const filteredReviews =
    selectedCountry === "all"
      ? filteredByProvider
      : filteredByProvider.filter(
          (r) => r.country && getCountryName(r.country) === selectedCountry
        );

  // Only show known certificate providers in the filter (exclude "web" / source)
  const providers = Array.from(
    new Set(
      reviews
        .map((r) => r.provider)
        .filter((p) => p && p in CERTIFICATION_PROVIDER_LOGOS)
    )
  ) as string[];

  // Unique countries (by display name) from reviews, for filter
  const countries = Array.from(
    new Set(
      filteredByProvider
        .map((r) => r.country && getCountryName(r.country))
        .filter(Boolean)
    )
  ).sort() as string[];

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
                  {/* Certification + Country Filters (dropdowns) */}
                  <div className="mb-8 flex flex-wrap items-center gap-3">
                    {/* Certification dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="min-w-[200px] justify-between gap-2 bg-card border-border hover:bg-muted"
                        >
                          <span className="flex items-center gap-2 truncate">
                            {selectedProvider === "all" ? (
                              "Certification"
                            ) : (
                              <>
                                {(() => {
                                  const info = CERTIFICATION_PROVIDER_LOGOS[selectedProvider];
                                  const logoUrl = getCertificationLogoUrl(selectedProvider, resolvedTheme);
                                  return (
                                    <>
                                      {logoUrl && (
                                        <img src={logoUrl} alt="" className="w-5 h-5 object-contain flex-shrink-0" width={20} height={20} />
                                      )}
                                      {info?.label ?? selectedProvider}
                                    </>
                                  );
                                })()}
                              </>
                            )}
                          </span>
                          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="min-w-[200px] max-h-[300px] overflow-y-auto">
                        <DropdownMenuItem onClick={() => setSelectedProvider("all")}>
                          <span className={selectedProvider === "all" ? "font-semibold" : ""}>
                            All ({reviews.length})
                          </span>
                        </DropdownMenuItem>
                        {providers.map((p) => {
                          const count = reviews.filter((r) => r.provider === p).length;
                          const providerInfo = CERTIFICATION_PROVIDER_LOGOS[p];
                          const logoUrl = getCertificationLogoUrl(p, resolvedTheme);
                          if (!providerInfo) return null;
                          return (
                            <DropdownMenuItem key={p} onClick={() => setSelectedProvider(p)}>
                              <span className="flex items-center gap-2 flex-1">
                                {logoUrl && (
                                  <img src={logoUrl} alt="" className="w-5 h-5 object-contain flex-shrink-0" width={20} height={20} />
                                )}
                                <span className={selectedProvider === p ? "font-semibold" : ""}>
                                  {providerInfo.label}
                                </span>
                                <span className="opacity-70 ml-auto">({count})</span>
                              </span>
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Country dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="min-w-[200px] justify-between gap-2 bg-card border-border hover:bg-muted"
                        >
                          <span className="flex items-center gap-2 truncate">
                            {selectedCountry === "all" ? (
                              "Country"
                            ) : (
                              <>
                                <span className="text-lg leading-none">
                                  {(() => {
                                    const r = filteredByProvider.find((x) => getCountryName(x.country) === selectedCountry);
                                    return r?.country ? getCountryFlag(r.country) : "🌍";
                                  })()}
                                </span>
                                {selectedCountry}
                              </>
                            )}
                          </span>
                          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="min-w-[200px] max-h-[300px] overflow-y-auto">
                        <DropdownMenuItem onClick={() => setSelectedCountry("all")}>
                          <span className={selectedCountry === "all" ? "font-semibold" : ""}>
                            All countries
                          </span>
                        </DropdownMenuItem>
                        {countries.map((countryName) => {
                          const count = filteredByProvider.filter(
                            (r) => r.country && getCountryName(r.country) === countryName
                          ).length;
                          const flagRow = filteredByProvider.find((r) => getCountryName(r.country) === countryName);
                          return (
                            <DropdownMenuItem
                              key={countryName}
                              onClick={() => setSelectedCountry(countryName)}
                            >
                              <span className="flex items-center gap-2 flex-1">
                                <span className="text-lg leading-none">
                                  {flagRow?.country ? getCountryFlag(flagRow.country) : "🌍"}
                                </span>
                                <span className={selectedCountry === countryName ? "font-semibold" : ""}>
                                  {countryName}
                                </span>
                                <span className="opacity-70 ml-auto">({count})</span>
                              </span>
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

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
                        <div className="mb-2">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 min-w-0">
                              <h4 className="font-semibold text-lg truncate">{r.name}</h4>
                              {r.linkedinProfile && (
                                <a href={r.linkedinProfile} target="_blank" rel="noreferrer" title="LinkedIn profile" className="flex-shrink-0 hover:opacity-80 transition">
                                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/LinkedIn_icon.svg/960px-LinkedIn_icon.svg.png" alt="LinkedIn" className="w-4 h-4 object-contain" width={16} height={16} />
                                </a>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <svg key={i} viewBox="0 0 24 24" width={18} height={18} className={i < Number(r.rating) ? "text-amber-400" : "text-muted-foreground"} fill={i < Number(r.rating) ? "currentColor" : "none"} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                </svg>
                              ))}
                            </div>
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            <div>
                              {providerInfo && (
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-sm w-fit">
                                  {logoUrl && (
                                    <img src={logoUrl} alt="" className="w-5 h-5 object-contain flex-shrink-0" width={20} height={20} />
                                  )}
                                  <span>{providerInfo.label}</span>
                                </div>
                              )}
                            </div>

                            <div>
                              {r.country && (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background/60 border border-border/60 text-sm" title={getCountryName(r.country)}>
                                  <span className="text-lg leading-none">{getCountryFlag(r.country)}</span>
                                  <span className="text-muted-foreground">{getCountryName(r.country) || r.country}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <p className="mt-4 text-foreground">{r.feedback}</p>
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
