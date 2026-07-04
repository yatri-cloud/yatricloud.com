import { motion, useReducedMotion } from "framer-motion";
import { Ticket, ChevronRight, BadgeCheck, GraduationCap, ShieldCheck, Briefcase, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ScrollReveal";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const perks = [
  {
    icon: Ticket,
    title: "Up to 50% Off",
    desc: "Significant discounts on major cloud & DevOps certifications.",
    color: "bg-amber-500/10 text-amber-500",
  },
  {
    icon: Briefcase,
    title: "Career Growth",
    desc: "Get certified and stand out in the competitive job market.",
    color: "bg-blue-500/10 text-blue-500",
  },
  {
    icon: ShieldCheck,
    title: "Verified codes",
    desc: "100% authentic vouchers from official training partners.",
    color: "bg-green-500/10 text-green-500",
  },
  {
    icon: Globe,
    title: "Community First",
    desc: "Designed to help students and early-career professionals.",
    color: "bg-red-500/10 text-red-500",
  },
];

export const VoucherPromoSection = () => {
  const reduce = useReducedMotion();

  return (
    <section className="band-blue py-20 md:py-28 relative overflow-hidden">
      {/* Decorative blur circles for depth */}
      <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-24 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="relative grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

              {/* Left — pitch + CTAs */}
              <div className="space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, ease: EASE_OUT }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-white text-sm font-medium"
                >
                  <BadgeCheck className="w-4 h-4" />
                  <span>Invested in Your Success</span>
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.06, ease: EASE_OUT }}
                  className="font-display text-4xl md:text-6xl font-bold tracking-[-0.02em] leading-tight text-white"
                >
                  Focus on learning, <br />
                  <span className="text-white/90">
                    not the price tag.
                  </span>
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.12, ease: EASE_OUT }}
                  className="text-lg md:text-xl text-white/80 leading-relaxed max-w-xl"
                >
                  We're now offering discounted certification vouchers for AWS, Azure, GCP, GitHub, and more. Apply today and let Yatri Cloud support your professional growth.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.18, ease: EASE_OUT }}
                  className="flex flex-col sm:flex-row gap-4 pt-2"
                >
                  <Button asChild size="lg" className="h-14 px-8 rounded-2xl text-lg font-bold bg-white text-primary shadow-inset-btn hover:bg-white/90">
                    <a href="/requestvoucher" className="flex items-center gap-2">
                      Request Voucher <ChevronRight className="w-5 h-5" />
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="h-14 px-8 rounded-2xl text-lg font-bold bg-transparent border border-white/40 text-white hover:bg-white/10 hover:text-white">
                    <a href="/reviews">View Reviews</a>
                  </Button>
                </motion.div>
              </div>

              {/* Right — the voucher ticket */}
              <motion.div
                initial={{ opacity: 0, y: 28, rotate: -1.5 }}
                whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1, ease: EASE_OUT }}
                className="relative mx-auto w-full max-w-md"
              >
                {/* soft halo behind the ticket */}
                <div aria-hidden className="pointer-events-none absolute -inset-5 rounded-[2.5rem] bg-white/15 blur-2xl" />

                <motion.div
                  whileHover={reduce ? undefined : { y: -6 }}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  className="relative flex overflow-hidden rounded-3xl bg-white text-primary shadow-inset-btn"
                  role="img"
                  aria-label="Certification voucher: up to 50% off cloud and DevOps certifications"
                >
                  {/* shimmer light-sweep */}
                  <motion.div
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
                    initial={{ x: "0%" }}
                    animate={reduce ? undefined : { x: ["-40%", "360%"] }}
                    transition={reduce ? undefined : { duration: 2.4, ease: "easeInOut", repeat: Infinity, repeatDelay: 2.6 }}
                  />

                  {/* main stub */}
                  <div className="relative flex-1 p-7 md:p-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/60">
                      Certification Voucher
                    </p>

                    <div className="mt-5 flex items-end gap-3">
                      <span className="font-display text-6xl md:text-7xl font-extrabold leading-[0.85] tracking-[-0.04em] tabular-nums">
                        50%
                      </span>
                      <span className="font-display text-2xl md:text-3xl font-bold pb-1">OFF</span>
                    </div>

                    {/* slashed original price (decorative) */}
                    <p aria-hidden className="mt-3 flex items-center gap-2 text-sm font-medium">
                      <span className="text-primary/40 line-through decoration-2">Full price</span>
                      <span className="text-primary/70">you pay half</span>
                    </p>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {["AWS", "Azure", "GCP", "GitHub"].map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-6 flex items-center gap-2 text-xs font-medium text-primary/50">
                      <GraduationCap className="h-4 w-4" />
                      <span>Redeemable on official certification exams</span>
                    </div>
                  </div>

                  {/* perforation */}
                  <div className="relative w-0 border-l-2 border-dashed border-primary/25" aria-hidden />

                  {/* tear-off stub */}
                  <div className="relative flex w-16 shrink-0 flex-col items-center justify-between py-6" aria-hidden>
                    {/* faux barcode */}
                    <div className="flex flex-col items-center gap-[3px]">
                      {[6, 3, 8, 4, 7, 3, 9, 5].map((h, i) => (
                        <span
                          key={i}
                          className="block h-[3px] rounded-full bg-primary/70"
                          style={{ width: `${h * 3}px` }}
                        />
                      ))}
                    </div>
                    <span className="[writing-mode:vertical-rl] rotate-180 text-[10px] font-bold uppercase tracking-[0.3em] text-primary/60">
                      Yatri Cloud
                    </span>
                  </div>
                </motion.div>

                {/* punched notches on the perforation line (band-colored) */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute right-16 top-0 h-6 w-6 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute right-16 bottom-0 h-6 w-6 translate-y-1/2 translate-x-1/2 rounded-full bg-primary"
                />
              </motion.div>
            </div>

            {/* Perks — glass chip row */}
            <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {perks.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.06, ease: EASE_OUT }}
                  whileHover={reduce ? undefined : { y: -5 }}
                  className="group flex items-start gap-3 p-5 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm text-white"
                >
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/15 text-white transition-colors group-hover:bg-white/25">
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold tracking-tight text-white">{feature.title}</h3>
                    <p className="mt-1 text-sm text-white/80 leading-relaxed">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};
