import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2 } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { openCalendlyPopup, loadCalendlyInline } from "@/lib/third-party";
import {
  useSiteContent,
  getEligibleExams,
  getPackageBenefits,
  getCertificationSteps,
  FALLBACK_ELIGIBLE_EXAMS,
  FALLBACK_PACKAGE_BENEFITS,
  FALLBACK_CERTIFICATION_STEPS,
  type PackageBenefit,
  type StepAction,
} from "@/lib/site-content";

const CalendlyInlineFacade = ({ url }: { url: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "loading" | "loaded">("idle");

  const handleLoad = async () => {
    if (state !== "idle" || !containerRef.current) return;
    setState("loading");
    const ok = await loadCalendlyInline(containerRef.current, url);
    setState(ok ? "loaded" : "idle");
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el || state !== "idle") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          void handleLoad();
        }
      },
      { rootMargin: "400px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [state]);

  return (
    <div ref={containerRef} className="w-full" style={{ minWidth: "320px", height: "700px" }}>
      {state !== "loaded" && (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-8 text-center">
          <div>
            <p className="font-display text-xl font-bold tracking-tight text-foreground">Pick a time that works for you</p>
            <p className="mt-1 text-sm text-muted-foreground">
              <Loader2 className="mr-1.5 inline h-4 w-4 animate-spin text-primary" aria-hidden="true" />
              Opening the live calendar...
            </p>
          </div>
          <a
            href="https://calendly.com/yatricloud/40min"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-primary underline underline-offset-4"
          >
            Calendar not loading? Book on Calendly instead
          </a>
        </div>
      )}
    </div>
  );
};

const EXAM_CODE_FALLBACK: Record<string, string> = {
  "cloud practitioner": "CLF-C02",
  "ai practitioner": "AIF-C01",
};

const BenefitCard = ({
  feature,
  index,
}: {
  feature: PackageBenefit;
  index: number;
}) => {
  const [isFlipped, setIsFlipped] = React.useState(false);

  return (
    <div
      className="group relative h-full min-h-[220px] cursor-pointer"
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
        {/* Front of card — Clean text without big numbers or icons */}
        <div
          className="absolute inset-0 bg-card border border-slate-200/80 group-hover:border-primary/40 rounded-2xl p-6 text-left flex flex-col justify-between transition-all duration-300 shadow-2xs"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="flex-1 flex flex-col justify-between">
            <h4 className="font-display text-lg font-bold tracking-tight text-foreground leading-tight group-hover:text-primary transition-colors duration-300">
              {feature.text}
            </h4>
            <p className="text-xs text-muted-foreground mt-4 leading-relaxed line-clamp-3">
              {feature.description}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-primary font-semibold">
            <span>View details</span>
            <span>→</span>
          </div>
        </div>

        {/* Back of card */}
        <div
          className="absolute inset-0 bg-card border border-primary/40 rounded-2xl p-6 shadow-sm flex flex-col justify-center text-center overflow-auto"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <p className="text-[11px] font-bold text-primary mb-2 uppercase tracking-wider">
            {index === 0
              ? "DURING MEET YOU WILL GET:"
              : index >= 4
                ? "POST ON LINKEDIN TO UNLOCK:"
                : "AFTER SCHEDULING EXAM:"}
          </p>
          <p className="text-sm text-foreground leading-relaxed font-medium">
            {feature.description}
          </p>
          <p className="mt-4 text-[11px] text-muted-foreground font-medium">
            Click to flip back
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export const CertificationFlowSection = () => {
  const eligibleExams = useSiteContent(getEligibleExams, FALLBACK_ELIGIBLE_EXAMS);
  const benefitRows = useSiteContent(getPackageBenefits, FALLBACK_PACKAGE_BENEFITS);
  const stepRows = useSiteContent(getCertificationSteps, FALLBACK_CERTIFICATION_STEPS);

  const handleStepAction = (
    e: React.MouseEvent,
    action: StepAction | null
  ) => {
    e.preventDefault();
    if (action?.isPopup) {
      void openCalendlyPopup('https://calendly.com/yatricloud/40min');
    } else if (action?.url?.startsWith('#') && action.url.length > 1) {
      const element = document.querySelector(action.url);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <section id="certification-flow" className="py-20 md:py-28 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center mb-16 md:mb-20 max-w-3xl mx-auto">
            <span className="text-primary font-bold text-xs uppercase tracking-widest mb-3 block">
              Get Certified with Yatri Cloud
            </span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              Your Path to <span className="gradient-text">AWS Certification</span>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Schedule a meeting at your suitable time to start the certification scheduling process
            </p>
          </div>
        </ScrollReveal>

        <div className="max-w-6xl mx-auto space-y-12">
          {/* Eligible Exams Card */}
          <ScrollReveal delay={0.1}>
            <div className="bg-card border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-2xs">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-3">
                    <img src="/logos/aws.svg" alt="AWS" width={36} height={20} className="h-5 w-auto" loading="lazy" decoding="async" />
                    <h3 className="font-display text-xl md:text-2xl font-bold tracking-tight text-foreground">
                      Eligible Associate Exams
                    </h3>
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {eligibleExams.length} exams
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  <span className="font-bold text-primary">50% OFF</span> applies to every exam below
                </p>
              </div>

              {/* Credential grid — Clean, no icons */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {eligibleExams.map((exam, index) => {
                  const codeMatch = exam.title.match(/\(([^)]+)\)/);
                  const code =
                    codeMatch?.[1] ??
                    exam.examCode ??
                    Object.entries(EXAM_CODE_FALLBACK).find(([k]) => exam.title.toLowerCase().includes(k))?.[1] ??
                    null;
                  const title = exam.title.replace(/\s*\([^)]*\)\s*/, " ").replace(/\s+–\s+Associate\s*$/i, "").trim();
                  const level = /associate/i.test(exam.title) ? "Associate" : /practitioner/i.test(exam.title) ? "Foundational" : null;
                  return (
                    <div
                      key={index}
                      className="group flex flex-col justify-between rounded-xl border border-slate-200/70 bg-slate-50/50 p-4 transition-all duration-200 hover:border-primary/40 hover:bg-white hover:shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          {level && (
                            <span className="inline-block rounded-full bg-slate-200/60 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                              {level}
                            </span>
                          )}
                          {code && (
                            <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                              {code}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{title}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollReveal>

          {/* Benefits Grid — Clean cards without big numbers or icons */}
          <ScrollReveal delay={0.2}>
            <div className="space-y-4">
              <h3 className="font-display text-xl font-bold text-slate-900 text-center">Package Included Benefits</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {benefitRows.map((feature, index) => (
                  <BenefitCard key={feature.text} feature={feature} index={index} />
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* 3 Step Timeline */}
          <ScrollReveal delay={0.3}>
            <div className="bg-card border border-slate-200/80 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xs">
              <h3 className="font-display text-xl font-bold text-slate-900 text-center">3-Step Certification Process</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {stepRows.map((step, idx) => (
                  <div key={step.title} className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-5 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-1">Step {idx + 1}</span>
                      <h4 className="font-bold text-base text-slate-900 mb-2">{step.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                    </div>
                    {step.action && (
                      <button
                        onClick={(e) => handleStepAction(e, step.action)}
                        className="mt-4 inline-flex items-center text-xs font-semibold text-primary hover:underline"
                      >
                        {step.action.label} →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Live Calendly Facade */}
          <ScrollReveal delay={0.4}>
            <div id="calendly-booking" className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
              <CalendlyInlineFacade url="https://calendly.com/yatricloud/40min" />
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default CertificationFlowSection;
