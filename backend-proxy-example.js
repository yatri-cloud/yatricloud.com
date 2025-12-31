/**
 * Backend Proxy Server Example for Udemy API
 * 
 * This is a simple Express.js server that acts as a proxy between your frontend
 * and the Udemy API. This keeps your API credentials secure on the server.
 * 
 * To use this:
 * 1. Install dependencies: npm install express cors dotenv
 * 2. Create a .env file with: UDEMY_CLIENT_ID and UDEMY_CLIENT_SECRET
 * 3. Run: node backend-proxy-example.js
 * 4. Update your frontend to call http://localhost:3001/api/udemy/courses
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Udemy API credentials (from .env file)
const UDEMY_CLIENT_ID = process.env.UDEMY_CLIENT_ID;
const UDEMY_CLIENT_SECRET = process.env.UDEMY_CLIENT_SECRET;

if (!UDEMY_CLIENT_ID || !UDEMY_CLIENT_SECRET) {
  console.error('Error: UDEMY_CLIENT_ID and UDEMY_CLIENT_SECRET must be set in .env file');
  process.exit(1);
}

// Create Basic Auth header
const authHeader = 'Basic ' + Buffer.from(`${UDEMY_CLIENT_ID}:${UDEMY_CLIENT_SECRET}`).toString('base64');

/**
 * Proxy endpoint to fetch Udemy courses
 * GET /api/udemy/courses
 * Query params: page, page_size, search, category
 */
app.get('/api/udemy/courses', async (req, res) => {
  try {
    const { page = 1, page_size = 12, search, category } = req.query;
    
    const baseUrl = 'https://www.udemy.com/api-2.0/courses/';
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: page_size.toString(),
      ordering: 'highest-rated',
      fields: [
        'id',
        'title',
        'url',
        'is_paid',
        'price',
        'price_detail',
        'visible_instructors',
        'image_240x135',
        'image_480x270',
        'headline',
        'num_subscribers',
        'avg_rating',
        'num_reviews',
        'locale',
        'created',
      ].join(','),
    });

    if (search) {
      params.append('search', search);
    }

    if (category) {
      params.append('category', category);
    }

    const url = `${baseUrl}?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: 'Udemy API error',
        message: errorText,
        status: response.status,
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching Udemy courses:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Udemy API Proxy Server running on http://localhost:${PORT}`);
  console.log(`📚 Courses endpoint: http://localhost:${PORT}/api/udemy/courses`);
});

