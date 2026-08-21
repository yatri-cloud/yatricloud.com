/**
 * Certification voucher requests — public form → RLS-guarded Supabase insert.
 */

import { supabase } from "@/lib/supabase";

export interface VoucherRequestData {
  fullName: string;
  email: string;
  whatsapp: string;
  contactNumber?: string;
  country: string;
  provider: string;
  exams: string[];
  reason?: string;
  timestamp?: string;
}

const PROVIDER_ENUM: Record<string, string> = {
  AWS: "AWS", Azure: "AZURE", "Microsoft Azure": "AZURE", GCP: "GCP",
  "Google Cloud": "GCP", GitHub: "GITHUB", Oracle: "ORACLE",
  Salesforce: "SALESFORCE", ServiceNow: "SERVICENOW", OpenAI: "OPENAI",
  Anthropic: "ANTHROPIC", "Anthropic (Claude AI)": "ANTHROPIC",
  HashiCorp: "HASHICORP", Kubernetes: "KUBERNETES", "Snowflake": "SNOWFLAKE",
};

function toVoucherProviderEnum(raw?: string | null): string {
  if (!raw) return "OTHER";
  const clean = raw.trim();
  if (PROVIDER_ENUM[clean]) return PROVIDER_ENUM[clean];
  const upper = clean.toUpperCase();
  if (["AWS", "AZURE", "GCP", "GITHUB", "ORACLE", "SALESFORCE", "SERVICENOW", "OPENAI", "ANTHROPIC", "SNOWFLAKE", "HASHICORP", "KUBERNETES", "OTHER"].includes(upper)) {
    return upper;
  }
  if (/snowflake/i.test(clean)) return "SNOWFLAKE";
  if (/anthropic|claude/i.test(clean)) return "ANTHROPIC";
  return "OTHER";
}

/**
 * Submit a voucher request.
 */
export async function submitVoucherRequest(data: VoucherRequestData) {
  const { error } = await supabase.from("voucher_requests").insert({
    full_name: data.fullName,
    email: data.email.trim().toLowerCase(),
    whatsapp: data.whatsapp || null,
    contact_number: data.contactNumber || null,
    country: data.country || null,
    provider: toVoucherProviderEnum(data.provider),
    exams: data.exams,
    reason: data.reason || null,
  });
  if (error) {
    console.error("❌ Error submitting voucher request:", error.message);
    throw new Error("Failed to submit request — please try again.");
  }
  return { success: true };
}
