import { supabase } from "./supabase";
import { getCachedUser } from "./auth";

export type EventCategory = "Resource" | "Event" | "Training" | "Mentorship" | "Store" | "System";
export type EventName = "download" | "view" | "click" | "enroll" | "purchase" | "visit";

export interface AnalyticsEvent {
  event_name: EventName;
  category: EventCategory;
  target_id?: string;
  user_id?: string;
  metadata?: Record<string, any>;
}

/**
 * Log an event to the analytics table.
 * It fails silently so it never breaks the user experience.
 */
export async function trackEvent(
  eventName: EventName,
  category: EventCategory,
  targetId?: string,
  metadata?: Record<string, any>
) {
  try {
    console.log(`[Analytics] Attempting to track event: ${eventName} for ${targetId}`);
    
    // Get the user securely from Supabase to ensure RLS policies don't fail
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.id) {
      console.log("[Analytics] Skipped: No authenticated user found.");
      return;
    }

    console.log(`[Analytics] Inserting event for user: ${user.id}`);
    const { error } = await supabase.from("analytics_events").insert({
      event_name: eventName,
      category,
      target_id: targetId,
      user_id: user.id,
      metadata: metadata || {},
    });

    if (error) {
      console.error("[Analytics] Supabase insert error:", error);
    } else {
      console.log("[Analytics] Successfully tracked event!");
    }
  } catch (error) {
    console.error("[Analytics] Failed to track analytics event:", error);
  }
}

// ----------------------------------------------------------------------------
// Admin Only Retrieval Queries
// ----------------------------------------------------------------------------

export interface AnalyticsSummary {
  totalEvents: number;
  totalDownloads: number;
  totalViews: number;
  eventsByDate: { date: string; downloads: number; views: number; other: number }[];
  topResources: { target_id: string; count: number; name?: string }[];
}

export async function getAnalyticsSummary(days: number = 30): Promise<AnalyticsSummary | null> {
  try {
    // We call the secure, server-side RPC function we defined in Supabase
    // This is 100% correct, prevents massive data transfer, and is much faster
    const { data, error } = await supabase.rpc('get_analytics_summary', { days });

    if (error) throw error;
    
    if (!data) return null;

    // Fill in missing dates with zero values to ensure continuous chart lines
    const result = data as AnalyticsSummary;
    const eventsByDate = result.eventsByDate || [];
    
    // Generate an array of the last N dates
    const dateMap: Record<string, { date: string; downloads: number; views: number; other: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      dateMap[dateStr] = { date: dateStr, downloads: 0, views: 0, other: 0 };
    }
    
    // Merge database results into the continuous date map
    eventsByDate.forEach(item => {
      if (dateMap[item.date]) {
        dateMap[item.date] = item;
      }
    });

    return {
      totalEvents: result.totalEvents || 0,
      totalDownloads: result.totalDownloads || 0,
      totalViews: result.totalViews || 0,
      eventsByDate: Object.values(dateMap),
      topResources: result.topResources || []
    };

    // Resolve resource names from the resources table so we show titles not UUIDs
    const topResources = summary.topResources;
    if (topResources.length > 0) {
      const ids = topResources.map(r => r.target_id);
      const { data: resourceRows } = await supabase
        .from('resources')
        .select('id, title')
        .in('id', ids);
      if (resourceRows) {
        const nameMap: Record<string, string> = {};
        resourceRows.forEach((r: any) => { nameMap[r.id] = r.title; });
        summary.topResources = topResources.map(r => ({
          ...r,
          name: nameMap[r.target_id] || r.target_id,
        }));
      }
    }

    return summary;
  } catch (error) {
    console.error("Failed to load analytics summary via RPC:", error);
    return null;
  }
}
