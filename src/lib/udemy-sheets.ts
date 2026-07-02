/**
 * Udemy Courses Integration Service
 * Reads: Supabase (`udemy_courses`) when VITE_USE_SUPABASE, else legacy Sheets webhooks.
 */

import { supabase, USE_SUPABASE } from "@/lib/supabase";

const UDEMY_YATHARTH_WEBHOOK_URL = import.meta.env.VITE_UDEMY_YATHARTH_WEBHOOK_URL || "";
const UDEMY_NENSI_WEBHOOK_URL = import.meta.env.VITE_UDEMY_NENSI_WEBHOOK_URL || "";

export interface UdemyCourse {
  id: string;
  title: string;
  udemyUrl: string;
  imageUrl: string;
  creator: string;
  certification: string;
  category: string;
  timestamp?: string; // Course creation timestamp for sorting
}

/**
 * Fetch courses from a specific webhook URL
 */
async function fetchCoursesFromWebhook(webhookUrl: string): Promise<UdemyCourse[]> {
  if (!webhookUrl) {
    console.warn(`⚠️ Webhook URL not configured`);
    return [];
  }

  // Validate URL format
  if (!webhookUrl.startsWith('https://script.google.com/macros/s/')) {
    console.error(`❌ Invalid webhook URL format: ${webhookUrl}`);
    console.error(`   Expected format: https://script.google.com/macros/s/.../exec`);
    return [];
  }

  try {
    console.log(`📥 Fetching courses from: ${webhookUrl}`);
    
    const response = await fetch(webhookUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success && Array.isArray(result.courses)) {
      console.log(`✅ Fetched ${result.courses.length} courses from webhook`);
      return result.courses;
    } else {
      console.warn(`⚠️ Unexpected response format:`, result);
      return [];
    }
  } catch (error: any) {
    console.error(`❌ Error fetching courses from webhook:`, error);
    if (error.message && error.message.includes('CORS')) {
      console.error(`   CORS Error: Make sure the Google Apps Script is deployed as a web app with "Anyone" access`);
    }
    return [];
  }
}

/**
 * Fetch all Udemy courses from both creators' sheets
 */
export async function fetchUdemyCourses(): Promise<UdemyCourse[]> {
  // Supabase-first (udemy_courses table), legacy webhooks as fallback
  if (USE_SUPABASE) {
    const { data, error } = await supabase
      .from("udemy_courses")
      .select("id,title,course_url,image_url,creator,tech,category,created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false });
    if (!error && data && data.length) {
      return data.map((c) => ({
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
    console.error("❌ Supabase udemy_courses fetch failed, falling back:", error?.message);
  }

  console.log('📚 Fetching Udemy courses from Google Sheets...');

  // Fetch from both creators concurrently
  const [yatharthCourses, nensiCourses] = await Promise.all([
    fetchCoursesFromWebhook(UDEMY_YATHARTH_WEBHOOK_URL),
    fetchCoursesFromWebhook(UDEMY_NENSI_WEBHOOK_URL),
  ]);

  // Combine and normalize courses
  const allCourses = [...yatharthCourses, ...nensiCourses].map((course: any) => ({
    id: course.id || `${course.creator || 'unknown'}-${Date.now()}-${Math.random()}`,
    title: course.title || '',
    udemyUrl: course.udemyUrl || course.courseLink || '',
    imageUrl: course.imageUrl || course.imageLink || '',
    creator: course.creator === 'yatharth-chauhan' ? 'Yatharth Chauhan' : 
             course.creator === 'nensi-ravaliya' ? 'Nensi Ravaliya' : 
             course.creator || 'Unknown',
    certification: course.certification || course.tech || '',
    category: course.category || '',
    timestamp: course.timestamp || '', // Preserve timestamp for sorting
  }));

  // Sort by timestamp (latest first)
  allCourses.sort((a, b) => {
    const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return dateB - dateA; // Latest first (descending order)
  });

  console.log(`📊 Total courses loaded: ${allCourses.length}`);
  return allCourses;
}

