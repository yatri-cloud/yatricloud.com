import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  MessageCircle,
  Users,
  Cpu,
  Infinity as InfinityIcon,
  Heart,
  Rss,
  Linkedin,
  Database,
  Gamepad2,
  Radio,
  type LucideIcon,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import { SEO } from "@/components/SEO";

const EASE = [0.16, 1, 0.3, 1] as const;

type Community = { name: string; url: string; tagline: string; logo?: string; icon?: LucideIcon };

const CHANNEL_URL = "https://whatsapp.com/channel/0029VakdAHIFHWq60yHA1Q0s";

const MAIN: Community[] = [
  { name: "AWS Yatri", url: "https://chat.whatsapp.com/Luh1daKLk4tCfgohAdkayp", tagline: "The world's #1 cloud", logo: "/logos/aws.svg" },
  { name: "Microsoft Yatri", url: "https://chat.whatsapp.com/CzcpDRiV2vR87vGwY7dPAp", tagline: "Azure, MVP & the Microsoft stack", logo: "/logos/microsoft.svg" },
  { name: "GCP Yatri", url: "https://chat.whatsapp.com/JgUS13YbcYCL82PfpLQnBv", tagline: "Google Cloud & data", logo: "/logos/googlecloud.svg" },
  { name: "GitHub Yatri", url: "https://chat.whatsapp.com/DbuYINmHGKF3qkQLYU5Ugx", tagline: "Open source, PRs & version control", logo: "/logos/github.svg" },
  { name: "Kubernetes Yatri", url: "https://chat.whatsapp.com/LC5LN2YTqjV24X0eiSMNwe", tagline: "Containers & cloud-native", logo: "/logos/kubernetes.svg" },
  { name: "DevOps Yatri", url: "https://chat.whatsapp.com/JYjH73L6Tof7JDmYQSUYqW", tagline: "CI/CD, automation & SRE", icon: InfinityIcon },
  { name: "AI Yatri", url: "https://chat.whatsapp.com/FPgpa7E8WQyA75ITKzXxI0", tagline: "LLMs, ML & the future of AI", icon: Cpu },
  { name: "Salesforce Yatri", url: "https://chat.whatsapp.com/KGjtJpcqgPRJFB6ImU2Awc", tagline: "CRM & the Salesforce ecosystem", logo: "/logos/salesforce.svg" },
  { name: "Oracle Yatri", url: "https://chat.whatsapp.com/JETPhF7ZE3LDQQeeigLLge", tagline: "Databases & enterprise cloud", logo: "/logos/oracle.svg" },
  { name: "TiDB Yatri", url: "https://chat.whatsapp.com/GNFWRA2yxSVCafGXgpXQO6", tagline: "Distributed SQL & databases", icon: Database },
  { name: "Google Cloud Arcade Yatri", url: "https://chat.whatsapp.com/Lkm5LMvsTrACLn6FIijist", tagline: "Earn badges & swag with GCP Arcade", icon: Gamepad2 },
  { name: "Women Yatri", url: "https://chat.whatsapp.com/If2yiVZNzivHdf7nv5lHiU", tagline: "Women in cloud & tech", icon: Heart },
  { name: "Blog Yatri", url: "https://chat.whatsapp.com/LJWGl6juKNgK7kO7jjgwp1", tagline: "Write, learn & get published", icon: Rss },
  { name: "Yatri LinkedIn", url: "https://chat.whatsapp.com/ImroH8OP1GKBzB2dACmqmf", tagline: "Network, grow & get noticed", icon: Linkedin },
];

const MS_SUBS: Community[] = [
  { name: "Azure Yatri", url: "https://chat.whatsapp.com/JUl0ysEOLZGKVSHnsuIoJb", tagline: "Microsoft's cloud platform", logo: "/logos/azure.svg" },
  { name: "MLSA Yatri", url: "https://chat.whatsapp.com/CRPn0N5V2lbDsexLrXY0l4", tagline: "Microsoft Learn Student Ambassadors", logo: "/logos/microsoft.svg" },
  { name: "MVP Yatri", url: "https://chat.whatsapp.com/GIqTRS29D8iIQodRNNXblr", tagline: "Most Valuable Professionals", logo: "/logos/microsoft.svg" },
];

const STATS = [
  { value: "17", label: "Communities" },
  { value: "50K+", label: "Yatris" },
  { value: "6", label: "Cloud tracks" },
  { value: "24/7", label: "Always active" },
];

const Badge = ({ c }: { c: Community }) => (
  <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-white p-2.5">
    {c.logo ? (
      <img src={c.logo} alt={`${c.name} logo`} className="h-full w-full object-contain opacity-85 grayscale transition duration-300 group-hover:opacity-100 group-hover:grayscale-0" loading="lazy" />
    ) : c.icon ? (
      <c.icon className="h-6 w-6 text-primary" />
    ) : null}
  </span>
);

const CommunityCard = ({ c, index }: { c: Community; index: number }) => {
  const reduce = useReducedMotion();
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
      aria-label={`Join ${c.name} on WhatsApp`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 transition-colors duration-300 hover:border-brand-200 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span aria-hidden="true" className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative flex items-start justify-between gap-3">
        <Badge c={c} />
        <ArrowUpRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/50 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      <h3 className="relative mt-4 font-display text-base font-bold tracking-tight">{c.name}</h3>
      <p className="relative mt-0.5 text-sm text-muted-foreground">{c.tagline}</p>
      <div className="relative mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
        <MessageCircle className="h-4 w-4" />
        Join on WhatsApp
      </div>
    </motion.a>
  );
};

const Community = () => {
  const reduce = useReducedMotion();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="Community - Yatri Cloud" description="Join 50,000+ Yatris across 17 WhatsApp communities for AWS, Azure, GCP, DevOps, Kubernetes, AI and more." />
      <div className="noise-overlay" />
      <Navbar />

      {/* Hero — saturated blue band */}
      <section className="relative overflow-hidden band-blue pt-32 pb-20 md:pb-24">
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
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
              <Users className="h-4 w-4" /> The Yatri community
            </p>
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-[-0.02em] md:text-6xl lg:text-7xl">
              You're not doing this alone, Yatri
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-white/85 md:text-xl">
              50,000+ Yatris are learning, sharing dumps, dropping job leads and celebrating wins across 17 focused WhatsApp communities. Find your track and jump in — it's free, forever.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={CHANNEL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-white px-7 text-base font-semibold text-primary shadow-sm transition-shadow hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <Radio className="h-5 w-5" />
                Follow the WhatsApp Channel
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
      </section>

      {/* Main communities grid */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <ScrollReveal>
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
                Pick your <span className="gradient-text">tribe</span>
              </h2>
              <p className="mt-3 text-lg text-muted-foreground">
                One community per track, so the chat stays relevant. Join as many as you like.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background px-4 py-1.5 text-sm font-medium text-primary shadow-sm">
                <img src="/logos/microsoft.svg" alt="" aria-hidden="true" className="h-4 w-4 object-contain" /> Microsoft family
              </p>
              <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Deeper into the Microsoft stack</h2>
              <p className="mt-3 text-lg text-muted-foreground">
                Inside the Microsoft Yatri world — dedicated rooms for Azure, Student Ambassadors and MVPs.
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
              Never miss a drop, Yatri
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/85">
              Free vouchers, new dumps, live sessions and job alerts land on our WhatsApp Channel first. Follow it and stay one step ahead.
            </p>
            <a
              href={CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-8 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-white px-8 text-base font-semibold text-primary shadow-sm transition-shadow hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <Radio className="h-5 w-5" />
              Follow the Yatri Cloud Channel
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
