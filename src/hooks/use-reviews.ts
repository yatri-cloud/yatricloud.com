import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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
    const fetchReviews = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: sbError } = await supabase
          .from("reviews")
          .select("id,name,review,rating,context,created_at")
          .eq("is_public", true)
          .order("created_at", { ascending: false })
          .limit(limit);
        if (sbError) throw new Error(sbError.message);
        setReviews((data || []).map(fromSupabaseRow));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unable to load reviews";
        console.error("❌ Reviews fetch failed:", message);
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [limit]);

  return { reviews, loading, error };
}
