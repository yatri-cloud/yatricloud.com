/**
 * Exam Dumps Integration Service
 * Reads: Supabase (`exam_dumps` table) when VITE_USE_SUPABASE, else legacy proxy.
 * Writes: legacy Apps Script path until the admin-auth swap lands.
 */

import { supabase, USE_SUPABASE } from "@/lib/supabase";

const EXAM_DUMPS_WEBHOOK_URL = import.meta.env.VITE_EXAM_DUMPS_WEBHOOK_URL || "";

export interface ExamDump {
  id: string;
  title: string;
  provider: string;
  originalPrice: number;
  price: number;
  image: string;
  downloadUrl: string;
  description: string;
  status?: string;
}

const PROXY_URL = '/api/exam-dumps';

/**
 * Fetch exam dumps (Supabase-first, legacy fallback).
 */
export async function fetchExamDumps(): Promise<ExamDump[]> {
  if (USE_SUPABASE) {
    const { data, error } = await supabase
      .from("exam_dumps")
      .select("id,title,provider,original_price_inr,price_inr,image_url,download_url,file_path,description,status")
      .eq("status", "published")
      .order("created_at", { ascending: false });
    if (!error && data) {
      return data.map((d) => ({
        id: d.id,
        title: d.title || "",
        provider: d.provider || "",
        originalPrice: Number(d.original_price_inr ?? 0),
        price: Number(d.price_inr ?? 0),
        image: d.image_url || "",
        downloadUrl: d.download_url || "",
        description: d.description || "",
        status: "active",
      }));
    }
    console.error("❌ Supabase exam_dumps fetch failed, falling back:", error?.message);
  }
  try {
    const response = await fetch(PROXY_URL, {
      method: "GET",
    });

    if (!response.ok) return [];

    const data = await response.json();
    let dumps: ExamDump[] = [];

    if (data.dumps && Array.isArray(data.dumps)) {
      dumps = data.dumps;
    } else if (Array.isArray(data)) {
      dumps = data;
    }

    return dumps.map((dump: any) => ({
      id: dump.id || `dump-${Date.now()}`,
      title: dump.title || '',
      provider: dump.provider || '',
      originalPrice: parseFloat(dump.originalPrice ?? dump.originalprice ?? 0),
      price: parseFloat(dump.price ?? 0),
      image: dump.image || '',
      downloadUrl: dump.downloadUrl || dump.downloadurl || '',
      description: dump.description || '',
      status: dump.status || 'active',
    }));

  } catch (error) {
    console.error("❌ Error fetching exam dumps:", error);
    return [];
  }
}

/**
 * Submit exam dump to Google Sheets
 */
export async function submitExamDump(dump: Omit<ExamDump, 'id' | 'status'>): Promise<void> {
  try {
    await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...dump,
        action: 'add',
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('❌ Error submitting exam dump:', error);
    throw error;
  }
}

/**
 * Update an existing exam dump
 */
export async function updateExamDump(id: string, data: Partial<ExamDump>): Promise<void> {
  try {
    await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        id,
        action: 'update'
      }),
    });
  } catch (error) {
    console.error('❌ Error updating exam dump:', error);
    throw error;
  }
}

/**
 * Delete an exam dump (soft delete)
 */
export async function deleteExamDump(id: string): Promise<void> {
  try {
    await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        action: 'delete'
      }),
    });
  } catch (error) {
    console.error('❌ Error deleting exam dump:', error);
    throw error;
  }
}
