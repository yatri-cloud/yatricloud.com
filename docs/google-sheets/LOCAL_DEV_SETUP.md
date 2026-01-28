# Local Development Setup for Yatris API

## Problem

In local development, Vite doesn't run serverless functions. The `/api/yatris-proxy` route only works on Vercel.

## Solution

Added a Vite proxy configuration that forwards `/api/yatris-proxy` requests directly to Google Apps Script during local development.

## Setup

### Option 1: Use Environment Variable (Recommended)

Create a `.env.local` file in the project root:

```env
VITE_YATRIS_USERS_API_URL=https://script.google.com/macros/s/AKfycbxHqWK2-fa7hRWf40_jZBKOUxLktgeVawx6e7pe68V83-dx9Ol34ShdqPtXTn0fNiOT5g/exec
```

The proxy will use this URL. If not set, it defaults to the hardcoded URL.

### Option 2: Use Vercel CLI (Alternative)

For a more production-like environment:

```bash
npm install -g vercel
vercel dev
```

This runs Vercel's development server which includes serverless functions.

## How It Works

1. **Local Development (Vite)**:
   - Browser → `/api/yatris-proxy` → Vite proxy → Google Apps Script
   - No CORS issues because proxy handles it

2. **Production (Vercel)**:
   - Browser → `/api/yatris-proxy` → Vercel serverless function → Google Apps Script
   - Serverless function handles CORS

## Testing

After starting the dev server (`npm run dev`), test:

```javascript
fetch('/api/yatris-proxy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'register',
    email: 'test@example.com',
    password: 'test123',
    fullName: 'Test User'
  })
})
```

This should work without CORS errors in both local and production.
