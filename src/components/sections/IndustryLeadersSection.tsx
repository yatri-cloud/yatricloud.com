import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, animate, useInView, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const EASE = [0.16, 1, 0.3, 1] as const;

/* Certifications by provider — sourced from certification.yatricloud.com. */
type Provider = { name: string; short: string; count: number; blurb: string; logo?: string };

const PROVIDERS: Provider[] = [
  { name: "Amazon AWS", short: "AWS", count: 30, blurb: "Cloud computing & DevOps", logo: "/logos/aws.svg" },
  { name: "Microsoft Azure", short: "Azure", count: 25, blurb: "Cloud solutions & infra", logo: "/logos/azure.svg" },
  { name: "Google Cloud", short: "GCP", count: 18, blurb: "Enterprise cloud & data", logo: "/logos/googlecloud.svg" },
  { name: "GitHub", short: "GitHub", count: 20, blurb: "Version control & CI/CD", logo: "/logos/github.svg" },
  { name: "Kubernetes", short: "K8s", count: 14, blurb: "Container orchestration", logo: "/logos/kubernetes.svg" },
  { name: "Linux Foundation", short: "Linux", count: 15, blurb: "Open-source & Linux", logo: "/logos/linux.svg" },
  { name: "CompTIA", short: "CompTIA", count: 20, blurb: "Vendor-neutral IT", logo: "/logos/comptia.svg" },
  { name: "Cisco", short: "Cisco", count: 16, blurb: "Networking & security", logo: "/logos/cisco.svg" },
  { name: "Salesforce", short: "SF", count: 15, blurb: "CRM & cloud solutions", logo: "/logos/salesforce.svg" },
  { name: "ISC2", short: "ISC2", count: 13, blurb: "Security incl. CISSP" },
  { name: "Oracle", short: "Oracle", count: 12, blurb: "Database & enterprise", logo: "/logos/oracle.svg" },
  { name: "IBM", short: "IBM", count: 12, blurb: "Enterprise & cloud", logo: "/logos/ibm.svg" },
  { name: "Alibaba", short: "Alibaba", count: 11, blurb: "Cloud & enterprise", logo: "/logos/alibabacloud.svg" },
  { name: "ServiceNow", short: "SNOW", count: 10, blurb: "ITSM & automation", logo: "/logos/servicenow.svg" },
  { name: "CNCF", short: "CNCF", count: 10, blurb: "Cloud-native tech", logo: "/logos/cncf.svg" },
  { name: "NVIDIA", short: "NVIDIA", count: 8, blurb: "AI & deep learning", logo: "/logos/nvidia.svg" },
];

const TOTAL = PROVIDERS.reduce((s, p) => s + p.count, 0); // 249

/* Count-up numeral: 0 → target on scroll-into-view; instant when reduced. */
const CountUp = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? value : 0);

  useEffect(() => {
    if (reduce) { setN(value); return; }
    if (!inView) return;
    const c = animate(0, value, { duration: 1.4, ease: EASE, onUpdate: (v) => setN(Math.round(v)) });
    return () => c.stop();
  }, [inView, reduce, value]);

  return <span ref={ref} className="tabular-nums">{n}{suffix}</span>;
};

export const IndustryLeadersSection = () => {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      {/* soft blue accents */}
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-brand-200/10 blur-3xl" />

      <div className="container relative z-10 mx-auto px-4 md:px-6">
        {/* Header */}
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-5xl">
              Backed by <span className="gradient-text">industry leaders</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              We help Yatris get certified across the platforms that actually get you hired. Official tracks from the world's top technology providers.
            </p>
          </div>
        </ScrollReveal>

        {/* Count-up highlight row */}
        <ScrollReveal delay={0.1}>
          <div className="mx-auto mt-10 grid max-w-3xl grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-card">
            {[
              { v: TOTAL, s: "+", label: "Certifications" },
              { v: PROVIDERS.length, s: "", label: "Providers" },
              { v: 400, s: "K+", label: "Learners reached" },
            ].map((stat) => (
              <div key={stat.label} className="px-4 py-6 text-center">
                <div className="font-display text-3xl font-black tracking-tight text-primary md:text-4xl">
                  <CountUp value={stat.v} suffix={stat.s} />
                </div>
                <div className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground md:text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Provider bento grid */}
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {PROVIDERS.map((p, i) => (
            <motion.div
              key={p.name}
              initial={reduce ? { opacity: 1 } : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.5, ease: EASE }}
              whileHover={reduce ? undefined : { y: -5 }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-colors duration-300 hover:border-brand-200 hover:shadow-card"
            >
            <Link
              to="/training"
              aria-label={`Explore ${p.name} certification training`}
              className="flex h-full flex-col justify-between p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span aria-hidden="true" className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative flex items-start justify-between gap-3">
                {p.logo ? (
                  <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-white p-2">
                    <img
                      src={p.logo}
                      alt={`${p.name} logo`}
                      className="h-full w-full object-contain opacity-80 grayscale transition duration-300 group-hover:opacity-100 group-hover:grayscale-0"
                      loading="lazy"
                    />
                  </span>
                ) : (
                  <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 font-display text-[11px] font-bold text-primary">
                    {p.short}
                  </span>
                )}
                <ArrowUpRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/50 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>

              <div className="relative mt-4">
                <h3 className="font-display text-base font-bold tracking-tight">{p.name}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{p.blurb}</p>
              </div>

              <div className="relative mt-4">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary tabular-nums">
                  {p.count}+ certifications
                </span>
              </div>
            </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IndustryLeadersSection;
