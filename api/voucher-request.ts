import type { VercelRequest, VercelResponse } from '@vercel/node';

const VOUCHER_API_URL = process.env.VOUCHER_REQUEST_WEBHOOK_URL || '';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // Enable CORS
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
  );

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!VOUCHER_API_URL) {
    return response.status(500).json({
      success: false,
      error: 'Server configuration error',
      message: 'VOUCHER_REQUEST_WEBHOOK_URL not configured.',
    });
  }

  try {
    const proxyResponse = await fetch(VOUCHER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request.body),
    });

    const data = await proxyResponse.json();
    return response.status(200).json(data);
  } catch (error: any) {
    console.error('❌ Proxy error:', error);
    return response.status(500).json({
      success: false,
      error: 'Proxy error',
      message: error.message || 'Failed to connect to the spreadsheet server.',
    });
  }
}
