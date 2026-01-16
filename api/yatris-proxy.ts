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
    console.error('❌ YATRIS_USERS_API_URL not configured');
    console.error('❌ Available env vars:', Object.keys(process.env).filter(k => k.includes('YATRIS')));
    return response.status(500).json({
      success: false,
      error: 'Server configuration error',
      message: 'YATRIS_USERS_API_URL not configured. Please add this environment variable in Vercel and redeploy.',
      help: 'Visit /api/yatris-proxy-check to verify environment variables',
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

    console.log(`📤 Proxying ${request.method} request to: ${url.substring(0, 50)}...`);

    // Forward the request to Google Apps Script
    const proxyResponse = await fetch(url, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: request.method === 'POST' ? JSON.stringify(request.body) : undefined,
    });

    console.log(`📥 Response status: ${proxyResponse.status} ${proxyResponse.statusText}`);

    const contentType = proxyResponse.headers.get('content-type');
    let data;
    
    try {
      if (contentType && contentType.includes('application/json')) {
        data = await proxyResponse.json();
      } else {
        const text = await proxyResponse.text();
        console.log(`📄 Response content type: ${contentType}`);
        console.log(`📄 Response preview: ${text.substring(0, 200)}...`);
        
        // Check if it's an HTML error page (common with Google Apps Script errors)
        if (text.includes('<html') || text.includes('<!DOCTYPE')) {
          return response.status(500).json({
            success: false,
            error: 'Google Apps Script error',
            message: 'The Google Apps Script returned an HTML error page. Please check the script deployment and logs.',
          });
        }
        
        try {
          data = JSON.parse(text);
        } catch {
          data = { 
            success: false, 
            error: 'Invalid response format', 
            message: `Expected JSON but received: ${contentType || 'unknown'}. Response: ${text.substring(0, 500)}` 
          };
        }
      }

      // Check if response indicates an error (even if status is 200)
      if (data.error || (data.success === false)) {
        return response.status(proxyResponse.ok ? 200 : proxyResponse.status).json({
          success: false,
          error: data.error || 'Request failed',
          message: data.message || data.error,
        });
      }

      // If status is not ok, return error
      if (!proxyResponse.ok) {
        return response.status(proxyResponse.status).json({
          success: false,
          error: data.error || 'Request failed',
          message: data.message || `Server returned ${proxyResponse.status}`,
        });
      }

      return response.status(200).json(data);
    } catch (parseError: any) {
      console.error('❌ Error parsing response:', parseError);
      return response.status(proxyResponse.ok ? 200 : proxyResponse.status).json({
        success: false,
        error: 'Response parsing error',
        message: parseError.message,
      });
    }
  } catch (error: any) {
    console.error('❌ Proxy error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause,
    });
    
    // Check if it's a network error
    if (error.message && (error.message.includes('fetch') || error.message.includes('network'))) {
      return response.status(500).json({
        success: false,
        error: 'Network error',
        message: 'Failed to connect to Google Apps Script. Please check if the script is deployed and accessible.',
      });
    }
    
    return response.status(500).json({
      success: false,
      error: 'Proxy error',
      message: error.message || 'Failed to connect to server. Please check Vercel logs for details.',
    });
  }
}
