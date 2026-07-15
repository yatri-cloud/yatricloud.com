import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  Cpu,
  Infinity as InfinityIcon,
  Heart,
  Rss,
  Linkedin,
  Database,
  Gamepad2,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { SEO } from "@/components/SEO";
import {
  useSiteContent,
  getSiteStats,
  getCommunities,
  statValue,
  FALLBACK_STATS,
  FALLBACK_COMMUNITIES,
  type CommunityEntry,
} from "@/lib/site-content";

const EASE = [0.16, 1, 0.3, 1] as const;

type Community = { name: string; url: string; tagline: string; logo?: string; icon?: LucideIcon };

const FALLBACK_CHANNEL_URL = "https://whatsapp.com/channel/0029VakdAHIFHWq60yHA1Q0s";

/* Lucide icons for logo-less communities, mapped by name so DB rows
 * (which carry no icon) merge back with the same visuals. New rows
 * without a logo fall back to MessageCircle. */
const COMMUNITY_ICONS: Record<string, LucideIcon> = {
  "DevOps Yatri": InfinityIcon,
  "AI Yatri": Cpu,
  "TiDB Yatri": Database,
  "Google Cloud Arcade Yatri": Gamepad2,
  "Women Yatri": Heart,
  "Blog Yatri": Rss,
  "Yatri LinkedIn": Linkedin,
};

const toCommunity = (c: CommunityEntry): Community => ({
  name: c.name,
  url: c.url,
  tagline: c.tagline,
  logo: c.logo ?? undefined,
  icon: COMMUNITY_ICONS[c.name] ?? (c.logo ? undefined : MessageCircle),
});

const CommunityCard = ({ c, index }: { c: Community; index: number }) => {
  const reduce = useReducedMotion();
  const num = String(index + 1).padStart(2, "0");
  return (
    <motion.a
      href={c.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={reduce ? { opacity: 1 } : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.5, ease: EASE }}
      whileHover={reduce ? undefined : { y: -6 }}
      aria-label={`Join the ${c.name} community`}
      className="group relative flex min-h-[230px] flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card p-7 md:p-8 transition-colors duration-300 hover:border-brand-200 hover:bg-brand-50/40 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* giant editorial index numeral */}
      <span aria-hidden="true" className="pointer-events-none absolute -right-2 -top-3 font-display text-8xl font-black leading-none tabular-nums text-foreground/[0.04] transition-colors duration-300 group-hover:text-primary/10">
        {num}
      </span>

      <div className="relative">
        <h3 className="font-display text-3xl font-bold leading-[1.02] tracking-[-0.02em] transition-colors duration-300 group-hover:text-primary md:text-4xl">
          {c.name}
        </h3>
        <p className="mt-3 max-w-[22ch] text-sm text-muted-foreground md:text-base">{c.tagline}</p>
      </div>

      <span className="relative mt-7 inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-inset-btn transition-colors duration-300 group-hover:bg-brand-600">
        Join Community
        <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </span>
    </motion.a>
  );
};

const Community = () => {
  const reduce = useReducedMotion();

  /* Community lists come from Supabase `communities` (seeded identical
   * to the fallbacks, so nothing visibly changes). */
  const communityEntries = useSiteContent(() => getCommunities(), FALLBACK_COMMUNITIES);
  const MAIN = communityEntries.filter((c) => c.grp === "main").map(toCommunity);
  const MS_SUBS = communityEntries.filter((c) => c.grp === "ms_subs").map(toCommunity);
  const CHANNEL_URL =
    communityEntries.find((c) => c.grp === "channel")?.url || FALLBACK_CHANNEL_URL;

  /* Stat card values come from Supabase site_stats (seeded identical). */
  const siteStats = useSiteContent(getSiteStats, FALLBACK_STATS);
  const STATS = [
    { value: statValue(siteStats, "communities", "17"), label: "Communities" },
    { value: statValue(siteStats, "learners", "50K+"), label: "Yatris" },
    { value: statValue(siteStats, "tracks", "6"), label: "Cloud tracks" },
    { value: statValue(siteStats, "always_active", "24/7"), label: "Always active" },
  ];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="Community - Yatri Cloud" description="You're not learning alone. Join 50,000+ Yatris in 17 friendly communities for AWS, Azure, GCP, DevOps, Kubernetes, AI and more." />
      <div className="noise-overlay" />
      <Navbar />

      {/* Hero — blue band that starts BELOW the transparent navbar so the header stays readable */}
      <section className="relative overflow-hidden bg-background pt-16 md:pt-20">
        <div className="relative overflow-hidden band-blue pt-16 pb-20 md:pt-20 md:pb-24">
          <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
              backgroundSize: "30px 30px",
              maskImage: "radial-gradient(ellipse 65% 60% at 50% 35%, black, transparent 80%)",
              WebkitMaskImage: "radial-gradient(ellipse 65% 60% at 50% 35%, black, transparent 80%)",
            }}
          />
          <div className="container relative z-10 mx-auto px-4 md:px-6">
            <motion.div
              initial={reduce ? { opacity: 1 } : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="mx-auto max-w-3xl text-center text-white"
            >
              <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-[-0.02em] md:text-6xl lg:text-7xl">
                You're not doing this alone, Yatri
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-lg text-white/85 md:text-xl">
                Studying alone is hard. 50,000+ Yatris are here to answer your questions and cheer you on. Find your community below, free for life.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href={CHANNEL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-white px-7 text-base font-semibold text-primary shadow-sm transition-shadow hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  Follow Yatri Community
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              </div>

              {/* stats */}
              <div className="mx-auto mt-12 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
                {STATS.map((s) => (
                  <div key={s.label} className="rounded-2xl border border-white/20 bg-white/10 px-4 py-5 backdrop-blur-sm">
                    <div className="font-display text-3xl font-black tracking-tight tabular-nums">{s.value}</div>
                    <div className="mt-1 text-xs font-medium uppercase tracking-wide text-white/75">{s.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main communities grid */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <ScrollReveal>
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
Find <span className="gradient-text">your people</span>
              </h2>
              <p className="mt-3 text-lg text-muted-foreground">
                One community per track, so the chat stays real and relevant. Join as many as speak to you.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {MAIN.map((c, i) => (
              <CommunityCard key={c.name} c={c} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Microsoft family cluster */}
      <section className="band-tint py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <ScrollReveal>
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">The Microsoft family</h2>
              <p className="mt-3 text-lg text-muted-foreground">
                Dedicated Yatri communities for Azure, Student Ambassadors and MVPs.
              </p>
            </div>
          </ScrollReveal>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
            {MS_SUBS.map((c, i) => (
              <CommunityCard key={c.name} c={c} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Channel CTA — blue band */}
      <section className="relative overflow-hidden band-blue py-20 md:py-24">
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-white/10 blur-[120px]" />
        <div className="container relative z-10 mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center text-white">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-5xl">
Stay close to the Yatri community
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/85">
              Free vouchers, fresh dumps, live sessions and real job openings reach the Yatri community first. Follow along so nothing that could change your career slips past you.
            </p>
            <a
              href={CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-8 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-white px-8 text-base font-semibold text-primary shadow-sm transition-shadow hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              Follow Yatri Community
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Community;
