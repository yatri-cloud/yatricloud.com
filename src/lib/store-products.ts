/**
 * Store Products — Supabase `products` table (read + admin write).
 */

import { supabase } from "@/lib/supabase";

/** DB provider enum → display category used across the store UI. */
const PROVIDER_TO_CATEGORY: Record<string, StoreProduct["category"]> = {
  AWS: "AWS", AZURE: "Azure", GCP: "GCP", ORACLE: "Oracle",
  SALESFORCE: "Salesforce", SERVICENOW: "ServiceNow", GITHUB: "GitHub",
};
const CATEGORY_TO_PROVIDER: Record<string, string> = {
  AWS: "AWS", Azure: "AZURE", GCP: "GCP", Oracle: "ORACLE",
  Salesforce: "SALESFORCE", ServiceNow: "SERVICENOW", GitHub: "GITHUB",
};

export interface StoreProduct {
  id: string;
  title: string;
  category: "AWS" | "Azure" | "GCP" | "Oracle" | "Salesforce" | "ServiceNow" | "GitHub";
  originalPrice: number;
  discountedPrice: number;
  discount: number;
  image: string;
  description: string;
  examCode?: string;
  level: "Associate" | "Practitioner" | "Professional" | "Specialty";
  status?: string;
}

/** Fetch published store products. */
export async function fetchStoreProducts(): Promise<StoreProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id,title,provider,exam_code,level,original_price_inr,discounted_price_inr,image_url,description,status")
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("❌ Error fetching products:", error.message);
    return [];
  }
  return (data || [])
    .map((p) => {
      const orig = Number(p.original_price_inr ?? 0);
      const disc = Number(p.discounted_price_inr ?? 0);
      return {
        id: p.id,
        title: p.title || "",
        category: PROVIDER_TO_CATEGORY[p.provider] ?? "AWS",
        originalPrice: orig,
        discountedPrice: disc,
        discount: orig > 0 ? Math.round(((orig - disc) / orig) * 100) : 0,
        image: p.image_url || "",
        description: p.description || "",
        examCode: p.exam_code || "",
        level: (p.level as StoreProduct["level"]) || "Associate",
        status: "active",
      } satisfies StoreProduct;
    })
    .filter((p) => p.title && p.discountedPrice > 0);
}

const toRow = (p: Partial<Omit<StoreProduct, "id">>) => ({
  ...(p.title !== undefined ? { title: p.title } : {}),
  ...(p.category !== undefined ? { provider: CATEGORY_TO_PROVIDER[p.category] ?? "OTHER" } : {}),
  ...(p.examCode !== undefined ? { exam_code: p.examCode || null } : {}),
  ...(p.level !== undefined ? { level: p.level } : {}),
  ...(p.originalPrice !== undefined ? { original_price_inr: p.originalPrice } : {}),
  ...(p.discountedPrice !== undefined ? { discounted_price_inr: p.discountedPrice } : {}),
  ...(p.image !== undefined ? { image_url: p.image || null } : {}),
  ...(p.description !== undefined ? { description: p.description || null } : {}),
  ...(p.status !== undefined ? { status: p.status } : {}),
});

/** Add a product (admin — enforced by RLS). */
export async function submitProduct(product: Omit<StoreProduct, "id" | "status">): Promise<void> {
  const { error } = await supabase.from("products").insert({ ...toRow(product), status: "published" });
  if (error) { console.error("❌ Error submitting product:", error.message); throw new Error(error.message); }
}

/** Admin: list ALL products (any status) with their real DB status. */
export async function listAllProducts(): Promise<StoreProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id,title,provider,exam_code,level,original_price_inr,discounted_price_inr,image_url,description,status")
    .order("created_at", { ascending: false });
  if (error) { console.error("listAllProducts", error.message); return []; }
  return (data || []).map((p) => {
    const orig = Number(p.original_price_inr ?? 0);
    const disc = Number(p.discounted_price_inr ?? 0);
    return {
      id: p.id, title: p.title || "",
      category: PROVIDER_TO_CATEGORY[p.provider] ?? "AWS",
      originalPrice: orig, discountedPrice: disc,
      discount: orig > 0 ? Math.round(((orig - disc) / orig) * 100) : 0,
      image: p.image_url || "", description: p.description || "",
      examCode: p.exam_code || "", level: (p.level as StoreProduct["level"]) || "Associate",
      status: p.status || "draft",
    } satisfies StoreProduct;
  });
}

/** Admin: update a product (partial). */
export async function updateProduct(id: string, patch: Partial<Omit<StoreProduct, "id">>): Promise<void> {
  const { error } = await supabase.from("products").update(toRow(patch)).eq("id", id);
  if (error) { console.error("updateProduct", error.message); throw new Error(error.message); }
}

/** Admin: set a product's publish status. */
export async function setProductStatus(id: string, status: "published" | "draft"): Promise<void> {
  const { error } = await supabase.from("products").update({ status }).eq("id", id);
  if (error) { console.error("setProductStatus", error.message); throw new Error(error.message); }
}

/** Admin: delete a product. */
export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) { console.error("deleteProduct", error.message); throw new Error(error.message); }
}
