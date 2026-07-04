/**
 * Udemy Courses — Supabase `udemy_courses` table (admin-managed catalog).
 */

import { supabase } from "@/lib/supabase";

export interface UdemyCourse {
  id: string;
  title: string;
  udemyUrl: string;
  imageUrl: string;
  creator: string;
  certification: string;
  category: string;
  timestamp?: string; // for sorting
}

/**
 * Fetch all published Udemy courses, newest first.
 *
 * `withImages: false` skips the `image_url` column — many rows store the
 * thumbnail as an inline base64 data URI, which made the full catalog fetch
 * ~11 MB. List views should fetch metadata only and hydrate images for just
 * the visible cards via fetchUdemyCourseImages().
 */
export async function fetchUdemyCourses(
  opts: { withImages?: boolean } = {}
): Promise<UdemyCourse[]> {
  const { withImages = true } = opts;
  const columns = withImages
    ? "id,title,course_url,image_url,creator,tech,category,created_at"
    : "id,title,course_url,creator,tech,category,created_at";
  const { data, error } = await supabase
    .from("udemy_courses")
    .select(columns)
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("❌ Error fetching Udemy courses:", error.message);
    return [];
  }
  return ((data || []) as unknown as Record<string, string>[]).map((c) => ({
    id: c.id,
    title: c.title || "",
    udemyUrl: c.course_url || "",
    imageUrl: c.image_url || "",
    creator: c.creator || "Unknown",
    certification: c.tech || "",
    category: c.category || "",
    timestamp: c.created_at || "",
  }));
}

/** Fetch just the thumbnails for a set of course ids (id → image_url). */
export async function fetchUdemyCourseImages(
  ids: string[]
): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const { data, error } = await supabase
    .from("udemy_courses")
    .select("id,image_url")
    .in("id", ids);
  if (error) {
    console.error("❌ Error fetching Udemy course images:", error.message);
    return {};
  }
  const map: Record<string, string> = {};
  for (const row of data || []) map[row.id] = row.image_url || "";
  return map;
}
