import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/ScrollReveal";
import Marquee from "@/components/Marquee";
import { useTheme } from "@/components/ThemeProvider";
import {
  useSiteContent,
  getTechLogos,
  FALLBACK_TECH_LOGOS,
} from "@/lib/site-content";

// Company logos loaded from the `tech_logos` table (grp 'community');
// the fallback list matches the live values exactly. `href` carries the
// light-theme logo variant (logoLight) where one exists.
const COMPANIES_FALLBACK = FALLBACK_TECH_LOGOS.filter((l) => l.grp === "community");

// Profile pictures for the globe - mix of actual and real profile images
const profilePictures = [
  // Self-hosted 200px copies — the originals were 812 KB and 2 MB PNGs.
  "/team/yatharth-chauhan-200.png",
  "/team/nensi-ravaliya-200.png",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=200&h=200&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200&h=200&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=200&h=200&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&h=200&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces",
];

// ——— Yatri Cloud logo shape — the community visual traces the WHITE LINES
// of the logo (three overlapping cloud lobes + flat base + the cheering-Yatri
// figure inside), NOT the outer blue disc. All geometry lives in a 200×170
// design box and renders as percentages so it scales with its container.

type Pt = { x: number; y: number };

const LOBES = {
  left: { cx: 62, cy: 108, r: 26 },
  mid: { cx: 100, cy: 82, r: 36 },
  right: { cx: 138, cy: 108, r: 26 },
};
const BASE_Y = 134; // flat bottom of the cloud (= left/right lobe bottoms)

// Upper intersection of two lobes — the visible seam on the cloud outline
const upperIntersection = (
  a: { cx: number; cy: number; r: number },
  b: { cx: number; cy: number; r: number }
): Pt => {
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  const d = Math.hypot(dx, dy);
  const l = (a.r * a.r - b.r * b.r + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(a.r * a.r - l * l, 0));
  const px = a.cx + (l * dx) / d;
  const py = a.cy + (l * dy) / d;
  const p1 = { x: px + (h * dy) / d, y: py - (h * dx) / d };
  const p2 = { x: px - (h * dy) / d, y: py + (h * dx) / d };
  return p1.y < p2.y ? p1 : p2;
};

const angleOn = (c: { cx: number; cy: number }, p: Pt) =>
  Math.atan2(p.y - c.cy, p.x - c.cx);

// Keep sweeping forward (clockwise on screen) past the previous angle
const unwrapAfter = (angle: number, after: number) => {
  let a = angle;
  while (a <= after) a += Math.PI * 2;
  return a;
};

const sampleArc = (
  c: { cx: number; cy: number; r: number },
  from: number,
  to: number,
  steps: number
): Pt[] => {
  const pts: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = from + ((to - from) * i) / steps;
    pts.push({ x: c.cx + c.r * Math.cos(t), y: c.cy + c.r * Math.sin(t) });
  }
  return pts;
};

// Dense closed polyline of the cloud outline, walked from the bottom-left
// corner: up the left lobe → over the crown → down the right lobe → flat base.
const buildCloudOutline = (): Pt[] => {
  const seamL = upperIntersection(LOBES.left, LOBES.mid);
  const seamR = upperIntersection(LOBES.mid, LOBES.right);
  const midStart = unwrapAfter(angleOn(LOBES.mid, seamL), Math.PI / 2);
  const rightStart = unwrapAfter(angleOn(LOBES.right, seamR), Math.PI);
  const pts: Pt[] = [
    ...sampleArc(
      LOBES.left,
      Math.PI / 2,
      unwrapAfter(angleOn(LOBES.left, seamL), Math.PI / 2),
      22
    ),
    ...sampleArc(
      LOBES.mid,
      midStart,
      unwrapAfter(angleOn(LOBES.mid, seamR), midStart),
      30
    ),
    ...sampleArc(LOBES.right, rightStart, unwrapAfter(Math.PI / 2, rightStart), 22),
  ];
  const baseSteps = 12;
  const xStart = LOBES.right.cx;
  const xEnd = LOBES.left.cx;
  for (let i = 1; i <= baseSteps; i++) {
    pts.push({ x: xStart + ((xEnd - xStart) * i) / baseSteps, y: BASE_Y });
  }
  return pts;
};

const CLOUD_OUTLINE = buildCloudOutline();

const CLOUD_PATH =
  CLOUD_OUTLINE.map(
    (p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`
  ).join(" ") + " Z";

// The cheering-Yatri figure inside the cloud (V arms + twin legs; head is a
// dot). Arms carry a wave rotation around their junction end (transform-box:
// fill-box makes the % origin land exactly on the junction); spark paths run
// the opposite way so energy travels junction → tip / ground → hip.
// Proportions match the logo: wide V arms with the head nested in the notch,
// legs reaching toward the cloud base.
const FIGURE_ARMS = [
  { d: "M 79 80 L 98 101", spark: "M 98 101 L 79 80", originX: 1, wave: 7 },
  { d: "M 121 80 L 102 101", spark: "M 102 101 L 121 80", originX: 0, wave: -7 },
];
// kick = mirrored outward swing around the hip (originY 0 = top of the leg)
const FIGURE_LEGS = [
  { d: "M 94.5 107 L 94.5 129", spark: "M 94.5 129 L 94.5 107", kick: -8 },
  { d: "M 105.5 107 L 105.5 129", spark: "M 105.5 129 L 105.5 107", kick: 8 },
];

// Evenly space n points along the closed outline (by arc length)
const spotsAlongOutline = (pts: Pt[], n: number): Pt[] => {
  const cum: number[] = [0];
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  }
  const total = cum[cum.length - 1];
  const out: Pt[] = [];
  let seg = 1;
  for (let k = 0; k < n; k++) {
    const target = ((k + 0.5) / n) * total;
    while (seg < pts.length - 1 && cum[seg] < target) seg++;
    const t = (target - cum[seg - 1]) / (cum[seg] - cum[seg - 1] || 1);
    out.push({
      x: pts[seg - 1].x + (pts[seg].x - pts[seg - 1].x) * t,
      y: pts[seg - 1].y + (pts[seg].y - pts[seg - 1].y) * t,
    });
  }
  return out;
};

const AVATAR_SPOTS = spotsAlongOutline(CLOUD_OUTLINE, profilePictures.length);

// The Yatri Cloud logo drawn in community members — dotted cloud outline +
// figure, with member avatars riding the cloud line. Pure presentation.
const CloudLogoVisualization = () => {
  const reduce = useReducedMotion();

  return (
    <div className="relative mx-auto w-full max-w-[620px] px-2 py-6">
      <div className="relative w-full" style={{ aspectRatio: "200 / 170" }}>
        {/* Dotted white-line geometry of the logo (drawn in brand blue).
            Choreography: the cloud DRAWS itself → avatars pop as the stroke
            passes them → figure draws in → head springs + radar pings →
            idle life: dots flow around the line, a comet orbits forever. */}
        <svg
          viewBox="0 0 200 170"
          className="absolute inset-0 h-full w-full"
          fill="none"
          aria-hidden
        >
          {/* faint continuous guide under the dots */}
          <path d={CLOUD_PATH} stroke="hsl(var(--primary) / 0.12)" strokeWidth="1" />

          {/* the cloud outline draws itself on scroll, then hands off to the dots */}
          {!reduce && (
            <motion.path
              d={CLOUD_PATH}
              stroke="hsl(var(--primary) / 0.75)"
              strokeWidth="1.8"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 1 }}
              whileInView={{ pathLength: 1, opacity: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{
                pathLength: { duration: 2.2, ease: "linear" },
                opacity: { delay: 2.3, duration: 0.9 },
              }}
            />
          )}

          {/* dotted logo line — fades in as the draw completes, then flows
              slowly around the cloud (seamless: offset cycle = dash cycle) */}
          <motion.g
            initial={reduce ? undefined : { opacity: 0 }}
            whileInView={reduce ? undefined : { opacity: 1 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ delay: 1.9, duration: 1 }}
          >
            <motion.path
              d={CLOUD_PATH}
              stroke="hsl(var(--primary) / 0.55)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="0.1 5.5"
              animate={reduce ? undefined : { strokeDashoffset: [0, -5.6] }}
              transition={
                reduce
                  ? undefined
                  : { duration: 2.8, ease: "linear", repeat: Infinity }
              }
            />
          </motion.g>

          <defs>
            {/* userSpaceOnUse is REQUIRED: bounding-box gradients collapse on
                zero-width shapes, which made the vertical legs render nothing */}
            <linearGradient
              id="yc-figure-grad"
              gradientUnits="userSpaceOnUse"
              x1="100"
              y1="64"
              x2="100"
              y2="132"
            >
              <stop offset="0%" style={{ stopColor: "hsl(var(--blue-300))" }} />
              <stop offset="100%" style={{ stopColor: "hsl(var(--primary))" }} />
            </linearGradient>
          </defs>

          {/* the cheering-Yatri figure — draws in, then comes ALIVE:
              the whole figure hops while both arms wave outward (a cheer),
              and energy sparks run up the legs and out along the arms */}
          <motion.g
            initial={reduce ? undefined : { y: 0 }}
            whileInView={reduce ? undefined : { y: [0, -3, 0] }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{
              delay: 3.4,
              duration: 2,
              ease: "easeInOut",
              repeat: Infinity,
              repeatDelay: 1.2,
            }}
          >
            {FIGURE_ARMS.map((arm, i) => (
              <motion.g
                key={arm.d}
                style={{
                  transformBox: "fill-box",
                  // framer overwrites transform-origin — set it via originX/Y
                  originX: arm.originX,
                  originY: 1,
                }}
                initial={reduce ? undefined : { rotate: 0 }}
                whileInView={reduce ? undefined : { rotate: [0, arm.wave, 0] }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{
                  delay: 3.4,
                  duration: 2,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatDelay: 1.2,
                }}
              >
                <motion.path
                  d={arm.d}
                  stroke="url(#yc-figure-grad)"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  initial={reduce ? undefined : { pathLength: 0, opacity: 0 }}
                  whileInView={reduce ? undefined : { pathLength: 1, opacity: 1 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ delay: 1.4 + i * 0.18, duration: 0.55, ease: "easeOut" }}
                />
              </motion.g>
            ))}
            {FIGURE_LEGS.map((leg, i) => (
              <motion.g
                key={leg.d}
                style={{ transformBox: "fill-box", originX: 0.5, originY: 0 }}
                initial={reduce ? undefined : { rotate: 0 }}
                whileInView={reduce ? undefined : { rotate: [0, leg.kick, 0] }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{
                  delay: 3.4,
                  duration: 2,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatDelay: 1.2,
                }}
              >
                <motion.path
                  d={leg.d}
                  stroke="url(#yc-figure-grad)"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  initial={reduce ? undefined : { pathLength: 0, opacity: 0 }}
                  whileInView={reduce ? undefined : { pathLength: 1, opacity: 1 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ delay: 1.75 + i * 0.18, duration: 0.55, ease: "easeOut" }}
                />
              </motion.g>
            ))}

            {/* head — springs in, then pings like a beacon (rides the hop) */}
            <motion.circle
              cx="100"
              cy="74.5"
              fill="hsl(var(--primary))"
              initial={reduce ? { r: 6, opacity: 0.9 } : { r: 0, opacity: 0 }}
              whileInView={reduce ? undefined : { r: [0, 7.6, 6], opacity: 0.9 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ delay: 2.15, duration: 0.55, ease: "easeOut" }}
            />
            {!reduce &&
              [0, 1.4].map((offset) => (
                <motion.circle
                  key={`ping-${offset}`}
                  cx="100"
                  cy="74.5"
                  r="6"
                  stroke="hsl(var(--primary) / 0.5)"
                  strokeWidth="1"
                  initial={{ opacity: 0 }}
                  whileInView={{ r: [6.5, 18], opacity: [0.55, 0] }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{
                    delay: 2.7 + offset,
                    duration: 2.8,
                    ease: "easeOut",
                    repeat: Infinity,
                  }}
                />
              ))}

            {/* energy sparks: rise up the legs, burst out along the arms */}
            {!reduce && (
              <motion.g
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ delay: 3.2, duration: 0.6 }}
              >
                {[
                  ...FIGURE_LEGS.map((leg, i) => ({ path: leg.spark, begin: i * 0.4 })),
                  ...FIGURE_ARMS.map((arm, i) => ({ path: arm.spark, begin: 0.8 + i * 0.4 })),
                ].map((spark) => (
                  <circle key={spark.path} r="1.4" fill="hsl(var(--primary))" opacity="0">
                    <animateMotion
                      dur="1.6s"
                      begin={`${spark.begin}s`}
                      repeatCount="indefinite"
                      path={spark.path}
                    />
                    <animate
                      attributeName="opacity"
                      values="0;0.9;0"
                      dur="1.6s"
                      begin={`${spark.begin}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                ))}
              </motion.g>
            )}
          </motion.g>

          {/* a glowing comet orbits the cloud line forever */}
          {!reduce && (
            <motion.g
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ delay: 2.5, duration: 0.8 }}
            >
              <circle r="5" fill="hsl(var(--primary) / 0.2)">
                <animateMotion dur="11s" repeatCount="indefinite" path={CLOUD_PATH} />
              </circle>
              <circle r="1.9" fill="hsl(var(--primary))">
                <animateMotion dur="11s" repeatCount="indefinite" path={CLOUD_PATH} />
              </circle>
            </motion.g>
          )}
        </svg>

        {/* Member avatars riding the cloud outline */}
        {AVATAR_SPOTS.map((spot, i) => (
          <div
            key={`profile-${i}`}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            style={{
              left: `${(spot.x / 200) * 100}%`,
              top: `${(spot.y / 170) * 100}%`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.zIndex = "50";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.zIndex = "10";
            }}
          >
            {/* entrance: pop in exactly as the drawing stroke reaches this spot
                (draw = 2.2s linear over the closed path; spot i sits at (i+0.5)/10) */}
            <motion.div
              initial={reduce ? undefined : { scale: 0, opacity: 0 }}
              whileInView={reduce ? undefined : { scale: 1, opacity: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                delay: 0.11 + i * 0.22,
                type: "spring",
                stiffness: 260,
                damping: 16,
              }}
            >
            <motion.div
              animate={reduce ? undefined : { y: [0, -4, 0] }}
              transition={
                reduce
                  ? undefined
                  : {
                      duration: 4 + (i % 3),
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.35,
                    }
              }
            >
              <motion.div
                className="h-10 w-10 sm:h-14 sm:w-14 rounded-full border-2 border-primary/50 bg-background overflow-hidden shadow-lg"
                whileHover={{ scale: 1.25 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
              >
                <img
                  src={profilePictures[i % profilePictures.length]}
                  alt={`Community member ${i + 1}`}
                  width={56}
                  height={56}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover pointer-events-none select-none"
                  draggable={false}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=User+${i + 1}&background=007CFF&color=fff&size=128`;
                  }}
                />
              </motion.div>
            </motion.div>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CommunitySection = () => {
  const { theme } = useTheme();
  const reduce = useReducedMotion();

  const communityLogos = useSiteContent(
    () => getTechLogos("community"),
    COMPANIES_FALLBACK
  );
  const companies = communityLogos.map((logo) => ({
    name: logo.name,
    logo: logo.src,
    logoLight: logo.href ?? undefined,
  }));

  return (
    <section className="relative band-tint text-foreground overflow-hidden">
      {/* Top Section - Join Our Community (Permanent Dark Closing Band) */}
      <div className="relative py-20 md:py-28 overflow-hidden">
        {/* Dotted-grid backdrop — kinetic community field */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage: "radial-gradient(hsl(var(--primary) / 0.7) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
            maskImage: "radial-gradient(ellipse 62% 58% at 50% 38%, black, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse 62% 58% at 50% 38%, black, transparent 80%)",
          }}
        />

        {/* Decorative blue glow blobs — top blob breathes */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[42rem] h-[42rem] bg-primary/10 blur-3xl rounded-full"
          animate={reduce ? undefined : { opacity: [0.55, 1, 0.55], scale: [1, 1.08, 1] }}
          transition={reduce ? undefined : { duration: 6.5, ease: "easeInOut", repeat: Infinity }}
        />
        <div className="pointer-events-none absolute -bottom-16 right-0 w-96 h-96 bg-primary/10 blur-3xl rounded-full" />
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <ScrollReveal>
              <p className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-4 py-1.5 text-sm font-medium text-muted-foreground uppercase tracking-[0.2em] mb-6 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <motion.span
                    aria-hidden
                    className="absolute inline-flex h-full w-full rounded-full bg-primary"
                    animate={reduce ? undefined : { scale: [1, 2.4], opacity: [0.7, 0] }}
                    transition={reduce ? undefined : { duration: 2, ease: "easeOut", repeat: Infinity }}
                  />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                Join Our Community
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <h2 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-[-0.03em] leading-[0.95] text-foreground mb-6">
                Join an <span className="gradient-text">Exclusive</span> Network of Cloud Innovators
              </h2>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                Join our private community to access discussions, job opportunities, and insights you won't find on Twitter or any public forum.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.25}>
              <div className="mb-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
                {["50% OFF vouchers", "Exam dumps & resources", "Personal 1:1 support"].map((b) => (
                  <span key={b} className="inline-flex items-center gap-2 text-sm text-foreground/80">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    {b}
                  </span>
                ))}
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.3}>
              <Button
                size="lg"
                className="group bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-6 text-lg rounded-xl shadow-inset-btn"
                asChild
              >
                <a
                  href="https://whatsapp.com/channel/0029VakdAHIFHWq60yHA1Q0s"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Join Our Community - It's Free
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
            </ScrollReveal>
          </div>

          {/* Yatri Cloud logo shape drawn in community members */}
          <ScrollReveal delay={0.4}>
            <div className="mt-16 relative">
              {/* Soft blue glow behind photos */}
              <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-2xl -z-10" />
              <CloudLogoVisualization />
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* Bottom Section - Company Logos (light, flows into the footer) */}
      <div className="py-12 md:py-20 bg-background border-t border-border relative overflow-hidden">
        {/* Decorative glow */}
        <div aria-hidden className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[36rem] h-40 bg-primary/10 blur-[100px]" />
        <div className="container mx-auto px-2 sm:px-4 md:px-6 relative z-10">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground mb-8 md:mb-10">
            Certifications we help you master
          </p>
          {/* Scrolling Company Logos - single row, right to left */}
          <div>
            <Marquee speed="normal" direction="right" className="py-2 md:py-4">
              {[...companies, ...companies].map((company, index) => (
                <div
                  key={`${company.name}-2-${index}`}
                  className="flex items-center justify-center px-4 sm:px-8 md:px-12 h-12 sm:h-16 md:h-20 opacity-60 hover:opacity-100 transition-opacity duration-300"
                >
                  <img
                    src={
                      company.name === 'AWS'
                        ? (theme === 'dark' ? company.logoLight || company.logo : company.logo)
                        : company.name === 'GitHub'
                        ? (theme === 'dark' ? company.logo : (company.logoLight || company.logo))
                        : company.logo
                    }
                    alt={company.name}
                    width={120}
                    height={48}
                    loading="lazy"
                    decoding="async"
                    className={`h-6 sm:h-8 md:h-12 w-auto object-contain max-w-[120px] sm:max-w-[150px] md:max-w-none opacity-60 hover:opacity-100 transition-opacity ${
                      company.name === 'GitHub' && theme === 'light' ? 'invert' : ''
                    }`}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = document.createElement('span');
                      fallback.className = 'text-sm sm:text-lg md:text-2xl font-bold text-foreground whitespace-nowrap';
                      fallback.textContent = company.name;
                      target.parentElement?.appendChild(fallback);
                    }}
                  />
                </div>
              ))}
            </Marquee>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CommunitySection;
