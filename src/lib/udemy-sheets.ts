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

/** Fetch all published Udemy courses, newest first. */
export async function fetchUdemyCourses(): Promise<UdemyCourse[]> {
  const { data, error } = await supabase
    .from("udemy_courses")
    .select("id,title,course_url,image_url,creator,tech,category,created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("❌ Error fetching Udemy courses:", error.message);
    return [];
  }
  return (data || []).map((c) => ({
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
