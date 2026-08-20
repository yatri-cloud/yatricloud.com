/**
 * Vercel Analytics API client for Admin Dashboard
 */

export interface VercelWebAnalyticsData {
  totalVisitors: number;
  totalPageviews: number;
  bounceRate: number; // e.g. 42 (%)
  timeseries: { timestamp: string; visitors: number; pageviews: number }[];
  countries: { country: string; visitors: number; pageviews: number }[];
  referrers: { referrerHostname: string; visitors: number; pageviews: number }[];
  devices: { deviceType: string; visitors: number; pageviews: number }[];
  os: { osName: string; visitors: number; pageviews: number }[];
  paths: { requestPath: string; visitors: number; pageviews: number }[];
}

export async function fetchVercelAnalytics(days: number = 30): Promise<VercelWebAnalyticsData | null> {
  try {
    const res = await fetch(`/api/vercel-analytics?days=${days}`);
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.success || !json.data) return null;
    return json.data as VercelWebAnalyticsData;
  } catch (err) {
    console.warn("[Vercel Analytics Client]", err);
    return null;
  }
}
