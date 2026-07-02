import { motion, useReducedMotion } from "framer-motion";
import ScrollReveal from "@/components/ScrollReveal";
import {
  useSiteContent,
  getRecognitions,
  FALLBACK_RECOGNITIONS,
} from "@/lib/site-content";

const EASE = [0.16, 1, 0.3, 1] as const;

export const RecognitionsSection = () => {
  const reduce = useReducedMotion();

  /* Instructor recognitions from Supabase (seeded to match the previous
   * hardcoded badge wall); each badge carries its program's brand logo. */
  const recognitions = useSiteContent(getRecognitions, FALLBACK_RECOGNITIONS);

  return (
    <section className="relative overflow-hidden band-blue py-20 md:py-28">
      {/* soft light accents on the blue band */}
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      {/* dotted texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse 60% 55% at 50% 40%, black, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 60% 55% at 50% 40%, black, transparent 80%)",
        }}
      />

      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center text-white">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-5xl">
              Learn from the best in the industry
            </h2>
            <p className="mt-4 text-lg text-white/85">
              Your instructors aren't random tutors, Yatri. They're MVPs, AWS Heroes, Google Developer Experts and Ambassadors recognised by the very companies you're getting certified in.
            </p>
          </div>
        </ScrollReveal>

        {/* Recognition badge wall — white pills w/ real brand logos on the blue band */}
        <div className="mx-auto mt-12 flex max-w-4xl flex-wrap justify-center gap-3">
          {recognitions.map((r, i) => (
            <motion.div
              key={r.label}
              initial={reduce ? { opacity: 1 } : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: Math.min(i * 0.04, 0.35), duration: 0.45, ease: EASE }}
              whileHover={reduce ? undefined : { y: -3 }}
              className="group inline-flex items-center gap-2.5 rounded-full bg-white px-4 py-2.5 text-foreground shadow-sm transition-shadow duration-300 hover:shadow-elevated"
            >
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
                <img
                  src={r.logo}
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full object-contain"
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
