/**
 * Vercel Serverless Function - Udemy Courses API Proxy
 * 
 * Endpoint: /api/udemy/courses
 * 
 * This function fetches courses from all Udemy instructors
 * and returns them in a unified format.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Helper function to fetch courses from a single instructor
async function fetchInstructorCourses(token: string, page: number = 1, pageSize: number = 100) {
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

// Fetch all courses from an instructor with pagination
async function fetchAllInstructorCourses(token: string) {
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
    const { creator } = request.query;

    // Get tokens from environment variables
    const UDEMY_INSTRUCTOR_TOKEN = process.env.UDEMY_INSTRUCTOR_TOKEN;
    const UDEMY_INSTRUCTOR_TOKEN_NENSI = process.env.UDEMY_INSTRUCTOR_TOKEN_NENSI;

    if (!UDEMY_INSTRUCTOR_TOKEN) {
      return response.status(500).json({
        error: 'Server configuration error',
        message: 'UDEMY_INSTRUCTOR_TOKEN not configured',
      });
    }

    // Fetch from all instructors in parallel
    const fetchPromises = [];

    // Yatharth's courses
    const yatharthToken = UDEMY_INSTRUCTOR_TOKEN.startsWith('bearer ')
      ? UDEMY_INSTRUCTOR_TOKEN
      : `bearer ${UDEMY_INSTRUCTOR_TOKEN}`;
    fetchPromises.push(
      fetchAllInstructorCourses(yatharthToken).then((courses) => ({
        courses,
        instructor: 'Yatharth Chauhan',
      })),
    );

    // Nensi's courses (if token available)
    if (UDEMY_INSTRUCTOR_TOKEN_NENSI) {
      const nensiToken = UDEMY_INSTRUCTOR_TOKEN_NENSI.startsWith('bearer ')
        ? UDEMY_INSTRUCTOR_TOKEN_NENSI
        : `bearer ${UDEMY_INSTRUCTOR_TOKEN_NENSI}`;
      fetchPromises.push(
        fetchAllInstructorCourses(nensiToken).then((courses) => ({
          courses,
          instructor: 'Nensi Ravaliya',
        })),
      );
    }

    // Fetch all courses
    const results = await Promise.all(fetchPromises);

    // Merge all courses
    let allCourses: any[] = [];
    results.forEach(({ courses, instructor }) => {
      // Add instructor name to each course
      const coursesWithInstructor = courses.map((course: any) => ({
        ...course,
        _instructor: instructor,
      }));
      allCourses = allCourses.concat(coursesWithInstructor);
    });

    // Filter by creator if specified
    if (creator && creator !== 'All') {
      allCourses = allCourses.filter((course) => {
        const courseInstructor =
          course._instructor ||
          course.visible_instructors?.[0]?.title ||
          course.visible_instructors?.[0]?.name ||
          '';
        return courseInstructor === creator;
      });
    }

    // Sort by created date (latest first)
    allCourses.sort((a, b) => {
      const dateA = new Date(a.created || 0).getTime();
      const dateB = new Date(b.created || 0).getTime();
      return dateB - dateA; // Latest first
    });

    // Return in same format as single instructor API
    return response.status(200).json({
      count: allCourses.length,
      next: null,
      previous: null,
      results: allCourses,
    });
  } catch (error: any) {
    console.error('❌ Server Error:', error);
    return response.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

