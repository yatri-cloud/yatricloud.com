// Razorpay integration utilities

declare global {
  interface Window {
    Razorpay: any;
  }
}

// Public Razorpay Key ID – must be provided via Vite env (VITE_RAZORPAY_KEY_ID)
// Never hard-code keys in the source; they should come from environment variables.
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID ?? "";
// For local dev, set VITE_API_BASE_URL=http://localhost:3001
// In production on Vercel, leave VITE_API_BASE_URL empty so we use relative /api path
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

// Check if we're in test mode
export const isTestMode = () => {
  return RAZORPAY_KEY.startsWith('rzp_test_');
};

export const loadRazorpayScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay script"));
    document.body.appendChild(script);
  });
};

export interface RazorpayOrder {
  amount: number; // in paise
  currency: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export const createRazorpayOrder = async (orderData: RazorpayOrder): Promise<string> => {
  try {
    if (!RAZORPAY_KEY) {
      throw new Error("Razorpay key is not configured. Please set VITE_RAZORPAY_KEY_ID in environment variables.");
    }

    const url = API_BASE_URL
      ? `${API_BASE_URL}/api/razorpay/create-order`
      : `/api/razorpay/create-order`;

    console.log('Creating Razorpay order:', { url, amount: orderData.amount });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || `HTTP error! status: ${response.status}` };
      }
      console.error('Razorpay API error:', errorData);
      throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Razorpay order created successfully:', data.orderId);
    return data.orderId;
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    throw error;
  }
};

export const initiatePayment = async (
  orderId: string,
  amount: number,
  productName: string,
  customerName: string = "Customer",
  customerEmail: string = "",
  customerContact: string = "",
  onSuccess: (paymentId: string) => void,
  onError: (error: string) => void
) => {
  try {
    await loadRazorpayScript();

    if (!window.Razorpay) {
      throw new Error("Razorpay script failed to load");
    }

    const testMode = isTestMode();
    
    const options: any = {
      key: RAZORPAY_KEY,
      amount: amount, // amount in paise
      currency: "INR",
      name: "Yatri Cloud",
      description: productName,
      order_id: orderId,
      handler: function (response: any) {
        // Handle successful payment
        // In production, verify payment on backend before calling onSuccess
        onSuccess(response.razorpay_payment_id);
      },
      prefill: {
        name: customerName,
        email: customerEmail,
        contact: customerContact,
      },
      theme: {
        color: "#007CFF", // Yatri Cloud brand color
      },
      modal: {
        ondismiss: function () {
          onError("Payment cancelled by user");
        },
      },
      notes: {
        product: productName,
        test_mode: testMode ? "true" : "false",
      },
      // Set read_only to restrict card input
      read_only: {
        email: false,
        contact: false,
        name: false,
      },
    };

    // Configure payment methods for test mode
    if (testMode) {
      // In test mode, prefer cards but let Razorpay decide actual availability
      options.method = {
        card: true,
        netbanking: true,
        wallet: true,
        upi: true,
        emi: true,
        paylater: true,
      };
      
      // Ensure Indian phone format
      if (!options.prefill.contact || options.prefill.contact.length < 10) {
        options.prefill.contact = "9999999999";
      }
      
      // Add image
      options.image = "https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/Logo/yatricloud-round-transparent.png";
    }

    const razorpay = new window.Razorpay(options);
    razorpay.on("payment.failed", function (response: any) {
      onError(response.error.description || "Payment failed");
    });
    razorpay.open();
  } catch (error) {
    console.error("Error initiating payment:", error);
    onError(error instanceof Error ? error.message : "Failed to initiate payment");
  }
};

