import { useEffect, useState } from "react";
import { supabase, USE_SUPABASE } from "@/lib/supabase";

export type Review = {
  id?: number | string;
  timestamp?: string;
  name: string;
  feedback: string;
  rating: number;
  linkedinProfile?: string;
  provider?: string;
  country?: string;
  source?: string;
};

/** Supabase row → legacy Review shape (context JSON carries the extras). */
function fromSupabaseRow(r: {
  id: string; name: string; review: string; rating: number | null;
  context: string | null; created_at: string;
}): Review {
  let extra: Record<string, string> = {};
  try { extra = r.context ? JSON.parse(r.context) : {}; } catch { /* legacy plain text */ }
  return {
    id: r.id,
    timestamp: r.created_at,
    name: r.name,
    feedback: r.review,
    rating: r.rating ?? 5,
    linkedinProfile: extra.linkedin,
    provider: extra.provider,
    country: extra.country,
    source: extra.source,
  };
}

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

      if (USE_SUPABASE) {
        const { data, error: sbError } = await supabase
          .from("reviews")
          .select("id,name,review,rating,context,created_at")
          .eq("is_public", true)
          .order("created_at", { ascending: false })
          .limit(limit);
        if (!sbError && data) {
          setReviews(data.map(fromSupabaseRow));
          setLoading(false);
          return;
        }
        console.error("❌ Supabase reviews fetch failed, falling back:", sbError?.message);
      }

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
