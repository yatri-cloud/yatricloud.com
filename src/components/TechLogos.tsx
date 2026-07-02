import { useReducedMotion } from "framer-motion";

/**
 * Official tech/cloud brand logos used across the site's marquees.
 * SVGs are stored locally in /public/logos (sourced from Devicon).
 * Rendered inside white chips so brand colors stay legible on light,
 * tint, blue, and dark section bands alike.
 */
export const TECH_LOGOS = [
  { name: "AWS", src: "/logos/aws.svg" },
  { name: "Azure", src: "/logos/azure.svg" },
  { name: "Google Cloud", src: "/logos/googlecloud.svg" },
  { name: "Kubernetes", src: "/logos/kubernetes.svg" },
  { name: "Terraform", src: "/logos/terraform.svg" },
  { name: "Docker", src: "/logos/docker.svg" },
  { name: "Ansible", src: "/logos/ansible.svg" },
  { name: "Python", src: "/logos/python.svg" },
  { name: "Linux", src: "/logos/linux.svg" },
  { name: "GitHub", src: "/logos/github.svg" },
] as const;

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
  const items = reduce ? TECH_LOGOS : [...TECH_LOGOS, ...TECH_LOGOS];

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
