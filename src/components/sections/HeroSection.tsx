import { useEffect, useRef, useState } from "react";
import {
  motion,
  animate,
  useInView,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { ArrowRight, Users, Star, Layers } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { YatriGreeting } from "@/components/YatriGreeting";

const EASE_EDITORIAL = [0.16, 1, 0.3, 1] as const;

/* Decorative certification tracks drifting behind the headline. */
const CERT_TRACKS = ["AWS", "Azure", "GCP", "Kubernetes", "Terraform", "DevOps"];

/* Kinetic outline marquee — purely decorative, reduced-motion safe. */
const CertMarquee = () => {
  const reduceMotion = useReducedMotion();
  const line = CERT_TRACKS.join("  ·  ");

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-[38%] -z-0 flex -rotate-2 select-none overflow-hidden opacity-70"
    >
      <div
        className={`flex w-max whitespace-nowrap ${
          reduceMotion ? "" : "animate-marquee-slow"
        }`}
      >
        <span className="shrink-0 px-8 font-display text-[14vw] font-black leading-none tracking-tight text-foreground/[0.05]">
          {line}
          {"  ·  "}
        </span>
        <span className="shrink-0 px-8 font-display text-[14vw] font-black leading-none tracking-tight text-foreground/[0.05]">
          {line}
          {"  ·  "}
        </span>
      </div>
    </div>
  );
};

/* Count-up numeral: 0 → target on scroll-into-view; instant when reduced. */
type CountUpProps = {
  value: number;
  decimals?: number;
  suffix?: string;
  ariaLabel: string;
};

const CountUp = ({ value, decimals = 0, suffix = "", ariaLabel }: CountUpProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(
    reduceMotion ? value.toFixed(decimals) : (0).toFixed(decimals)
  );

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value.toFixed(decimals));
      return;
    }
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.4,
      ease: EASE_EDITORIAL,
      onUpdate: (latest) => setDisplay(latest.toFixed(decimals)),
    });
    return () => controls.stop();
  }, [inView, reduceMotion, value, decimals]);

  return (
    <span ref={ref} aria-label={ariaLabel} className="tabular-nums">
      <span aria-hidden="true">
        {display}
        {suffix}
      </span>
    </span>
  );
};

const STATS = [
  { value: 50, decimals: 0, suffix: "K+", label: "Learners", aria: "50K+", icon: Users },
  { value: 4.8, decimals: 1, suffix: "", label: "Rating", aria: "4.8", icon: Star },
  { value: 6, decimals: 0, suffix: "", label: "Cloud Tracks", aria: "6", icon: Layers },
];

/* Headline copy split for a word-by-word kinetic reveal. */
const HEADLINE_LINE_ONE = ["Get", "50%", "OFF", "on"];
const HEADLINE_LINE_TWO = ["Certification", "Vouchers"];

export const HeroSection = () => {
  const reduceMotion = useReducedMotion();

  const wordContainer: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduceMotion ? 0 : 0.07, delayChildren: 0.15 },
    },
  };

  const wordChild: Variants = reduceMotion
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: { y: "115%", opacity: 0 },
        show: {
          y: 0,
          opacity: 1,
          transition: { duration: 0.85, ease: EASE_EDITORIAL },
        },
      };

  const renderWords = (words: string[], accent = false) =>
    words.map((word, i) => (
      <span key={`${word}-${i}`} className="inline-block overflow-hidden pb-[0.12em] align-bottom">
        <motion.span
          variants={wordChild}
          className={`inline-block ${accent ? "gradient-text" : ""}`}
        >
          {word}
          {i < words.length - 1 ? " " : ""}
        </motion.span>
      </span>
    ));

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden pb-24 pt-28">
      {/* Background wash + signature blue glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="absolute -left-20 top-1/4 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-3xl shadow-glow-soft" />
      <div className="absolute -right-16 bottom-16 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />

      {/* Kinetic editorial marquee behind the headline */}
      <CertMarquee />

      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="max-w-4xl">
          {/* Personal, time-aware welcome */}
          <motion.p
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_EDITORIAL }}
            className="mb-4 text-lg md:text-xl font-medium"
          >
            <span className="text-foreground">
              <YatriGreeting />
            </span>
          </motion.p>

          {/* Kinetic headline */}
          <motion.h1
            variants={wordContainer}
            initial="hidden"
            animate="show"
            className="mb-6 font-display text-4xl font-bold leading-[1.02] tracking-[-0.02em] md:text-6xl lg:text-7xl"
          >
            {renderWords(HEADLINE_LINE_ONE)}
            <br />
            {renderWords(HEADLINE_LINE_TWO, true)}
          </motion.h1>

          {/* Subheadline */}
          <ScrollReveal delay={0.35}>
            <p className="mb-9 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Get AWS certified at 50% OFF. Book your time slot and we'll schedule
              your exam during the meeting. Dumps, resources, and support included!
            </p>
          </ScrollReveal>

          {/* CTAs */}
          <ScrollReveal delay={0.45}>
            <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
              <motion.a
                href="#"
                aria-label="Get your 50% off certification voucher — book a slot"
                onClick={(e) => {
                  e.preventDefault();
                  if (window.Calendly) {
                    window.Calendly.initPopupWidget({ url: 'https://calendly.com/yatricloud/40min' });
                  }
                }}
                whileHover={reduceMotion ? undefined : { scale: 1.03, y: -2 }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                className="group relative inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-xl bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-inset-btn shadow-glow-soft transition-colors duration-base hover:bg-brand-600"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                <span className="relative z-10">Get Your 50% OFF</span>
                <ArrowRight className="relative z-10 h-5 w-5 transition-transform duration-base group-hover:translate-x-1" />
              </motion.a>

              <motion.a
                href="/examdumps"
                aria-label="Browse the latest exam dumps"
                whileHover={reduceMotion ? undefined : { scale: 1.03, y: -2 }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                className="group relative inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-3 rounded-xl border border-border bg-card px-8 py-4 text-lg font-semibold text-foreground transition-colors duration-base hover:border-primary/60 hover:bg-brand-50"
              >
                <span className="relative z-10">Latest Exam Dumps</span>
                <ArrowRight className="relative z-10 h-5 w-5 transition-transform duration-base group-hover:translate-x-1" />
              </motion.a>
            </div>
          </ScrollReveal>

          {/* Count-up stat cards — creative bento tiles */}
          <ScrollReveal delay={0.55}>
            <dl className="mt-14 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
              {STATS.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: 0.1 + i * 0.08, duration: 0.5, ease: EASE_EDITORIAL }}
                  whileHover={reduceMotion ? undefined : { y: -4 }}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-colors duration-base hover:border-brand-200 hover:shadow-card"
                >
                  {/* Soft blue glow that blooms on hover */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/15 blur-2xl opacity-0 transition-opacity duration-slow group-hover:opacity-100"
                  />
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="font-display text-4xl font-black tracking-tight gradient-text md:text-5xl">
                    <CountUp
                      value={stat.value}
                      decimals={stat.decimals}
                      suffix={stat.suffix}
                      ariaLabel={stat.aria}
                    />
                  </dd>
                  <span className="mt-1 block text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </span>
                </motion.div>
              ))}
            </dl>
          </ScrollReveal>
        </div>

        {/* Certification Process Section */}
        <ScrollReveal delay={0.7}>
          <div id="certification-process" className="mx-auto mt-28 max-w-6xl">
            <div className="mb-12 max-w-2xl">
              <span className="mb-4 block text-sm font-semibold uppercase tracking-wider text-primary">
                Certification Process
              </span>
              <h2 className="mb-4 font-display text-3xl font-bold tracking-tight md:text-5xl">
                How to Get <span className="gradient-text">Certified</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Follow these simple steps below to schedule a meeting and start the
                exam processing
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  number: "01",
                  title: "Select Time",
                  description: "Select a suitable time slot to schedule your meeting",
                },
                {
                  number: "02",
                  title: "Book a Meet",
                  description: "Confirm your booking through the Calendly widget below",
                },
                {
                  number: "03",
                  title: "Exam Scheduling",
                  description:
                    "We will start processing ahead to schedule the exam during our meeting",
                },
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: index * 0.1, duration: 0.6, ease: EASE_EDITORIAL }}
                  whileHover={reduceMotion ? undefined : { y: -6 }}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card p-7 transition-colors duration-base hover:border-primary/50 hover:shadow-card"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity duration-base group-hover:opacity-100" />

                  <span className="font-display text-5xl font-black text-foreground/10 transition-colors duration-base group-hover:text-primary/70">
                    {step.number}
                  </span>

                  <h3 className="mb-3 mt-4 text-xl font-semibold text-foreground transition-colors group-hover:text-primary">
                    {step.title}
                  </h3>

                  <div className="mb-4 h-1 w-10 rounded-full bg-gradient-to-r from-primary to-transparent transition-all duration-base group-hover:w-16" />

                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>

                  {index === 0 && (
                    <motion.a
                      href="#"
                      aria-label="Book your certification meeting now"
                      onClick={(e) => {
                        e.preventDefault();
                        if (window.Calendly) {
                          window.Calendly.initPopupWidget({ url: 'https://calendly.com/yatricloud/40min' });
                        }
                      }}
                      whileHover={reduceMotion ? undefined : { x: 4 }}
                      className="group/link mt-5 inline-flex min-h-[44px] cursor-pointer items-center gap-2 text-sm font-semibold text-primary"
                    >
                      Book Now
                      <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                    </motion.a>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default HeroSection;
