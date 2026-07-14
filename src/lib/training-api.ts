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
import { getCachedUser, fetchMyProfile } from "@/lib/auth";
import { getFormProviders } from "@/lib/cert-catalog";

// ---------------------------------------------------------------------------
// Provider enum helpers
// ---------------------------------------------------------------------------

/** Display-cased provider labels shown in the UI (fallback list). */
export const PROVIDERS_DISPLAY = [
  "AWS", "Azure", "GCP", "GitHub", "Oracle", "Salesforce",
  "ServiceNow", "OpenAI", "HashiCorp", "Kubernetes", "Other",
];

/**
 * Display labels sourced from the certification catalog. Known providers
 * keep the exact casing above (matched by enum value) so nothing on screen
 * changes; providers added to the catalog later appear with their label.
 * Always ends with "Other" and never throws.
 */
async function providerDisplayLabels(): Promise<string[]> {
  try {
    const forms = await getFormProviders();
    const labels = forms.map((fp) => {
      const enumValue = String(fp.enumValue || fp.slug).toUpperCase();
      return (
        PROVIDERS_DISPLAY.find((l) => l !== "Other" && l.toUpperCase() === enumValue) ||
        fp.label
      );
    });
    return [...labels, "Other"];
  } catch {
    return [...PROVIDERS_DISPLAY];
  }
}

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
  slug?: string;
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
  status: "Draft" | "Published" | "Review";
  /** 'public' = listed on /training; 'private' = unlisted, reachable only via its direct link. */
  visibility: "public" | "private";
  /** Review gate: 'none' | 'pending' | 'approved' | 'rejected'. */
  reviewStatus: string;
  timestamp: string;
  folderUrl: string;
  venue?: string;
  capacity?: string;
  startDate?: string;
  startTime?: string;
  meetLink?: string;
  resources?: any[];
  /** Average public rating (0 when no public reviews yet). */
  avgRating: number;
  /** Count of public reviews (0 when none). */
  reviewCount: number;
  /** Linked certification this training prepares you for (provider_certifications.id). */
  certificationId?: string | null;
  /** Full label of the linked certification, e.g. "AWS Certified Solutions Architect - Associate". */
  certificationLabel?: string;
  /** Exam code of the linked certification, e.g. "SAA-C03". */
  certificationExamCode?: string;
  /** Provider slug of the linked certification, e.g. "aws". */
  certificationProvider?: string;
}

const createSlug = (name: string) =>
  String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");

/**
 * Unguessable suffix for private (unlisted) URLs — the YouTube-unlisted
 * pattern. The URL itself never says "private"; it is simply not enumerable.
 */
const unlistedToken = () => crypto.randomUUID().replace(/-/g, "").slice(0, 12);

/** Slug base for a private item: the word "private" never reaches the URL. */
const privateSlugBase = (name: string) =>
  createSlug(String(name || "").replace(/\bprivate\b/gi, " ")) || "training";

const statusToDb = (s?: string) => (s === "Published" ? "published" : "draft");
const statusFromDb = (s?: string): "Draft" | "Published" =>
  s === "published" ? "Published" : "Draft";

/** Map a trainings row → the legacy Course shape used across the public UI. */
function rowToCourse(row: any, modulesCount = 0): Course {
  const priceNum = Number(row.price_inr) || 0;
  const isPaid = priceNum > 0;
  const mode: "Online" | "On-site" = row.mode === "online" ? "Online" : "On-site";
  const reviewStatus = row.review_status || "none";
  // A draft awaiting admin approval reads as "Review" so both dashboards can
  // tell it apart from an untouched draft. A published course stays published.
  let status: "Draft" | "Published" | "Review" = statusFromDb(row.status);
  if (status !== "Published" && reviewStatus === "pending") status = "Review";
  // PostgREST embeds a to-one relation as an object (or null when unlinked).
  const cert = Array.isArray(row.provider_certifications)
    ? row.provider_certifications[0]
    : row.provider_certifications;
  return {
    id: row.id,
    slug: row.slug || "",
    courseName: row.course_title || row.name || "",
    description: row.description || "",
    instructor: row.trainer_name || "",
    instructorId: row.trainer_id || "",
    level: row.level || "All Levels",
    duration: row.duration_hours ? `${row.duration_hours} hours` : "",
    paymentType: isPaid ? "Paid" : "Free",
    price: isPaid ? `₹${priceNum}` : "Free",
    thumbnailUrl: row.image_url || "",
    subType: row.name || "",
    mode,
    skills: "",
    outcomes: "",
    modulesCount,
    status,
    visibility: row.visibility === "private" ? "private" : "public",
    reviewStatus,
    timestamp: row.created_at || "",
    folderUrl: "",
    venue: row.city || "",
    startDate: row.start_date || undefined,
    startTime: row.start_time || undefined,
    meetLink: row.meet_link || undefined,
    resources: Array.isArray(row.resources) ? row.resources : [],
    avgRating: Number(row.avg_rating) || 0,
    reviewCount: Number(row.review_count) || 0,
    certificationId: row.certification_id || null,
    certificationLabel: cert?.label || undefined,
    certificationExamCode: cert?.exam_code || undefined,
    certificationProvider: cert?.provider_slug || undefined,
  };
}

// ---------------------------------------------------------------------------
// Public catalog
// ---------------------------------------------------------------------------

/**
 * Column list for anonymous visitors: everything EXCEPT meet_link and
 * trainer_email — the anon role cannot select those (migration 038), and a
 * `select *` would fail outright. Signed-in requests keep `*` so enrolled
 * students still receive the meeting link on their dashboards.
 */
const TRAINING_PUBLIC_COLS =
  "id,slug,name,course_title,provider,start_date,start_time,end_date,duration_hours,mode,city,trainer_id,trainer_name,max_capacity,price_inr,image_url,description,resources,status,created_at,updated_at,review_status,avg_rating,review_count,certification_id,visibility,level";

async function trainingCatalogColumns(): Promise<string> {
  const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
  return data.session ? "*" : TRAINING_PUBLIC_COLS;
}

/** All published (and archived) trainings for the public catalog. */
export async function listPublishedTrainings(): Promise<Course[]> {
  const cols = await trainingCatalogColumns();
  const { data, error } = await supabase
    .from("trainings")
    .select(`${cols}, provider_certifications(label, exam_code, provider_slug)`)
    .in("status", ["published", "archived"])
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data || []) as unknown as Record<string, unknown>[]).map((r) => rowToCourse(r));
}

/**
 * A single training with its module count (public detail / dashboard).
 * Accepts either a slug or an id so slug URLs resolve while old id links still work.
 */
export async function getTrainingDetail(idOrSlug: string): Promise<Course | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug || "");
  const cols = await trainingCatalogColumns();
  const base = supabase
    .from("trainings")
    .select(`${cols}, provider_certifications(label, exam_code, provider_slug)`);
  const { data: rawData, error } = await (
    isUuid ? base.eq("id", idOrSlug) : base.eq("slug", idOrSlug)
  ).maybeSingle();
  if (error) throw error;
  if (!rawData) return null;
  const data = rawData as unknown as Record<string, any>;
  const { count } = await supabase
    .from("course_modules")
    .select("id", { count: "exact", head: true })
    .eq("training_id", data.id);
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
  /** INR price of the training (stored for the record). */
  amount?: number;
  /** Currency the Yatri chose to pay in (INR default). */
  currency?: string;
  /** 'pending' before a paid checkout, 'paid'/'free' when settled. */
  paymentStatus?: "pending" | "paid" | "failed" | "free";
  /** Our orders.id row backing this enrollment (paid flows). */
  orderId?: string | null;
}): Promise<{ id: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in to enroll.");
  const email = input.email.trim().toLowerCase();

  const fields: Record<string, unknown> = {};
  if (input.paymentId) fields.payment_id = input.paymentId;
  if (input.amount !== undefined) fields.amount = input.amount;
  if (input.currency) fields.currency = input.currency;
  if (input.paymentStatus) fields.payment_status = input.paymentStatus;
  if (input.orderId !== undefined && input.orderId !== null) fields.order_id = input.orderId;

  // Reuse an existing row for this (training, email) so a retried paid attempt
  // does not hit the unique constraint — mirrors the events flow.
  const { data: existing } = await supabase
    .from("training_enrollments")
    .select("id")
    .eq("training_id", input.trainingId)
    .eq("email", email)
    .maybeSingle();

  if (existing?.id) {
    const { data, error } = await supabase
      .from("training_enrollments")
      .update(fields)
      .eq("id", existing.id)
      .select("id")
      .single();
    if (error) throw error;
    return { id: data.id };
  }

  const { data, error } = await supabase
    .from("training_enrollments")
    .insert({
      training_id: input.trainingId,
      user_id: user.id,
      email,
      status: "enrolled",
      ...fields,
    })
    .select("id")
    .single();

  if (error) {
    // Row already exists (e.g. RLS hid it above) — patch and reuse it.
    if ((error as any).code === "23505") {
      const { data: again, error: upErr } = await supabase
        .from("training_enrollments")
        .update(fields)
        .eq("training_id", input.trainingId)
        .eq("email", email)
        .select("id")
        .single();
      if (upErr) throw upErr;
      return { id: again.id };
    }
    throw error;
  }
  return { id: data.id };
}

/**
 * Creates our orders row (kind 'training') and returns its id. Mirrors
 * createMentorshipOrder so the paid enrollment flow has an order to link.
 */
export async function createTrainingOrder(input: {
  email: string;
  amount: number;
  currency: string;
  items: unknown[];
}): Promise<{ orderId: string | null; error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("orders")
    .insert({
      user_id: user?.id || null,
      email: input.email,
      kind: "training",
      items: input.items,
      amount: input.amount,
      currency: input.currency,
    })
    .select("id")
    .single();
  if (error || !data) {
    console.error("[training-api] createTrainingOrder", error?.message);
    return { orderId: null, error: "We could not start your order. Please try again." };
  }
  return { orderId: String(data.id), error: null };
}

/** Is the current user enrolled in a training? */
export async function checkEnrollment(trainingId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data, error } = await supabase
    .from("training_enrollments")
    .select("id,payment_status")
    .eq("training_id", trainingId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !data) return false;
  // A pending or failed payment does not grant access to a paid course.
  return data.payment_status !== "pending" && data.payment_status !== "failed";
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
    .from("profiles").select("id, role").eq("email", e).maybeSingle();
  // Never downgrade an admin who also holds a trainer application.
  if (profile && profile.role !== "admin") {
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

/**
 * Build a working Jitsi meeting link for a training. Jitsi rooms are created on
 * first visit, so this URL is live the moment it is shared — no external API.
 */
export function generateMeetLink(
  training: { id?: string; slug?: string; courseName?: string; course_title?: string; name?: string } = {},
): string {
  const label =
    createSlug(training.slug || training.courseName || training.course_title || training.name || "");
  const idPart = String(training.id || "").replace(/-/g, "").slice(0, 6);
  const base = (label || idPart || "session").slice(0, 40);
  const random6 = Math.random().toString(36).slice(2, 8);
  return `https://meet.jit.si/YatriCloud-${base}-${random6}`;
}

/** Approved trainers as public instructor profiles (backed by trainer_applications). */
export async function listInstructorProfiles(): Promise<any[]> {
  const { data, error } = await supabase
    .from("trainer_applications")
    .select("id, user_id, name, email, expertise, linkedin_url, details")
    .eq("status", "approved");
  if (error) throw error;
  return (data || []).map((a: any) => {
    const d = a.details || {};
    return {
      id: a.id,
      userId: a.user_id || "",
      trainerId: a.user_id || "",
      name: a.name || "",
      fullName: a.name || "",
      email: a.email || "",
      role: d.role || "",
      bio: d.bio || "",
      expertise: a.expertise || "",
      linkedin: a.linkedin_url || "",
      linkedin_url: a.linkedin_url || "",
      photo: d.photo || "",
      photoUrl: d.photo || "",
      // No invented numbers: an empty rating/count simply renders nothing.
      rating: d.rating || "",
      studentsCount: d.studentsCount || "",
      coursesCount: d.coursesCount || "",
    };
  });
}

/** Update an approved trainer's instructor profile (columns + details jsonb). */
export async function updateInstructorProfile(profile: any): Promise<void> {
  const email = String(profile?.email || "").trim().toLowerCase();
  let row: { id: string; details: any } | null = null;
  if (profile?.id) {
    const { data } = await supabase
      .from("trainer_applications")
      .select("id, details")
      .eq("id", profile.id)
      .maybeSingle();
    row = data as any;
  } else if (email) {
    const { data } = await supabase
      .from("trainer_applications")
      .select("id, details")
      .eq("email", email)
      .eq("status", "approved")
      .maybeSingle();
    row = data as any;
  }
  if (!row) throw new Error("We could not find this trainer's application.");

  const details = { ...(row.details || {}) };
  if (profile.bio !== undefined) details.bio = profile.bio;
  const photo = profile.photo_url ?? profile.photoUrl;
  if (photo !== undefined) details.photo = photo;
  if (profile.role !== undefined) details.role = profile.role;
  if (profile.rating !== undefined) details.rating = profile.rating;
  if (profile.studentsCount !== undefined) details.studentsCount = profile.studentsCount;
  if (profile.coursesCount !== undefined) details.coursesCount = profile.coursesCount;

  const patch: Record<string, any> = { details };
  if (profile.expertise !== undefined) patch.expertise = profile.expertise;
  const linkedin = profile.linkedin_url ?? profile.linkedIn ?? profile.linkedin;
  if (linkedin !== undefined) patch.linkedin_url = linkedin;

  const { error } = await supabase
    .from("trainer_applications")
    .update(patch)
    .eq("id", row.id);
  if (error) throw error;
}

/**
 * Ensure a training has a live meeting link (generate + save a Jitsi one if
 * missing) so the trainer can host. Returns the link.
 */
export async function grantMeetAccess(input: { trainerEmail: string; trainingId: string }): Promise<{ meetLink?: string }> {
  const { data: current, error: readErr } = await supabase
    .from("trainings")
    .select("id, slug, course_title, name, meet_link")
    .eq("id", input.trainingId)
    .maybeSingle();
  if (readErr) throw readErr;
  if (!current) throw new Error("We could not find that training.");

  let meetLink = current.meet_link || "";
  if (!meetLink) {
    meetLink = generateMeetLink({
      id: current.id,
      slug: current.slug,
      courseName: current.course_title || current.name,
    });
    const { error } = await supabase
      .from("trainings")
      .update({ meet_link: meetLink })
      .eq("id", input.trainingId);
    if (error) throw error;
  }
  return { meetLink };
}

/** Assign a trainer to a real training (sets trainer_id, trainer_name, trainer_email). */
export async function assignTrainerToCourse(input: {
  trainingId: string;
  trainerId?: string;
  trainerName?: string;
  trainerEmail?: string;
}): Promise<void> {
  if (!input.trainingId) throw new Error("Please choose a training to assign.");
  const patch: Record<string, any> = {};
  if (input.trainerId !== undefined) patch.trainer_id = input.trainerId || null;
  if (input.trainerName !== undefined) patch.trainer_name = input.trainerName || null;
  if (input.trainerEmail !== undefined) patch.trainer_email = input.trainerEmail || null;
  const { error } = await supabase
    .from("trainings")
    .update(patch)
    .eq("id", input.trainingId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Providers (derived from the provider_t enum + distinct training course titles)
// ---------------------------------------------------------------------------

export interface ProviderData {
  id?: string;
  type: string;
  name: string;
  slug?: string;
  logoUrl?: string;
  exams: string[];
  exists?: boolean;
}

/**
 * Provider list from the training_providers table (public read of active rows;
 * admins see all). Each provider is enriched with the exams (course titles)
 * seen in trainings. Falls back to the certification catalog labels when the
 * table is empty so dropdowns are never blank.
 */
export async function listProviders(): Promise<ProviderData[]> {
  const { data: providerRows } = await supabase
    .from("training_providers")
    .select("id, name, slug, logo_url, sort_order, active")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  const { data: trainingRows } = await supabase
    .from("trainings")
    .select("name, course_title, provider");

  // Real, managed providers.
  if (providerRows && providerRows.length) {
    const examsByProvider: Record<string, Set<string>> = {};
    for (const p of providerRows) examsByProvider[p.name] = new Set();

    for (const row of trainingRows || []) {
      const match = providerRows.find(
        (p) => toProviderEnum(p.name) === toProviderEnum(row.name || row.provider),
      );
      const exam = row.course_title || row.name;
      if (match && exam) examsByProvider[match.name]?.add(exam);
    }

    return providerRows.map((p) => ({
      id: p.id,
      type: "Certification",
      name: p.name,
      slug: p.slug || "",
      logoUrl: p.logo_url || "",
      exams: Array.from(examsByProvider[p.name] || []),
      exists: true,
    }));
  }

  // Fallback: catalog labels with exams derived from trainings.
  const labels = await providerDisplayLabels();
  const examsByLabel: Record<string, Set<string>> = {};
  for (const label of labels) examsByLabel[label] = new Set();
  for (const row of trainingRows || []) {
    const label = labels.find(
      (p) => toProviderEnum(p) === toProviderEnum(row.name || row.provider),
    ) || "Other";
    const exam = row.course_title || row.name;
    if (exam) examsByLabel[label]?.add(exam);
  }
  return labels.map((label) => ({
    type: "Certification",
    name: label,
    exams: Array.from(examsByLabel[label] || []),
    exists: true,
  }));
}

/** Folder-picker helper: providers when no provider given, else that provider's exams. */
export async function getFoldersInPath(_type: string, provider?: string): Promise<string[]> {
  if (!provider) return providerDisplayLabels();
  const providers = await listProviders();
  return providers.find((p) => p.name === provider)?.exams || [];
}

/** Admin: add a training provider. */
export async function addProvider(input: {
  name?: string;
  provider?: string;
  logo_url?: string;
  slug?: string;
  sort_order?: number;
}): Promise<void> {
  const name = String(input.name || input.provider || "").trim();
  if (!name) throw new Error("Please enter a provider name.");
  const { error } = await supabase.from("training_providers").insert({
    name,
    slug: input.slug || createSlug(name),
    logo_url: input.logo_url || null,
    sort_order: input.sort_order ?? 0,
    active: true,
  });
  if (error) throw error;
}

/** Admin: update a training provider (by id, or by current name). */
export async function updateProvider(input: {
  id?: string;
  name?: string;
  provider?: string;
  oldProvider?: string;
  logo_url?: string;
  slug?: string;
  sort_order?: number;
  active?: boolean;
}): Promise<void> {
  const patch: Record<string, any> = {};
  const newName = input.name ?? input.provider;
  if (newName !== undefined) patch.name = newName;
  if (input.logo_url !== undefined) patch.logo_url = input.logo_url;
  if (input.slug !== undefined) patch.slug = input.slug;
  if (input.sort_order !== undefined) patch.sort_order = input.sort_order;
  if (input.active !== undefined) patch.active = input.active;
  if (Object.keys(patch).length === 0) return;

  let query = supabase.from("training_providers").update(patch);
  if (input.id) query = query.eq("id", input.id);
  else if (input.oldProvider) query = query.eq("name", input.oldProvider);
  else throw new Error("We could not tell which provider to update.");
  const { error } = await query;
  if (error) throw error;
}

/** Admin: delete a training provider (by id, or by name). */
export async function deleteProvider(input: { id?: string; provider?: string; name?: string }): Promise<void> {
  let query = supabase.from("training_providers").delete();
  if (input.id) query = query.eq("id", input.id);
  else if (input.provider || input.name) query = query.eq("name", input.provider || input.name);
  else throw new Error("We could not tell which provider to delete.");
  const { error } = await query;
  if (error) throw error;
}

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
  level?: string;
  instructorId?: string;
  instructor?: string;
  duration?: string;
  mode?: "Online" | "On-site";
  /** Custom online meeting link for the live session (trainings.meet_link). */
  meetLink?: string;
  venueName?: string;
  capacityType?: string;
  capacityCount?: string;
  paymentType?: string;
  price?: string;
  startDate?: string;
  startTime?: string;
  thumbnailBase64?: string;
  thumbnailMimeType?: string;
  curriculum?: {
    moduleId?: string;
    title: string;
    lessons: { lessonId?: string; title: string; type: string; duration: string; url?: string; description?: string }[];
  }[];
  resources?: any[];
  status?: "Draft" | "Published";
  /** 'public' = listed on /training; 'private' = unlisted, reachable only via its direct link. */
  visibility?: "public" | "private";
  /** Certification this training prepares you for (provider_certifications.id). Empty = none. */
  certificationId?: string | null;
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
    level: input.level || null,
    trainer_id: input.instructorId || null,
    trainer_name: input.instructor || null,
    duration_hours: isNaN(durHours) ? null : durHours,
    mode: input.mode === "On-site" ? "offline" : "online",
    city: input.mode === "On-site" ? (input.venueName || null) : null,
    // Only touch meet_link when the caller manages it (the unified editor does),
    // so a save never wipes an auto-generated link from a caller that omits it.
    ...(input.meetLink !== undefined ? { meet_link: input.meetLink || null } : {}),
    max_capacity: input.capacityType === "Limited" ? (Number(input.capacityCount) || null) : null,
    price_inr: input.paymentType === "Paid" ? price : 0,
    start_date: input.startDate || null,
    start_time: input.startTime || null,
    resources: Array.isArray(input.resources) ? input.resources : [],
    status: statusToDb(input.status),
    visibility: input.visibility === "private" ? "private" : "public",
    // Optional certification link. An empty choice clears it (nullable column).
    certification_id: input.certificationId ? input.certificationId : null,
  };
  return row;
}

/** Matches a Postgres UUID — editor-created rows use temp ids (MOD…/LSN…) instead. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Canonical lesson content types. The coarse (TrainingManager) and granular
 * (TrainerCourseEditor) editors historically wrote different casing ("Video" vs
 * "video") for the same field; normalize every write to Title-case so the coarse
 * form's <select> round-trips and reads stay consistent. Reads that compare type
 * should still lower-case defensively for legacy rows.
 */
export const canonLessonType = (t?: string): string => {
  const k = String(t || "").toLowerCase();
  const known: Record<string, string> = { video: "Video", reading: "Reading", assignment: "Assignment", quiz: "Quiz" };
  return known[k] || (t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : "Video");
};

/**
 * Persist a curriculum (modules + lessons) for a training id-preservingly.
 *
 * This is the coarse editor's save path (TrainingManager), which only knows a
 * lesson's title/type/duration — NOT the url/description the granular editor
 * (saveCourseContent) manages. So for an existing lesson we UPDATE it in place
 * and MERGE its content: title/type/duration change, but any url/description
 * already stored survives. Rows carrying a real UUID are matched to the DB and
 * updated (ids stay stable so lesson_progress FKs and student completion aren't
 * lost); new rows insert; only rows the editor removed are deleted.
 */
async function saveCurriculum(
  trainingId: string,
  curriculum?: TrainingInput["curriculum"],
): Promise<void> {
  if (!curriculum) return;

  // Snapshot existing modules + their lessons' ids and content to diff + merge.
  const { data: existingMods } = await supabase
    .from("course_modules")
    .select("id, course_lessons(id, content)")
    .eq("training_id", trainingId);
  const existingModuleIds = new Set<string>((existingMods || []).map((m: any) => m.id));
  const existingLessonsByModule = new Map<string, Set<string>>();
  const contentByLesson = new Map<string, any>();
  for (const m of existingMods || []) {
    existingLessonsByModule.set(m.id, new Set((m.course_lessons || []).map((l: any) => l.id)));
    for (const l of m.course_lessons || []) contentByLesson.set(l.id, l.content || {});
  }

  const keptModuleIds = new Set<string>();
  let mi = 0;
  for (const mod of curriculum) {
    const name = mod.title || `Module ${mi + 1}`;
    let moduleId: string;

    if (mod.moduleId && UUID_RE.test(mod.moduleId) && existingModuleIds.has(mod.moduleId)) {
      moduleId = mod.moduleId;
      await supabase.from("course_modules").update({ name, sort_order: mi }).eq("id", moduleId);
    } else {
      const { data: modRow, error } = await supabase
        .from("course_modules")
        .insert({ training_id: trainingId, name, sort_order: mi })
        .select("id")
        .single();
      if (error || !modRow) { mi++; continue; }
      moduleId = modRow.id;
    }
    keptModuleIds.add(moduleId);

    const existingLessonIds = existingLessonsByModule.get(moduleId) || new Set<string>();
    const keptLessonIds = new Set<string>();
    let li = 0;
    for (const l of mod.lessons || []) {
      const isExisting = !!l.lessonId && UUID_RE.test(l.lessonId) && existingLessonIds.has(l.lessonId);
      // Preserve url/description the coarse form doesn't manage, from the stored row.
      const prev = isExisting ? (contentByLesson.get(l.lessonId!) || {}) : {};
      const content = {
        ...prev,
        type: canonLessonType(l.type || prev.type),
        duration: l.duration || prev.duration || "",
        ...(l.url !== undefined ? { url: l.url } : {}),
        ...(l.description !== undefined ? { description: l.description } : {}),
      };
      const row = { name: l.title || `Lesson ${li + 1}`, content, sort_order: li };
      if (isExisting) {
        await supabase.from("course_lessons").update(row).eq("id", l.lessonId!);
        keptLessonIds.add(l.lessonId!);
      } else {
        await supabase.from("course_lessons").insert({ module_id: moduleId, ...row });
      }
      li++;
    }
    const removedLessons = [...existingLessonIds].filter((id) => !keptLessonIds.has(id));
    if (removedLessons.length) await supabase.from("course_lessons").delete().in("id", removedLessons);
    mi++;
  }

  const removedModules = [...existingModuleIds].filter((id) => !keptModuleIds.has(id));
  if (removedModules.length) await supabase.from("course_modules").delete().in("id", removedModules);
}

/** Create a training (admin or trainer). Returns the new id. */
export async function createTraining(input: TrainingInput): Promise<string> {
  const row = inputToRow(input);
  if (input.thumbnailBase64 && input.thumbnailMimeType) {
    try { row.image_url = await uploadThumbnail(input.thumbnailBase64, input.thumbnailMimeType); }
    catch { /* image optional */ }
  }
  // Private trainings get an unguessable token suffix and never carry the
  // word "private" in the URL; public ones keep the readable dated slug.
  row.slug = input.visibility === "private"
    ? `${privateSlugBase(input.courseName || input.subType || "training")}-${unlistedToken()}`
    : `${createSlug(input.courseName || input.subType || "training") || "training"}-${Date.now().toString(36)}`;

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
  // Switching public → private regenerates the link: the old URL was public
  // knowledge, so it must not remain the private one. An already-private slug
  // is kept stable so links already shared keep working.
  if (input.visibility === "private") {
    const { data: cur } = await supabase
      .from("trainings").select("visibility").eq("id", id).maybeSingle();
    if (cur && cur.visibility !== "private") {
      row.slug = `${privateSlugBase(input.courseName || input.subType || "training")}-${unlistedToken()}`;
    }
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
    .select("id, name, sort_order, course_lessons(id, name, content, sort_order)")
    .eq("training_id", id)
    .order("sort_order", { ascending: true });

  // Carry the module/lesson ids into the form so a later save can update rows in
  // place (preserving student progress) instead of replacing them wholesale.
  const curriculum = (mods || []).map((m: any) => ({
    moduleId: m.id,
    title: m.name,
    lessons: (m.course_lessons || [])
      .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
      .map((l: any) => ({
        lessonId: l.id,
        title: l.name,
        type: l.content?.type || "Video",
        duration: l.content?.duration || "",
        url: l.content?.url || "",
        description: l.content?.description || "",
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
    level: data.level || "Beginner",
    duration: data.duration_hours ? `${data.duration_hours}` : "",
    skills: "",
    outcomes: "",
    curriculum,
    mode: data.mode === "online" ? "Online" : "On-site",
    meetLink: data.meet_link || "",
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
    certificationId: data.certification_id || "",
    visibility: data.visibility === "private" ? "private" : "public",
  };
}

/** A certification option for the "Prepares you for" picker in the course form. */
export interface CertificationOption {
  id: string;
  label: string;
  examCode: string;
  provider: string;
}

/**
 * The certification catalog for the training picker, flat and in provider order.
 * Reads provider_certifications directly so each option carries its real id
 * (the value stored on trainings.certification_id). Never throws — returns an
 * empty list on any error so the form still renders.
 */
export async function getCertificationOptions(): Promise<CertificationOption[]> {
  try {
    const { data, error } = await supabase
      .from("provider_certifications")
      .select("id, label, exam_code, provider_slug")
      .eq("active", true)
      .order("provider_slug", { ascending: true })
      .order("sort_order", { ascending: true });
    if (error || !data) return [];
    return data.map((r: any) => ({
      id: String(r.id),
      label: String(r.label || ""),
      examCode: String(r.exam_code || ""),
      provider: String(r.provider_slug || ""),
    }));
  } catch {
    return [];
  }
}

/** Admin: every training (drafts + published), list shape. */
export async function listAllTrainings(): Promise<Course[]> {
  const { data, error } = await supabase
    .from("trainings")
    .select("*, provider_certifications(label, exam_code, provider_slug)")
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

/**
 * Save a training's schedule and ensure it has a meeting link. Uses the
 * provided link when given, otherwise keeps the existing one, otherwise
 * generates a working Jitsi link. Returns the saved link.
 */
export async function updateTrainingSchedule(
  id: string,
  schedule: { startDate: string; startTime: string; meetLink?: string },
): Promise<{ meetLink?: string }> {
  const { data: current } = await supabase
    .from("trainings")
    .select("id, slug, course_title, name, meet_link")
    .eq("id", id)
    .maybeSingle();

  let meetLink = (schedule.meetLink || current?.meet_link || "").trim();
  if (!meetLink) {
    meetLink = generateMeetLink({
      id,
      slug: current?.slug,
      courseName: current?.course_title || current?.name,
    });
  }

  const { data, error } = await supabase
    .from("trainings")
    .update({ start_date: schedule.startDate, start_time: schedule.startTime, meet_link: meetLink })
    .eq("id", id)
    .select("meet_link")
    .single();
  if (error) throw error;
  return { meetLink: data?.meet_link || meetLink };
}

/** Admin: approve a pending course — publish it and mark the review approved. */
export async function approveCourse(courseId: string): Promise<void> {
  const { error } = await supabase
    .from("trainings")
    .update({ status: "published", review_status: "approved" })
    .eq("id", courseId);
  if (error) throw error;
}

/** Admin: reject a pending course — mark the review rejected (stays a draft). */
export async function rejectCourse(courseId: string): Promise<void> {
  const { error } = await supabase
    .from("trainings")
    .update({ review_status: "rejected" })
    .eq("id", courseId);
  if (error) throw error;
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
  // Read the LIVE profile role, not the cached mirror: a trainer approved after
  // their last sign-in would otherwise be denied because the cache still says
  // "yatri". Fall back to the cached user only if the live fetch is unavailable.
  const user = (await fetchMyProfile()) || getCachedUser();
  if (!user || !user.id) {
    throw new Error("Please sign in to Yatri Cloud first, then continue.");
  }
  if (user.role !== "trainer" && user.role !== "admin") {
    throw new Error("Access denied. You might not be an approved trainer.");
  }
  // Access is decided by the signed-in Yatri Cloud session's role (+ RLS), not by
  // which Google account the popup picked — so we don't hard-fail on a mismatch
  // between the two, which only confused approved trainers/admins. The `email`
  // arg stays for signature compatibility.
  void email;

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
        contentType: canonLessonType(l.content?.type),
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

/**
 * Submit a course for admin approval. The course stays a draft and its
 * review_status flips to 'pending' so an admin can approve it to publish.
 */
export async function submitCourseForApproval(input: { courseId: string }): Promise<void> {
  const { error } = await supabase
    .from("trainings")
    .update({ status: "draft", review_status: "pending" })
    .eq("id", input.courseId);
  if (error) throw error;
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

// ---------------------------------------------------------------------------
// Lesson progress + completion certificates (migration 021)
// ---------------------------------------------------------------------------

/**
 * The lesson ids the current user has completed for a training.
 * Returns an empty array when signed out or on any error (never throws).
 */
export async function getLessonProgress(trainingId: string): Promise<string[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from("lesson_progress")
      .select("lesson_id")
      .eq("user_id", user.id)
      .eq("training_id", trainingId);
    if (error || !data) return [];
    return data.map((r: any) => r.lesson_id);
  } catch {
    return [];
  }
}

/**
 * Mark a lesson complete for the current user. Idempotent: a duplicate
 * (already-completed) lesson resolves quietly. Returns whether it stuck.
 */
export async function markLessonComplete(
  trainingId: string,
  lessonId: string,
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { error } = await supabase
      .from("lesson_progress")
      .upsert(
        { user_id: user.id, training_id: trainingId, lesson_id: lessonId },
        { onConflict: "user_id,lesson_id", ignoreDuplicates: true },
      );
    // A unique-violation just means it was already there — treat as success.
    if (error && (error as any).code !== "23505") return false;
    return true;
  } catch {
    return false;
  }
}

/** Remove the current user's completion of a lesson. Never throws. */
export async function unmarkLesson(lessonId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { error } = await supabase
      .from("lesson_progress")
      .delete()
      .eq("user_id", user.id)
      .eq("lesson_id", lessonId);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Ask the server to issue a completion certificate (it re-verifies enrollment
 * and that every lesson is done). Returns the serial on success.
 */
export async function issueCertificate(
  trainingId: string,
): Promise<{ ok: boolean; serial?: string; message?: string }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) {
      return { ok: false, message: "Please sign in again to get your certificate." };
    }
    const res = await fetch("/api/training/issue-certificate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ training_id: trainingId, access_token: accessToken }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok || !data.serial) {
      return {
        ok: false,
        message: data.message || "We could not issue your certificate just now. Please try again.",
      };
    }
    return { ok: true, serial: data.serial };
  } catch {
    return { ok: false, message: "We could not issue your certificate just now. Please try again." };
  }
}

/** The current user's certificates, newest first. Empty on signed-out/error. */
export async function getMyCertificates(): Promise<any[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from("certificates")
      .select("serial, kind, recipient_name, title, issued_at, training_id")
      .eq("user_id", user.id)
      .order("issued_at", { ascending: false });
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

/** Public: read one certificate by its serial (share/verify link). */
export async function getCertificateBySerial(serial: string): Promise<{
  serial: string;
  kind: string;
  recipient_name: string;
  title: string;
  issued_at: string;
  training_id: string | null;
} | null> {
  try {
    const { data, error } = await supabase
      .from("certificates")
      .select("serial, kind, recipient_name, title, issued_at, training_id")
      .eq("serial", serial)
      .maybeSingle();
    if (error || !data) return null;
    return data as any;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Training reviews & ratings (migration 026)
// ---------------------------------------------------------------------------

/** A public review shown on the catalog and detail pages. */
export interface TrainingReview {
  id: string;
  name: string;
  rating: number;
  review: string;
  created_at: string;
  /** Set when the reviewer has an enrollment — powers the Verified badge. */
  enrollment_id: string | null;
}

/** Public reviews for a training, newest first. Signed-out safe; never throws. */
export async function getTrainingReviews(trainingId: string): Promise<TrainingReview[]> {
  try {
    const { data, error } = await supabase
      .from("training_reviews")
      .select("id, name, rating, review, created_at, enrollment_id")
      .eq("training_id", trainingId)
      .eq("is_public", true)
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return data.map((r: any) => ({
      id: r.id,
      name: r.name || "",
      rating: Number(r.rating) || 0,
      review: r.review || "",
      created_at: r.created_at || "",
      enrollment_id: r.enrollment_id || null,
    }));
  } catch {
    return [];
  }
}

/** The current user's own review for a training, or null. Never throws. */
export async function getMyTrainingReview(trainingId: string): Promise<TrainingReview | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from("training_reviews")
      .select("id, name, rating, review, created_at, enrollment_id")
      .eq("training_id", trainingId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id,
      name: data.name || "",
      rating: Number(data.rating) || 0,
      review: data.review || "",
      created_at: data.created_at || "",
      enrollment_id: data.enrollment_id || null,
    };
  } catch {
    return null;
  }
}

/**
 * Upsert the current user's review for a training. The name comes from their
 * profile, the enrollment_id is looked up from their enrollment, and RLS
 * enforces that only an enrolled (paid or free) student may write. One review
 * per (training, user). Never throws — returns { ok, error }.
 */
export async function submitTrainingReview(input: {
  trainingId: string;
  rating: number;
  review: string;
}): Promise<{ ok: boolean; error: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Please sign in to leave a review." };

    // Name from the signed in user (profile first, then email).
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .maybeSingle();
    const name = profile?.full_name || profile?.email || user.email || "Yatri";

    // Enrollment backing this review (RLS still verifies it server-side).
    const { data: enrollment } = await supabase
      .from("training_enrollments")
      .select("id")
      .eq("training_id", input.trainingId)
      .eq("user_id", user.id)
      .maybeSingle();

    const rating = Math.max(1, Math.min(5, Math.round(Number(input.rating) || 0)));
    const { error } = await supabase
      .from("training_reviews")
      .upsert(
        {
          training_id: input.trainingId,
          user_id: user.id,
          enrollment_id: enrollment?.id || null,
          name,
          rating,
          review: input.review?.trim() || null,
        },
        { onConflict: "training_id,user_id" },
      );
    if (error) {
      return { ok: false, error: "Your review could not be saved. Please try again." };
    }
    return { ok: true, error: null };
  } catch {
    return { ok: false, error: "Your review could not be saved. Please try again." };
  }
}

/** Owner: remove their own review. Never throws — returns { ok, error }. */
export async function deleteTrainingReview(id: string): Promise<{ ok: boolean; error: string | null }> {
  try {
    const { error } = await supabase.from("training_reviews").delete().eq("id", id);
    if (error) return { ok: false, error: "We could not remove your review. Please try again." };
    return { ok: true, error: null };
  } catch {
    return { ok: false, error: "We could not remove your review. Please try again." };
  }
}

// ── Admin moderation ──

/** An admin view of a review, joined to its training name. */
export interface AdminTrainingReview {
  id: string;
  training_id: string;
  trainingName: string;
  name: string;
  rating: number;
  review: string;
  is_public: boolean;
  enrollment_id: string | null;
  created_at: string;
}

/** Admin: every review with its training name, newest first. */
export async function getAllTrainingReviews(): Promise<AdminTrainingReview[]> {
  const { data, error } = await supabase
    .from("training_reviews")
    .select(
      "id, training_id, name, rating, review, is_public, enrollment_id, created_at, trainings(name, course_title)",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((r: any) => ({
    id: r.id,
    training_id: r.training_id,
    trainingName: r.trainings ? (r.trainings.course_title || r.trainings.name) : "",
    name: r.name || "",
    rating: Number(r.rating) || 0,
    review: r.review || "",
    is_public: r.is_public !== false,
    enrollment_id: r.enrollment_id || null,
    created_at: r.created_at || "",
  }));
}

/** Admin: show or hide a review (the trigger recalculates the training rating). */
export async function setReviewPublic(id: string, isPublic: boolean): Promise<void> {
  const { error } = await supabase
    .from("training_reviews")
    .update({ is_public: isPublic })
    .eq("id", id);
  if (error) throw error;
}

/** Admin: delete any review. */
export async function adminDeleteReview(id: string): Promise<void> {
  const { error } = await supabase.from("training_reviews").delete().eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Practice quizzes (quizzes + quiz_attempts tables, migration 031)
// ---------------------------------------------------------------------------

import type { QuizQuestion } from "@/types/quiz";
import type { QuizAnswer, PreviousAttempt } from "@/types/quizAttempt";

export interface QuizRecord {
  id: string;
  trainingId: string;
  title: string;
  description: string | null;
  questions: QuizQuestion[];
  passingScore: number;
  timeLimitMin: number | null;
  status: "draft" | "published";
}

const rowToQuiz = (row: any): QuizRecord => ({
  id: row.id,
  trainingId: row.training_id,
  title: row.title || "Practice Quiz",
  description: row.description || null,
  questions: Array.isArray(row.questions) ? row.questions : [],
  passingScore: row.passing_score ?? 70,
  timeLimitMin: row.time_limit_min ?? null,
  status: row.status === "draft" ? "draft" : "published",
});

/**
 * Quizzes for a training. RLS limits reads to enrolled students, the
 * training's trainer, and admins (questions carry the correct answers).
 * Never throws — the dashboard renders an honest empty state instead.
 */
export async function listQuizzes(trainingId: string): Promise<QuizRecord[]> {
  const { data, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("training_id", trainingId)
    .order("sort_order", { ascending: true });
  if (error) return [];
  return (data || []).map(rowToQuiz);
}

/**
 * Save the training's practice quiz (one default quiz per training for now —
 * updates the first quiz if present, creates it otherwise). Trainer/admin only
 * via RLS. Passing an empty question list removes the quiz.
 */
export async function saveQuizForTraining(
  trainingId: string,
  questions: QuizQuestion[],
  opts?: { title?: string; passingScore?: number; timeLimitMin?: number | null },
): Promise<void> {
  const { data: existing } = await supabase
    .from("quizzes")
    .select("id")
    .eq("training_id", trainingId)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!questions.length) {
    if (existing?.id) await supabase.from("quizzes").delete().eq("id", existing.id);
    return;
  }

  const row: Record<string, unknown> = {
    training_id: trainingId,
    questions,
    updated_at: new Date().toISOString(),
  };
  if (opts?.title) row.title = opts.title;
  if (opts?.passingScore !== undefined) row.passing_score = opts.passingScore;
  if (opts?.timeLimitMin !== undefined) row.time_limit_min = opts.timeLimitMin;

  const { error } = existing?.id
    ? await supabase.from("quizzes").update(row).eq("id", existing.id)
    : await supabase.from("quizzes").insert(row);
  if (error) throw error;
}

/** Record a completed attempt. RLS requires the signed-in student to own it. */
export async function submitQuizAttempt(input: {
  quizId: string;
  trainingId: string;
  answers: QuizAnswer[];
  score: number;
  isPassed: boolean;
  timeSpentSec: number;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in to submit your quiz.");
  const { error } = await supabase.from("quiz_attempts").insert({
    quiz_id: input.quizId,
    training_id: input.trainingId,
    user_id: user.id,
    answers: input.answers,
    score: Math.round(input.score * 100) / 100,
    is_passed: input.isPassed,
    time_spent_sec: Math.max(0, Math.round(input.timeSpentSec)),
    status: "completed",
  });
  if (error) throw error;
}

/** The signed-in student's past attempts for a quiz, newest first. */
export async function getMyQuizAttempts(quizId: string): Promise<PreviousAttempt[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("quiz_attempts")
    .select("id, score, is_passed, time_spent_sec, created_at")
    .eq("quiz_id", quizId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) return [];
  return (data || []).map((row: any) => ({
    attemptId: row.id,
    date: new Date(row.created_at),
    score: Number(row.score) || 0,
    timeSpent: row.time_spent_sec || 0,
    isPassed: row.is_passed === true,
  }));
}
