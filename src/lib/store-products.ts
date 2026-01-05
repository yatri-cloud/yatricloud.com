/**
 * Store Products Integration Service
 * 
 * Fetches products from Google Sheets via Apps Script webhook
 */

const STORE_PRODUCTS_WEBHOOK_URL = import.meta.env.VITE_STORE_PRODUCTS_WEBHOOK_URL || "";

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
  const webhookUrl = STORE_PRODUCTS_WEBHOOK_URL;
  
  if (!webhookUrl) {
    throw new Error('Store products webhook URL not configured. Please set VITE_STORE_PRODUCTS_WEBHOOK_URL in .env');
  }

  try {
    // Use no-cors mode to bypass CORS limitations of Google Apps Script.
    // We can't read the JSON response, but the data will still be written to the sheet.
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({
        ...product,
        timestamp: new Date().toISOString(),
      }),
    });
    console.log('✅ Product submitted to Google Sheets (no-cors mode). Check sheet to confirm.');
    
  } catch (error) {
    console.error('❌ Error submitting product:', error);
    throw error;
  }
}

