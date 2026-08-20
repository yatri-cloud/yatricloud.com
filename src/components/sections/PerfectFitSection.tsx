import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import {
  useSiteContent,
  getTrustFeatures,
  FALLBACK_NOT_FOR_YOU,
} from "@/lib/site-content";

const forYouPoints = [
  "You're ambitious about getting cloud certified and saving 50% on official exam vouchers",
  "You value step-by-step guidance to schedule and confidently pass on your first attempt",
  "You want verified exam dumps, curated study kits, and Udemy course access in one place",
  "You thrive in an active community with direct support whenever you hit a roadblock",
  "You're ready to accelerate your career and see your achievement on the Wall of Fame",
];

export const PerfectFitSection = () => {
  const notForYouRows = useSiteContent(
    () => getTrustFeatures("not_for_you"),
    FALLBACK_NOT_FOR_YOU
  );
  const notForYouPoints = notForYouRows.map((row) => row.title);

  return (
    <section className="band-tint py-20 md:py-28 relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <ScrollReveal>
          <div className="text-center mb-12 max-w-3xl mx-auto">
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
            className="max-w-5xl mx-auto grid md:grid-cols-[1.05fr_0.95fr] rounded-3xl border border-border overflow-hidden shadow-card"
          >
            {/* Highlighted side — "for you" */}
            <div className="relative bg-card p-7 md:p-9">
              <div className="mb-6 flex items-center gap-3">
                <span className="inline-flex h-9 items-center rounded-full bg-primary px-4 font-display text-sm font-bold tracking-tight text-primary-foreground shadow-sm">
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
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center mt-0.5 text-muted-foreground">
                      <X className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-muted-foreground text-sm md:text-base leading-relaxed">{point}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default PerfectFitSection;
