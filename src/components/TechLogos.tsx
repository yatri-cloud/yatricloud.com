import { useReducedMotion } from "framer-motion";
import {
  useSiteContent,
  getTechLogos,
  FALLBACK_TECH_LOGOS,
} from "@/lib/site-content";

/**
 * Official tech/cloud brand logos used across the site's marquees.
 * Loaded from the `tech_logos` table (grp 'marquee') with the exact
 * live values as the hardcoded fallback. SVGs are stored locally in
 * /public/logos (sourced from Devicon). Rendered inside white chips
 * so brand colors stay legible on light, tint, blue, and dark
 * section bands alike.
 */
const MARQUEE_FALLBACK = FALLBACK_TECH_LOGOS.filter((l) => l.grp === "marquee");

type LogoMarqueeProps = {
  /** Scroll direction. */
  reverse?: boolean;
  /** Marquee speed preset. */
  speed?: "normal" | "slow";
  /** Show the brand name next to the logo. */
  showLabel?: boolean;
  /** Extra classes for the outer wrapper. */
  className?: string;
};

/**
 * Seamless, infinite horizontal logo marquee.
 * - Pauses on hover, colorizes from grayscale on hover.
 * - Reduced-motion: renders a static, centered, wrapped row (no auto-scroll).
 */
export const LogoMarquee = ({
  reverse = false,
  speed = "normal",
  showLabel = true,
  className = "",
}: LogoMarqueeProps) => {
  const reduce = useReducedMotion();
  const logos = useSiteContent(() => getTechLogos("marquee"), MARQUEE_FALLBACK);
  const items = reduce ? logos : [...logos, ...logos];

  const anim = reduce
    ? ""
    : `${speed === "slow" ? "animate-marquee-slow" : "animate-marquee"} ${reverse ? "[animation-direction:reverse]" : ""}`;

  return (
    <div
      className={`group relative overflow-hidden ${className}`}
      role="list"
      aria-label="Cloud and DevOps certification technologies"
    >
      {/* Edge fades (match whatever band this sits on) */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-14 md:w-28 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-14 md:w-28 bg-gradient-to-l from-background to-transparent" />

      <div
        className={`flex w-max items-center gap-4 py-2 ${anim} group-hover:[animation-play-state:paused] motion-reduce:flex-wrap motion-reduce:justify-center`}
      >
        {items.map((logo, i) => (
          <div
            key={`${logo.name}-${i}`}
            role="listitem"
            className="flex h-14 shrink-0 items-center gap-2.5 rounded-xl bg-white px-5 shadow-card ring-1 ring-black/5 grayscale transition-all duration-300 hover:grayscale-0 hover:-translate-y-0.5"
          >
            <img
              src={logo.src}
              alt={`${logo.name} logo`}
              loading="lazy"
              decoding="async"
              width={96}
              height={28}
              className="h-7 w-auto object-contain"
            />
            {showLabel && (
              <span className="text-sm font-semibold text-neutral-800">{logo.name}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogoMarquee;
