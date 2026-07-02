/**
 * Yatri Cloud — Training data-access layer (Supabase).
 *
 * Replaces the legacy Google Apps Script backend (VITE_TRAINING_SCRIPT_URL).
 * Every function here talks to the already-migrated Supabase tables:
 *   trainings · training_enrollments · course_modules · course_lessons
 *   trainer_applications · profiles
 *
 * The UI shapes (Course / Enrollment / TrainerApplication / …) are preserved
 * exactly so no page/component markup or copy needs to change — only the data
 * source. Fields that have no column in the Supabase schema (skills, outcomes,
 * level, instructor-profiles, google-drive folders, google-meet auto links,
 * quizzes) are defaulted on read and dropped on write; those limitations are
 * documented in the migration notes.
 */

import { supabase } from "@/lib/supabase";
import { getCachedUser } from "@/lib/auth";

// ---------------------------------------------------------------------------
// Provider enum helpers
// ---------------------------------------------------------------------------

/** Display-cased provider labels shown in the UI. */
export const PROVIDERS_DISPLAY = [
  "AWS", "Azure", "GCP", "GitHub", "Oracle", "Salesforce",
  "ServiceNow", "OpenAI", "HashiCorp", "Kubernetes", "Other",
];

/** Map a free-text provider/track label to the provider_t enum value. */
function toProviderEnum(s: string | null | undefined): string {
  const x = String(s || "").toUpperCase();
  for (const p of ["AWS", "AZURE", "GCP", "GITHUB", "ORACLE", "SALESFORCE", "SERVICENOW", "OPENAI", "HASHICORP", "KUBERNETES"]) {
    if (x.includes(p) || (p === "GCP" && x.includes("GOOGLE"))) return p;
  }
  return "OTHER";
}

// ---------------------------------------------------------------------------
// Shared shapes (structurally match the callers' local interfaces)
// ---------------------------------------------------------------------------

export interface Course {
  id: string;
  courseName: string;
  description: string;
  instructor: string;
  instructorId?: string;
  level: string;
  duration: string;
  paymentType: "Free" | "Paid";
  price: string;
  thumbnailUrl: string;
  subType: string;
  mode: "Online" | "On-site";
  skills: string;
  outcomes: string;
  modulesCount: number;
  status: "Draft" | "Published";
  timestamp: string;
  folderUrl: string;
  venue?: string;
  capacity?: string;
  startDate?: string;
  startTime?: string;
  meetLink?: string;
  resources?: any[];
}

const createSlug = (name: string) =>
  String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");

const statusToDb = (s?: string) => (s === "Published" ? "published" : "draft");
const statusFromDb = (s?: string): "Draft" | "Published" =>
  s === "published" ? "Published" : "Draft";

/** Map a trainings row → the legacy Course shape used across the public UI. */
function rowToCourse(row: any, modulesCount = 0): Course {
  const priceNum = Number(row.price_inr) || 0;
  const isPaid = priceNum > 0;
  const mode: "Online" | "On-site" = row.mode === "online" ? "Online" : "On-site";
  return {
    id: row.id,
    courseName: row.course_title || row.name || "",
    description: row.description || "",
    instructor: row.trainer_name || "",
    instructorId: row.trainer_id || "",
    level: "All Levels",
    duration: row.duration_hours ? `${row.duration_hours} hours` : "",
    paymentType: isPaid ? "Paid" : "Free",
    price: isPaid ? `₹${priceNum}` : "Free",
    thumbnailUrl: row.image_url || "",
    subType: row.name || "",
    mode,
    skills: "",
    outcomes: "",
    modulesCount,
    status: statusFromDb(row.status),
    timestamp: row.created_at || "",
    folderUrl: "",
    venue: row.city || "",
    startDate: row.start_date || undefined,
    startTime: row.start_time || undefined,
    meetLink: row.meet_link || undefined,
    resources: Array.isArray(row.resources) ? row.resources : [],
  };
}

// ---------------------------------------------------------------------------
// Public catalog
// ---------------------------------------------------------------------------

/** All published (and archived) trainings for the public catalog. */
export async function listPublishedTrainings(): Promise<Course[]> {
  const { data, error } = await supabase
    .from("trainings")
    .select("*")
    .in("status", ["published", "archived"])
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((r) => rowToCourse(r));
}

/** A single training with its module count (public detail / dashboard). */
export async function getTrainingDetail(id: string): Promise<Course | null> {
  const { data, error } = await supabase
    .from("trainings")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { count } = await supabase
    .from("course_modules")
    .select("id", { count: "exact", head: true })
    .eq("training_id", id);
  return rowToCourse(data, count || 0);
}

// ---------------------------------------------------------------------------
// Enrollments
// ---------------------------------------------------------------------------

/**
 * Enroll the current user in a training.
 * RLS requires an authenticated session (user_id = auth.uid()).
 */
export async function enroll(input: {
  trainingId: string;
  email: string;
  paymentId?: string;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in to enroll.");

  const { error } = await supabase.from("training_enrollments").insert({
    training_id: input.trainingId,
    user_id: user.id,
    email: input.email.trim().toLowerCase(),
    status: "enrolled",
    payment_id: input.paymentId || null,
  });

  // Unique (training_id, email) — already enrolled counts as success.
  if (error && (error as any).code !== "23505") throw error;
}

/** Is the current user enrolled in a training? */
export async function checkEnrollment(trainingId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data, error } = await supabase
    .from("training_enrollments")
    .select("id")
    .eq("training_id", trainingId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) return false;
  return !!data;
}

/** The current user's enrollments + a map of their trainings (My Trainings). */
export async function listMyEnrollments(): Promise<{
  enrollments: any[];
  trainings: Record<string, any>;
}> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { enrollments: [], trainings: {} };

  const { data, error } = await supabase
    .from("training_enrollments")
    .select("*, trainings(*)")
    .eq("user_id", user.id)
    .order("enrolled_at", { ascending: false });
  if (error) throw error;

  const enrollments: any[] = [];
  const trainings: Record<string, any> = {};
  for (const e of data || []) {
    const t = e.trainings;
    enrollments.push({
      trainingId: e.training_id,
      trainingName: t ? (t.course_title || t.name) : "",
      status: e.status,
      paymentStatus: e.payment_id ? "Paid" : "Free",
      amount: "",
      currency: "INR",
      timestamp: e.enrolled_at,
      userEmail: e.email,
    });
    if (t) trainings[e.training_id] = rowToCourse(t);
  }
  return { enrollments, trainings };
}

/** Admin: all enrollments with student + course details. */
export async function listAllEnrollments(): Promise<any[]> {
  const { data, error } = await supabase
    .from("training_enrollments")
    .select("*, trainings(name, course_title), profiles(full_name, city, phone_number)")
    .order("enrolled_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((e: any) => ({
    rowIndex: e.id,
    timestamp: e.enrolled_at,
    trainingName: e.trainings ? (e.trainings.course_title || e.trainings.name) : "",
    userName: e.profiles?.full_name || e.email,
    userEmail: e.email,
    userPhone: e.profiles?.phone_number || "",
    city: e.profiles?.city || "",
    status: e.status === "enrolled" ? "Enrolled"
      : e.status ? e.status.charAt(0).toUpperCase() + e.status.slice(1) : "",
    paymentStatus: e.payment_id ? "Paid" : "Free",
    amount: "",
  }));
}

/** Admin: delete an enrollment by its id. */
export async function deleteEnrollment(id: string): Promise<void> {
  const { error } = await supabase.from("training_enrollments").delete().eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Trainer applications
// ---------------------------------------------------------------------------

/** Public: submit a trainer application (BecomeTrainer form). */
export async function submitTrainerApplication(input: {
  fullName: string;
  email: string;
  countryCode?: string;
  phoneNumber?: string;
  linkedinUrl?: string;
  expertise?: string;
  certificationProvider?: string;
  credentialsLinks?: string;
  yearsOfExperience?: string;
  motivation?: string;
  resumeFile?: File | null;
}): Promise<void> {
  let resumeUrl = "";
  if (input.resumeFile) {
    try {
      const path = `trainer-resumes/${Date.now()}-${input.resumeFile.name.replace(/[^\w.-]+/g, "_")}`;
      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(path, input.resumeFile, { upsert: true });
      if (!upErr) {
        resumeUrl = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
      }
    } catch { /* resume upload best-effort */ }
  }

  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("trainer_applications").insert({
    user_id: user?.id || null,
    name: input.fullName,
    email: input.email.trim().toLowerCase(),
    phone: [input.countryCode, input.phoneNumber].filter(Boolean).join(" ") || null,
    expertise: input.expertise || null,
    linkedin_url: input.linkedinUrl || null,
    resume_url: resumeUrl || null,
    status: "pending",
    details: {
      countryCode: input.countryCode || "",
      phoneNumber: input.phoneNumber || "",
      certificationProvider: input.certificationProvider || "",
      credentialsLinks: input.credentialsLinks || "",
      yearsOfExperience: input.yearsOfExperience || "",
      motivation: input.motivation || "",
    },
  });
  if (error) throw error;
}

const capitalize = (s?: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

/** Admin: all trainer applications. */
export async function listTrainerApplications(): Promise<any[]> {
  const { data, error } = await supabase
    .from("trainer_applications")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((a: any) => {
    const d = a.details || {};
    return {
      id: a.id,
      timestamp: a.created_at,
      fullName: a.name,
      email: a.email,
      countryCode: d.countryCode || "",
      phoneNumber: d.phoneNumber || a.phone || "",
      linkedinUrl: a.linkedin_url || "",
      expertise: a.expertise || "",
      yearsOfExperience: d.yearsOfExperience || "",
      motivation: d.motivation || "",
      status: capitalize(a.status),
      adminNotes: "",
      resumeUrl: a.resume_url || "",
      certificationProvider: d.certificationProvider || "",
      credentialsLinks: d.credentialsLinks || "",
    };
  });
}

/** Admin: all approved trainers (profiles with role='trainer'). */
export async function listApprovedTrainers(): Promise<any[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "trainer")
    .order("created_at", { ascending: false });
  if (error) throw error;

  // Enrich expertise from the trainer's application (matched by email).
  const emails = (data || []).map((p: any) => p.email).filter(Boolean);
  const expertiseByEmail: Record<string, string> = {};
  if (emails.length) {
    const { data: apps } = await supabase
      .from("trainer_applications")
      .select("email, expertise")
      .in("email", emails);
    for (const a of apps || []) expertiseByEmail[a.email] = a.expertise || "";
  }

  return (data || []).map((p: any) => ({
    trainerId: p.id,
    email: p.email,
    fullName: p.full_name || "",
    phone: p.phone_number || "",
    linkedIn: p.linkedin_url || "",
    expertise: expertiseByEmail[p.email] || "",
    status: "Approved",
    createdDate: p.created_at,
  }));
}

/** Admin: update an application's status (Approved/Rejected/Pending). */
export async function updateApplicationStatus(email: string, status: string): Promise<void> {
  const { error } = await supabase
    .from("trainer_applications")
    .update({ status: status.toLowerCase() })
    .eq("email", email.trim().toLowerCase());
  if (error) throw error;
}

/** Admin: approve a trainer — set application approved + promote profile role. */
export async function approveTrainer(email: string): Promise<void> {
  const e = email.trim().toLowerCase();
  const { error: appErr } = await supabase
    .from("trainer_applications")
    .update({ status: "approved" })
    .eq("email", e);
  if (appErr) throw appErr;

  const { data: profile } = await supabase
    .from("profiles").select("id").eq("email", e).maybeSingle();
  if (profile) {
    const { error: roleErr } = await supabase
      .from("profiles").update({ role: "trainer" }).eq("id", profile.id);
    if (roleErr) throw roleErr;
  }
}

/** Admin: reject an application — mark rejected + revoke trainer role. */
export async function rejectTrainerApplication(email: string): Promise<void> {
  const e = email.trim().toLowerCase();
  const { error: appErr } = await supabase
    .from("trainer_applications")
    .update({ status: "rejected" })
    .eq("email", e);
  if (appErr) throw appErr;

  const { data: profile } = await supabase
    .from("profiles").select("id, role").eq("email", e).maybeSingle();
  if (profile && profile.role === "trainer") {
    await supabase.from("profiles").update({ role: "yatri" }).eq("id", profile.id);
  }
}

/** Admin: delete a trainer application. */
export async function deleteTrainerApplication(email: string): Promise<void> {
  const { error } = await supabase
    .from("trainer_applications")
    .delete()
    .eq("email", email.trim().toLowerCase());
  if (error) throw error;
}

/** Admin: "delete" a trainer — demote their profile role back to yatri. */
export async function deleteTrainer(trainerId: string): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ role: "yatri" })
    .eq("id", trainerId);
  if (error) throw error;
}

// Instructor profiles, Google-Meet access and course assignments were
// Sheets/Drive/Calendar-only features with no Supabase table. They resolve as
// no-ops so the existing admin UI keeps working without behavioural surprises.
export async function listInstructorProfiles(): Promise<any[]> {
  return [];
}
export async function updateInstructorProfile(_profile: any): Promise<void> {
  return;
}
export async function grantMeetAccess(_input: { trainerEmail: string; trainingId: string }): Promise<{ meetLink?: string }> {
  return {};
}
export async function assignTrainerToCourse(_input: any): Promise<void> {
  return;
}

// ---------------------------------------------------------------------------
// Providers (derived from the provider_t enum + distinct training course titles)
// ---------------------------------------------------------------------------

export interface ProviderData {
  type: string;
  name: string;
  exams: string[];
  exists?: boolean;
}

/** Provider list = enum labels, each with the exams (course titles) seen in trainings. */
export async function listProviders(): Promise<ProviderData[]> {
  const { data } = await supabase
    .from("trainings")
    .select("name, course_title, provider");

  const examsByProvider: Record<string, Set<string>> = {};
  for (const label of PROVIDERS_DISPLAY) examsByProvider[label] = new Set();

  for (const row of data || []) {
    // Prefer the human track label stored in `name`; fall back to enum display.
    const label = PROVIDERS_DISPLAY.find(
      (p) => toProviderEnum(p) === toProviderEnum(row.name || row.provider),
    ) || "Other";
    const exam = row.course_title || row.name;
    if (exam) examsByProvider[label].add(exam);
  }

  return PROVIDERS_DISPLAY.map((label) => ({
    type: "Certification",
    name: label,
    exams: Array.from(examsByProvider[label] || []),
    exists: true,
  }));
}

/** Folder-picker helper: providers when no provider given, else that provider's exams. */
export async function getFoldersInPath(_type: string, provider?: string): Promise<string[]> {
  if (!provider) return [...PROVIDERS_DISPLAY];
  const providers = await listProviders();
  return providers.find((p) => p.name === provider)?.exams || [];
}

// Provider add/update/delete have no backing table (provider is an enum column,
// not a managed entity). They resolve as no-ops to preserve the admin UI.
export async function addProvider(_input: any): Promise<void> { return; }
export async function updateProvider(_input: any): Promise<void> { return; }
export async function deleteProvider(_input: any): Promise<void> { return; }

// ---------------------------------------------------------------------------
// Training CRUD (admin + trainer)
// ---------------------------------------------------------------------------

async function uploadThumbnail(base64: string, mimeType: string): Promise<string> {
  const ext = (mimeType.split("/")[1] || "png").replace(/[^\w]+/g, "");
  const byteChars = atob(base64);
  const bytes = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
  const blob = new Blob([bytes], { type: mimeType });
  const path = `trainings/${Date.now()}-thumb.${ext}`;
  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, blob, { upsert: true, contentType: mimeType });
  if (error) throw error;
  return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
}

export interface TrainingInput {
  subType?: string;
  courseName?: string;
  description?: string;
  instructorId?: string;
  instructor?: string;
  duration?: string;
  mode?: "Online" | "On-site";
  venueName?: string;
  capacityType?: string;
  capacityCount?: string;
  paymentType?: string;
  price?: string;
  startDate?: string;
  startTime?: string;
  thumbnailBase64?: string;
  thumbnailMimeType?: string;
  curriculum?: { title: string; lessons: { title: string; type: string; duration: string }[] }[];
  resources?: any[];
  status?: "Draft" | "Published";
}

function inputToRow(input: TrainingInput): Record<string, any> {
  const trackLabel = input.subType || input.courseName || "Training";
  const price = Number(input.price) || 0;
  const durHours = parseFloat(String(input.duration || "").replace(/[^\d.]/g, ""));
  const row: Record<string, any> = {
    name: trackLabel,
    course_title: input.courseName || null,
    provider: toProviderEnum(input.subType),
    description: input.description || null,
    trainer_id: input.instructorId || null,
    trainer_name: input.instructor || null,
    duration_hours: isNaN(durHours) ? null : durHours,
    mode: input.mode === "On-site" ? "offline" : "online",
    city: input.mode === "On-site" ? (input.venueName || null) : null,
    max_capacity: input.capacityType === "Limited" ? (Number(input.capacityCount) || null) : null,
    price_inr: input.paymentType === "Paid" ? price : 0,
    start_date: input.startDate || null,
    start_time: input.startTime || null,
    resources: Array.isArray(input.resources) ? input.resources : [],
    status: statusToDb(input.status),
  };
  return row;
}

/** Persist a curriculum (modules + lessons) for a training, replacing existing. */
async function saveCurriculum(
  trainingId: string,
  curriculum?: { title: string; lessons: { title: string; type: string; duration: string }[] }[],
): Promise<void> {
  if (!curriculum) return;
  await supabase.from("course_modules").delete().eq("training_id", trainingId);
  let mi = 0;
  for (const mod of curriculum) {
    const { data: modRow, error } = await supabase
      .from("course_modules")
      .insert({ training_id: trainingId, name: mod.title || `Module ${mi + 1}`, sort_order: mi })
      .select("id")
      .single();
    if (error || !modRow) { mi++; continue; }
    const lessons = (mod.lessons || []).map((l, li) => ({
      module_id: modRow.id,
      name: l.title || `Lesson ${li + 1}`,
      content: { type: l.type || "Video", duration: l.duration || "" },
      sort_order: li,
    }));
    if (lessons.length) await supabase.from("course_lessons").insert(lessons);
    mi++;
  }
}

/** Create a training (admin or trainer). Returns the new id. */
export async function createTraining(input: TrainingInput): Promise<string> {
  const row = inputToRow(input);
  if (input.thumbnailBase64 && input.thumbnailMimeType) {
    try { row.image_url = await uploadThumbnail(input.thumbnailBase64, input.thumbnailMimeType); }
    catch { /* image optional */ }
  }
  row.slug = `${createSlug(input.courseName || input.subType || "training") || "training"}-${Date.now().toString(36)}`;

  const { data, error } = await supabase.from("trainings").insert(row).select("id").single();
  if (error || !data) throw error || new Error("Create failed");
  await saveCurriculum(data.id, input.curriculum);
  return data.id;
}

/** Update an existing training. */
export async function updateTraining(id: string, input: TrainingInput): Promise<void> {
  const row = inputToRow(input);
  if (input.thumbnailBase64 && input.thumbnailMimeType) {
    try { row.image_url = await uploadThumbnail(input.thumbnailBase64, input.thumbnailMimeType); }
    catch { /* image optional */ }
  }
  const { error } = await supabase.from("trainings").update(row).eq("id", id);
  if (error) throw error;
  if (input.curriculum) await saveCurriculum(id, input.curriculum);
}

/** Load a training into the admin/trainer edit-form shape (populateForm). */
export async function getTrainingForEdit(id: string): Promise<any | null> {
  const { data, error } = await supabase
    .from("trainings").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { data: mods } = await supabase
    .from("course_modules")
    .select("id, name, sort_order, course_lessons(name, content, sort_order)")
    .eq("training_id", id)
    .order("sort_order", { ascending: true });

  const curriculum = (mods || []).map((m: any) => ({
    title: m.name,
    lessons: (m.course_lessons || [])
      .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
      .map((l: any) => ({
        title: l.name,
        type: l.content?.type || "Video",
        duration: l.content?.duration || "",
      })),
  }));

  const priceNum = Number(data.price_inr) || 0;
  return {
    id: data.id,
    type: "Certification",
    subType: data.name || "",
    courseName: data.course_title || "",
    description: data.description || "",
    instructor: data.trainer_id || "",
    level: "Beginner",
    duration: data.duration_hours ? `${data.duration_hours}` : "",
    skills: "",
    outcomes: "",
    curriculum,
    mode: data.mode === "online" ? "Online" : "On-site",
    venueName: data.mode !== "online" ? (data.city || "") : "",
    venueAddress: "",
    venueMapLink: "",
    capacityType: data.max_capacity ? "Limited" : "Unlimited",
    capacityCount: data.max_capacity ? String(data.max_capacity) : "",
    paymentType: priceNum > 0 ? "Paid" : "Free",
    price: priceNum > 0 ? String(priceNum) : "",
    currency: "INR",
    couponCode: "",
    startDate: data.start_date || "",
    startTime: data.start_time || "",
    thumbnail: data.image_url || "",
    resources: Array.isArray(data.resources) ? data.resources : [],
  };
}

/** Admin: every training (drafts + published), list shape. */
export async function listAllTrainings(): Promise<Course[]> {
  const { data, error } = await supabase
    .from("trainings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((r) => rowToCourse(r));
}

/** Trainer: only trainings owned by this trainer. */
export async function listTrainerTrainings(trainerId: string): Promise<Course[]> {
  const { data, error } = await supabase
    .from("trainings")
    .select("*")
    .eq("trainer_id", trainerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((r) => rowToCourse(r));
}

/** Delete a training (RLS: admins only). */
export async function deleteTraining(id: string): Promise<void> {
  const { error } = await supabase.from("trainings").delete().eq("id", id);
  if (error) throw error;
}

/** Update a training's schedule. Returns the (existing) meet link, if any. */
export async function updateTrainingSchedule(
  id: string, startDate: string, startTime: string,
): Promise<{ meetLink?: string }> {
  const { data, error } = await supabase
    .from("trainings")
    .update({ start_date: startDate, start_time: startTime })
    .eq("id", id)
    .select("meet_link")
    .single();
  if (error) throw error;
  return { meetLink: data?.meet_link || undefined };
}

// ---------------------------------------------------------------------------
// Trainer login (Supabase role check)
// ---------------------------------------------------------------------------

/**
 * Verify trainer access for the currently signed-in Supabase user.
 * Requires an active Supabase session whose profile role is 'trainer'.
 * (Replaces the Sheets `verifyTrainerAccess` action; Google auto-provisioning
 * of trainer rows is no longer needed — role is managed in `profiles`.)
 */
export async function verifyTrainerAccess(email?: string): Promise<{
  trainer: { trainerId: string; fullName: string; email: string; phone: string; expertise: string };
  assignments: any[];
}> {
  const user = getCachedUser();
  if (!user || !user.id) {
    throw new Error("Please sign in to Yatri Cloud first, then continue.");
  }
  if (user.role !== "trainer") {
    throw new Error("Access denied. You might not be an approved trainer.");
  }
  if (email && email.trim().toLowerCase() !== (user.email || "").toLowerCase()) {
    throw new Error("This Google account doesn't match your Yatri Cloud sign-in.");
  }

  // Expertise (best-effort) from the trainer's application.
  let expertise = "";
  const { data: app } = await supabase
    .from("trainer_applications")
    .select("expertise")
    .eq("email", (user.email || "").toLowerCase())
    .maybeSingle();
  if (app) expertise = app.expertise || "";

  return {
    trainer: {
      trainerId: user.id,
      fullName: user.fullName || "",
      email: user.email,
      phone: user.phoneNumber || "",
      expertise,
    },
    assignments: [],
  };
}

// ---------------------------------------------------------------------------
// Trainer course editor (modules / lessons / resources / live session)
// ---------------------------------------------------------------------------

/** Load editor content: modules, resources, live-session. Quizzes have no table. */
export async function getCourseContent(courseId: string): Promise<{
  modules: any[];
  quizzes: any[];
  resources: any[];
  liveSession: { mode: "Online" | "On-site"; startDate: string; startTime: string; meetLink: string };
}> {
  const { data: training } = await supabase
    .from("trainings")
    .select("mode, start_date, start_time, meet_link, resources")
    .eq("id", courseId)
    .maybeSingle();

  const { data: mods } = await supabase
    .from("course_modules")
    .select("id, name, sort_order, course_lessons(id, name, content, sort_order)")
    .eq("training_id", courseId)
    .order("sort_order", { ascending: true });

  const modules = (mods || []).map((m: any, i: number) => ({
    moduleId: m.id,
    moduleName: m.name,
    order: m.sort_order ?? i + 1,
    lessons: (m.course_lessons || [])
      .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
      .map((l: any, li: number) => ({
        lessonId: l.id,
        lessonTitle: l.name,
        duration: l.content?.duration || "",
        contentType: l.content?.type || "video",
        contentUrl: l.content?.url || "",
        description: l.content?.description || "",
        order: l.sort_order ?? li + 1,
      })),
  }));

  const resources = (Array.isArray(training?.resources) ? training!.resources : []).map((r: any) => ({
    resourceId: r.id || r.resourceId || `RES${Date.now()}`,
    title: r.name || r.title || "",
    type: r.type || "link",
    url: r.url || "",
  }));

  return {
    modules,
    quizzes: [],
    resources,
    liveSession: {
      mode: training?.mode === "offline" ? "On-site" : "Online",
      startDate: training?.start_date || "",
      startTime: training?.start_time || "",
      meetLink: training?.meet_link || "",
    },
  };
}

/** Save editor content: replace modules/lessons, update resources + live session. */
export async function saveCourseContent(input: {
  courseId: string;
  modules: any[];
  resources: any[];
  liveSession: { mode: "Online" | "On-site"; startDate: string; startTime: string; meetLink: string };
}): Promise<void> {
  // Modules + lessons: replace wholesale.
  await supabase.from("course_modules").delete().eq("training_id", input.courseId);
  let mi = 0;
  for (const mod of input.modules || []) {
    const { data: modRow, error } = await supabase
      .from("course_modules")
      .insert({ training_id: input.courseId, name: mod.moduleName || `Module ${mi + 1}`, sort_order: mod.order ?? mi })
      .select("id")
      .single();
    if (error || !modRow) { mi++; continue; }
    const lessons = (mod.lessons || []).map((l: any, li: number) => ({
      module_id: modRow.id,
      name: l.lessonTitle || `Lesson ${li + 1}`,
      content: {
        type: l.contentType || "video",
        url: l.contentUrl || "",
        duration: l.duration || "",
        description: l.description || "",
      },
      sort_order: l.order ?? li,
    }));
    if (lessons.length) await supabase.from("course_lessons").insert(lessons);
    mi++;
  }

  // Resources + live session on the training row.
  const resources = (input.resources || []).map((r: any) => ({
    id: r.resourceId || r.id || `RES${Date.now()}`,
    name: r.title || r.name || "",
    type: r.type || "link",
    url: r.url || "",
    description: r.description || "",
  }));
  const ls = input.liveSession;
  await supabase.from("trainings").update({
    resources,
    mode: ls?.mode === "On-site" ? "offline" : "online",
    start_date: ls?.startDate || null,
    start_time: ls?.startTime || null,
    meet_link: ls?.meetLink || null,
  }).eq("id", input.courseId);
}

/** Submit a course for approval — no review status in the schema, so a no-op. */
export async function submitCourseForApproval(_input: { courseId: string }): Promise<void> {
  return;
}

/** Upload a resource file to the public product-images bucket; returns its URL. */
export async function uploadResource(file: File): Promise<string> {
  const path = `trainings/${Date.now()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { upsert: true });
  if (error) throw error;
  return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
}
