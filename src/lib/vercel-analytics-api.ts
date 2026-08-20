/**
 * Vercel Analytics API client for Admin Dashboard
 */

export interface VercelStatsResponse {
  pageviews?: number;
  visitors?: number;
  bounceRate?: number; // e.g. 0.42 = 42%
  topPaths?: { path: string; count: number }[];
  topReferrers?: { referrer: string; count: number }[];
  topCountries?: { country: string; count: number }[];
  topDevices?: { device: string; count: number }[];
}

export async function fetchVercelAnalytics(days: number = 30): Promise<VercelStatsResponse | null> {
  try {
    const res = await fetch(`/api/vercel-analytics?days=${days}`);
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.success || !json.stats) return null;

    const s = json.stats;
    return {
      pageviews: s.pageviews?.value || s.total_pageviews || 0,
      visitors: s.visitors?.value || s.total_visitors || 0,
      bounceRate: s.bounceRate?.value ?? s.bounce_rate ?? null,
      topPaths: s.topPaths || [],
      topReferrers: s.topReferrers || [],
      topCountries: s.topCountries || [],
      topDevices: s.topDevices || [],
    };
  } catch (err) {
    console.warn("[Vercel Analytics Client]", err);
    return null;
  }
}
