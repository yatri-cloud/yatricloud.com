import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { ContactSection } from "@/components/sections/ContactSection";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";

const EASE = [0.16, 1, 0.3, 1] as const;

const OFFERINGS = [
  {
    id: "college" as const,
    slug: "campus",
    title: "For colleges & universities",
    desc: "Give your students real, job-ready cloud and DevOps skills, taught by people who do this work every day.",
    benefits: [
      "A curriculum shaped around what employers actually hire for",
      "Hands-on labs, not just slides",
      "Mentorship from working industry experts",
      "Placement support for your students",
    ],
    cta: "Talk to us about your campus",
  },
  {
    id: "corporate" as const,
    slug: "team",
    title: "For teams & companies",
    desc: "Grow your team's cloud skills with training built around your stack, your goals, and your schedule.",
    benefits: [
      "Training modules tailored to your team",
      "Flexible scheduling that fits your sprints",
      "Real projects, not toy examples",
      "Certification prep included",
    ],
    cta: "Plan a training for your team",
  },
];

const Partners = () => {
  const reduce = useReducedMotion();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Partner with Yatri Cloud"
        description="Bring real cloud and DevOps skills to your campus or company. Team up with Yatri Cloud for training, events and certification support."
      />
      <div className="noise-overlay" />
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-16 md:pb-20">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/[0.07] via-background to-background" />
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE }}
            className="mx-auto max-w-3xl text-center"
          >
            <h1 className="font-display text-4xl font-bold tracking-[-0.02em] md:text-6xl">
              Let's build something <span className="gradient-text">together</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Whether you teach hundreds of students or lead a team of engineers, we'll help your people get certified and confident in the cloud.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Two partnership offerings */}
      <section className="pb-20 md:pb-28">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-2">
            {OFFERINGS.map((o, i) => (
              <motion.div
                key={o.id}
                initial={reduce ? { opacity: 1 } : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: EASE }}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-8 transition-colors duration-300 hover:border-brand-200 hover:shadow-card"
              >
                <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-100" />
                <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">{o.title}</h2>
                <p className="mt-3 text-muted-foreground">{o.desc}</p>

                <ul className="mt-6 space-y-3">
                  {o.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-3 text-sm md:text-base">
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className="mt-8 w-fit rounded-xl bg-primary px-6 text-base font-semibold text-primary-foreground shadow-inset-btn hover:bg-brand-600 hover:text-primary-foreground min-h-[44px]"
                >
                  <Link to={`/partners/${o.slug}`}>{o.cta}</Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <ContactSection />

      <Footer />
    </div>
  );
};

export default Partners;
