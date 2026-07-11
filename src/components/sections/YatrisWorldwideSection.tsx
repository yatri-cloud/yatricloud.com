import { Suspense, lazy, useEffect, useRef, useState } from "react";
import ScrollReveal from "@/components/ScrollReveal";
import { getCountryFlag } from "@/lib/country-flag";
import {
  useSiteContent,
  getOptionList,
  getSiteStats,
  statValue,
  FALLBACK_OPTION_LISTS,
  FALLBACK_STATS,
  type OptionItem,
} from "@/lib/site-content";
import centroids from "@/data/country-centroids.json";
import type { WorldMarker } from "@/components/sections/YatrisWorldMap";

/**
 * Yatris worldwide — the same filled world map as the Achievements page
 * (react-simple-maps), on the homepage. Markers come from the admin managed
 * community_countries option list (seeded from real Yatri records across the
 * wall of fame, profiles, registrations and voucher requests). The map chunk
 * loads only when the section nears the viewport.
 */

// Generated from Natural Earth 110m into a 0..100 × 0..50 equirect box;
// invert back to lon/lat for react-simple-maps.
const CENTROIDS = centroids as unknown as Record<string, [number, number]>;
const toLonLat = ([x, y]: [number, number]): [number, number] => [
  x * 3.6 - 180,
  85 - y * 2.9,
];

const NAME_ALIASES: Record<string, string> = {
  "united states": "united states of america",
  usa: "united states of america",
  uk: "united kingdom",
  uae: "united arab emirates",
};

const markerFor = (c: OptionItem): WorldMarker | null => {
  const key = c.label.trim().toLowerCase();
  const at = CENTROIDS[NAME_ALIASES[key] || key];
  return at ? { code: c.value, label: c.label, coordinates: toLonLat(at) } : null;
};

const YatrisWorldMap = lazy(() => import("@/components/sections/YatrisWorldMap"));

export const YatrisWorldwideSection = () => {
  const hostRef = useRef<HTMLElement>(null);
  const [showMap, setShowMap] = useState(false);

  const countries = useSiteContent(
    () => getOptionList("community_countries"),
    FALLBACK_OPTION_LISTS.community_countries
  );
  const siteStats = useSiteContent(getSiteStats, FALLBACK_STATS);
  const learners = statValue(siteStats, "learners", "50K+");

  // Mount the map chunk only when the section approaches the viewport.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (!("IntersectionObserver" in window)) {
      setShowMap(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShowMap(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px" }
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  const markers = countries
    .map(markerFor)
    .filter((m): m is WorldMarker => m !== null);

  return (
    <section ref={hostRef} className="relative overflow-hidden bg-background py-20 md:py-28">
      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <div className="text-center">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                Yatris worldwide
              </p>
              <h2 className="font-display text-3xl font-bold tracking-[-0.02em] md:text-5xl">
                One community, <span className="gradient-text">many time zones</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                {learners} learners study with Yatri Cloud from {markers.length}{" "}
                countries and counting. Wherever you are, you are not preparing
                alone.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <div className="mt-12 overflow-hidden rounded-2xl border border-border bg-card p-4 md:p-8">
              {showMap ? (
                <Suspense
                  fallback={<div className="h-[440px] w-full animate-pulse rounded-xl bg-muted/40" />}
                >
                  <YatrisWorldMap markers={markers} />
                </Suspense>
              ) : (
                <div className="h-[440px] w-full rounded-xl bg-muted/30" />
              )}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.25}>
            <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2.5">
              {markers.map((m) => (
                <li
                  key={m.code}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground/85"
                >
                  <span aria-hidden>{getCountryFlag(m.code)}</span>
                  {m.label}
                </li>
              ))}
            </ul>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default YatrisWorldwideSection;
