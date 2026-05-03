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
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env first, then .env.local (local overrides)
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '.env.local'), override: true });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
}));
app.use(express.json());

// Logging middleware for debugging
app.use((req, res, next) => {
  // Allow Google Login popups to communicate back to the parent window
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  console.log(`${req.method} ${req.path}`, req.body ? JSON.stringify(req.body) : '');
  next();
});

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
 * Razorpay Order Creation Endpoint
 * POST /api/razorpay/create-order
 */
app.post('/api/razorpay/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, notes } = req.body;

    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    // Get Razorpay credentials from env
    // Priority: RAZORPAY_KEY_ID > VITE_RAZORPAY_KEY_ID > default test key
    const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_S05Hqy9qMsJRVs';
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET || 'AbZUaer9h9iPXWHK3QNUF3TG';

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        error: 'Razorpay credentials not configured',
        message: 'Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables'
      });
    }

    // Create order using Razorpay REST API directly
    const orderOptions = {
      amount: amount, // amount in paise
      currency: currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: notes || {},
    };

    // Call Razorpay API directly
    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify(orderOptions),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.description || `Razorpay API error: ${response.status}`);
    }

    const order = await response.json();
    console.log('✅ Razorpay order created:', order.id);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    });
  } catch (error) {
    console.error('❌ Razorpay order creation error:', error);
    res.status(500).json({
      error: 'Failed to create Razorpay order',
      message: error.message,
    });
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

/**
 * Proxy endpoint to fetch reviews from Apps Script
 * GET /api/reviews?action=all&limit=200
 */
app.get('/api/reviews', async (req, res) => {
  try {
    const appsScriptUrl = process.env.VITE_CERTIFICATE_REVIEWS_APPS_SCRIPT_URL;
    if (!appsScriptUrl) return res.status(500).json({ error: 'Apps Script URL not configured in env' });

    const query = req.originalUrl.split('?')[1] || '';
    const targetUrl = appsScriptUrl + (query ? `?${query}` : '');

    const response = await fetch(targetUrl, { method: 'GET' });
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const json = await response.json();
      return res.json(json);
    }

    // If not JSON, forward text (likely error/html)
    const text = await response.text();
    res.status(response.status).type('text/plain').send(text);
  } catch (err) {
    console.error('Error proxying reviews:', err);
    res.status(500).json({ error: 'Failed to proxy reviews', message: err.message });
  }
});

/**
 * Exam Dumps Proxy Endpoint
 * GET /api/exam-dumps - Fetch dumps
 * POST /api/exam-dumps - Add/Submit dump
 */
app.get('/api/exam-dumps', async (req, res) => {
  try {
    const webhookUrl = process.env.VITE_EXAM_DUMPS_WEBHOOK_URL;
    if (!webhookUrl) return res.status(500).json({ error: 'Exam Dumps Webhook URL not configured' });

    console.log('📡 Fetching Exam Dumps from Apps Script...');
    const response = await fetch(webhookUrl);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('❌ Error fetching exam dumps:', error);
    res.status(500).json({ error: 'Failed to fetch exam dumps', message: error.message });
  }
});

app.post('/api/exam-dumps', async (req, res) => {
  try {
    const webhookUrl = process.env.VITE_EXAM_DUMPS_WEBHOOK_URL;
    if (!webhookUrl) return res.status(500).json({ error: 'Exam Dumps Webhook URL not configured' });

    console.log('📡 Submitting Exam Dump to Apps Script...');
    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: JSON.stringify(req.body),
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('❌ Error submitting exam dump:', error);
    res.status(500).json({ error: 'Failed to submit exam dump', message: error.message });
  }
});

/**
 * Yatris Auth and Events Proxy
 */
console.log('📝 Proxy Config Check:', {
  EXAM_DUMPS: !!process.env.VITE_EXAM_DUMPS_WEBHOOK_URL,
  AUTH: !!process.env.VITE_API_URL_AUTH,
  EVENTS: !!process.env.VITE_API_URL_EVENTS
});

app.post('/api/yatris/auth', async (req, res) => {
  try {
    const url = process.env.VITE_API_URL_AUTH;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/yatris/auth', async (req, res) => {
  try {
    const url = process.env.VITE_API_URL_AUTH;
    const query = req.originalUrl.split('?')[1] || '';
    const targetUrl = url + (query ? `?${query}` : '');
    const response = await fetch(targetUrl);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/yatris/events', async (req, res) => {
  try {
    const url = process.env.VITE_API_URL_EVENTS;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/yatris/events', async (req, res) => {
  try {
    const url = process.env.VITE_API_URL_EVENTS;
    const query = req.originalUrl.split('?')[1] || '';
    const targetUrl = url + (query ? `?${query}` : '');
    const response = await fetch(targetUrl);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Yatri AI Chat endpoint using Ollama with live streaming
 * POST /api/chat
 * Body: { message: string }
 * Returns: Server-Sent Events (SSE) stream with AI response tokens
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required and must be a string' });
    }

    console.log('💬 Chat request:', message);

    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Get Ollama API URL from environment variable
    const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';

    // Create a system prompt for better formatting
    const systemPrompt = `You are Yatri AI, a friendly assistant for Yatri Cloud.
Your goal is to explain technical concepts clearly and help users with Yatri Cloud events and courses.

### INSTRUCTIONS:
1. **Tone**: flexible. Be professional and technical, but use **simple, clear English**. Avoid unnecessary jargon.
2. **GREETINGS**: Use "Hello Yatri!" ONLY if the user says "Hi", "Hello", etc. first.
3. **NO REPEATED GREETINGS**: If the user asks a specific technical question, answer it **IMMEDIATELY**.
4. **Formatting**:
   - **NEVER** use bullet points (*), dashes (-), or hyphens for lists.
   - **NEVER** use em-dashes (—) or en-dashes (–) inside sentences. Use commas (,) or parentheses ( ) instead.
   - To make a list, just start a new line with the **bold** word followed by a colon. 
   - Keep paragraphs **SHORT** (2-3 sentences max).

### KNOWLEDGE CONTEXT (Use this to answer questions about Yatri Cloud):
${context || 'No specific context provided.'}

### USER QUESTION:
${message}`;

    // Call Ollama API with streaming enabled
    const ollamaResponse = await fetch(`${OLLAMA_API_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: req.body.model || 'gemma3',
        prompt: systemPrompt,
        stream: true, // Enable streaming
      }),
    });

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text();
      console.error('Ollama API error:', ollamaResponse.status, errorText);
      res.write(`data: ${JSON.stringify({
        error: 'Ollama service unavailable. Make sure Ollama is running and the gemma3 model is available.',
        details: errorText
      })}\n\n`);
      res.end();
      return;
    }

    // Stream the response
    const reader = ollamaResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        console.log('✅ Chat response stream completed');
        res.write('data: [DONE]\n\n');
        res.end();
        break;
      }

      // Decode chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });

      // Process complete JSON lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.trim()) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              // Send each token immediately via SSE
              res.write(`data: ${JSON.stringify({ token: data.response })}\n\n`);
            }
            if (data.error) {
              res.write(`data: ${JSON.stringify({ error: data.error })}\n\n`);
            }
          } catch (e) {
            console.error('Error parsing JSON line:', e);
          }
        }
      }
    }
  } catch (err) {
    console.error('Error in chat endpoint:', err);
    res.write(`data: ${JSON.stringify({
      error: 'Failed to process chat message',
      message: err.message
    })}\n\n`);
    res.end();
  }
});

/**
 * Get available Ollama models
 * GET /api/ai/models
 */
app.get('/api/ai/models', async (req, res) => {
  try {
    const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';
    const response = await fetch(`${OLLAMA_API_URL}/api/tags`);

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    // Return just the model names
    const models = data.models.map(m => m.name);
    res.json({ models });
  } catch (err) {
    console.error('Error fetching Ollama models:', err);
    res.status(500).json({ error: 'Failed to fetch models', message: err.message });
  }
});

/**
 * Send Email Endpoint
 * POST /api/send-email
 * Body: { to, subject, html }
 */
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, html } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
    }

    // Get email credentials
    const EMAIL_USER = process.env.EMAIL_USER;
    const EMAIL_PASS = process.env.EMAIL_PASS;
    const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.office365.com';
    const EMAIL_PORT = process.env.EMAIL_PORT || 587;
    const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || "Yatri Cloud";

    if (!EMAIL_USER || !EMAIL_PASS) {
      console.error('❌ Email credentials missing in .env');
      return res.status(500).json({ error: 'Email configuration missing on server' });
    }

    // Import nodemailer dynamically to avoid startup errors if not installed
    let nodemailer;
    try {
      nodemailer = await import('nodemailer');
    } catch (e) {
      console.error('❌ Nodemailer not found', e);
      return res.status(500).json({ error: 'Email service error: nodemailer not installed' });
    }

    // Create transporter (Office 365 / Outlook)
    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: Number(EMAIL_PORT),
      secure: false, // TLS
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
      tls: {
        ciphers: 'SSLv3'
      }
    });

    // Send mail
    const info = await transporter.sendMail({
      from: `"${EMAIL_FROM_NAME}" <${EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log('✅ Email sent:', info.messageId);
    res.json({ success: true, messageId: info.messageId });

  } catch (error) {
    console.error('❌ Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Udemy API Proxy Server running on http://localhost:${PORT}`);
  console.log(`📚 Courses endpoint: http://localhost:${PORT}/api/udemy/courses`);
  console.log(`💳 Razorpay endpoint: http://localhost:${PORT}/api/razorpay/create-order`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log(`💬 Chat endpoint: http://localhost:${PORT}/api/chat (requires Ollama running)`);
  console.log(`\n⚠️  Make sure your frontend calls: http://localhost:${PORT}/api/udemy/courses`);
});

