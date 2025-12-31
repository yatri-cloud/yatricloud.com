/**
 * Vercel Serverless Function - Udemy Course Image Proxy
 * 
 * Endpoint: /api/udemy/image/[courseSlug]
 * 
 * This function proxies course images from Udemy CDN with authentication
 * to avoid CORS and access denied errors.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // Enable CORS
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
  );

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  try {
    const { courseSlug } = request.query;

    if (!courseSlug || typeof courseSlug !== 'string') {
      return response.status(400).json({ error: 'Course slug is required' });
    }

    // Get token from environment variables
    const UDEMY_INSTRUCTOR_TOKEN = process.env.UDEMY_INSTRUCTOR_TOKEN;

    if (!UDEMY_INSTRUCTOR_TOKEN) {
      return response.status(500).json({
        error: 'Server configuration error',
        message: 'UDEMY_INSTRUCTOR_TOKEN not configured',
      });
    }

    // Try different image sizes
    const imageSizes = ['480x270', '240x135', '750x422', '125_H'];
    const baseUrl = 'https://img-c.udemycdn.com/course';

    const authHeader = UDEMY_INSTRUCTOR_TOKEN.startsWith('bearer ')
      ? UDEMY_INSTRUCTOR_TOKEN
      : `bearer ${UDEMY_INSTRUCTOR_TOKEN}`;

    // Try to fetch the image with authentication
    for (const size of imageSizes) {
      const imageUrl = `${baseUrl}/${size}/${courseSlug}/`;

      try {
        const imageResponse = await fetch(imageUrl, {
          method: 'GET',
          headers: {
            Authorization: authHeader,
            Referer: 'https://www.udemy.com/',
          },
        });

        if (imageResponse.ok) {
          // Forward the image
          const imageBuffer = await imageResponse.arrayBuffer();
          const contentType =
            imageResponse.headers.get('content-type') || 'image/jpeg';

          response.setHeader('Content-Type', contentType);
          response.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
          return response.send(Buffer.from(imageBuffer));
        }
      } catch (error) {
        // Try next size
        continue;
      }
    }

    // If all fail, return 404
    return response.status(404).json({ error: 'Image not found' });
  } catch (error: any) {
    console.error('❌ Error fetching course image:', error);
    return response.status(500).json({ error: 'Internal server error' });
  }
}

