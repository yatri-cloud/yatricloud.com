/**
 * Resources service — Supabase `resources` table.
 * Admin CRUD, public catalog listing, and user unlock (via RPC).
 * Redis is NOT yet wired in this SPA (no server runtime).
 * Cache is handled with a simple in-memory store with TTL so the
 * catalog is only fetched once per browser session unless invalidated.
 */

import { supabase } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface Resource {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  accessUrl: string;         // only returned after unlock
  resourceType: "link" | "file";
  isFree: boolean;
  priceInr: number;
  provider: string;
  category: string;
  tags: string[];
  isPublished: boolean;
  createdAt: string;
}

export interface MyResource {
  id: string;               // user_resources.id
  resourceId: string;
  name: string;
  description: string;
  imageUrl: string;
  accessUrl: string;
  provider: string;
  category: string;
  resourceType: "link" | "file";
  accessedAt: string;
}

export interface ResourceFilters {
  provider?: string;
  category?: string;
  isFree?: boolean;
  search?: string;
}

// ─────────────────────────────────────────────────────────────
// Simple in-memory catalog cache (TTL: 5 min)
// ─────────────────────────────────────────────────────────────

let _catalogCache: Resource[] | null = null;
let _catalogAt = 0;
const CATALOG_TTL_MS = 5 * 60 * 1000;

function invalidateCache() {
  _catalogCache = null;
  _catalogAt = 0;
}

// ─────────────────────────────────────────────────────────────
// Row → UI mapper
// ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toResource(r: any): Resource {
  return {
    id: r.id,
    name: r.name ?? "",
    description: r.description ?? "",
    imageUrl: r.image_url ?? "",
    accessUrl: r.access_url ?? "",
    resourceType: r.resource_type === "file" ? "file" : "link",
    isFree: Boolean(r.is_free),
    priceInr: Number(r.price_inr ?? 0),
    provider: r.provider ?? "",
    category: r.category ?? "",
    tags: Array.isArray(r.tags) ? r.tags : [],
    isPublished: Boolean(r.is_published),
    createdAt: r.created_at ?? "",
  };
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/** Fetch all published resources (cached). Filters applied client-side. */
export async function listResources(): Promise<Resource[]> {
  if (_catalogCache && Date.now() - _catalogAt < CATALOG_TTL_MS) {
    return _catalogCache;
  }
  const { data, error } = await supabase
    .from("resources")
    .select("id,name,description,image_url,resource_type,is_free,price_inr,provider,category,tags,is_published,created_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("❌ resources fetch failed:", error?.message);
    return [];
  }
  _catalogCache = data.map(toResource);
  _catalogAt = Date.now();
  return _catalogCache;
}

export const listPublishedResources = listResources;

/** Distinct provider values for the filter dropdown. */
export async function listResourceProviders(): Promise<string[]> {
  const all = await listResources();
  const set = new Set(all.map((r) => r.provider).filter(Boolean));
  return Array.from(set).sort();
}

/** Distinct category values for the filter dropdown. */
export async function listResourceCategories(): Promise<string[]> {
  const all = await listResources();
  const set = new Set(all.map((r) => r.category).filter(Boolean));
  return Array.from(set).sort();
}

// ─────────────────────────────────────────────────────────────
// Unlock
// ─────────────────────────────────────────────────────────────

/**
 * Unlock a resource for the signed in user.
 * Calls the `grant_resource_access` Supabase RPC (SECURITY DEFINER),
 * then fires a confirmation email.
 * Returns the access_url on success.
 */
export async function unlockResource(
  resource: Pick<Resource, "id" | "name" | "description" | "provider">,
  userEmail: string,
  userName: string,
  paymentId?: string
): Promise<string> {
  const { data, error } = await supabase.rpc("grant_resource_access", {
    p_resource_id: resource.id,
    p_payment_id: paymentId ?? null,
  });

  if (error) {
    console.error("❌ grant_resource_access failed:", error.message);
    throw new Error(error.message);
  }

  const accessUrl = data as string;

  // Fire-and-forget confirmation email
  sendEmail({
    to: userEmail,
    subject: `Your resource is ready — ${resource.name}`,
    html: buildResourceUnlockEmail({ userName, resource, accessUrl }),
  }).catch((e) => console.warn("Email send failed (non-fatal):", e));

  return accessUrl;
}

/** Build the HTML email for a resource unlock. */
function buildResourceUnlockEmail({
  userName,
  resource,
  accessUrl,
}: {
  userName: string;
  resource: Pick<Resource, "name" | "description" | "provider">;
  accessUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>Resource Ready</title></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:36px 40px;text-align:center;">
            <img src="https://yatricloud.com/logo-64.png" alt="Yatri Cloud" width="48" height="48"
                 style="border-radius:10px;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;" />
            <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">Your resource is ready!</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 16px;font-size:16px;color:#374151;">Hi ${userName},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">
              You've successfully unlocked <strong style="color:#1e40af;">${resource.name}</strong>
              ${resource.provider ? `from <strong>${resource.provider}</strong>` : ""}.
              Click the button below to access it directly.
            </p>
            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center" style="padding:8px 0 32px;">
                <a href="${accessUrl}"
                   style="display:inline-block;background:#1e40af;color:#ffffff;font-size:15px;font-weight:600;
                          padding:14px 36px;border-radius:8px;text-decoration:none;">
                  Access Resource
                </a>
              </td></tr>
            </table>
            ${resource.description ? `<p style="margin:0 0 24px;font-size:14px;color:#6b7280;border-left:3px solid #3b82f6;padding-left:16px;">${resource.description}</p>` : ""}
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
            <p style="margin:0;font-size:13px;color:#9ca3af;">
              This link was sent to you by Yatri Cloud. If you did not request this,
              please contact <a href="mailto:support@yatricloud.com" style="color:#3b82f6;">support@yatricloud.com</a>.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              © ${new Date().getFullYear()} Yatri Cloud. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────
// My Resources (authenticated user)
// ─────────────────────────────────────────────────────────────

export async function listMyResources(): Promise<MyResource[]> {
  const { data, error } = await supabase
    .from("user_resources")
    .select(`
      id,
      resource_id,
      accessed_at,
      resources (
        name, description, image_url, access_url,
        provider, category, resource_type
      )
    `)
    .order("accessed_at", { ascending: false });

  if (error || !data) {
    console.error("❌ listMyResources failed:", error?.message);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((row: any) => {
    const r = row.resources ?? {};
    return {
      id: row.id,
      resourceId: row.resource_id,
      name: r.name ?? "",
      description: r.description ?? "",
      imageUrl: r.image_url ?? "",
      accessUrl: r.access_url ?? "",
      provider: r.provider ?? "",
      category: r.category ?? "",
      resourceType: r.resource_type === "file" ? "file" : "link",
      accessedAt: row.accessed_at ?? "",
    };
  });
}

// ─────────────────────────────────────────────────────────────
// Admin CRUD
// ─────────────────────────────────────────────────────────────

export interface ResourceInput {
  name: string;
  description: string;
  imageUrl: string;
  accessUrl: string;
  resourceType: "link" | "file";
  isFree: boolean;
  priceInr: number;
  provider: string;
  category: string;
  tags: string[];
  isPublished: boolean;
}

function toRow(input: Partial<ResourceInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.name !== undefined) row.name = input.name;
  if (input.description !== undefined) row.description = input.description;
  if (input.imageUrl !== undefined) row.image_url = input.imageUrl;
  if (input.accessUrl !== undefined) row.access_url = input.accessUrl;
  if (input.resourceType !== undefined) row.resource_type = input.resourceType;
  if (input.isFree !== undefined) row.is_free = input.isFree;
  if (input.priceInr !== undefined) row.price_inr = input.priceInr;
  if (input.provider !== undefined) row.provider = input.provider;
  if (input.category !== undefined) row.category = input.category;
  if (input.tags !== undefined) row.tags = input.tags;
  if (input.isPublished !== undefined) row.is_published = input.isPublished;
  return row;
}

/** Admin: fetch all resources (published + draft). */
export async function adminListResources(): Promise<Resource[]> {
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) {
    console.error("❌ adminListResources failed:", error?.message);
    return [];
  }
  return data.map(toResource);
}

/** Admin: fetch a single resource by id. */
export async function adminGetResource(id: string): Promise<Resource | null> {
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) {
    if (error) console.error("❌ adminGetResource failed:", error.message);
    return null;
  }
  return toResource(data);
}

/** Admin: create a new resource. */
export async function createResource(input: ResourceInput): Promise<void> {
  const { error } = await supabase.from("resources").insert(toRow(input));
  if (error) throw new Error(error.message);
  invalidateCache();
}

/** Admin: update an existing resource. */
export async function updateResource(id: string, input: Partial<ResourceInput>): Promise<void> {
  const { data, error } = await supabase
    .from("resources")
    .update(toRow(input))
    .eq("id", id)
    .select();
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) {
    throw new Error("Update failed: no rows updated. Please check admin permissions.");
  }
  invalidateCache();
}

/** Admin: delete (hard) a resource. */
export async function deleteResource(id: string): Promise<void> {
  const { error } = await supabase.from("resources").delete().eq("id", id);
  if (error) throw new Error(error.message);
  invalidateCache();
}

/** Admin: upload thumbnail to Supabase Storage, returns public URL. */
export async function uploadResourceImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("resource-images").upload(path, file, { upsert: false });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("resource-images").getPublicUrl(path);
  return data.publicUrl;
}

/** Get provider glow color (mirrors exam-dumps helper). */
export const getResourceProviderColor = (provider?: string): string => {
  const p = (provider ?? "").toLowerCase();
  if (p.includes("aws")) return "rgba(255,153,0,0.35)";
  if (p.includes("azure") || p.includes("microsoft")) return "rgba(0,137,214,0.35)";
  if (p.includes("gcp") || p.includes("google")) return "rgba(66,133,244,0.35)";
  if (p.includes("oracle")) return "rgba(248,0,0,0.35)";
  if (p.includes("cisco")) return "rgba(0,188,235,0.35)";
  return "rgba(37,99,235,0.25)";
};
