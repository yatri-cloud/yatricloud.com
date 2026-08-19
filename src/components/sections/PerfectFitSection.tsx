import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import {
  useSiteContent,
  getTrustFeatures,
  FALLBACK_NOT_FOR_YOU,
} from "@/lib/site-content";

const forYouPoints = [
  "You want to get AWS certified with 50% OFF vouchers",
  "You're ready to complete registration and join our WhatsApp group",
  "You need exam dumps, study resources, and personal support",
  "You value guided exam scheduling through our team's meeting calls",
  "You want a complete certification package with full support",
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
            className="max-w-5xl mx-auto grid md:grid-cols-[1.05fr_0.95fr] rounded-3xl border border-primary/40 overflow-hidden shadow-card"
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
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center mt-0.5 text-white">
                      <X className="w-4 h-4 text-primary" />
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
