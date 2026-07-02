/**
 * Exam Dumps service — Supabase `exam_dumps` table.
 * Reads published dumps; admin CRUD is enforced by RLS.
 */

import { supabase } from "@/lib/supabase";

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


/**
 * Fetch published exam dumps.
 */
export async function fetchExamDumps(): Promise<ExamDump[]> {
  const { data, error } = await supabase
    .from("exam_dumps")
    .select("id,title,provider,original_price_inr,price_inr,image_url,download_url,file_path,description,status")
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (error || !data) {
    console.error("❌ Supabase exam_dumps fetch failed:", error?.message);
    return [];
  }
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

/** Map the UI shape → DB columns. */
function toRow(dump: Partial<ExamDump>) {
  const row: Record<string, unknown> = {};
  if (dump.title !== undefined) row.title = dump.title;
  if (dump.provider !== undefined) row.provider = dump.provider.toUpperCase();
  if (dump.originalPrice !== undefined) row.original_price_inr = dump.originalPrice;
  if (dump.price !== undefined) row.price_inr = dump.price;
  if (dump.image !== undefined) row.image_url = dump.image;
  if (dump.downloadUrl !== undefined) row.download_url = dump.downloadUrl;
  if (dump.description !== undefined) row.description = dump.description;
  return row;
}

/**
 * Add an exam dump (admin — enforced by RLS).
 */
export async function submitExamDump(dump: Omit<ExamDump, 'id' | 'status'>): Promise<void> {
  const { error } = await supabase.from('exam_dumps').insert({ ...toRow(dump), status: 'published' });
  if (error) {
    console.error('❌ Error submitting exam dump:', error.message);
    throw new Error(error.message);
  }
}

/**
 * Update an existing exam dump (admin — enforced by RLS).
 */
export async function updateExamDump(id: string, data: Partial<ExamDump>): Promise<void> {
  const { error } = await supabase.from('exam_dumps').update(toRow(data)).eq('id', id);
  if (error) {
    console.error('❌ Error updating exam dump:', error.message);
    throw new Error(error.message);
  }
}

/**
 * Delete an exam dump (soft delete → archived; admin — enforced by RLS).
 */
export async function deleteExamDump(id: string): Promise<void> {
  const { error } = await supabase.from('exam_dumps').update({ status: 'archived' }).eq('id', id);
  if (error) {
    console.error('❌ Error deleting exam dump:', error.message);
    throw new Error(error.message);
  }
}
