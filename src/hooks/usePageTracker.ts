import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/analytics";

/**
 * Drop this hook inside your root App component ONCE.
 * It will automatically track every page navigation across the entire site.
 */
export function usePageTracker() {
  const location = useLocation();

  useEffect(() => {
    // Small delay so the document title has time to update
    const timer = setTimeout(() => {
      trackPageView(location.pathname, document.title);
    }, 100);
    return () => clearTimeout(timer);
  }, [location.pathname]);
}
