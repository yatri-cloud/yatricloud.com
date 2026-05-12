/**
 * Service for handling certification voucher requests
 */

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

/**
 * Submit a voucher request to the backend
 */
export async function submitVoucherRequest(data: VoucherRequestData) {
  try {
    const response = await fetch('/api/voucher-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to submit request');
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error submitting voucher request:', error);
    throw error;
  }
}
