import { supabase } from "@/lib/supabase";
import { createResumeRequest } from "@/lib/resume-api";

/** Job profile + selected-jobs → tailored-resume pipeline. */

export interface JobProfile {
  full_name: string;
  resume_path: string;
  roles: string;
}

export async function getJobProfile(): Promise<JobProfile | null> {
  const { data } = await supabase
    .from("job_profiles")
    .select("full_name, resume_path, roles")
    .maybeSingle();
  return (data as JobProfile) || null;
}

export async function saveJobProfile(p: JobProfile): Promise<boolean> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return false;
  const { error } = await supabase
    .from("job_profiles")
    .upsert({ user_id: auth.user.id, ...p, updated_at: new Date().toISOString() });
  return !error;
}

export interface ApplicationRow {
  id: string;
  job_id: string;
  resume_request_id: string | null;
  job_postings: {
    title: string;
    location: string;
    apply_url: string;
    job_companies: { name: string; website: string | null; contact_email: string | null } | null;
  } | null;
  resume_requests: { status: string; docx_path: string | null; pdf_path: string | null } | null;
}

export async function listApplications(): Promise<ApplicationRow[]> {
  const { data } = await supabase
    .from("job_applications")
    .select(
      "id, job_id, resume_request_id, job_postings(title, location, apply_url, job_companies(name, website, contact_email)), resume_requests(status, docx_path, pdf_path)"
    )
    .order("created_at", { ascending: false });
  return (data as unknown as ApplicationRow[]) || [];
}

export async function selectedJobIds(): Promise<Set<string>> {
  const { data } = await supabase.from("job_applications").select("job_id");
  return new Set(((data as { job_id: string }[]) || []).map((r) => r.job_id));
}

export async function toggleJobSelection(jobId: string, on: boolean): Promise<boolean> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return false;
  if (on) {
    const { error } = await supabase
      .from("job_applications")
      .insert({ user_id: auth.user.id, job_id: jobId });
    return !error;
  }
  const { error } = await supabase
    .from("job_applications")
    .delete()
    .eq("job_id", jobId)
    .is("resume_request_id", null);
  return !error;
}

export async function removeApplication(id: string): Promise<boolean> {
  const { error } = await supabase.from("job_applications").delete().eq("id", id);
  return !error;
}

/** Queue one tailored resume per selected job that has none yet. */
export async function buildSelected(profile: JobProfile): Promise<number> {
  const apps = await listApplications();
  const pending = apps.filter((a) => !a.resume_request_id && a.job_postings);
  let built = 0;
  for (const app of pending.slice(0, 10)) {
    const { data: jd } = await supabase
      .from("job_postings")
      .select("title, description, job_companies(name)")
      .eq("id", app.job_id)
      .single();
    if (!jd) continue;
    const row = jd as unknown as {
      title: string;
      description: string;
      job_companies: { name: string } | null;
    };
    const result = await createResumeRequest({
      fullName: profile.full_name,
      email: "",
      inputText: "",
      jdText: `Role: ${row.title} at ${row.job_companies?.name || ""}\n\n${row.description}`,
      inputFilePath: profile.resume_path,
    });
    if ("error" in result) break; // active cap reached — rest build next round
    await supabase
      .from("job_applications")
      .update({ resume_request_id: result.id })
      .eq("id", app.id);
    built++;
  }
  return built;
}

/** mailto draft for one application (in-app OAuth sending is phase 4). */
export function applicationMailto(app: ApplicationRow, profile: JobProfile): string | null {
  const email = app.job_postings?.job_companies?.contact_email;
  if (!email) return null;
  const title = app.job_postings?.title || "the open role";
  const company = app.job_postings?.job_companies?.name || "";
  const subject = encodeURIComponent(`Application for ${title} — ${profile.full_name}`);
  const body = encodeURIComponent(
    `Hi ${company} team,\n\nI came across the ${title} opening and it fits my background well. My tailored resume is attached.\n\nLooking forward to hearing from you.\n\n${profile.full_name}`
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}
