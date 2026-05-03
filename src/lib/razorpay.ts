/**
 * Razorpay Payment Integration Utility
 */

export interface RazorpayOptions {
  amount: number; // Amount in rupees (not paise)
  currency: string;
  eventName: string;
  userDetails: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

/**
 * Initialize and open Razorpay payment modal
 */
export function initiateRazorpayPayment(
  options: RazorpayOptions,
  onSuccess: (response: RazorpayResponse) => void,
  onFailure: (error: any) => void
): void {
  const key = import.meta.env.VITE_RAZORPAY_KEY_ID;

  if (!key) {
    console.error('Razorpay Key ID not configured');
    onFailure({ error: 'Payment gateway not configured. Please contact administrator.' });
    return;
  }

  if (!window.Razorpay) {
    console.error('Razorpay script not loaded');
    onFailure({ error: 'Payment system not available. Please refresh and try again.' });
    return;
  }

  const razorpayOptions = {
    key: key,
    amount: Math.round(options.amount * 100), // Convert to paise
    currency: options.currency,
    name: 'Yatri Cloud Events',
    description: `Registration for ${options.eventName}`,
    image: 'https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/Logo/yatricloud-round-transparent.png',
    handler: function (response: RazorpayResponse) {
      onSuccess(response);
    },
    prefill: {
      name: options.userDetails.name,
      email: options.userDetails.email,
      contact: options.userDetails.phone,
    },
    notes: {
      event: options.eventName,
    },
    theme: {
      color: '#3B82F6', // Primary blue color
    },
    modal: {
      ondismiss: function () {
        onFailure({ error: 'Payment cancelled by user' });
      }
    }
  };

  try {
    const razorpayInstance = new window.Razorpay(razorpayOptions);

    razorpayInstance.on('payment.failed', function (response: any) {
      onFailure({
        error: response.error.description || 'Payment failed',
        code: response.error.code,
        reason: response.error.reason
      });
    });

    razorpayInstance.open();
  } catch (error) {
    console.error('Error opening Razorpay:', error);
    onFailure({ error: 'Failed to open payment gateway' });
  }
}

/**
 * Format amount for display (₹499 or Free)
 */
export function formatEventPrice(price: string | number | undefined): string {
  if (!price || price === 0 || price === '0') {
    return 'Free';
  }

  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return `₹${numPrice.toFixed(0)}`;
}

/**
 * Check if event is paid
 */
export function isEventPaid(price: string | number | undefined): boolean {
  if (!price) return false;
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return numPrice > 0;
}

// ------------------------------------------------------------------
// Legacy Support & CartSheet.tsx Compatibility
// ------------------------------------------------------------------

export const isTestMode = () => {
  return import.meta.env.VITE_RAZORPAY_KEY_ID?.startsWith("rzp_test_");
};

export const createRazorpayOrder = async (orderData: any) => {
  try {
    // Determine Base URL
    // Determine Base URL
    let API_BASE_URL = "";

    if (import.meta.env.PROD) {
      // In production (Vercel), ALWAYS use relative path to hit Vercel functions (same origin)
      // This ignores any incorrect VITE_API_BASE_URL set in env vars
      API_BASE_URL = "";
    } else {
      // In development, use env var or default to localhost
      API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    }

    const requestUrl = `${API_BASE_URL}/api/razorpay/create-order`;
    console.log("💳 Creating order via:", requestUrl);

    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create order: ${response.statusText}`);
    }

    const data = await response.json();
    return data.orderId;
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    throw error;
  }
};

export function initiatePayment(
  orderId: string,
  amount: number,
  productName: string,
  customerName: string,
  email: string,
  phone: string,
  onSuccess: (paymentId: string) => void,
  onFailure: (error: string) => void
) {
  const key = import.meta.env.VITE_RAZORPAY_KEY_ID;

  if (!key) {
    onFailure("Razorpay Key ID not configured");
    return;
  }

  const options = {
    key: key,
    amount: amount,
    currency: "INR",
    name: "Yatri Cloud",
    description: productName,
    order_id: orderId,
    image: "https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/Logo/yatricloud-round-transparent.png",
    handler: function (response: any) {
      onSuccess(response.razorpay_payment_id);
    },
    prefill: {
      name: customerName,
      email: email,
      contact: phone,
    },
    theme: {
      color: "#3B82F6",
    },
    modal: {
      ondismiss: function () {
        onFailure('Payment cancelled by user');
      }
    }
  };

  try {
    const razorpay = new window.Razorpay(options);
    razorpay.on("payment.failed", function (response: any) {
      onFailure(response.error.description || "Payment failed");
    });
    razorpay.open();
  } catch (error) {
    console.error("Error opening Razorpay:", error);
    onFailure("Failed to open payment gateway");
  }
}
