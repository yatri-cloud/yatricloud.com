import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
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

/* Official Credly AWS Badge CDN images for all 7 eligible exams */
const CREDLY_BADGE_IMAGES: Record<string, string> = {
  "CLF-C02": "https://images.credly.com/images/00634f82-b07f-4bbd-a6bb-53de397fc3a6/image.png",
  "AIF-C01": "https://images.credly.com/images/4d4693bb-530e-4bca-9327-de07f3aa2348/image.png",
  "SAA-C03": "https://images.credly.com/images/0e284c3f-5164-4b21-8660-0d84737941bc/image.png",
  "DVA-C02": "https://images.credly.com/images/b9feab85-1a43-4f6c-99a5-631b88d5461b/image.png",
  "SOA-C03": "https://images.credly.com/images/f0d3fbb9-bfa7-4017-9989-7bde8eaf42b1/image.png",
  "DEA-C01": "https://images.credly.com/images/e5c85d7f-4e50-431e-b5af-fa9d9b0596e7/image.png",
  "MLA-C01": "https://images.credly.com/images/1a634b4e-3d6b-4a74-b118-c0dcb429e8d2/image.png",
};

/* Official concise descriptions for each exam card */
const EXAM_DESCRIPTIONS: Record<string, string> = {
  "CLF-C02": "Validate overall understanding of the AWS Cloud platform, basic security, and fundamental concepts",
  "AIF-C01": "Demonstrate fundamental knowledge of AI/ML concepts and practical generative AI applications",
  "SAA-C03": "Validate your technical knowledge and skills across the breadth of AWS services",
  "DVA-C02": "Showcase your expertise in developing, deploying, and debugging cloud-based applications",
  "SOA-C03": "Demonstrate proficiency in deploying, managing, and operating scalable workloads on AWS",
  "DEA-C01": "Showcase your ability to design data models, manage data life cycles, and ensure data quality",
  "MLA-C01": "Position yourself for in-demand technical ML roles",
};

/* Minimal, Unique, Professional Benefit Card */
const BenefitCard = ({
  feature,
  index,
}: {
  feature: PackageBenefit;
  index: number;
}) => {
  return (
    <div
      onClick={() => void openCalendlyPopup('https://calendly.com/yatricloud/40min')}
      className="group relative flex flex-col justify-between h-full min-h-[190px] rounded-2xl border border-border/80 hover:border-transparent p-6 md:p-8 text-left transition-all duration-300 outline-none focus:outline-none cursor-pointer"
    >
      {/* Outer Glow Trail Layer */}
      <div className="absolute -inset-[8px] z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-[24px] overflow-hidden">
        <div 
          className="absolute top-1/2 left-1/2 w-[200%] aspect-square -translate-x-1/2 -translate-y-1/2 opacity-60"
          style={{ 
            animation: "spin 6s linear infinite",
            background: "conic-gradient(from 0deg, transparent 0deg, transparent 270deg, #2563eb 360deg)",
            filter: "blur(12px)"
          }}
        />
      </div>

      {/* Sharp Border Line Layer */}
      <div className="absolute -inset-[2px] z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-[18px] overflow-hidden">
        <div 
          className="absolute top-1/2 left-1/2 w-[200%] aspect-square -translate-x-1/2 -translate-y-1/2"
          style={{ 
            animation: "spin 6s linear infinite",
            background: "conic-gradient(from 0deg, transparent 0deg, transparent 340deg, #2563eb 360deg)"
          }}
        />
      </div>

      {/* Solid Background Layer to mask inner shadow */}
      <div className="absolute inset-0 z-[1] rounded-2xl bg-card pointer-events-none transition-colors duration-300" />

      <div className="relative z-10">
        <h4 className="font-bold text-foreground text-lg md:text-xl leading-snug mb-3 group-hover:text-primary transition-colors">
          {feature.text}
        </h4>
        <p className="text-xs md:text-sm text-muted-foreground leading-relaxed font-normal">
          {feature.description}
        </p>
      </div>

      <div className="relative z-10 pt-6 mt-4 border-t border-border/50 flex items-center justify-between text-xs md:text-sm text-primary font-semibold">
        <span>Get offer now</span>
        <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
      </div>
    </div>
  );
};

export const CertificationFlowSection = () => {
  const eligibleExams = useSiteContent(getEligibleExams, FALLBACK_ELIGIBLE_EXAMS);
  const benefitRows = useSiteContent(getPackageBenefits, FALLBACK_PACKAGE_BENEFITS).slice(0, 3);
  const stepRows = useSiteContent(getCertificationSteps, FALLBACK_CERTIFICATION_STEPS);
  const [showAllExams, setShowAllExams] = useState(false);

  const visibleExams = showAllExams ? eligibleExams : eligibleExams.slice(0, 3);

  return (
    <section id="certification-flow" className="py-20 md:py-28 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Header — Clean title without eyebrow line */}
        <ScrollReveal>
          <div className="text-center mb-16 md:mb-20 max-w-3xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              Your Path to <span className="gradient-text">AWS Certification</span>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Schedule a meeting at your suitable time to start the certification scheduling process
            </p>
          </div>
        </ScrollReveal>

        <div className="max-w-6xl mx-auto space-y-16">
          {/* Eligible Exams Section — Soft Blue Gradient Cards */}
          <ScrollReveal delay={0.1}>
            <div>
              {/* Header — AWS Logo on left + Highlighted Red 50% OFF badge on right */}
              <div className="flex items-center justify-between gap-4 mb-6">
                <img src="/logos/aws.svg" alt="AWS" width={44} height={26} className="h-7 w-auto" loading="lazy" decoding="async" />
                <span className="inline-flex items-center rounded-full bg-red-600 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-red-600/25 ring-2 ring-red-600/20">
                  50% OFF
                </span>
              </div>

              {/* Credential Grid — Soft Blue Gradient Glow Cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleExams.map((exam, index) => {
                  const codeMatch = exam.title.match(/\(([^)]+)\)/);
                  const code =
                    codeMatch?.[1] ??
                    exam.examCode ??
                    Object.entries(EXAM_CODE_FALLBACK).find(([k]) => exam.title.toLowerCase().includes(k))?.[1] ??
                    "";

                  const displayTitle = exam.title.replace(/\s*\([^)]*\)\s*/, " ").trim();
                  const badgeImg = code && CREDLY_BADGE_IMAGES[code] ? CREDLY_BADGE_IMAGES[code] : "/logos/aws.svg";
                  const desc = EXAM_DESCRIPTIONS[code] || "Validate your technical knowledge and skills on AWS";

                  return (
                    <div
                      key={index}
                      onClick={() => void openCalendlyPopup('https://calendly.com/yatricloud/40min')}
                      className="group relative flex flex-col justify-between h-full rounded-2xl border border-border/80 hover:border-transparent p-6 text-left transition-all duration-300 outline-none focus:outline-none cursor-pointer"
                    >
                      {/* Outer Glow Trail Layer */}
                      <div className="absolute -inset-[8px] z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-[24px] overflow-hidden">
                        <div 
                          className="absolute top-1/2 left-1/2 w-[200%] aspect-square -translate-x-1/2 -translate-y-1/2 opacity-60"
                          style={{ 
                            animation: "spin 6s linear infinite",
                            background: "conic-gradient(from 0deg, transparent 0deg, transparent 270deg, #2563eb 360deg)",
                            filter: "blur(12px)"
                          }}
                        />
                      </div>

                      {/* Sharp Border Line Layer */}
                      <div className="absolute -inset-[2px] z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-[18px] overflow-hidden">
                        <div 
                          className="absolute top-1/2 left-1/2 w-[200%] aspect-square -translate-x-1/2 -translate-y-1/2"
                          style={{ 
                            animation: "spin 6s linear infinite",
                            background: "conic-gradient(from 0deg, transparent 0deg, transparent 340deg, #2563eb 360deg)"
                          }}
                        />
                      </div>

                      {/* Solid Background Layer to mask inner shadow */}
                      <div className="absolute inset-0 z-[1] rounded-2xl bg-card pointer-events-none transition-colors duration-300" />

                      {/* Top: Large Centered Badge */}
                      <div className="relative z-10 py-4 flex items-center justify-center">
                        <img
                          src={badgeImg}
                          alt={displayTitle}
                          className="h-28 w-28 md:h-32 md:w-32 object-contain transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/logos/aws.svg";
                          }}
                        />
                      </div>

                      {/* Middle: Title & Description */}
                      <div className="relative z-10 mb-6">
                        <h4 className="font-bold text-foreground text-base md:text-lg leading-snug mb-2 group-hover:text-primary transition-colors">
                          {displayTitle}
                        </h4>
                        <p className="text-xs md:text-sm text-muted-foreground leading-relaxed font-normal">
                          {desc}
                        </p>
                      </div>

                      {/* Bottom Row: "Get offer now →" action */}
                      <div className="relative z-10 pt-3 border-t border-border/50 flex items-center justify-between text-xs md:text-sm text-primary font-semibold">
                        <span>Get offer now</span>
                        <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* View All / Show Less Toggle Button */}
              {eligibleExams.length > 3 && (
                <div className="mt-8 flex justify-center">
                  <Button
                    onClick={() => setShowAllExams(!showAllExams)}
                    className="rounded-full px-7 py-3 font-semibold text-sm bg-primary text-primary-foreground shadow-inset-btn hover:bg-brand-600 transition-all gap-2 min-h-[44px]"
                  >
                    {showAllExams ? (
                      <>
                        Show Less <ChevronUp className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        View All {eligibleExams.length} AWS Certifications <ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </ScrollReveal>

          {/* Benefits Grid — Soft Grey Background Cards */}
          <ScrollReveal delay={0.2}>
            <div className="space-y-6">
              <h3 className="font-display text-2xl font-bold text-slate-900 text-center">Package Included Benefits</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {benefitRows.map((feature, index) => (
                  <BenefitCard key={feature.text} feature={feature} index={index} />
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Certification Process — Crisp White Background (No Grey BG) */}
          <ScrollReveal delay={0.3}>
            <div className="space-y-10">
              <h3 className="font-display text-2xl md:text-3xl font-bold text-slate-900 text-center">
                Certification Process
              </h3>

              <div className="relative max-w-5xl mx-auto">
                {/* Animated Horizontal Connecting Stepper Line (centered 100% through circles) */}
                <div className="hidden md:block absolute top-[60px] -translate-y-1/2 left-[16.66%] right-[16.66%] h-[3px] bg-slate-200/80 z-0 overflow-hidden rounded-full">
                  <motion.div
                    className="h-full w-full bg-gradient-to-r from-blue-600 via-sky-400 to-blue-600"
                    animate={{
                      x: ["-100%", "100%"],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-6 relative z-10">
                  {stepRows.map((step, index) => (
                    <div
                      key={step.title}
                      className="group relative rounded-2xl p-[1px] transition-all duration-300"
                    >
                      {/* Subtle Blue Brand Gradient Glow on Hover */}
                      <div className="absolute -inset-[1.5px] rounded-2xl bg-gradient-to-r from-blue-500/50 via-sky-400/40 to-indigo-500/50 opacity-0 blur-md transition-all duration-300 group-hover:opacity-75" />

                      {/* Inner Card Container — Pure Crisp White (No Grey BG) */}
                      <div className="relative flex flex-col items-center text-center rounded-2xl bg-white border border-slate-200/80 p-6 md:p-8 shadow-2xs transition-all duration-300 group-hover:border-transparent group-hover:bg-white">
                        {/* Solid Blue Round Stepper Badge (1, 2, 3) */}
                        <div className="w-14 h-14 rounded-full bg-blue-600 text-white font-black text-xl flex items-center justify-center mb-6 shadow-md shadow-blue-500/25 ring-4 ring-white transition-transform duration-300 group-hover:scale-110">
                          {step.number || index + 1}
                        </div>

                        {/* Step Title */}
                        <h4 className="font-bold text-slate-900 text-lg md:text-xl leading-snug mb-2 group-hover:text-blue-600 transition-colors">
                          {step.title}
                        </h4>

                        {/* Step Description */}
                        <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-normal">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
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
