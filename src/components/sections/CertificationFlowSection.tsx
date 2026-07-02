import React, { useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ExternalLink, BadgeCheck } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const eligibleExams = [
  "AWS Cloud Practitioner",
  "AWS AI Practitioner",
  "AWS Certified Solutions Architect – Associate (SAA-C03)",
  "AWS Certified Developer – Associate (DVA-C02)",
  "AWS Certified CloudOps Engineer – Associate (SOA-C03)",
  "AWS Certified Data Engineer – Associate (DEA-C01)",
  "AWS Certified Machine Learning Engineer – Associate (MLA-C01)",
];

// Public AWS exam codes for entries whose title doesn't include the code inline.
const EXAM_CODE_FALLBACK: Record<string, string> = {
  "cloud practitioner": "CLF-C02",
  "ai practitioner": "AIF-C01",
};

const bonusFeatures = [
  {
    text: "50% OFF Vouchers",
    description: "Get AWS Associate exam vouchers at half price - limited time offer",
    gradient: "from-blue-500/20 to-purple-500/20"
  },
  {
    text: "Exam Dumps & Resources",
    description: "Comprehensive exam dumps and study resources to help you prepare effectively",
    gradient: "from-purple-500/20 to-pink-500/20"
  },
  {
    text: "Udemy Course Free Access",
    description: "Get free access to our premium Udemy certification courses",
    gradient: "from-pink-500/20 to-orange-500/20"
  },
  {
    text: "Topmate Free Connect",
    description: "Free Topmate sessions with Yatharth Chauhan and Nensi Ravaliya for personalized guidance",
    gradient: "from-orange-500/20 to-yellow-500/20"
  },
  {
    text: "LinkedIn Recommendation",
    description: "Get a professional LinkedIn recommendation from us after certification",
    gradient: "from-yellow-500/20 to-green-500/20"
  },
  {
    text: "Yatri Wall of Fame",
    description: "Get featured on our Wall of Fame after successfully passing your AWS certification",
    gradient: "from-green-500/20 to-teal-500/20"
  },
];

const steps = [
  {
    number: 1,
    title: "Select Time",
    description: "Select a suitable time slot to schedule your meeting",
    gradient: "from-blue-500/20 via-cyan-500/20 to-teal-500/20",
    action: {
      label: "Book Now",
      isPopup: true,
      url: "#",
    },
  },
  {
    number: 2,
    title: "Book a Meet",
    description: "Confirm your booking through the Calendly widget below",
    gradient: "from-green-500/20 via-emerald-500/20 to-teal-500/20",
    action: null,
  },
  {
    number: 3,
    title: "Exam Scheduling",
    description: "We will start processing ahead to schedule the exam during our meeting",
    gradient: "from-purple-500/20 via-pink-500/20 to-rose-500/20",
    action: null,
  },
];

const reveal = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
};

export const CertificationFlowSection = () => {
  const prefersReducedMotion = useReducedMotion();

  // Preserved step-action logic (extracted so both the desktop + mobile
  // timeline layouts can share the exact same handler — behaviour unchanged).
  const handleStepAction = (
    e: React.MouseEvent,
    action: (typeof steps)[number]["action"]
  ) => {
    e.preventDefault();
    if (action?.isPopup) {
      if (window.Calendly) {
        window.Calendly.initPopupWidget({ url: 'https://calendly.com/yatricloud/40min' });
      } else {
        // Calendly script blocked/slow — open the booking page directly.
        window.open('https://calendly.com/yatricloud/40min', '_blank', 'noopener');
      }
    } else if (action?.url?.startsWith('#') && action.url.length > 1) {
      const element = document.querySelector(action.url);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <section id="certification-flow" className="py-20 md:py-28 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center mb-16 md:mb-20 max-w-3xl mx-auto">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider mb-4 block">
              Get Certified with Yatri Cloud
            </span>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.02em] leading-[1.05] mb-6">
              Your Path to <span className="gradient-text">AWS Certification</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Schedule a meeting at your suitable time to start the certification scheduling process
            </p>
          </div>
        </ScrollReveal>

        <div className="max-w-6xl mx-auto">
          {/* Eligible Exams - Credential Cards */}
          <ScrollReveal delay={0.1}>
            <div className="bg-card border border-border rounded-2xl p-6 md:p-10 mb-8">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <img src="/logos/aws.svg" alt="AWS" className="h-6 w-auto" loading="lazy" />
                    <h3 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                      Eligible Associate Exams
                    </h3>
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary tabular-nums">
                      {eligibleExams.length} exams
                    </span>
                  </div>
                  <div className="mt-3 h-1 w-20 bg-primary rounded-full" />
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-primary">50% OFF</span> applies to every exam below
                </p>
              </div>

              {/* Credential grid */}
              <div className="grid sm:grid-cols-2 gap-3">
                {eligibleExams.map((exam, index) => {
                  const codeMatch = exam.match(/\(([^)]+)\)/);
                  const code =
                    codeMatch?.[1] ??
                    Object.entries(EXAM_CODE_FALLBACK).find(([k]) => exam.toLowerCase().includes(k))?.[1] ??
                    null;
                  const title = exam.replace(/\s*\([^)]*\)\s*/, " ").replace(/\s+–\s+Associate\s*$/i, "").trim();
                  const level = /associate/i.test(exam) ? "Associate" : /practitioner/i.test(exam) ? "Foundational" : null;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      whileHover={{ y: -3 }}
                      className="group relative flex items-center gap-4 overflow-hidden rounded-xl border border-border bg-secondary/40 p-4 transition-all duration-300 hover:border-primary/40 hover:shadow-card"
                    >
                      {/* Left accent bar (draws in on hover) */}
                      <span className="absolute left-0 top-0 h-full w-0.5 origin-top scale-y-0 bg-primary transition-transform duration-300 group-hover:scale-y-100" />
                      {/* Icon */}
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                        <BadgeCheck className="h-5 w-5" />
                      </div>
                      {/* Title + level */}
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-semibold leading-snug text-foreground" title={exam}>{title}</p>
                        {level && (
                          <span className="mt-1 inline-block rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            {level}
                          </span>
                        )}
                      </div>
                      {/* Exam code pill */}
                      {code && (
                        <span className="shrink-0 self-start rounded-md border border-border bg-background px-2 py-1 font-mono text-xs font-medium tabular-nums text-muted-foreground">
                          {code}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </ScrollReveal>

          {/* Bonus Features */}
          <ScrollReveal delay={0.2}>
            <div id="benefits" className="mb-16 scroll-mt-20">
              {/* Header */}
              <div className="text-center mb-10 max-w-2xl mx-auto">
                <span className="text-primary font-semibold text-sm uppercase tracking-wider mb-4 block">
                  Certification Package
                </span>
                <h3 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">
                  What's <span className="gradient-text">Included</span>
                </h3>
                <p className="text-muted-foreground text-lg">
                  These benefits are available only after getting 50% OFF. Get everything you need to succeed with our comprehensive support package.
                </p>
              </div>

              {/* Individual Benefit Boxes */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bonusFeatures.map((feature, index) => {
                  const [isFlipped, setIsFlipped] = React.useState(false);

                  return (
                    <ScrollReveal key={index} delay={0.1 + index * 0.06}>
                      <div
                        className="group relative h-full min-h-[300px] cursor-pointer"
                        onClick={() => setIsFlipped(!isFlipped)}
                        role="button"
                        tabIndex={0}
                        aria-label={`${feature.text} - click to flip for details`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setIsFlipped(!isFlipped);
                          }
                        }}
                        style={{ perspective: 1000 }}
                      >
                        <motion.div
                          className="w-full h-full relative"
                          animate={{ rotateY: isFlipped ? 180 : 0 }}
                          transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                          style={{ transformStyle: "preserve-3d" }}
                        >
                          {/* Front of card */}
                          <div
                            className="absolute inset-0 bg-card border border-border group-hover:border-primary/40 group-hover:shadow-card rounded-2xl p-8 text-left flex flex-col transition-all duration-300"
                            style={{ backfaceVisibility: "hidden" }}
                          >
                            <div className="flex-1 flex flex-col h-full">
                              <span className="font-display text-4xl md:text-5xl font-black gradient-text mb-6">
                                {String(index + 1).padStart(2, "0")}
                              </span>

                              <h4 className="font-display text-xl md:text-2xl font-bold tracking-tight text-foreground mb-3 leading-tight group-hover:text-primary transition-colors duration-300">
                                {feature.text}
                              </h4>

                              <div className="h-1 w-12 bg-primary rounded-full mt-auto group-hover:w-20 transition-all duration-500" />
                            </div>
                          </div>

                          {/* Back of card */}
                          <div
                            className="absolute inset-0 bg-card border border-primary/40 rounded-2xl p-8 shadow-card flex flex-col justify-center text-center overflow-auto"
                            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                          >
                            <p className="text-xs font-bold text-primary mb-4 uppercase tracking-wider">
                              {index === 0
                                ? "DURING MEET YOU WILL GET NOT AFTER:"
                                : index >= 4
                                  ? "IF YOU PASS EXAM AND POST ON LINKEDIN WITH TAGGING YATRI CLOUD AND TEAMMATES YOU WILL GET THESE BENEFITS:"
                                  : "AFTER SCHEDULING EXAM YOU WILL GET:"}
                            </p>
                            <p className="text-base md:text-lg text-foreground leading-relaxed font-medium">
                              {feature.description}
                            </p>
                            <div className="mt-6 text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                              Click to flip back
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </ScrollReveal>
                  );
                })}
              </div>
            </div>
          </ScrollReveal>

          {/* Steps - Drawn-path certification journey */}
          <div className="mb-16">
            {/* ============ DESKTOP: horizontal drawn path with numbered nodes ============ */}
            <div className="hidden md:block relative">
              {/* Numbered nodes on a clean animated connector */}
              <div className="relative mb-10">
                {/* Connector line spanning the three node centers */}
                <div className="absolute top-8 left-[16.67%] right-[16.67%] h-0.5 -translate-y-1/2 overflow-hidden rounded-full bg-border">
                  <motion.div
                    className="h-full w-full origin-left bg-gradient-to-r from-primary to-brand-600"
                    initial={{ scaleX: prefersReducedMotion ? 1 : 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={prefersReducedMotion ? { duration: 0 } : { duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>

                {/* Numbered circle nodes sitting on the line */}
                <div className="relative z-10 grid grid-cols-3">
                  {steps.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        delay: prefersReducedMotion ? 0 : 0.3 + index * 0.28,
                        duration: prefersReducedMotion ? 0 : 0.5,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="flex justify-center"
                    >
                      <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary font-display text-xl font-bold text-primary-foreground shadow-inset-btn ring-8 ring-background">
                        {!prefersReducedMotion && (
                          <motion.span
                            className="absolute inset-0 rounded-full bg-primary/40"
                            animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: index * 0.35 }}
                          />
                        )}
                        <span className="relative">{String(step.number).padStart(2, "0")}</span>
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Aligned content row */}
              <div className="grid grid-cols-3 gap-8">
                {steps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      delay: prefersReducedMotion ? 0 : 0.45 + index * 0.28,
                      duration: prefersReducedMotion ? 0 : 0.6,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="group flex flex-col items-center text-center"
                  >
                    <h3 className="font-display text-xl lg:text-2xl font-bold tracking-tight text-foreground mb-3 group-hover:text-primary transition-colors">
                      {step.title}
                    </h3>
                    <div className="h-1 w-12 bg-primary rounded-full mb-4 transition-all duration-500 group-hover:w-16" />
                    <p className="text-muted-foreground text-base leading-relaxed mb-6 max-w-xs">
                      {step.description}
                    </p>
                    {step.action && (
                      <motion.a
                        href="#"
                        onClick={(e) => handleStepAction(e, step.action)}
                        whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                        whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                        aria-label={step.action.label}
                        className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground shadow-inset-btn px-6 py-3 text-base font-semibold min-h-[44px] transition-all duration-300 hover:bg-brand-600"
                      >
                        <span>{step.action.label}</span>
                        <ExternalLink className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </motion.a>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* ============ MOBILE: vertical timeline with a drawn spine ============ */}
            <div className="md:hidden relative">
              {/* Animated vertical spine (decorative) */}
              <svg
                className="absolute left-[19px] top-2 bottom-2 w-1"
                viewBox="0 0 2 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <motion.line
                  x1="1"
                  y1="0"
                  x2="1"
                  y2="100"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  initial={{ pathLength: prefersReducedMotion ? 1 : 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : { duration: 1.2, ease: [0.16, 1, 0.3, 1] }
                  }
                />
              </svg>

              <div className="relative space-y-10">
                {steps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={
                      prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                    }
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      delay: prefersReducedMotion ? 0 : 0.3 + index * 0.28,
                      duration: prefersReducedMotion ? 0 : 0.6,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="group relative pl-14"
                  >
                    {/* Pulsing node dot on the spine */}
                    <span className="absolute left-0 top-1 flex h-10 w-10 items-center justify-center">
                      <span className="relative flex h-6 w-6 items-center justify-center">
                        {!prefersReducedMotion && (
                          <motion.span
                            className="absolute inset-0 rounded-full bg-primary/40"
                            animate={{ scale: [1, 1.9, 1], opacity: [0.55, 0, 0.55] }}
                            transition={{
                              duration: 2.4,
                              repeat: Infinity,
                              ease: "easeInOut",
                              delay: index * 0.35,
                            }}
                          />
                        )}
                        <span className="relative h-4 w-4 rounded-full bg-primary ring-4 ring-background" />
                      </span>
                    </span>

                    {/* Step number */}
                    <span className="font-display text-4xl font-black gradient-text block mb-2">
                      {String(step.number).padStart(2, "0")}
                    </span>

                    {/* Title */}
                    <h3 className="font-display text-xl font-bold tracking-tight text-foreground mb-3 group-hover:text-primary transition-colors">
                      {step.title}
                    </h3>

                    {/* Decorative line */}
                    <div className="h-1 w-12 bg-primary rounded-full mb-4" />

                    {/* Description */}
                    <p className="text-muted-foreground text-base leading-relaxed mb-6">
                      {step.description}
                    </p>

                    {/* Action Button */}
                    {step.action && (
                      <motion.a
                        href="#"
                        onClick={(e) => handleStepAction(e, step.action)}
                        whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                        whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                        aria-label={step.action.label}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground shadow-inset-btn px-6 py-3 text-base font-semibold min-h-[44px] transition-all duration-300 hover:bg-brand-600"
                      >
                        <span>{step.action.label}</span>
                        <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
                      </motion.a>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Calendly Widget Section */}
          <ScrollReveal delay={0.3}>
            <div id="schedule-meeting" className="mb-16 scroll-mt-20">
              <div className="text-center mb-10 max-w-2xl mx-auto">
                <span className="text-primary font-semibold text-sm uppercase tracking-wider mb-4 block">
                  Schedule Meeting
                </span>
                <h3 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">
                  Let's Schedule Your <span className="gradient-text">Exam</span>
                </h3>
                <p className="text-muted-foreground text-lg">
                  Select a suitable time slot and schedule a meeting with us. We will assist you with the complete exam scheduling process.
                </p>
              </div>

              <motion.div
                {...reveal}
                className="w-full rounded-2xl overflow-hidden border border-border bg-card relative z-20"
              >
                <div
                  className="calendly-inline-widget w-full"
                  data-url="https://calendly.com/yatricloud/40min?hide_gdpr_banner=1"
                  style={{ minWidth: "320px", height: "700px" }}
                />
              </motion.div>
            </div>
          </ScrollReveal>

          {/* Thank You Message */}
          <ScrollReveal delay={0.4}>
            <motion.div {...reveal} className="relative">
              <div className="bg-card border border-primary/40 rounded-2xl p-10 md:p-14 text-center">
                <h3 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
                  Thank you for trusting <span className="gradient-text">Yatri Cloud</span>
                </h3>
                <p className="text-xl md:text-2xl text-muted-foreground">
                  Let's get you certified!
                </p>
              </div>
            </motion.div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default CertificationFlowSection;
