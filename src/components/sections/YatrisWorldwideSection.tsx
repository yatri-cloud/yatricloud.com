import { Suspense, lazy, useEffect, useRef, useState } from "react";

/**
 * Homepage gate for the "Yatris, worldwide" map — the EXACT section from the
 * Achievements page (provider tabs, colored markers, legend), replicated in
 * YatrisWorldwideInner. The heavy chunk (react-simple-maps + certifications
 * fetch) mounts only when this sentinel nears the viewport, so the homepage
 * entry bundle stays light.
 */

const YatrisWorldwideInner = lazy(
  () => import("@/components/sections/YatrisWorldwideInner")
);

export const YatrisWorldwideSection = () => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (!("IntersectionObserver" in window)) {
      setShow(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          observer.disconnect();
        }
      },
      { rootMargin: "800px" }
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={hostRef}>
      {show && (
        <Suspense fallback={<div className="h-[400px] w-full band-tint" aria-hidden />}>
          <YatrisWorldwideInner />
        </Suspense>
      )}
    </div>
  );
};

export default YatrisWorldwideSection;
