import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { SEO } from "@/components/SEO";
import MentorCard from "@/components/mentorship/MentorCard";
import {
  Mentor,
  MentorshipService,
  MentorshipServiceType,
  getMentors,
  getAllServices,
} from "@/lib/mentorship";

const SITE_URL = "https://www.yatricloud.com";

type TypeFilter = "all" | MentorshipServiceType;

const FILTER_TABS: { id: TypeFilter; label: string }[] = [
  { id: "all", label: "All mentors" },
  { id: "call", label: "1 on 1 Calls" },
  { id: "package", label: "Packages" },
  { id: "digital", label: "Digital Products" },
  { id: "webinar", label: "Webinars" },
];

const MentorshipDirectory = () => {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [services, setServices] = useState<MentorshipService[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<TypeFilter>("all");

  useEffect(() => {
    window.scrollTo(0, 0);
    Promise.all([getMentors(), getAllServices()]).then(([m, s]) => {
      setMentors(m);
      setServices(s);
      setLoaded(true);
    });
  }, []);

  const availableTypes = useMemo(
    () => new Set(services.map((s) => s.type)),
    [services]
  );

  const tabs = FILTER_TABS.filter(
    (tab) => tab.id === "all" || availableTypes.has(tab.id)
  );

  const visibleMentors = useMemo(() => {
    if (filter === "all") return mentors;
    const mentorIds = new Set(
      services.filter((s) => s.type === filter).map((s) => s.mentor_id)
    );
    return mentors.filter((m) => mentorIds.has(m.id));
  }, [mentors, services, filter]);

  const fromPriceFor = (mentorId: string): number | null => {
    const pool = services.filter(
      (s) => s.mentor_id === mentorId && (filter === "all" || s.type === filter)
    );
    if (pool.length === 0) return null;
    return Math.min(...pool.map((s) => s.price));
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Yatri Cloud Mentors",
    itemListElement: mentors.map((mentor, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Person",
        name: mentor.name,
        url: `${SITE_URL}/mentorship/${mentor.slug}`,
        ...(mentor.photo_url ? { image: mentor.photo_url } : {}),
        ...(mentor.headline ? { jobTitle: mentor.headline } : {}),
        ...(mentor.linkedin_url ? { sameAs: [mentor.linkedin_url] } : {}),
      },
    })),
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Mentorship · Book 1:1 Sessions with Cloud Experts | Yatri Cloud"
        description="Book 1:1 mentorship calls, resume reviews, interview prep and career roadmaps with cloud experts who have walked the path. Real advice, honest pricing."
        jsonLd={jsonLd}
      />
      <div className="noise-overlay" />
      <Navbar />

      <main className="pt-24 pb-16">
        <section className="container mx-auto px-4 md:px-6 py-12 md:py-16">
          <ScrollReveal>
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-4">
                Mentorship
              </p>
              <h1 className="font-display text-4xl md:text-6xl font-bold tracking-[-0.02em] leading-[1.05]">
                Learn from people who have already made it in cloud
              </h1>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl">
                Book a 1:1 call, get your resume reviewed or follow a proven
                roadmap. Every mentor here has done the work, cleared the
                certifications and helped Yatris like you land real roles.
              </p>
            </div>
          </ScrollReveal>
        </section>

        <section className="container mx-auto px-4 md:px-6">
          <ScrollReveal>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-10" role="tablist" aria-label="Filter mentors by service type">
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
          </ScrollReveal>

          {!loaded ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-3xl border border-border bg-card overflow-hidden animate-pulse motion-reduce:animate-none"
                >
                  <div className="aspect-[4/3] bg-muted" />
                  <div className="p-6 space-y-3">
                    <div className="h-5 w-2/3 bg-muted rounded" />
                    <div className="h-4 w-full bg-muted rounded" />
                    <div className="h-4 w-1/2 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : visibleMentors.length === 0 ? (
            <div className="rounded-3xl border border-border band-tint p-12 text-center">
              <p className="text-muted-foreground">
                No mentors match this filter yet, Yatri. Try another category
                or check back soon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {visibleMentors.map((mentor, index) => (
                <ScrollReveal key={mentor.id} delay={index * 0.08}>
                  <MentorCard mentor={mentor} fromPrice={fromPriceFor(mentor.id)} />
                </ScrollReveal>
              ))}
            </div>
          )}
        </section>

        <section className="container mx-auto px-4 md:px-6 mt-20">
          <ScrollReveal>
            <div className="rounded-3xl band-tint border border-border p-8 md:p-12 text-center max-w-3xl mx-auto">
              <h2 className="font-display text-2xl md:text-3xl font-bold">
                Not sure which session fits you?
              </h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Start with a career guidance call. It is the fastest way to get
                clarity on your path, and your mentor will point you to the
                right next step.
              </p>
            </div>
          </ScrollReveal>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default MentorshipDirectory;
