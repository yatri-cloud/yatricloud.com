import { supabase } from "@/lib/supabase";

/** Resume-to-jobs matching queue (built by the Mac worker). */

export interface JobMatchResult {
  roles?: string[];
  level?: string;
  summary?: string;
  job_ids?: string[];
}

export interface JobMatchRequest {
  id: string;
  resume_path: string;
  status: "queued" | "processing" | "ready" | "failed";
  result: JobMatchResult | null;
  error: string | null;
  created_at: string;
}

export async function createJobMatch(
  resumePath: string
): Promise<{ id: string } | { error: string }> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return { error: "not signed in" };
  const { data, error } = await supabase
    .from("job_match_requests")
    .insert({ user_id: auth.user.id, resume_path: resumePath })
    .select("id")
    .single();
  if (error) return { error: error.message };
  return { id: (data as { id: string }).id };
}

export async function latestJobMatch(): Promise<JobMatchRequest | null> {
  const { data } = await supabase
    .from("job_match_requests")
    .select("id, resume_path, status, result, error, created_at")
    .order("created_at", { ascending: false })
    .limit(1);
  return ((data || [])[0] as JobMatchRequest) || null;
}

export async function deleteJobMatch(id: string): Promise<boolean> {
  const { error } = await supabase.from("job_match_requests").delete().eq("id", id);
  return !error;
}
