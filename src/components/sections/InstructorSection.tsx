import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import {
  useSiteContent,
  getTeamMembers,
  FALLBACK_TEAM_MEMBERS,
} from "@/lib/site-content";

const fallbackSrc = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3B82F6&color=fff&size=256`;

export const InstructorSection = () => {
  /* Team roster from Supabase (seeded to match the previous hardcoded
   * array); the fallback renders immediately so nothing flashes. */
  const teamMembers = useSiteContent(getTeamMembers, FALLBACK_TEAM_MEMBERS);
  const lead = teamMembers[0];
  const others = teamMembers.slice(1);

  const reduceMotion = useReducedMotion();
  const portraitRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: portraitRef,
    offset: ["start end", "end start"],
  });
  const parallaxY = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [0, 0] : [36, -36]
  );

  return (
    <section id="team" className="py-20 md:py-28 bg-background overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <ScrollReveal>
          <div className="max-w-2xl mb-14 md:mb-20">
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.03em] leading-[1.02]">
              Meet the <span className="gradient-text">Team</span>
            </h2>
          </div>
        </ScrollReveal>

        <div className="max-w-5xl mx-auto grid lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          {/* LEAD — editorial feature */}
          <ScrollReveal direction="right" className="lg:col-span-6">
            <div className="relative w-full">
              {/* Portrait with scroll parallax */}
              <div
                ref={portraitRef}
                className="group relative rounded-3xl overflow-hidden border border-border bg-secondary aspect-[4/5] max-h-[480px]"
              >
                <motion.img
                  style={{ y: parallaxY }}
                  src={lead.image}
                  alt={lead.name}
                  className="absolute inset-0 w-full h-[112%] -top-[6%] object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = fallbackSrc(lead.name);
                  }}
                />

                {/* Bottom scrim + role always visible in black/foreground text */}
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 bg-gradient-to-t from-background/95 via-background/80 to-transparent">
                  <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-xl sm:text-2xl md:text-3xl font-bold tracking-[-0.02em] text-foreground truncate">
                        {lead.name}
                      </h3>
                      <p className="text-foreground font-semibold mt-0.5 text-xs sm:text-sm whitespace-nowrap">
                        {lead.role}
                      </p>
                    </div>
                    <a
                      href={lead.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Connect with ${lead.name}`}
                      className="group/btn flex-shrink-0 inline-flex items-center justify-center gap-1.5 min-h-[38px] px-3.5 py-2 bg-primary text-primary-foreground text-xs sm:text-sm font-semibold rounded-xl shadow-inset-btn hover:bg-brand-600 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <span>Let's Connect</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform duration-300" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* RIGHT — editorial statement + the rest of the team */}
          <div className="lg:col-span-6">
            <ScrollReveal delay={0.1}>
              {/* Existing tagline elevated to an editorial pull-quote */}
              <figure className="relative mb-10">
                <span
                  aria-hidden="true"
                  className="font-display text-6xl md:text-7xl leading-none text-primary/20 select-none block"
                >
                  “
                </span>
                <blockquote className="font-display text-2xl md:text-3xl font-semibold tracking-[-0.02em] leading-snug -mt-6">
                  The <span className="gradient-text">passionate cloud professionals</span> behind
                  Yatri Cloud
                </blockquote>
              </figure>

              {/* The rest of the team — asymmetric smaller cards */}
              <div className="space-y-4">
                {others.map((member, index) => (
                  <motion.div
                    key={index}
                    whileHover={reduceMotion ? undefined : { y: -3 }}
                    className="group flex items-center gap-5 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors duration-300"
                  >
                    <div className="relative flex-shrink-0 w-20 h-20 rounded-full overflow-hidden border border-border group-hover:border-primary/40 transition-colors duration-300 bg-secondary">
                      <img
                        src={member.image}
                        alt={member.name}
                        width={80}
                        height={80}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = fallbackSrc(member.name);
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-xl font-bold tracking-[-0.01em] text-foreground truncate group-hover:text-primary transition-colors duration-300">
                        {member.name}
                      </h3>
                      <p className="text-muted-foreground text-sm font-medium truncate">
                        {member.role}
                      </p>
                    </div>
                    <a
                      href={member.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Connect with ${member.name}`}
                      className="flex-shrink-0 grid place-items-center w-11 h-11 rounded-full border border-border text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <ArrowUpRight className="w-5 h-5" />
                    </a>
                  </motion.div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InstructorSection;
