import { supabase } from "./supabase";

export type EventCategory =
  | "Resource"
  | "Event"
  | "Training"
  | "Mentorship"
  | "Store"
  | "Blog"
  | "Job"
  | "Certification"
  | "Community"
  | "Support"
  | "System"
  | "Page";

export type EventName =
  | "download"
  | "view"
  | "click"
  | "enroll"
  | "purchase"
  | "visit"
  | "search"
  | "apply"
  | "signup"
  | "login";

export interface AnalyticsEvent {
  event_name: EventName;
  category: EventCategory;
  target_id?: string;
  user_id?: string;
  metadata?: Record<string, any>;
}

/**
 * Log an event to the analytics table.
 * Works for both authenticated and anonymous users.
 * Fails silently so it never breaks the user experience.
 */
export async function trackEvent(
  eventName: EventName,
  category: EventCategory,
  targetId?: string,
  metadata?: Record<string, any>
) {
  try {
    // Try to get the logged-in user — but don't block tracking if not logged in
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("analytics_events").insert({
      event_name: eventName,
      category,
      target_id: targetId || null,
      user_id: user?.id || null,
      metadata: {
        ...metadata,
        // Always capture page context for revenue insights
        url: typeof window !== "undefined" ? window.location.pathname : undefined,
        referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      },
    });

    if (error) {
      console.error("[Analytics] Insert error:", error.message);
    }
  } catch (error) {
    // Silent fail — analytics must never crash the app
  }
}

/**
 * Track a page view. Call this from the usePageTracker hook.
 */
export function trackPageView(pathname: string, title?: string) {
  // Derive a human-readable page category from the path
  const category = pathToCategory(pathname);
  trackEvent("visit", category, undefined, {
    page: pathname,
    title: title || document?.title,
  });
}

/**
 * Track a search query — call this when a user submits a search.
 */
export function trackSearch(query: string, category: EventCategory = "System", resultCount?: number) {
  if (!query?.trim()) return;
  trackEvent("search", category, undefined, {
    query: query.trim().toLowerCase(),
    result_count: resultCount,
  });
}

function pathToCategory(path: string): EventCategory {
  if (path.startsWith("/resources")) return "Resource";
  if (path.startsWith("/events") || path.startsWith("/upcoming-event")) return "Event";
  if (path.startsWith("/training")) return "Training";
  if (path.startsWith("/mentorship") || path.startsWith("/become-mentor")) return "Mentorship";
  if (path.startsWith("/store") || path.startsWith("/yatri-store")) return "Store";
  if (path.startsWith("/blog")) return "Blog";
  if (path.startsWith("/job")) return "Job";
  if (path.startsWith("/certification") || path.startsWith("/certified")) return "Certification";
  if (path.startsWith("/community")) return "Community";
  if (path.startsWith("/support")) return "Support";
  return "Page";
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin retrieval queries
// ─────────────────────────────────────────────────────────────────────────────

export interface AnalyticsSummary {
  totalEvents: number;
  totalDownloads: number;
  totalViews: number;
  totalSearches: number;
  totalEnrollments: number;
  totalPurchases: number;
  uniqueVisitors: number;
  eventsByDate: { date: string; downloads: number; views: number; other: number }[];
  topResources: { target_id: string; count: number; name?: string }[];
  topPages: { page: string; count: number }[];
  topSearches: { query: string; count: number }[];
  categoryBreakdown: { category: string; count: number }[];
}

export async function getAnalyticsSummary(days: number = 30): Promise<AnalyticsSummary | null> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString();

    // Fetch all events in the time range in one query
    const { data: events, error } = await supabase
      .from("analytics_events")
      .select("event_name, category, target_id, metadata, created_at, user_id")
      .gte("created_at", sinceStr)
      .order("created_at", { ascending: true });

    if (error) throw error;
    if (!events) return null;

    // ── Aggregate metrics ─────────────────────────────────────────────────
    let totalDownloads = 0;
    let totalViews = 0;
    let totalSearches = 0;
    let totalEnrollments = 0;
    let totalPurchases = 0;
    const uniqueUserIds = new Set<string>();
    const dateMap: Record<string, { date: string; downloads: number; views: number; other: number }> = {};
    const resourceCounts: Record<string, number> = {};
    const pageCounts: Record<string, number> = {};
    const searchCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};

    // Pre-fill date map so chart is continuous
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split("T")[0];
      dateMap[ds] = { date: ds, downloads: 0, views: 0, other: 0 };
    }

    for (const ev of events) {
      if (ev.user_id) uniqueUserIds.add(ev.user_id);

      const ds = ev.created_at.split("T")[0];

      // Event type aggregation
      if (ev.event_name === "download") {
        totalDownloads++;
        if (dateMap[ds]) dateMap[ds].downloads++;
        if (ev.target_id) resourceCounts[ev.target_id] = (resourceCounts[ev.target_id] || 0) + 1;
      } else if (ev.event_name === "visit") {
        totalViews++;
        if (dateMap[ds]) dateMap[ds].views++;
        const page = ev.metadata?.page || "unknown";
        pageCounts[page] = (pageCounts[page] || 0) + 1;
      } else if (ev.event_name === "search") {
        totalSearches++;
        const q = ev.metadata?.query;
        if (q) searchCounts[q] = (searchCounts[q] || 0) + 1;
      } else if (ev.event_name === "enroll") {
        totalEnrollments++;
        if (dateMap[ds]) dateMap[ds].other++;
      } else if (ev.event_name === "purchase") {
        totalPurchases++;
        if (dateMap[ds]) dateMap[ds].other++;
      } else {
        if (dateMap[ds]) dateMap[ds].other++;
      }

      // Category breakdown
      if (ev.category) categoryCounts[ev.category] = (categoryCounts[ev.category] || 0) + 1;
    }

    // ── Top resources (with names resolved) ───────────────────────────────
    const topResourceEntries = Object.entries(resourceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({ target_id: id, count, name: id }));

    if (topResourceEntries.length > 0) {
      const ids = topResourceEntries.map(r => r.target_id);
      const { data: resourceRows } = await supabase
        .from("resources")
        .select("id, title")
        .in("id", ids);
      if (resourceRows) {
        const nameMap: Record<string, string> = {};
        resourceRows.forEach((r: any) => { nameMap[r.id] = r.title; });
        topResourceEntries.forEach(r => { r.name = nameMap[r.target_id] || r.target_id; });
      }
    }

    // ── Top pages ─────────────────────────────────────────────────────────
    const topPages = Object.entries(pageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([page, count]) => ({ page, count }));

    // ── Top searches ──────────────────────────────────────────────────────
    const topSearches = Object.entries(searchCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));

    // ── Category breakdown ────────────────────────────────────────────────
    const categoryBreakdown = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({ category, count }));

    return {
      totalEvents: events.length,
      totalDownloads,
      totalViews,
      totalSearches,
      totalEnrollments,
      totalPurchases,
      uniqueVisitors: uniqueUserIds.size,
      eventsByDate: Object.values(dateMap),
      topResources: topResourceEntries,
      topPages,
      topSearches,
      categoryBreakdown,
    };
  } catch (error) {
    console.error("Failed to load analytics summary:", error);
    return null;
  }
}
