/**
 * Vercel Serverless Function - Canva Image Generation
 * 
 * Endpoint: /api/canva/generate-image
 * 
 * This function generates images from Canva templates using the Canva Connect API
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

interface CanvaGenerateRequest {
  templateId: string;
  data: {
    name: string;
    photoUrl: string;
    certifications?: string;
    country?: string;
    [key: string]: any;
  };
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // Enable CORS
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
  );

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { templateId, data }: CanvaGenerateRequest = request.body;

    if (!templateId) {
      return response.status(400).json({ error: 'templateId is required' });
    }

    if (!data) {
      return response.status(400).json({ error: 'data is required' });
    }

    // Get Canva API credentials from environment
    const CANVA_CLIENT_ID = process.env.CANVA_CLIENT_ID;
    const CANVA_CLIENT_SECRET = process.env.CANVA_CLIENT_SECRET;

    if (!CANVA_CLIENT_ID || !CANVA_CLIENT_SECRET) {
      return response.status(500).json({
        error: 'Server configuration error',
        message: 'Canva API credentials not configured. Please set CANVA_CLIENT_ID and CANVA_CLIENT_SECRET',
      });
    }

    // Step 1: Get OAuth token using client credentials flow
    // For server-to-server operations, we use client_credentials grant type
    const tokenResponse = await fetch('https://api.canva.com/rest/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CANVA_CLIENT_ID,
        client_secret: CANVA_CLIENT_SECRET,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Canva OAuth error:', errorText);
      return response.status(500).json({
        error: 'Failed to authenticate with Canva',
        message: errorText,
      });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Step 2: Create a design from template with autofill data
    const designResponse = await fetch(`https://api.canva.com/rest/v1/designs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template_id: templateId,
        autofill: {
          // Map your data to Canva template variables
          // Adjust these based on your Canva template variable names
          name: data.name,
          photo: data.photoUrl,
          certifications: data.certifications || '',
          country: data.country || '',
        },
      }),
    });

    if (!designResponse.ok) {
      const errorText = await designResponse.text();
      console.error('Canva design creation error:', errorText);
      return response.status(500).json({
        error: 'Failed to create design',
        message: errorText,
      });
    }

    const designData = await designResponse.json();
    const designId = designData.id;

    // Step 3: Export the design as PNG
    const exportResponse = await fetch(`https://api.canva.com/rest/v1/exports`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        design_id: designId,
        format: 'png',
        quality: 'high',
      }),
    });

    if (!exportResponse.ok) {
      const errorText = await exportResponse.text();
      console.error('Canva export error:', errorText);
      return response.status(500).json({
        error: 'Failed to export design',
        message: errorText,
      });
    }

    const exportData = await exportResponse.json();
    const exportId = exportData.id;

    // Step 4: Poll for export completion
    let exportStatus = 'processing';
    let exportUrl = null;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max wait

    while (exportStatus === 'processing' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

      const statusResponse = await fetch(
        `https://api.canva.com/rest/v1/exports/${exportId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        exportStatus = statusData.status;
        if (statusData.status === 'completed') {
          exportUrl = statusData.url;
        }
      }

      attempts++;
    }

    if (exportStatus !== 'completed' || !exportUrl) {
      return response.status(500).json({
        error: 'Export timeout',
        message: 'Design export took too long to complete',
      });
    }

    // Step 5: Fetch the exported image
    const imageResponse = await fetch(exportUrl);
    if (!imageResponse.ok) {
      return response.status(500).json({
        error: 'Failed to fetch exported image',
      });
    }

    const imageBuffer = await imageResponse.arrayBuffer();

    // Return the image
    response.setHeader('Content-Type', 'image/png');
    response.setHeader('Content-Disposition', `attachment; filename="${data.name.replace(/\s+/g, '_')}_Yatri_Cloud_Certification.png"`);
    return response.send(Buffer.from(imageBuffer));

  } catch (error: any) {
    console.error('❌ Error generating Canva image:', error);
    return response.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
