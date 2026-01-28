/**
 * Udemy Instructor API Service
 * 
 * Official Documentation: https://www.udemy.com/developers/instructor/
 * 
 * Authentication:
 * - Get Instructor API token from: https://www.udemy.com/instructor/account/api/
 * - Add to .env: VITE_UDEMY_INSTRUCTOR_TOKEN=your_token_here
 * 
 * API Endpoint: https://www.udemy.com/instructor-api/v1/taught-courses/courses/
 * Authentication: Authorization: bearer {token}
 */

/**
 * List of course title patterns that indicate a course is in draft/coming soon
 * Add course titles or partial matches here to mark them as "Coming Soon"
 */
export const DRAFT_COURSE_PATTERNS = [
  'aws machine learning specialty',
  'mls-c01',
  'aws certified developer associate exam preparation',
  // Add more draft course patterns here as needed
];

export interface UdemyCourse {
  id: number;
  title: string;
  url: string;
  is_paid: boolean;
  price: string;
  price_detail: {
    amount: number;
    currency: string;
    price_string: string;
  };
  price_serve_tracking_id: string;
  visible_instructors: Array<{
    title: string;
    name: string;
    display_name: string;
    job_title: string;
    image_50x50: string;
    image_100x100: string;
    url: string;
  }>;
  image_125_H: string;
  image_240x135: string;
  image_480x270: string;
  is_practice_test_course: boolean;
  published_title: string;
  tracking_id: string;
  predictive_score: number | null;
  relevancy_score: number | null;
  input_features: any;
  lecture_search_result: any;
  curriculum_items: any[];
  headline: string;
  num_subscribers: number;
  avg_rating: number;
  num_reviews: number;
  num_published_lectures: number;
  instructional_level: string;
  content_info: string;
  created: string;
  last_update_date: string;
  locale: {
    locale: string;
    title: string;
    english_title: string;
  };
}

export interface UdemyApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: UdemyCourse[];
}

export interface TransformedCourse {
  id: string;
  title: string;
  category: string;
  certification: string;
  creator: string;
  enrollments: number;
  rating: number;
  udemyUrl: string;
  thumbnail: string;
  headline?: string;
  price?: string;
  isPaid?: boolean;
  created?: string; // Course creation date for sorting
}

/**
 * Get Udemy API token from environment variables
 * Prioritizes Instructor API token, falls back to Client ID/Secret
 */
function getUdemyToken(): string | null {
  // First, try Instructor API token (preferred method)
  const instructorToken = import.meta.env.VITE_UDEMY_INSTRUCTOR_TOKEN;
  if (instructorToken) {
    return instructorToken;
  }

  // Fallback to Client ID/Secret (Basic Auth)
  const clientId = import.meta.env.VITE_UDEMY_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_UDEMY_CLIENT_SECRET;

  if (clientId && clientSecret) {
    const credentials = btoa(`${clientId}:${clientSecret}`);
    return `Basic ${credentials}`;
  }

  return null;
}

/**
 * Create authentication header for Udemy API
 */
function createAuthHeader(): string {
  const token = getUdemyToken();

  if (!token) {
    throw new Error(
      'Udemy API credentials not found. Please set either:\n' +
      '  - VITE_UDEMY_INSTRUCTOR_TOKEN (recommended), or\n' +
      '  - VITE_UDEMY_CLIENT_ID and VITE_UDEMY_CLIENT_SECRET\n' +
      'in your .env file'
    );
  }

  // If token starts with "Basic ", it's already formatted (Client ID/Secret)
  if (token.startsWith('Basic ')) {
    return token;
  }

  // Otherwise, it's an Instructor API token
  // Udemy Instructor API might use Bearer format or direct token
  // Try without Bearer first (some APIs use token directly)
  return token;
}

/**
 * Fetch courses from Udemy API
 * @param page - Page number (default: 1)
 * @param pageSize - Number of courses per page (default: 12, max: 100)
 * @param search - Search query (optional)
 * @param category - Category filter (optional)
 */
export async function fetchUdemyCourses(
  page: number = 1,
  pageSize: number = 12,
  search?: string,
  category?: string
): Promise<UdemyApiResponse> {
  try {
    // Use backend proxy to avoid CORS issues
    // The proxy server handles authentication and makes the API call
    // In production (Vercel), use relative URL to access serverless functions
    // In development, use localhost proxy server
    const proxyUrl = import.meta.env.VITE_PROXY_URL || 
      (import.meta.env.PROD ? '' : 'http://localhost:3001');
    const baseUrl = `${proxyUrl}/api/udemy/courses`;
    
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    if (search) {
      params.append('search', search);
    }

    if (category) {
      params.append('category', category);
    }

    const url = `${baseUrl}?${params.toString()}`;

    console.log(`📡 Fetching courses from proxy: ${url}`);

    // No authentication needed - proxy handles it
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
    } catch (fetchError) {
      // If proxy server is not running, provide helpful error
      if (fetchError instanceof TypeError && fetchError.message.includes('Failed to fetch')) {
        throw new Error(
          `Proxy server is not running!\n\n` +
          `Please start it with:\n` +
          `  npm run server\n\n` +
          `Or in a new terminal run:\n` +
          `  node server.js\n\n` +
          `Then refresh this page.`
        );
      }
      throw fetchError;
    }

    if (!response.ok) {
      const errorText = await response.text();
      const errorDetails = {
        status: response.status,
        statusText: response.statusText,
        url: url,
        error: errorText,
        authMethod: 'Proxy Server',
      };
      
      console.error('❌ Udemy API Error Details:', errorDetails);
      
      // Provide helpful error messages
      if (response.status === 401) {
        throw new Error(
          `Authentication failed (401). Check your API token or proxy server.\n` +
          `URL: ${url}\n` +
          `Error: ${errorText.substring(0, 200)}`
        );
      } else if (response.status === 403) {
        throw new Error(
          `Access forbidden (403). Your token may not have permission.\n` +
          `URL: ${url}\n` +
          `Error: ${errorText.substring(0, 200)}`
        );
      } else if (response.status === 404) {
        throw new Error(
          `Endpoint not found (404). Make sure proxy server is running.\n` +
          `URL: ${url}\n` +
          `Run: npm run server`
        );
      }
      
      throw new Error(`Udemy API error: ${response.status} - ${errorText.substring(0, 200)}`);
    }

    const data: UdemyApiResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Udemy courses:', error);
    throw error;
  }
}

/**
 * Custom image mapping for specific courses
 * Maps course titles/slugs to custom image URLs
 */
function getCustomCourseImage(title: string, courseSlug?: string): string | null {
  const titleLower = title.toLowerCase();
  
  // Custom image mappings
  const customImages: Record<string, string> = {
    // AWS Certified AI Practitioner (Yatharth)
    'aws certified ai practitioner': 'https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/certification.yatricloud.com/Yatharth%20Chauhan/AWS/AWS%20Certified%20AI%20Practitioner%20(AIF-C01).png',
    'aif-c01': 'https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/certification.yatricloud.com/Yatharth%20Chauhan/AWS/AWS%20Certified%20AI%20Practitioner%20(AIF-C01).png',
    
    // AWS Certified Cloud Practitioner (Yatharth)
    'aws certified cloud practitioner': 'https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/certification.yatricloud.com/Yatharth%20Chauhan/AWS/AWS%20Certified%20Cloud%20Practitioner.png',
    'cloud practitioner': 'https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/certification.yatricloud.com/Yatharth%20Chauhan/AWS/AWS%20Certified%20Cloud%20Practitioner.png',
    'clf-c02': 'https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/certification.yatricloud.com/Yatharth%20Chauhan/AWS/AWS%20Certified%20Cloud%20Practitioner.png',
    
    // AWS Certified CloudOps Engineer (Yatharth)
    'aws certified cloudops engineer': 'https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/certification.yatricloud.com/Yatharth%20Chauhan/AWS/AWS%20Certified%20CloudOps%20Engineer%20-%20Associate%20(SOA-C03).png',
    'cloudops engineer': 'https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/certification.yatricloud.com/Yatharth%20Chauhan/AWS/AWS%20Certified%20CloudOps%20Engineer%20-%20Associate%20(SOA-C03).png',
    'soa-c03': 'https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/certification.yatricloud.com/Yatharth%20Chauhan/AWS/AWS%20Certified%20CloudOps%20Engineer%20-%20Associate%20(SOA-C03).png',
    
    // AWS GenAI Developer Professional (Yatharth)
    'aws genai developer': 'https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/certification.yatricloud.com/Yatharth%20Chauhan/AWS/AWS%20GenAI%20Developer%20Professional%20Certificate.png',
    'genai developer professional': 'https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/certification.yatricloud.com/Yatharth%20Chauhan/AWS/AWS%20GenAI%20Developer%20Professional%20Certificate.png',
    'genai developer': 'https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/certification.yatricloud.com/Yatharth%20Chauhan/AWS/AWS%20GenAI%20Developer%20Professional%20Certificate.png',
    
    // AWS Certified DevOps Engineer - Professional (Nensi)
    'aws certified devops engineer - professional exam prep': 'https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/certification.yatricloud.com/Nensi%20Ravaliya/AWS/AWS%20Certified%20DevOps%20Engineer%20-%20Professional%20Exam%20Prep.png',
    'aws certified devops engineer professional': 'https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/certification.yatricloud.com/Nensi%20Ravaliya/AWS/AWS%20Certified%20DevOps%20Engineer%20-%20Professional%20Exam%20Prep.png',
    'devops engineer professional': 'https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/certification.yatricloud.com/Nensi%20Ravaliya/AWS/AWS%20Certified%20DevOps%20Engineer%20-%20Professional%20Exam%20Prep.png',
    'devops engineer - professional': 'https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/certification.yatricloud.com/Nensi%20Ravaliya/AWS/AWS%20Certified%20DevOps%20Engineer%20-%20Professional%20Exam%20Prep.png',
    
    // AWS Solutions Architect Associate (Nensi)
    'aws solutions architect associate': 'https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/certification.yatricloud.com/Nensi%20Ravaliya/AWS/AWS%20Solutions%20Architect%20Associate%20SAA-C03.png',
    'solutions architect associate': 'https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/certification.yatricloud.com/Nensi%20Ravaliya/AWS/AWS%20Solutions%20Architect%20Associate%20SAA-C03.png',
    'saa-c03': 'https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/certification.yatricloud.com/Nensi%20Ravaliya/AWS/AWS%20Solutions%20Architect%20Associate%20SAA-C03.png',
    
    // Azure DevOps Engineer Expert (Nensi)
    'azure devops engineer expert': 'https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/certification.yatricloud.com/Nensi%20Ravaliya/AZURE/AZ-400%20Azure%20DevOps%20Engineer%20Expert%20Exam%20Prep.png',
    'az-400': 'https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/certification.yatricloud.com/Nensi%20Ravaliya/AZURE/AZ-400%20Azure%20DevOps%20Engineer%20Expert%20Exam%20Prep.png',
    'azure devops expert': 'https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/certification.yatricloud.com/Nensi%20Ravaliya/AZURE/AZ-400%20Azure%20DevOps%20Engineer%20Expert%20Exam%20Prep.png',
    
    // AWS Data Engineer Associate (Nensi)
    'aws data engineer associate': 'https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/certification.yatricloud.com/Nensi%20Ravaliya/AWS/AWS%20Data%20Engineer%20Associate.png',
    'data engineer associate': 'https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/certification.yatricloud.com/Nensi%20Ravaliya/AWS/AWS%20Data%20Engineer%20Associate.png',
    'dea-c01': 'https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/certification.yatricloud.com/Nensi%20Ravaliya/AWS/AWS%20Data%20Engineer%20Associate.png',
    'aws certified data engineer': 'https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/certification.yatricloud.com/Nensi%20Ravaliya/AWS/AWS%20Data%20Engineer%20Associate.png',
  };
  
  // Check by title keywords
  for (const [key, imageUrl] of Object.entries(customImages)) {
    if (titleLower.includes(key.toLowerCase())) {
      return imageUrl;
    }
  }
  
  // Check by course slug if provided
  if (courseSlug) {
    const slugLower = courseSlug.toLowerCase();
    for (const [key, imageUrl] of Object.entries(customImages)) {
      if (slugLower.includes(key.toLowerCase())) {
        return imageUrl;
      }
    }
  }
  
  return null;
}

/**
 * Transform Udemy course data to match our Course interface
 */
export function transformUdemyCourse(udemyCourse: any): TransformedCourse {
  // Handle different response structures from Instructor API
  // Server adds _instructor field when merging courses from multiple instructors
  const instructor = udemyCourse.visible_instructors?.[0];
  const creator = udemyCourse._instructor || 
    instructor?.title || 
    instructor?.display_name || 
    instructor?.name || 
    'Unknown Instructor';

  // Extract category/certification from title or use default
  const title = udemyCourse.title || udemyCourse.published_title || '';
  const category = extractCategory(title);
  const certification = extractCertification(title, category);

  // Extract course slug for custom image lookup
  let courseSlug: string | undefined;
  if (udemyCourse.url) {
    const urlMatch = udemyCourse.url.match(/\/course\/([^\/\?]+)/);
    if (urlMatch && urlMatch[1]) {
      courseSlug = urlMatch[1].trim();
    }
  }

  // Handle image URLs - Check for custom images first
  let thumbnail = '';
  
  // Check for custom course image
  const customImage = getCustomCourseImage(title, courseSlug);
  if (customImage) {
    thumbnail = customImage;
  } else if (udemyCourse.image_480x270) {
    thumbnail = udemyCourse.image_480x270;
  } else if (udemyCourse.image_240x135) {
    thumbnail = udemyCourse.image_240x135;
  } else if (udemyCourse.image_125_H) {
    thumbnail = udemyCourse.image_125_H;
  } else if (udemyCourse.url && courseSlug) {
    // Use proxy server to fetch image (avoids CORS and access denied)
    // In production (Vercel), use relative URL to access serverless functions
    // In development, use localhost proxy server
    const proxyUrl = import.meta.env.VITE_PROXY_URL || 
      (import.meta.env.PROD ? '' : 'http://localhost:3001');
    thumbnail = `${proxyUrl}/api/udemy/image/${courseSlug}`;
  }
  
  // Final fallback - use placeholder
  if (!thumbnail) {
    thumbnail = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=225&fit=crop';
  }

  // Handle price - get actual price from API
  let price = 'Free';
  if (udemyCourse.is_paid) {
    if (udemyCourse.price_detail?.price_string) {
      price = udemyCourse.price_detail.price_string;
    } else if (udemyCourse.price_detail?.amount && udemyCourse.price_detail?.currency) {
      // Construct price string from amount and currency
      const currencySymbol = udemyCourse.price_detail.currency === 'USD' ? '$' : 
                            udemyCourse.price_detail.currency === 'EUR' ? '€' : 
                            udemyCourse.price_detail.currency === 'GBP' ? '£' : 
                            udemyCourse.price_detail.currency;
      price = `${currencySymbol}${udemyCourse.price_detail.amount}`;
    } else if (udemyCourse.price) {
      price = udemyCourse.price;
    } else {
      price = 'Paid';
    }
  }

  return {
    id: udemyCourse.id?.toString() || String(udemyCourse._class || Math.random()),
    title: title,
    category: category,
    certification: certification,
    creator: creator,
    enrollments: udemyCourse.num_subscribers || 0,
    rating: udemyCourse.avg_rating || 0,
    udemyUrl: udemyCourse.url 
      ? (udemyCourse.url.startsWith('http') ? udemyCourse.url : `https://www.udemy.com${udemyCourse.url}`)
      : '#',
    thumbnail: thumbnail || (udemyCourse.url ? getImageFromUrl(udemyCourse.url) : '') || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=225&fit=crop',
    headline: udemyCourse.headline,
    price: price,
    isPaid: udemyCourse.is_paid || false,
    created: udemyCourse.created || undefined, // Preserve creation date for sorting
  };
}

/**
 * Get image URL from course URL
 */
function getImageFromUrl(courseUrl: string): string {
  const urlMatch = courseUrl.match(/\/course\/([^\/\?]+)/);
  if (urlMatch && urlMatch[1]) {
    const courseSlug = urlMatch[1].trim();
    return `https://img-c.udemycdn.com/course/480x270/${courseSlug}/`;
  }
  return '';
}

/**
 * Extract category from course title
 * AI category has priority - if AI is detected, return AI even if other categories match
 * Returns the first matched category if multiple categories match (no "Common" category)
 */
function extractCategory(title: string): string {
  const titleLower = title.toLowerCase();
  const matchedCategories: string[] = [];
  let hasAI = false;
  
  // Check for AI first (has priority)
  if (titleLower.includes('ai') || titleLower.includes('artificial intelligence') || 
      titleLower.includes('machine learning') || titleLower.includes('ml ') ||
      titleLower.includes('genai') || titleLower.includes('generative ai')) {
    hasAI = true;
    matchedCategories.push('Artificial Intelligence');
  }
  
  // If AI is found, return it immediately (AI has priority)
  if (hasAI) {
    return 'Artificial Intelligence';
  }
  
  // Check for Cloud Computing
  if (titleLower.includes('aws') || titleLower.includes('amazon web services') || 
      titleLower.includes('azure') || titleLower.includes('microsoft azure') ||
      titleLower.includes('gcp') || titleLower.includes('google cloud')) {
    matchedCategories.push('Cloud Computing');
  }
  
  // Check for DevOps
  if (titleLower.includes('devops') || titleLower.includes('dev ops')) {
    matchedCategories.push('DevOps');
  }
  
  // Check for Containers
  if (titleLower.includes('kubernetes') || titleLower.includes('k8s') || 
      titleLower.includes('docker')) {
    matchedCategories.push('Containers');
  }
  
  // Check for Infrastructure
  if (titleLower.includes('terraform') || titleLower.includes('infrastructure as code') || 
      titleLower.includes('iac')) {
    matchedCategories.push('Infrastructure');
  }
  
  // Check for Programming
  if (titleLower.includes('python') || titleLower.includes('javascript') || 
      titleLower.includes('js ') || titleLower.includes('programming')) {
    matchedCategories.push('Programming');
  }
  
  // If multiple categories matched, return the first one (priority order)
  if (matchedCategories.length > 0) {
    return matchedCategories[0];
  }
  
  // Default fallback
  return 'General';
}

/**
 * Extract certification name from course title
 */
function extractCertification(title: string, category: string): string {
  const titleLower = title.toLowerCase();
  
  // AWS Certifications
  if (titleLower.includes('cloud practitioner') || titleLower.includes('clf')) {
    return 'AWS';
  } else if (titleLower.includes('solutions architect') || titleLower.includes('saa')) {
    return 'AWS';
  } else if (titleLower.includes('sysops') || titleLower.includes('soa')) {
    return 'AWS';
  } else if (titleLower.includes('developer') || titleLower.includes('dva')) {
    return 'AWS';
  } else if (titleLower.includes('aws')) {
    return 'AWS';
  }
  
  // Azure Certifications
  if (titleLower.includes('az-900') || titleLower.includes('azure fundamentals')) {
    return 'Azure';
  } else if (titleLower.includes('az-104') || titleLower.includes('azure administrator')) {
    return 'Azure';
  } else if (titleLower.includes('az-305') || titleLower.includes('azure architect')) {
    return 'Azure';
  } else if (titleLower.includes('ai-900') || titleLower.includes('azure ai')) {
    return 'AI';
  } else if (titleLower.includes('azure')) {
    return 'Azure';
  }
  
  // Other certifications
  if (titleLower.includes('terraform')) {
    return 'Terraform';
  } else if (titleLower.includes('kubernetes') || titleLower.includes('ckad') || titleLower.includes('cks')) {
    return 'Kubernetes';
  } else if (titleLower.includes('devops')) {
    return 'DevOps';
  } else if (titleLower.includes('ai') || titleLower.includes('artificial intelligence')) {
    return 'AI';
  }
  
  // Default based on category
  if (category === 'Cloud Computing') {
    return 'Cloud';
  } else if (category === 'DevOps') {
    return 'DevOps';
  } else if (category === 'Containers') {
    return 'Kubernetes';
  } else if (category === 'Infrastructure') {
    return 'Terraform';
  } else if (category === 'Artificial Intelligence') {
    return 'AI';
  }
  
  return 'General';
}

/**
 * Fetch all courses with pagination
 * Now fetches from all instructors and supports creator filter
 */
export async function fetchAllUdemyCourses(
  search?: string,
  category?: string,
  creator?: string
): Promise<TransformedCourse[]> {
  try {
    // Use backend proxy to fetch from all instructors
    // In production (Vercel), use relative URL to access serverless functions
    // In development, use localhost proxy server
    const proxyUrl = import.meta.env.VITE_PROXY_URL || 
      (import.meta.env.PROD ? '' : 'http://localhost:3001');
    const baseUrl = `${proxyUrl}/api/udemy/courses`;
    
    const params = new URLSearchParams();
    if (creator && creator !== 'All') {
      params.append('creator', creator);
    }

    const url = `${baseUrl}?${params.toString()}`;

    console.log(`📡 Fetching all courses from proxy: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Proxy error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Transform courses
    const transformed = data.results.map(transformUdemyCourse);
    
    // Apply search and category filters client-side
    let filtered = transformed;
    
    if (search) {
      filtered = filtered.filter(course => 
        course.title.toLowerCase().includes(search.toLowerCase()) ||
        course.category.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (category && category !== 'All') {
      filtered = filtered.filter(course => 
        course.certification === category || course.category === category
      );
    }

    // Sort by created date (latest first)
    filtered.sort((a, b) => {
      const dateA = a.created ? new Date(a.created).getTime() : 0;
      const dateB = b.created ? new Date(b.created).getTime() : 0;
      return dateB - dateA; // Latest first (descending order)
    });

    return filtered;
  } catch (error) {
    console.error('Error fetching all courses:', error);
    throw error;
  }
}

