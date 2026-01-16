# Quick Fix for CORS Error

## The Error
```
Access to fetch at 'https://script.google.com/...' from origin 'http://localhost:8080' 
has been blocked by CORS policy
```

## Quick Solution (3 Steps)

### Step 1: Update Your Apps Script

1. Go to [script.google.com](https://script.google.com)
2. Open your "Yatris Users" project
3. **Copy the entire code** from `appscript/yatris-users.gs` in this project
4. **Paste it** into the Apps Script editor (replace all existing code)
5. **Save** (Ctrl+S or Cmd+S)

### Step 2: Create NEW Deployment Version

**⚠️ CRITICAL: You MUST create a NEW version, not just update!**

1. Click **"Deploy"** → **"Manage deployments"**
2. Click the **pencil icon (✏️)** next to your deployment
3. Click **"New version"** button
4. Click **"Deploy"**
5. **VERIFY:** "Who has access" is set to **"Anyone"**
6. Copy the new Web App URL

### Step 3: Update Environment Variable

Update your `.env` file:
```env
VITE_YATRIS_USERS_API_URL=https://script.google.com/macros/s/YOUR_NEW_SCRIPT_ID/exec
```

**Restart your dev server** after updating the `.env` file.

## Why This Happens

Google Apps Script web apps need:
1. ✅ `doOptions()` function for preflight requests
2. ✅ CORS headers on ALL responses
3. ✅ NEW version deployment (not just save)
4. ✅ "Anyone" access setting

## Still Not Working?

1. **Clear browser cache** or use incognito mode
2. **Check the URL** - should end with `/exec`
3. **Test direct URL** in browser - should return JSON
4. **Check Apps Script logs** - Executions tab for errors

## Alternative: Use Proxy (If Still Fails)

If CORS still fails, create a proxy API route at `api/yatris-proxy.ts` to handle requests server-side.

See `docs/google-sheets/YATRIS_CORS_FIX.md` for detailed troubleshooting.
