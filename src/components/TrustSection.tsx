import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, animate, useReducedMotion } from "framer-motion";
import { Check, X } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import {
  useSiteContent,
  getSiteStats,
  getTrustFeatures,
  statValue,
  FALLBACK_STATS,
  FALLBACK_TRUST_FEATURES,
  FALLBACK_NOT_FOR_YOU,
  type TrustFeature,
} from "@/lib/site-content";

const forYouPoints = [
  "You want to get AWS certified with 50% OFF vouchers",
  "You're ready to complete registration and join our WhatsApp group",
  "You need exam dumps, study resources, and personal support",
  "You value guided exam scheduling through our team's meeting calls",
  "You want a complete certification package with full support",
];

/* --------------------------------------------------------------------------
 * Count-up stat — animates 0 → final on scroll into view.
 * Preserves the exact final value string (prefix + number + suffix) and label.
 * Honors prefers-reduced-motion by snapping straight to the final value.
 * ------------------------------------------------------------------------ */
const CountUpStat = ({ value, label }: { value: string; label: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();

  // Split "50K+" → prefix "", number "50", suffix "K+"
  const parts = value.match(/^(\D*)([\d.]+)(.*)$/);
  const prefix = parts?.[1] ?? "";
  const numStr = parts?.[2] ?? value;
  const suffix = parts?.[3] ?? "";
  const target = parseFloat(numStr);
  const hasNumber = !Number.isNaN(target);
  const decimals = numStr.includes(".") ? numStr.split(".")[1].length : 0;

  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(
    hasNumber && !reduce ? (0).toFixed(decimals) : numStr,
  );

  useEffect(() => {
    if (!hasNumber) return;
    const unsub = mv.on("change", (v) => setDisplay(v.toFixed(decimals)));
    return () => unsub();
  }, [mv, decimals, hasNumber]);

  useEffect(() => {
    if (!hasNumber) return;
    if (!inView) return;
    if (reduce) {
      mv.set(target);
      setDisplay(target.toFixed(decimals));
      return;
    }
    const controls = animate(mv, target, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
  }, [inView, reduce, target, hasNumber, decimals, mv]);

  return (
    <div ref={ref} className="text-center">
      <div className="font-display font-bold tracking-[-0.02em] tabular-nums gradient-text leading-none text-6xl md:text-7xl lg:text-8xl">
        {/* aria-label is prohibited on a plain <div>; a visually-hidden twin
            carries the final value while the count-up stays decorative. */}
        <span className="sr-only">{`${value} ${label}`}</span>
        <span aria-hidden="true">
          {prefix}
          {hasNumber ? display : value}
          {suffix}
        </span>
      </div>
      <div aria-hidden="true" className="mt-4 text-sm md:text-base font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
};

/* --------------------------------------------------------------------------
 * Marquee row — one direction, seamless (content duplicated), pauses on hover,
 * and stops entirely under prefers-reduced-motion.
 * ------------------------------------------------------------------------ */
const MarqueeRow = ({
  reverse = false,
  slow = false,
  label,
  features,
}: {
  reverse?: boolean;
  slow?: boolean;
  label: string;
  features: TrustFeature[];
}) => (
  <div
    className="group relative flex overflow-hidden"
    role="list"
    aria-label={label}
  >
    {/* edge fades */}
    <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 md:w-28 bg-gradient-to-r from-[hsl(var(--band-tint))] to-transparent" />
    <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 md:w-28 bg-gradient-to-l from-[hsl(var(--band-tint))] to-transparent" />

    {[0, 1].map((copy) => (
      <div
        key={copy}
        aria-hidden={copy === 1 ? true : undefined}
        className={`flex shrink-0 items-center gap-4 pr-4 ${
          slow ? "animate-marquee-slow" : "animate-marquee"
        } group-hover:[animation-play-state:paused] motion-reduce:animate-none`}
        style={reverse ? { animationDirection: "reverse" } : undefined}
      >
        {features.map((feature, i) => (
          <div
            key={`${feature.title}-${i}`}
            role={copy === 0 ? "listitem" : undefined}
            className="inline-flex items-center gap-3 rounded-full border border-border bg-card px-5 py-3 min-h-[44px]"
          >
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-bold text-primary">
              {i + 1}
            </span>
            <span className="whitespace-nowrap font-display text-sm md:text-base font-semibold tracking-tight text-foreground">
              {feature.title}
            </span>
          </div>
        ))}
      </div>
    ))}
  </div>
);

export const TrustSection = () => {
  /* Stat values come from Supabase (seeded identical to these fallbacks).
   * "6+ Practice Tests" stays hardcoded — no site_stats key matches "6+". */
  const siteStats = useSiteContent(getSiteStats, FALLBACK_STATS);

  /* Trust features + "not for you" points come from `trust_features`
   * (seeded to match the previous hardcoded arrays). */
  const trustFeatures = useSiteContent(
    () => getTrustFeatures("feature"),
    FALLBACK_TRUST_FEATURES
  );
  const notForYouRows = useSiteContent(
    () => getTrustFeatures("not_for_you"),
    FALLBACK_NOT_FOR_YOU
  );
  const notForYouPoints = notForYouRows.map((row) => row.title);

  const stats = [
    { value: statValue(siteStats, "learners", "50K+"), label: "Learners" },
    { value: "6+", label: "Practice Tests" },
    { value: statValue(siteStats, "rating", "4.8"), label: "Avg. Rating" },
    { value: statValue(siteStats, "success_rate", "95%"), label: "Success Rate" },
  ];

  return (
    <section className="band-tint py-20 md:py-28 relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* ---------------------------------------------------------------
         * Is this for you — one distinctive split contrast panel
         * ------------------------------------------------------------- */}
        <ScrollReveal>
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">Is this for you?</p>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-foreground">
              This Certification Program Is a <span className="gradient-text">Perfect</span> Fit If You're Ready to...
            </h2>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-5xl mx-auto mb-24 grid md:grid-cols-[1.05fr_0.95fr] rounded-3xl border border-primary/40 overflow-hidden shadow-card"
          >
            {/* Highlighted side — "for you" */}
            <div className="relative bg-primary/[0.06] p-7 md:p-9">
              <div className="absolute inset-y-0 left-0 w-1 bg-primary" aria-hidden="true" />
              <div className="mb-6 flex items-center gap-3">
                <span className="inline-flex h-9 items-center rounded-full bg-primary px-4 font-display text-sm font-bold tracking-tight text-primary-foreground">
                  This is for you if:
                </span>
              </div>
              <div className="space-y-4">
                {forYouPoints.map((point, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: index * 0.06 }}
                    className="flex items-start gap-3"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center mt-0.5">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <p className="text-foreground text-sm md:text-base leading-relaxed">{point}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Quiet side — "consider our offer" */}
            <div className="relative bg-card p-7 md:p-9 border-t md:border-t-0 md:border-l border-border">
              <div className="mb-6 flex items-center gap-3">
                <span className="inline-flex h-9 items-center rounded-full border border-border bg-secondary px-4 font-display text-sm font-bold tracking-tight text-foreground">
                  Consider Our Offer If:
                </span>
              </div>
              <div className="space-y-4">
                {notForYouPoints.map((point, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: index * 0.06 }}
                    className="flex items-start gap-3"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      <X className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-muted-foreground text-sm md:text-base leading-relaxed">{point}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </ScrollReveal>

        {/* ---------------------------------------------------------------
         * Living proof wall — count-up stat band
         * ------------------------------------------------------------- */}
        <ScrollReveal delay={0.1}>
          <div className="text-center mb-14 max-w-3xl mx-auto">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider mb-4 block">
              Trusted by Professionals
            </span>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Why Learners <span className="gradient-text">Trust Us</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Complete certification support from exam scheduling to study resources and personal guidance.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.16}>
          <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-6 divide-x-0 lg:divide-x lg:divide-border py-4 mb-20">
            {stats.map((stat) => (
              <div key={stat.label} className="lg:px-6">
                <CountUpStat value={stat.value} label={stat.label} />
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* ---------------------------------------------------------------
         * Dual badge marquees — opposite directions, pause on hover
         * ------------------------------------------------------------- */}
        <ScrollReveal delay={0.2}>
          <div
            className="max-w-7xl mx-auto space-y-4"
            role="region"
            aria-label="What's included with the certification program"
          >
            <MarqueeRow reverse label="Program benefits, scrolling" features={trustFeatures} />
            <MarqueeRow slow label="Program benefits, scrolling in reverse" features={trustFeatures} />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default TrustSection;
