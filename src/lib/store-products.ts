/**
 * Store Products Integration Service
 * Reads: Supabase (`products` table) when VITE_USE_SUPABASE, else legacy webhook.
 * Writes: legacy Apps Script path until the admin-auth swap lands.
 */

import { supabase, USE_SUPABASE } from "@/lib/supabase";

const STORE_PRODUCTS_WEBHOOK_URL = import.meta.env.VITE_STORE_PRODUCTS_WEBHOOK_URL || "";

/** DB provider enum → display category used across the store UI. */
const PROVIDER_TO_CATEGORY: Record<string, StoreProduct["category"]> = {
  AWS: "AWS", AZURE: "Azure", GCP: "GCP", ORACLE: "Oracle",
  SALESFORCE: "Salesforce", SERVICENOW: "ServiceNow", GITHUB: "GitHub",
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

/**
 * Fetch products from Google Sheets
 */
export async function fetchStoreProducts(): Promise<StoreProduct[]> {
  if (USE_SUPABASE) {
    const { data, error } = await supabase
      .from("products")
      .select("id,title,provider,exam_code,level,original_price_inr,discounted_price_inr,image_url,description,status")
      .eq("status", "published")
      .order("created_at", { ascending: false });
    if (!error && data) {
      return data
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
    console.error("❌ Supabase products fetch failed, falling back:", error?.message);
  }
  if (!STORE_PRODUCTS_WEBHOOK_URL) {
    console.warn("⚠️ Store products webhook URL not configured. No products will be loaded.");
    return [];
  }

  try {
    console.log("📥 Fetching products from Google Sheets:", STORE_PRODUCTS_WEBHOOK_URL);
    
    const response = await fetch(STORE_PRODUCTS_WEBHOOK_URL, {
      method: "GET",
      mode: "cors",
    });

    if (!response.ok) {
      console.error("❌ Failed to fetch products:", response.status);
      return [];
    }

    const data = await response.json();
    
    let products: StoreProduct[] = [];
    if (data.products && Array.isArray(data.products)) {
      products = data.products;
    } else if (Array.isArray(data)) {
      products = data;
    } else {
      console.warn("⚠️ Unexpected response format from store webhook:", data);
      return [];
    }

    // Normalize and validate products
    const normalizedProducts = products.map((product: any) => ({
      id: product.id || `product-${Date.now()}-${Math.random()}`,
      title: product.title || '',
      category: product.category || 'AWS',
      originalPrice: parseFloat(product.originalPrice ?? product.originalprice ?? 0),
      discountedPrice: parseFloat(product.discountedPrice ?? product.discountedprice ?? 0),
      discount: parseFloat(product.discount ?? 0),
      image: product.image || '',
      description: product.description || '',
      examCode: product.examCode || product.examcode || '',
      level: product.level || 'Associate',
      status: product.status || 'active',
    })).filter((product: StoreProduct) => 
      product.status === 'active' && 
      product.title && 
      product.discountedPrice > 0
    );

    console.log(`✅ Fetched ${normalizedProducts.length} products from Google Sheets`);
    return normalizedProducts;
    
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    return [];
  }
}

/**
 * Submit product to Google Sheets
 */
export async function submitProduct(product: Omit<StoreProduct, 'id' | 'status'>): Promise<void> {
  const CATEGORY_TO_PROVIDER: Record<string, string> = {
    AWS: 'AWS', Azure: 'AZURE', GCP: 'GCP', Oracle: 'ORACLE',
    Salesforce: 'SALESFORCE', ServiceNow: 'SERVICENOW', GitHub: 'GITHUB',
  };
  const { error } = await supabase.from('products').insert({
    title: product.title,
    provider: CATEGORY_TO_PROVIDER[product.category] ?? 'OTHER',
    exam_code: product.examCode || null,
    level: product.level,
    original_price_inr: product.originalPrice,
    discounted_price_inr: product.discountedPrice,
    image_url: product.image || null,
    description: product.description || null,
    status: 'published',
  });
  if (error) {
    console.error('❌ Error submitting product:', error.message);
    throw new Error(error.message);
  }
}

