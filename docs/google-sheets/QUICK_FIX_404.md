# Quick Fix: 404 Error for /api/yatris-proxy

## Problem
Getting `404 (Not Found)` error when calling `/api/yatris-proxy` in local development.

## Solution

### Step 1: Restart Dev Server

The Vite proxy configuration was just added. You need to restart your dev server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 2: Verify Proxy is Working

After restarting, the proxy should forward requests to Google Apps Script. Test it:

1. Open browser console
2. Try registering a user
3. Check Network tab - you should see `/api/yatris-proxy` requests going through

### Step 3: If Still Not Working

#### Option A: Use Environment Variable

Create `.env.local` file in project root:

```env
VITE_YATRIS_USERS_API_URL=https://script.google.com/macros/s/AKfycbxHqWK2-fa7hRWf40_jZBKOUxLktgeVawx6e7pe68V83-dx9Ol34ShdqPtXTn0fNiOT5g/exec
```

Then restart dev server.

#### Option B: Use Vercel CLI (Production-like)

```bash
npm install -g vercel
vercel dev
```

This runs Vercel's dev server which includes serverless functions.

## How It Works

**Local Development:**
- Browser → `/api/yatris-proxy` → Vite proxy → Google Apps Script
- No CORS issues because proxy handles it

**Production (Vercel):**
- Browser → `/api/yatris-proxy` → Vercel serverless function → Google Apps Script
- Serverless function handles CORS

## Still Having Issues?

1. Check `vite.config.ts` has the proxy configuration
2. Make sure dev server was restarted after adding proxy
3. Check browser console for any proxy errors
4. Verify the Google Apps Script URL is correct
