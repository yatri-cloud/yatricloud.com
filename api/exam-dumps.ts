import type { VercelRequest, VercelResponse } from '@vercel/node';

const EXAM_DUMPS_WEBHOOK_URL = process.env.VITE_EXAM_DUMPS_WEBHOOK_URL || '';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // Enable CORS
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-Requested-With, Content-Type, Accept',
  );

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (!EXAM_DUMPS_WEBHOOK_URL) {
    return response.status(500).json({ error: 'EXAM_DUMPS_WEBHOOK_URL not configured' });
  }

  try {
    let url = EXAM_DUMPS_WEBHOOK_URL;
    const fetchOptions: any = {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (request.method === 'GET' && request.query) {
      const params = new URLSearchParams();
      Object.entries(request.query).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
      if (params.toString()) {
        url += (url.includes('?') ? '&' : '?') + params.toString();
      }
    } else if (request.method === 'POST') {
      fetchOptions.body = JSON.stringify(request.body);
    }

    const proxyResponse = await fetch(url, fetchOptions);
    const data = await proxyResponse.json();
    
    return response.status(200).json(data);
  } catch (error: any) {
    console.error('Proxy error:', error);
    return response.status(500).json({ error: 'Proxy error', message: error.message });
  }
}
