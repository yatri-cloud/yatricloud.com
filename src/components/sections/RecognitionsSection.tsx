import { motion, useReducedMotion } from "framer-motion";
import { Award } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";

const EASE = [0.16, 1, 0.3, 1] as const;

/* Instructor recognitions — sourced from certification.yatricloud.com.
   Each badge carries its parent program's real brand logo. */
const RECOGNITIONS = [
  { label: "Microsoft MVP", logo: "/logos/microsoft.svg" },
  { label: "Microsoft Certified Trainer", logo: "/logos/microsoft.svg" },
  { label: "Google Developer Expert", logo: "/logos/google.svg" },
  { label: "AWS Hero", logo: "/logos/aws.svg" },
  { label: "AWS Subject Matter Expert", logo: "/logos/aws.svg" },
  { label: "AWS Community Builder", logo: "/logos/aws.svg" },
  { label: "CNCF Ambassador", logo: "/logos/cncf.svg" },
  { label: "Docker Captain", logo: "/logos/docker.svg" },
  { label: "HashiCorp Ambassador", logo: "/logos/hashicorp.svg" },
  { label: "MS Learn Student Ambassador (Gold)", logo: "/logos/microsoft.svg" },
  { label: "Google Student Ambassador", logo: "/logos/google.svg" },
  { label: "GitHub Campus Expert", logo: "/logos/github.svg" },
];

export const RecognitionsSection = () => {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden band-tint py-20 md:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />

      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background px-4 py-1.5 text-sm font-medium text-primary shadow-sm">
              <Award className="h-4 w-4" /> Technical leadership
            </p>
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-5xl">
              Learn from the <span className="gradient-text">best in the industry</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Your instructors aren't random tutors, Yatri — they're MVPs, AWS Heroes, Google Developer Experts and Ambassadors recognised by the very companies you're getting certified in.
            </p>
          </div>
        </ScrollReveal>

        {/* Recognition badge wall — real program/brand logos + label */}
        <div className="mx-auto mt-12 flex max-w-4xl flex-wrap justify-center gap-3">
          {RECOGNITIONS.map((r, i) => (
            <motion.div
              key={r.label}
              initial={reduce ? { opacity: 1 } : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: Math.min(i * 0.04, 0.35), duration: 0.45, ease: EASE }}
              whileHover={reduce ? undefined : { y: -3 }}
              className="group inline-flex items-center gap-2.5 rounded-full border border-border bg-background px-4 py-2.5 transition-colors duration-300 hover:border-brand-200 hover:shadow-card"
            >
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
                <img
                  src={r.logo}
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full object-contain opacity-80 grayscale transition duration-300 group-hover:opacity-100 group-hover:grayscale-0"
                  loading="lazy"
                />
              </span>
              <span className="text-sm font-medium tracking-tight">{r.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecognitionsSection;
