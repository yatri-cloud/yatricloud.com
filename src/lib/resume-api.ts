import { supabase } from "@/lib/supabase";

/**
 * Resume maker queue. The site only inserts and reads own rows (RLS);
 * a local worker with the service role does the building.
 */

export interface ResumeRequest {
  id: string;
  full_name: string;
  email: string;
  input_text: string;
  jd_text: string;
  status: "queued" | "processing" | "ready" | "failed";
  error: string | null;
  docx_path: string | null;
  pdf_path: string | null;
  created_at: string;
}

/** Upload a source resume (PDF/DOCX) into the caller's private folder. */
export async function uploadResumeSource(
  file: File
): Promise<{ path: string } | { error: string }> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return { error: "not signed in" };
  const ext = file.name.toLowerCase().endsWith(".pdf") ? "pdf" : "docx";
  const path = `${auth.user.id}/${crypto.randomUUID()}/source.${ext}`;
  const { error } = await supabase.storage.from("resumes").upload(path, file, {
    contentType:
      ext === "pdf"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  if (error) return { error: error.message };
  return { path };
}

export async function createResumeRequest(input: {
  fullName: string;
  email: string;
  inputText: string;
  jdText: string;
  inputFilePath?: string | null;
}): Promise<{ id: string } | { error: string }> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return { error: "not signed in" };
  const { data, error } = await supabase
    .from("resume_requests")
    .insert({
      user_id: auth.user.id,
      full_name: input.fullName,
      email: input.email,
      input_text: input.inputText,
      jd_text: input.jdText,
      input_file_path: input.inputFilePath || null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  return { id: (data as { id: string }).id };
}

export async function listMyResumeRequests(): Promise<ResumeRequest[]> {
  const { data, error } = await supabase
    .from("resume_requests")
    .select(
      "id, full_name, email, input_text, jd_text, status, error, docx_path, pdf_path, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) return [];
  return (data || []) as ResumeRequest[];
}

/** Signed URL for a finished file (owner-only via storage RLS). */
export async function resumeDownloadUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("resumes")
    .createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}
