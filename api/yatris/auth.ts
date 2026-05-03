import type { VercelRequest, VercelResponse } from '@vercel/node';

const API_URL_AUTH = process.env.VITE_API_URL_AUTH || '';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') return response.status(200).end();
  if (!API_URL_AUTH) return response.status(500).json({ error: 'VITE_API_URL_AUTH not configured' });

  try {
    let url = API_URL_AUTH;
    const options: any = {
      method: request.method,
      headers: { 'Content-Type': 'application/json' },
    };

    if (request.method === 'GET') {
      const query = new URLSearchParams(request.query as any).toString();
      if (query) url += (url.includes('?') ? '&' : '?') + query;
    } else {
      options.body = JSON.stringify(request.body);
    }

    const res = await fetch(url, options);
    const data = await res.json();
    return response.status(200).json(data);
  } catch (error: any) {
    return response.status(500).json({ error: error.message });
  }
}
