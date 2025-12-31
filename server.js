/**
 * Udemy Instructor API Proxy Server
 * 
 * Official Documentation: https://www.udemy.com/developers/instructor/
 * 
 * This server acts as a proxy between your frontend and Udemy Instructor API
 * to avoid CORS issues and keep your API token secure.
 * 
 * API Endpoint: https://www.udemy.com/instructor-api/v1/taught-courses/courses/
 * Authentication: Authorization: bearer {token}
 * 
 * Run: node server.js
 * Frontend calls: http://localhost:3001/api/udemy/courses
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Udemy API tokens from .env - support multiple instructors
const UDEMY_INSTRUCTOR_TOKEN = process.env.UDEMY_INSTRUCTOR_TOKEN || process.env.VITE_UDEMY_INSTRUCTOR_TOKEN;
const UDEMY_INSTRUCTOR_TOKEN_NENSI = process.env.UDEMY_INSTRUCTOR_TOKEN_NENSI;

if (!UDEMY_INSTRUCTOR_TOKEN) {
  console.error('❌ Error: UDEMY_INSTRUCTOR_TOKEN not found in .env file');
  console.error('   Please add: UDEMY_INSTRUCTOR_TOKEN=your_token_here');
  process.exit(1);
}

console.log('✅ Udemy Instructor Tokens loaded');
if (UDEMY_INSTRUCTOR_TOKEN_NENSI) {
  console.log('   - Yatharth token: ✅');
  console.log('   - Nensi token: ✅');
} else {
  console.log('   - Yatharth token: ✅');
  console.log('   - Nensi token: ❌ (optional)');
}

/**
 * Fetch courses from a single instructor
 */
async function fetchInstructorCourses(token, page = 1, pageSize = 100) {
  const baseUrl = 'https://www.udemy.com/instructor-api/v1/taught-courses/courses/';
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });

  const courseFields = [
    'id',
    'title',
    'url',
    'is_paid',
    'price',
    'price_detail',
    'visible_instructors',
    'image_240x135',
    'image_480x270',
    'image_125_H',
    'headline',
    'num_subscribers',
    'avg_rating',
    'num_reviews',
    'locale',
    'created',
    'published_title',
  ];
  params.append('fields[course]', courseFields.join(','));

  const url = `${baseUrl}?${params.toString()}`;
  const authHeader = token.startsWith('bearer ') ? token : `bearer ${token}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Udemy API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Fetch all courses from all instructors with pagination
 */
async function fetchAllInstructorCourses(token) {
  const allCourses = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    try {
      const response = await fetchInstructorCourses(token, page, 100);
      if (response.results && response.results.length > 0) {
        allCourses.push(...response.results);
        hasMore = !!response.next;
        page++;
      } else {
        hasMore = false;
      }
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error);
      hasMore = false;
    }
  }

  return allCourses;
}

/**
 * Proxy endpoint to fetch Udemy courses from all instructors
 * GET /api/udemy/courses
 * Query params: creator (optional filter)
 */
app.get('/api/udemy/courses', async (req, res) => {
  try {
    const { creator } = req.query;
    
    console.log('📡 Fetching courses from all instructors...');

    // Fetch from all instructors in parallel
    const fetchPromises = [];
    
    // Yatharth's courses
    const yatharthToken = UDEMY_INSTRUCTOR_TOKEN.startsWith('bearer ') 
      ? UDEMY_INSTRUCTOR_TOKEN 
      : `bearer ${UDEMY_INSTRUCTOR_TOKEN}`;
    fetchPromises.push(fetchAllInstructorCourses(yatharthToken).then(courses => ({
      courses,
      instructor: 'Yatharth Chauhan'
    })));

    // Nensi's courses (if token available)
    if (UDEMY_INSTRUCTOR_TOKEN_NENSI) {
      const nensiToken = UDEMY_INSTRUCTOR_TOKEN_NENSI.startsWith('bearer ') 
        ? UDEMY_INSTRUCTOR_TOKEN_NENSI 
        : `bearer ${UDEMY_INSTRUCTOR_TOKEN_NENSI}`;
      fetchPromises.push(fetchAllInstructorCourses(nensiToken).then(courses => ({
        courses,
        instructor: 'Nensi Ravaliya'
      })));
    }

    // Fetch all courses
    const results = await Promise.all(fetchPromises);
    
    // Merge all courses
    let allCourses = [];
    results.forEach(({ courses, instructor }) => {
      // Add instructor name to each course
      const coursesWithInstructor = courses.map(course => ({
        ...course,
        _instructor: instructor
      }));
      allCourses = allCourses.concat(coursesWithInstructor);
    });

    // Filter by creator if specified
    if (creator && creator !== 'All') {
      allCourses = allCourses.filter(course => {
        const courseInstructor = course._instructor || 
          (course.visible_instructors?.[0]?.title || course.visible_instructors?.[0]?.name || '');
        return courseInstructor === creator;
      });
    }

    // Sort by created date (latest first)
    allCourses.sort((a, b) => {
      const dateA = new Date(a.created || 0).getTime();
      const dateB = new Date(b.created || 0).getTime();
      return dateB - dateA; // Latest first
    });

    console.log(`✅ Fetched ${allCourses.length} total courses from ${results.length} instructor(s)`);

    // Return in same format as single instructor API
    res.json({
      count: allCourses.length,
      next: null,
      previous: null,
      results: allCourses,
    });
  } catch (error) {
    console.error('❌ Server Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * Proxy endpoint to fetch course images
 * GET /api/udemy/image/:courseSlug
 */
app.get('/api/udemy/image/:courseSlug', async (req, res) => {
  try {
    const { courseSlug } = req.params;
    
    // Try different image sizes
    const imageSizes = ['480x270', '240x135', '750x422', '125_H'];
    const baseUrl = 'https://img-c.udemycdn.com/course';
    
    // Try to fetch the image with authentication
    for (const size of imageSizes) {
      const imageUrl = `${baseUrl}/${size}/${courseSlug}/`;
      
      try {
        const authHeader = UDEMY_INSTRUCTOR_TOKEN.startsWith('bearer ') 
          ? UDEMY_INSTRUCTOR_TOKEN 
          : `bearer ${UDEMY_INSTRUCTOR_TOKEN}`;
        
        const response = await fetch(imageUrl, {
          method: 'GET',
          headers: {
            'Authorization': authHeader,
            'Referer': 'https://www.udemy.com/',
          },
        });
        
        if (response.ok) {
          // Forward the image
          const imageBuffer = await response.arrayBuffer();
          const contentType = response.headers.get('content-type') || 'image/jpeg';
          
          res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
          res.send(Buffer.from(imageBuffer));
          return;
        }
      } catch (error) {
        // Try next size
        continue;
      }
    }
    
    // If all fail, return 404
    res.status(404).json({ error: 'Image not found' });
  } catch (error) {
    console.error('❌ Error fetching course image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    tokenLoaded: !!UDEMY_INSTRUCTOR_TOKEN,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Udemy API Proxy Server running on http://localhost:${PORT}`);
  console.log(`📚 Courses endpoint: http://localhost:${PORT}/api/udemy/courses`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log(`\n⚠️  Make sure your frontend calls: http://localhost:${PORT}/api/udemy/courses`);
});

