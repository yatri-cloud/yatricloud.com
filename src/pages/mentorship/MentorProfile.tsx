import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { SEO } from "@/components/SEO";
import ServiceCard from "@/components/mentorship/ServiceCard";
import MentorReviews from "@/components/mentorship/MentorReviews";
import {
  Mentor,
  MentorReview,
  MentorshipService,
  MentorshipServiceType,
  getMentorBySlug,
  getMentorReviews,
  getMentorServices,
} from "@/lib/mentorship";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const SITE_URL = "https://www.yatricloud.com";

type TypeFilter = "all" | MentorshipServiceType;

const TYPE_LABELS: Record<MentorshipServiceType, string> = {
  call: "1 on 1 Calls",
  package: "Packages",
  digital: "Digital Products",
  webinar: "Webinars",
};

const MentorProfile = () => {
  const { mentorSlug } = useParams<{ mentorSlug: string }>();
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [services, setServices] = useState<MentorshipService[]>([]);
  const [reviews, setReviews] = useState<MentorReview[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<TypeFilter>("all");
  const [isOwner, setIsOwner] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    let mounted = true;
    (async () => {
      const found = await getMentorBySlug(mentorSlug || "");
      if (!mounted) return;
      setMentor(found);
      if (found) {
        const [svc, rev] = await Promise.all([
          getMentorServices(found.id),
          getMentorReviews(found.id),
        ]);
        if (!mounted) return;
        setServices(svc);
        setReviews(rev);

        // Is the signed in visitor this mentor? Show a manage shortcut.
        const { data: authData } = await supabase.auth.getUser();
        const uid = authData?.user?.id;
        if (mounted && uid) {
          const { data: own } = await supabase
            .from("mentors")
            .select("id")
            .eq("user_id", uid)
            .eq("id", found.id)
            .maybeSingle();
          if (mounted) setIsOwner(Boolean(own));
        }
      }
      setLoaded(true);
    })();
    return () => {
      mounted = false;
    };
  }, [mentorSlug]);

  const availableTypes = useMemo(
    () => new Set(services.map((s) => s.type)),
    [services]
  );

  const tabs: { id: TypeFilter; label: string }[] = [
    { id: "all", label: "All services" },
    ...(["call", "package", "digital", "webinar"] as MentorshipServiceType[])
      .filter((t) => availableTypes.has(t))
      .map((t) => ({ id: t as TypeFilter, label: TYPE_LABELS[t] })),
  ];

  const visibleServices =
    filter === "all" ? services : services.filter((s) => s.type === filter);

  if (loaded && !mentor) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SEO title="Mentor not found | Yatri Cloud" noindex />
        <Navbar />
        <main className="container mx-auto px-4 md:px-6 pt-32 pb-24 text-center">
          <h1 className="font-display text-3xl font-bold mb-4">
            We could not find this mentor
          </h1>
          <p className="text-muted-foreground mb-8">
            The profile may have moved. All our mentors live on one page.
          </p>
          <Link
            to="/mentorship"
            className="inline-flex items-center justify-center min-h-[44px] bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-brand-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Browse all mentors
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const jsonLd = mentor
    ? {
        "@context": "https://schema.org",
        "@type": "Person",
        name: mentor.name,
        url: `${SITE_URL}/mentorship/${mentor.slug}`,
        ...(mentor.photo_url ? { image: mentor.photo_url } : {}),
        ...(mentor.headline ? { jobTitle: mentor.headline } : {}),
        ...(mentor.bio ? { description: mentor.bio } : {}),
        ...(mentor.linkedin_url ? { sameAs: [mentor.linkedin_url] } : {}),
        ...(mentor.review_count > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: mentor.avg_rating,
                reviewCount: mentor.review_count,
                bestRating: 5,
              },
            }
          : {}),
        ...(services.length > 0
          ? {
              hasOfferCatalog: {
                "@type": "OfferCatalog",
                name: `Mentorship services by ${mentor.name}`,
                itemListElement: services.map((s) => ({
                  "@type": "Offer",
                  price: s.price,
                  priceCurrency: s.currency,
                  availability: "https://schema.org/InStock",
                  url: `${SITE_URL}/mentorship/${mentor.slug}/${s.slug}`,
                  itemOffered: {
                    "@type": "Service",
                    name: s.title,
                    description: s.short_description,
                  },
                })),
              },
            }
          : {}),
      }
    : undefined;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title={
          mentor
            ? `${mentor.name} · Cloud Mentorship Sessions | Yatri Cloud`
            : "Mentorship | Yatri Cloud"
        }
        description={
          mentor?.headline ||
          "Book 1:1 mentorship sessions with cloud experts on Yatri Cloud."
        }
        image={mentor?.photo_url || undefined}
        type="profile"
        jsonLd={jsonLd}
      />
      <div className="noise-overlay" />
      <Navbar />

      <main className="container mx-auto px-4 md:px-6 pt-24 pb-16">
        <Link
          to="/mentorship"
          className="inline-flex items-center min-h-[44px] text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          Back to all mentors
        </Link>

        {!loaded || !mentor ? (
          <div className="flex flex-col md:flex-row gap-8 animate-pulse motion-reduce:animate-none">
            <div className="w-40 h-40 rounded-3xl bg-muted shrink-0" />
            <div className="flex-1 space-y-4 py-2">
              <div className="h-8 w-1/3 bg-muted rounded" />
              <div className="h-4 w-2/3 bg-muted rounded" />
              <div className="h-4 w-1/2 bg-muted rounded" />
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <ScrollReveal>
              <div className="flex flex-col md:flex-row gap-8 md:items-start mb-14">
                <div className="w-36 h-36 md:w-44 md:h-44 rounded-3xl overflow-hidden bg-muted shrink-0">
                  {mentor.photo_url ? (
                    <img
                      src={mentor.photo_url}
                      alt={mentor.name}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-display text-5xl font-bold text-brand-200">
                        {mentor.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {isOwner && (
                    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-brand-100 bg-brand-50/50 p-3">
                      <p className="text-sm text-muted-foreground">This is your public page.</p>
                      <Button size="sm" onClick={() => navigate("/mentor/dashboard")} className="ml-auto font-semibold">
                        Manage my page
                      </Button>
                    </div>
                  )}
                  <h1 className="font-display text-3xl md:text-5xl font-bold tracking-[-0.02em]">
                    {mentor.name}
                  </h1>
                  <p className="mt-3 text-lg text-muted-foreground leading-relaxed max-w-2xl">
                    {mentor.headline}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                    {mentor.review_count > 0 && (
                      <p className="text-foreground">
                        <span className="font-semibold">
                          {mentor.avg_rating.toFixed(1)}
                        </span>
                        <span className="text-muted-foreground">
                          {" "}
                          · {mentor.review_count}{" "}
                          {mentor.review_count === 1 ? "review" : "reviews"}
                        </span>
                      </p>
                    )}
                    {mentor.languages.length > 0 && (
                      <p className="text-muted-foreground">
                        Speaks {mentor.languages.join(" and ")}
                      </p>
                    )}
                    {mentor.linkedin_url && (
                      <a
                        href={mentor.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center min-h-[44px] text-primary font-medium hover:underline"
                      >
                        View profile
                      </a>
                    )}
                  </div>

                  {mentor.expertise.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {mentor.expertise.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ScrollReveal>

            {/* Services */}
            <section className="mb-16">
              <ScrollReveal>
                <h2 className="font-display text-2xl md:text-3xl font-bold mb-6">
                  Book a session
                </h2>
                {tabs.length > 2 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-8" role="tablist" aria-label="Filter services by type">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={filter === tab.id}
                        onClick={() => setFilter(tab.id)}
                        className={`shrink-0 min-h-[44px] px-5 rounded-full border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          filter === tab.id
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-foreground hover:border-brand-200 hover:bg-brand-50"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}
              </ScrollReveal>

              {visibleServices.length === 0 ? (
                <div className="rounded-2xl border border-border band-tint p-8 text-center">
                  <p className="text-muted-foreground">
                    Sessions are being set up, Yatri. Check back soon.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {visibleServices.map((service, index) => (
                    <ScrollReveal key={service.id} delay={index * 0.06}>
                      <ServiceCard service={service} mentorSlug={mentor.slug} />
                    </ScrollReveal>
                  ))}
                </div>
              )}
            </section>

            {/* Reviews */}
            <section className="mb-16">
              <ScrollReveal>
                <h2 className="font-display text-2xl md:text-3xl font-bold mb-6">
                  What Yatris say
                </h2>
                <MentorReviews mentor={mentor} reviews={reviews} />
              </ScrollReveal>
            </section>

            {/* About */}
            {mentor.bio && (
              <section className="max-w-3xl">
                <ScrollReveal>
                  <h2 className="font-display text-2xl md:text-3xl font-bold mb-6">
                    About {mentor.name.split(" ")[0]}
                  </h2>
                  <div className="space-y-4">
                    {mentor.bio.split("\n").filter(Boolean).map((para, i) => (
                      <p
                        key={i}
                        className="text-muted-foreground leading-relaxed"
                      >
                        {para}
                      </p>
                    ))}
                  </div>
                </ScrollReveal>
              </section>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MentorProfile;
