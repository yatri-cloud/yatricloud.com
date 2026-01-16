# Fix CORS Error for Yatris Users API

## The Problem

You're seeing this error:
```
Access to fetch at 'https://script.google.com/macros/s/...' from origin 'http://localhost:8080' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Solution: Update and Redeploy Google Apps Script

### Step 1: Update the Script

1. Go to [script.google.com](https://script.google.com)
2. Open your "Yatris Users" project
3. Copy the updated code from `appscript/yatris-users.gs`
4. Paste it into the editor
5. **Save** the script (Ctrl+S or Cmd+S)

### Step 2: Redeploy as New Version

**Important:** You MUST create a new version for CORS changes to take effect!

1. Click **"Deploy"** → **"Manage deployments"**
2. Click the **pencil icon (✏️)** next to your existing deployment
3. Click **"New version"** (this is critical!)
4. Click **"Deploy"**
5. **Verify settings:**
   - **Execute as:** Me
   - **Who has access:** Anyone (must be "Anyone" for CORS to work!)
6. Copy the new Web App URL

### Step 3: Update Environment Variable

Update your `.env` file or Vercel environment variable with the new URL:

```env
VITE_YATRIS_USERS_API_URL=https://script.google.com/macros/s/YOUR_NEW_SCRIPT_ID/exec
```

### Step 4: Test

1. Restart your dev server
2. Try to register/login again
3. Check browser console for errors

## Alternative: Use a Proxy (If CORS Still Fails)

If CORS still doesn't work after redeploying, you can use a proxy:

### Option 1: Use a CORS Proxy Service

Update `src/lib/yatris-api.ts`:

```typescript
const API_URL = import.meta.env.VITE_YATRIS_USERS_API_URL || '';
const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/'; // Or use your own proxy

export async function registerUser(data: {...}) {
  const response = await fetch(`${CORS_PROXY}${API_URL}`, {
    // ... rest of code
  });
}
```

### Option 2: Create Your Own Proxy API Route

Create `api/yatris-proxy.ts`:

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // Enable CORS
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  const API_URL = process.env.YATRIS_USERS_API_URL;
  
  try {
    const proxyResponse = await fetch(API_URL, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: request.method === 'POST' ? JSON.stringify(request.body) : undefined,
    });

    const data = await proxyResponse.json();
    return response.status(200).json(data);
  } catch (error) {
    return response.status(500).json({ error: 'Proxy error' });
  }
}
```

Then update `src/lib/yatris-api.ts` to use `/api/yatris-proxy` instead.

## Quick Checklist

- [ ] Updated `appscript/yatris-users.gs` with latest code
- [ ] Saved the script
- [ ] Created **NEW VERSION** deployment (not just updated existing)
- [ ] Set "Who has access" to **"Anyone"**
- [ ] Updated environment variable with new URL
- [ ] Restarted dev server
- [ ] Tested registration/login

## Still Not Working?

1. **Check Deployment Settings:**
   - Go to Deploy → Manage deployments
   - Verify "Who has access" is "Anyone"
   - Make sure you created a NEW version

2. **Test Direct URL:**
   - Open: `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=getUser&token=test`
   - Should return JSON (even if error, should have CORS headers)

3. **Check Browser Network Tab:**
   - Open DevTools → Network
   - Look for the OPTIONS request
   - Check if it returns 200 with CORS headers

4. **Check Google Apps Script Logs:**
   - In Apps Script editor → Executions
   - Look for errors in recent executions

5. **Try Different Browser:**
   - Sometimes browser cache causes issues
   - Try incognito/private mode

## Common Issues

### Issue: "doOptions not found"
- Make sure `doOptions()` function exists in your script
- It should be at the top of the file

### Issue: Still getting CORS error after redeploy
- You must create a **NEW VERSION**, not just save
- Delete old deployment and create fresh one
- Clear browser cache

### Issue: Works in browser but not in code
- Check if you're using the correct URL (should end with `/exec`)
- Verify environment variable is loaded
- Check if fetch is being called correctly

## Need More Help?

See the main troubleshooting guide: `docs/cors-fixes/FIX_CORS_GET_REQUEST.md`
