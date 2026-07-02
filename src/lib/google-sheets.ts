/**
 * Certifications service — Supabase `certifications` table.
 * (Filename kept for import stability; the Google Sheets/Apps Script backend
 * was fully migrated to Supabase — see docs/SYSTEM-DESIGN.md.)
 */

import { supabase } from "@/lib/supabase";

export interface CertificationSubmission {
  fullName: string;
  email: string;
  certificationProvider: string;
  certificationName: string;
  examCode: string;
  certificationDate: string;
  linkedinUrl: string;
  verifiedCredential: string;
  country: string;
  stateProvince?: string;
  city: string;
  countryCode: string;
  phoneNumber: string;
  photo: File | null;
  photoUrl?: string; // if user already has a profile photo, reuse it
  additionalNotes?: string;
  sheetName: string;      // legacy fields, ignored by Supabase (kept for caller compatibility)
  subSheetName: string;
}

export interface CertificationEntry {
  id: string;
  fullName: string;
  email: string;
  certificationProvider: string;
  certificationName: string;
  examCode: string;
  certificationDate: string;
  linkedinUrl: string;
  verifiedCredential?: string;
  country?: string;
  stateProvince?: string;
  city?: string;
  countryCode?: string;
  phoneNumber?: string;
  photoUrl: string;
  additionalNotes?: string;
}

/** Display provider name → DB enum. */
const DISPLAY_TO_ENUM: Record<string, string> = {
  aws: "AWS", azure: "AZURE", gcp: "GCP", github: "GITHUB", oracle: "ORACLE",
  salesforce: "SALESFORCE", servicenow: "SERVICENOW", openai: "OPENAI",
  hashicorp: "HASHICORP", kubernetes: "KUBERNETES",
};
/** DB enum → display name used across the UI. */
const ENUM_TO_DISPLAY: Record<string, string> = {
  AWS: "AWS", AZURE: "Azure", GCP: "GCP", GITHUB: "GitHub", ORACLE: "Oracle",
  SALESFORCE: "Salesforce", SERVICENOW: "ServiceNow", OPENAI: "OpenAI",
  HASHICORP: "HashiCorp", KUBERNETES: "Kubernetes", OTHER: "Other",
};

/**
 * Submit a certification for the signed-in user.
 * Photo: reuse the profile URL, else upload the file to the `avatars` bucket.
 */
export async function submitCertification(data: CertificationSubmission): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in to submit your certification.");

  let photoUrl = data.photoUrl || "";
  if (!photoUrl && data.photo) {
    const path = `${user.id}/${Date.now()}-${data.photo.name.replace(/[^\w.-]+/g, "_")}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, data.photo, { upsert: true });
    if (upErr) throw new Error("Photo upload failed — please try again.");
    photoUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  }

  const { error } = await supabase.from("certifications").insert({
    user_id: user.id,
    email: data.email.trim().toLowerCase(),
    full_name: data.fullName,
    provider: DISPLAY_TO_ENUM[data.certificationProvider.toLowerCase()] ?? "OTHER",
    certification_name: data.certificationName,
    exam_code: data.examCode || null,
    certification_date: data.certificationDate || null,
    verified_credential_url: data.verifiedCredential || null,
    linkedin_url: data.linkedinUrl || null,
    photo_url: photoUrl || null,
    country: data.country || null,
    state_province: data.stateProvince || null,
    city: data.city || null,
    country_code: data.countryCode || null,
    phone_number: data.phoneNumber || null,
    additional_notes: data.additionalNotes || null,
  });
  if (error) {
    console.error("❌ Error submitting certification:", error.message);
    throw new Error("Submission failed — please try again.");
  }
}

/** Fetch all public certifications (the Wall of Fame). */
export async function fetchCertifications(): Promise<CertificationEntry[]> {
  const { data, error } = await supabase
    .from("certifications")
    .select("id,full_name,email,provider,certification_name,exam_code,certification_date,verified_credential_url,linkedin_url,photo_url,country,state_province,city,country_code,phone_number,additional_notes")
    .eq("is_public", true)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("❌ Error fetching certifications:", error.message);
    return [];
  }
  return (data || []).map((c) => ({
    id: c.id,
    fullName: c.full_name || "",
    email: c.email || "",
    certificationProvider: ENUM_TO_DISPLAY[c.provider] ?? c.provider,
    certificationName: c.certification_name || "",
    examCode: c.exam_code || "",
    certificationDate: c.certification_date || "",
    linkedinUrl: c.linkedin_url || "",
    verifiedCredential: c.verified_credential_url || undefined,
    country: c.country || undefined,
    stateProvince: c.state_province || undefined,
    city: c.city || undefined,
    countryCode: c.country_code || undefined,
    phoneNumber: c.phone_number || undefined,
    photoUrl: c.photo_url || "",
    additionalNotes: c.additional_notes || undefined,
  }));
}
