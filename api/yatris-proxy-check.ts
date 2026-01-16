/**
 * Diagnostic endpoint to check if environment variables are configured
 * Access at: /api/yatris-proxy-check
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // Enable CORS
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  const yatrisUrl = process.env.YATRIS_USERS_API_URL;
  
  return response.status(200).json({
    configured: !!yatrisUrl,
    variableName: 'YATRIS_USERS_API_URL',
    value: yatrisUrl ? `${yatrisUrl.substring(0, 50)}...` : 'NOT SET',
    allEnvVars: {
      YATRIS_USERS_API_URL: yatrisUrl || 'NOT SET',
      NODE_ENV: process.env.NODE_ENV || 'NOT SET',
    },
    instructions: yatrisUrl ? 
      '✅ Environment variable is configured!' : 
      '❌ Please add YATRIS_USERS_API_URL to Vercel environment variables and redeploy.',
  });
}
