import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Loader2, ArrowRight, Search, ShieldCheck, Zap, RefreshCw, ChevronRight, Building2, Sparkles } from "lucide-react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";
import { SEO } from "@/components/SEO";
import { ExamDumpCard } from "@/components/exam-dumps/ExamDumpCard";
import { CartSheet } from "@/components/store/CartSheet";
import { MobileCartBar } from "@/components/store/MobileCartBar";
import {
  fetchExamDumps,
  ExamDump,
  getProviderMeta,
  normalizeProviderSlug,
  KNOWN_EXAM_PROVIDERS,
} from "@/lib/exam-dumps";
import { useSiteContent, getSiteStats, statValue, FALLBACK_STATS } from "@/lib/site-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ListPager } from "@/components/ui/list-pager";
import { useSearchTracker } from "@/hooks/usePageTracker";

const PAGE_SIZE = 9;

const ExamDumps = () => {
  const navigate = useNavigate();
  const { provider: urlProvider } = useParams<{ provider?: string }>();
  const trackSearch = useSearchTracker("ExamDump");

  const [dumps, setDumps] = useState<ExamDump[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const siteStats = useSiteContent(getSiteStats, FALLBACK_STATS);
  const learners = statValue(siteStats, "learners", "50K+");

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [page, setPage] = useState(1);

  // Normalize provider slug from URL
  const activeProviderSlug = urlProvider ? normalizeProviderSlug(urlProvider) : "all";
  const isProviderSpecific = activeProviderSlug !== "all" && Boolean(urlProvider);
  const activeProviderMeta = isProviderSpecific ? getProviderMeta(activeProviderSlug) : null;

  useEffect(() => {
    setPage(1);
  }, [activeProviderSlug, search, sort]);

  useEffect(() => {
    const loadDumps = async () => {
      try {
        setIsLoading(true);
        const fetchedDumps = await fetchExamDumps();
        setDumps(fetchedDumps);
      } catch (error) {
        console.error("Error loading exam dumps:", error);
        setDumps([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadDumps();
  }, []);

  // Compute all available providers present in current dumps + top recognized providers
  const providerTabs = useMemo(() => {
    const countsBySlug = new Map<string, number>();
    for (const d of dumps) {
      const slug = normalizeProviderSlug(d.provider) || "other";
      countsBySlug.set(slug, (countsBySlug.get(slug) || 0) + 1);
    }

    // Always include top tier providers if present or prominent
    const prominentSlugs = ["aws", "azure", "gcp", "kubernetes", "github", "hashicorp", "salesforce", "cisco", "comptia", "oracle", "servicenow"];
    const allSlugs = new Set([...prominentSlugs, ...Array.from(countsBySlug.keys())]);

    const result: Array<{ slug: string; name: string; count: number; logoUrl?: string; badge?: string }> = [
      { slug: "all", name: "All", count: dumps.length },
    ];

    for (const slug of allSlugs) {
      const count = countsBySlug.get(slug) || 0;
      // Show if it has dumps OR is one of the top 4 cloud providers
      if (count > 0 || ["aws", "azure", "gcp", "kubernetes"].includes(slug)) {
        const meta = getProviderMeta(slug);
        result.push({
          slug,
          name: meta.shortName || meta.name,
          count,
          logoUrl: meta.logoUrl,
          badge: meta.badge,
        });
      }
    }

    return result;
  }, [dumps]);

  // Filter and sort dumps
  const filteredDumps = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = dumps.filter((d) => {
      if (isProviderSpecific) {
        const dSlug = normalizeProviderSlug(d.provider);
        if (dSlug !== activeProviderSlug) return false;
      }

      if (!q) return true;
      return (
        d.title.toLowerCase().includes(q) ||
        d.provider.toLowerCase().includes(q) ||
        (d.description || "").toLowerCase().includes(q)
      );
    });

    const sorted = [...list];
    if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    else if (sort === "name") sorted.sort((a, b) => a.title.localeCompare(b.title));
    return sorted;
  }, [isProviderSpecific, activeProviderSlug, search, sort, dumps]);

  const pageCount = Math.max(1, Math.ceil(filteredDumps.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedDumps = filteredDumps.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // SEO Configurations
  const pageTitle = isProviderSpecific && activeProviderMeta
    ? `${activeProviderMeta.name} Exam Dumps · Verified Practice Questions | Yatri Cloud`
    : "Verified Exam Dumps · AWS, Azure, GCP | Yatri Cloud";

  const pageDescription = isProviderSpecific && activeProviderMeta
    ? activeProviderMeta.description
    : "Real, verified exam dumps for AWS, Azure, GCP, and Kubernetes certifications. Practice with the same style of questions and pass on your first attempt.";

  const canonicalUrl = isProviderSpecific && activeProviderMeta
    ? `https://www.yatricloud.com/examdumps/${activeProviderMeta.slug}`
    : "https://www.yatricloud.com/examdumps";

  return (
    <>
      <div className="min-h-screen bg-background text-foreground pb-20 md:pb-0">
        <SEO
          title={pageTitle}
          description={pageDescription}
          canonical={canonicalUrl}
          jsonLd={
            dumps.length > 0
              ? {
                  "@context": "https://schema.org",
                  "@type": "ItemList",
                  name: isProviderSpecific && activeProviderMeta ? `${activeProviderMeta.name} Exam Dumps` : "Verified Cloud Certification Exam Dumps",
                  itemListElement: filteredDumps.slice(0, 20).map((d, i) => ({
                    "@type": "ListItem",
                    position: i + 1,
                    name: d.title,
                    url: canonicalUrl,
                  })),
                }
              : undefined
          }
        />
        <div className="noise-overlay" />
        <Navbar />

        {/* ── Breadcrumb Bar (if on provider page) ── */}
        {isProviderSpecific && activeProviderMeta && (
          <div className="border-b border-border/60 bg-muted/20 pt-24 pb-3">
            <div className="container mx-auto px-4 md:px-6 flex items-center gap-2 text-xs text-muted-foreground">
              <Link to="/" className="hover:text-primary transition-colors">Home</Link>
              <ChevronRight className="h-3.5 w-3.5 opacity-60" />
              <Link to="/examdumps" className="hover:text-primary transition-colors">Exam Dumps</Link>
              <ChevronRight className="h-3.5 w-3.5 opacity-60" />
              <span className="text-foreground font-semibold">{activeProviderMeta.name}</span>
            </div>
          </div>
        )}

        {/* ── Hero Section ── */}
        <section className={`relative ${isProviderSpecific ? "pt-8 md:pt-12" : "pt-28 md:pt-32"} pb-14 overflow-hidden border-b border-border`}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-background" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/4 h-56 w-56 rounded-full bg-brand-200/20 blur-3xl" />

          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto">
              {isProviderSpecific && activeProviderMeta ? (
                <>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-card/80 backdrop-blur-md shadow-2xs mb-5">
                    {activeProviderMeta.logoUrl ? (
                      <img src={activeProviderMeta.logoUrl} alt={activeProviderMeta.name} className="h-4 w-4 object-contain" />
                    ) : (
                      <Building2 className="h-4 w-4 text-primary" />
                    )}
                    <span className="text-xs font-semibold text-foreground">{activeProviderMeta.badge || "Verified Certification Track"}</span>
                  </div>

                  <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-4">
                    {activeProviderMeta.name} <span className="gradient-text">Exam Dumps</span>
                  </h1>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-6">
                    {activeProviderMeta.description}
                  </p>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-card/80 backdrop-blur-md shadow-2xs mb-5">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold text-foreground">Trusted by {learners} Cloud Engineers</span>
                  </div>

                  <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-4">
                    Pass on your <span className="gradient-text">first attempt</span>
                  </h1>
                  <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-6">
                    Real, verified practice questions & dumps organized by certification provider.
                  </p>
                </>
              )}

              {/* Trust Guarantees */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs md:text-sm text-muted-foreground pt-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-card border border-border/80 px-3.5 py-1.5 shadow-2xs">
                  <ShieldCheck className="h-4 w-4 text-success" /> 100% Verified Questions
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-card border border-border/80 px-3.5 py-1.5 shadow-2xs">
                  <Zap className="h-4 w-4 text-amber-500" /> Instant Email Delivery
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-card border border-border/80 px-3.5 py-1.5 shadow-2xs">
                  <RefreshCw className="h-4 w-4 text-primary" /> Updated for 2026
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Sticky Provider Tabs & Filters Bar ── */}
        <section className="sticky top-16 z-40 bg-background/95 backdrop-blur-xl border-b border-border/60 shadow-xs">
          {/* Provider Quick Jump Bar */}
          <div className="border-b border-border/40">
            <div className="container mx-auto px-4 md:px-6 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {providerTabs.map((tab) => {
                const isActive = tab.slug === "all" ? !isProviderSpecific : activeProviderSlug === tab.slug;
                const linkHref = tab.slug === "all" ? "/examdumps" : `/examdumps/${tab.slug}`;
                return (
                  <Button
                    key={tab.slug}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    asChild
                    className={`rounded-full text-xs min-h-[36px] whitespace-nowrap transition-all ${
                      isActive ? "shadow-inset-btn font-semibold" : "hover:bg-muted"
                    }`}
                  >
                    <Link to={linkHref}>
                      {tab.logoUrl && (
                        <img src={tab.logoUrl} alt="" className="mr-1.5 h-3.5 w-3.5 object-contain" />
                      )}
                      <span>{tab.name}</span>
                    </Link>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Search, Sort and Cart */}
          <div className="container mx-auto px-4 md:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    trackSearch(e.target.value);
                  }}
                  placeholder={
                    isProviderSpecific && activeProviderMeta
                      ? `Search ${activeProviderMeta.shortName} dumps by exam code or name...`
                      : "Search dumps by exam, code or provider..."
                  }
                  aria-label="Search exam dumps"
                  className="h-10 rounded-full pl-9 bg-card/60"
                />
              </div>

              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="h-10 w-[170px] rounded-full hidden sm:flex" aria-label="Sort exam dumps">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="name">Name: A to Z</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2">
              <div className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground tabular-nums">{filteredDumps.length}</span> {filteredDumps.length === 1 ? "dump" : "dumps"} available
              </div>
              <CartSheet openOnBuy />
            </div>
          </div>
        </section>

        {/* ── Grid Section ── */}
        <section className="py-12 lg:py-16">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            {isLoading ? (
              <div className="text-center py-24">
                <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
                <h3 className="text-xl font-semibold">Loading practice dumps…</h3>
              </div>
            ) : filteredDumps.length === 0 ? (
              <div className="text-center py-20 max-w-md mx-auto">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Search className="h-8 w-8" />
                </div>
                <h3 className="font-display text-2xl font-bold">
                  {isProviderSpecific && activeProviderMeta
                    ? `No ${activeProviderMeta.name} dumps yet`
                    : "No dumps found"}
                </h3>
                <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                  {search
                    ? `No exam dumps match "${search}". Try a different keyword or view all providers.`
                    : `We are currently validating fresh question sets for this certification track. Tell us which exam you need and we will prioritize it.`}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  {isProviderSpecific && (
                    <Button variant="outline" asChild className="rounded-xl min-h-[44px]">
                      <Link to="/examdumps">View All Providers</Link>
                    </Button>
                  )}
                  <Button onClick={() => navigate("/requestvoucher")} className="rounded-xl shadow-inset-btn min-h-[44px]">
                    Request a Dump <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {pagedDumps.map((dump) => (
                    <ExamDumpCard key={dump.id} dump={dump} />
                  ))}
                </div>
                {pageCount > 1 && (
                  <div className="mt-12">
                    <ListPager page={currentPage} pageCount={pageCount} onPageChange={setPage} />
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <Footer />
        <MobileCartBar />
      </div>
    </>
  );
};

export default ExamDumps;
