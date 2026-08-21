/**
 * Resources service — Supabase `resources` table.
 * Admin CRUD, public catalog listing, and user unlock (via RPC).
 * Redis is NOT yet wired in this SPA (no server runtime).
 * Cache is handled with a simple in-memory store with TTL so the
 * catalog is only fetched once per browser session unless invalidated.
 */

import { supabase } from "@/lib/supabase";

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
// Fallback Resources Catalog (guarantees zero loading freeze)
// ─────────────────────────────────────────────────────────────

export const FALLBACK_RESOURCES: Resource[] = [
  {
    id: "res-redis-dev-guide",
    name: "Redis Associate Developer Certification Exam Guide",
    description: "Official comprehensive study guide and key concepts for the Redis Certified Developer examination.",
    imageUrl: "/logos/redis.svg",
    accessUrl: "https://cdn.sanity.io/files/sy1jschh/production/9509c5b4ca38aced819831fd2dfd4253370d8f5d.pdf",
    resourceType: "file",
    isFree: true,
    priceInr: 0,
    provider: "Redis",
    category: "Exam Guide",
    tags: ["Redis", "NoSQL", "Database", "Certification"],
    isPublished: true,
    createdAt: "2026-08-20T00:00:00Z",
  },
  {
    id: "res-aws-saa-blueprint",
    name: "AWS Solutions Architect Associate (SAA-C03) Exam Blueprint",
    description: "In-depth architecture patterns, VPC design, IAM policies, and high-availability cheat sheets.",
    imageUrl: "/logos/aws.svg",
    accessUrl: "https://d1.awsstatic.com/training-and-certification/docs-sa-assoc/AWS-Certified-Solutions-Architect-Associate_Exam-Guide.pdf",
    resourceType: "file",
    isFree: true,
    priceInr: 0,
    provider: "AWS",
    category: "Study Guide",
    tags: ["AWS", "Cloud", "Solutions Architect", "SAA-C03"],
    isPublished: true,
    createdAt: "2026-08-15T00:00:00Z",
  },
  {
    id: "res-azure-az104-cheatsheet",
    name: "Microsoft Azure Administrator (AZ-104) Study Sheet",
    description: "Comprehensive review of Azure identities, governance, storage, virtual networks, and backup strategies.",
    imageUrl: "/logos/azure.svg",
    accessUrl: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-104",
    resourceType: "link",
    isFree: true,
    priceInr: 0,
    provider: "Azure",
    category: "Cheat Sheet",
    tags: ["Azure", "Microsoft", "AZ-104", "Administration"],
    isPublished: true,
    createdAt: "2026-08-10T00:00:00Z",
  },
  {
    id: "res-gcp-ace-handbook",
    name: "GCP Associate Cloud Engineer (ACE) Study Handbook",
    description: "Core Google Cloud services, IAM permissions, GKE deployment commands, and Cloud Storage configurations.",
    imageUrl: "/logos/gcp.svg",
    accessUrl: "https://cloud.google.com/learn/certification/guides/cloud-engineer",
    resourceType: "link",
    isFree: true,
    priceInr: 0,
    provider: "GCP",
    category: "Handbook",
    tags: ["GCP", "Google Cloud", "ACE", "DevOps"],
    isPublished: true,
    createdAt: "2026-08-05T00:00:00Z",
  },
  {
    id: "res-k8s-cka-cheatsheet",
    name: "Certified Kubernetes Administrator (CKA) Command Reference",
    description: "Must-know kubectl commands, pod troubleshooting templates, and cluster maintenance blueprints.",
    imageUrl: "/logos/kubernetes.svg",
    accessUrl: "https://kubernetes.io/docs/reference/kubectl/cheatsheet/",
    resourceType: "link",
    isFree: true,
    priceInr: 0,
    provider: "Kubernetes",
    category: "Reference",
    tags: ["Kubernetes", "CKA", "Containers", "DevOps"],
    isPublished: true,
    createdAt: "2026-08-01T00:00:00Z",
  },
];

// Helper to timeout slow network requests
function withTimeout<T>(promise: PromiseLike<T>, ms = 3500, fallback: T): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/** Fetch all published resources (cached with fallback). Filters applied client-side. */
export async function listResources(): Promise<Resource[]> {
  if (_catalogCache && Date.now() - _catalogAt < CATALOG_TTL_MS) {
    return _catalogCache;
  }

  try {
    const fetchPromise = supabase
      .from("resources")
      .select("id,name,description,image_url,resource_type,is_free,price_inr,provider,category,tags,is_published,created_at")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    const { data, error } = await withTimeout(fetchPromise, 3500, { data: null, error: null } as any);

    if (error || !data || data.length === 0) {
      _catalogCache = FALLBACK_RESOURCES;
      _catalogAt = Date.now();
      return _catalogCache;
    }

    _catalogCache = data.map(toResource);
    _catalogAt = Date.now();
    return _catalogCache;
  } catch (err) {
    console.warn("⚠️ Using fallback resources catalog:", err);
    return FALLBACK_RESOURCES;
  }
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

  return accessUrl;
}


// ─────────────────────────────────────────────────────────────
// My Resources (authenticated user)
// ─────────────────────────────────────────────────────────────

export async function listMyResources(): Promise<MyResource[]> {
  try {
    const fetchPromise = supabase
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

    const { data, error } = await withTimeout(fetchPromise, 3500, { data: null, error: null } as any);

    if (error || !data) {
      return [];
    }

    return data.map((r: any) => ({
      id: r.id,
      resourceId: r.resource_id,
      name: r.resources?.name ?? "Resource",
      description: r.resources?.description ?? "",
      imageUrl: r.resources?.image_url ?? "",
      accessUrl: r.resources?.access_url ?? "",
      provider: r.resources?.provider ?? "",
      category: r.resources?.category ?? "",
      resourceType: r.resources?.resource_type === "file" ? "file" : "link",
      accessedAt: r.accessed_at,
    }));
  } catch (err) {
    console.warn("⚠️ listMyResources failed or timed out:", err);
    return [];
  }
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
