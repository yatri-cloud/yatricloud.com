/**
 * Vercel Serverless Function - Yatris Users API Proxy
 * 
 * Endpoint: /api/yatris-proxy
 * 
 * This function proxies requests to Google Apps Script to avoid CORS issues
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const YATRIS_API_URL = process.env.YATRIS_USERS_API_URL || '';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // Enable CORS
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
  );

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  if (!YATRIS_API_URL) {
    return response.status(500).json({
      error: 'Server configuration error',
      message: 'YATRIS_USERS_API_URL not configured',
    });
  }

  try {
    // Build URL with query params for GET requests
    let url = YATRIS_API_URL;
    if (request.method === 'GET' && request.query) {
      const params = new URLSearchParams();
      Object.entries(request.query).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
      if (params.toString()) {
        url += '?' + params.toString();
      }
    }

    // Forward the request to Google Apps Script
    const proxyResponse = await fetch(url, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: request.method === 'POST' ? JSON.stringify(request.body) : undefined,
    });

    const contentType = proxyResponse.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await proxyResponse.json();
    } else {
      const text = await proxyResponse.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: 'Invalid response', message: text };
      }
    }

    if (!proxyResponse.ok) {
      return response.status(proxyResponse.status).json(data);
    }

    return response.status(200).json(data);
  } catch (error: any) {
    console.error('❌ Proxy error:', error);
    return response.status(500).json({
      error: 'Proxy error',
      message: error.message,
    });
  }
}
