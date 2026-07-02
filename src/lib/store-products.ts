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

/** Add a product (admin — enforced by RLS). */
export async function submitProduct(product: Omit<StoreProduct, "id" | "status">): Promise<void> {
  const { error } = await supabase.from("products").insert({
    title: product.title,
    provider: CATEGORY_TO_PROVIDER[product.category] ?? "OTHER",
    exam_code: product.examCode || null,
    level: product.level,
    original_price_inr: product.originalPrice,
    discounted_price_inr: product.discountedPrice,
    image_url: product.image || null,
    description: product.description || null,
    status: "published",
  });
  if (error) {
    console.error("❌ Error submitting product:", error.message);
    throw new Error(error.message);
  }
}
