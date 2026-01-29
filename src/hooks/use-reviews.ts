import { useEffect, useState } from "react";

export type Review = {
  id?: number;
  timestamp?: string;
  name: string;
  feedback: string;
  rating: number;
  linkedinProfile?: string;
  provider?: string;
  country?: string;
  source?: string;
};

export function useReviews(limit = 200) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const query = `action=all&limit=${limit}`;

    const tryFetch = async (url: string): Promise<Response> => {
      const res = await fetch(url);
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("text/html")) {
        const text = await res.text();
        throw new Error(`HTML response (not JSON) from ${url.slice(0, 50)}…`);
      }
      return res;
    };

    const fetchReviews = async () => {
      setLoading(true);
      setError(null);
      try {
        let res: Response | null = null;
        const sources: Array<() => Promise<Response>> = [
          () => tryFetch(`http://localhost:3001/api/reviews?${query}`),
          () => tryFetch(`/api/reviews?${query}`),
        ];

        const directUrl = import.meta.env.VITE_CERTIFICATE_REVIEWS_APPS_SCRIPT_URL;
        if (directUrl) {
          sources.push(() => tryFetch(`${directUrl}?${query}`));
        }

        for (const fn of sources) {
          try {
            res = await fn();
            break;
          } catch {
            continue;
          }
        }

        if (!res) {
          throw new Error(
            directUrl
              ? "Could not load reviews from server, proxy, or Apps Script."
              : "Could not load reviews. Set VITE_CERTIFICATE_REVIEWS_APPS_SCRIPT_URL in .env."
          );
        }

        const json = await res.json();
        if (!json || json.success === false) {
          throw new Error(json?.message || "Failed to load reviews");
        }
        setReviews(json.data || []);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unable to load reviews";
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [limit]);

  return { reviews, loading, error };
}
