# Yatris Users API Proxy Setup

The Yatris Users API uses a proxy to avoid CORS issues when calling Google Apps Script from the browser.

## Environment Variable

Add this to your Vercel environment variables:

```env
YATRIS_USERS_API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

Replace `YOUR_SCRIPT_ID` with your actual Google Apps Script deployment URL.

## How It Works

1. Frontend calls `/api/yatris-proxy` (Vercel serverless function)
2. Proxy forwards request to Google Apps Script (YATRIS_USERS_API_URL)
3. Proxy returns response to frontend

This avoids CORS issues because:
- Browser → Vercel (same origin)
- Vercel → Google Apps Script (server-to-server, no CORS)

## Setup Steps

1. Deploy `appscript/yatris-users.gs` as a web app (see [YATRIS_USERS_SETUP.md](./YATRIS_USERS_SETUP.md))
2. Copy the deployment URL
3. Add `YATRIS_USERS_API_URL` to Vercel environment variables
4. Redeploy your Vercel app

## Testing

After setup, test the API:

```javascript
// Should work without CORS errors
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
