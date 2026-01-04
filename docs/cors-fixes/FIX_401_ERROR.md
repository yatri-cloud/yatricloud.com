# Fix 401 Unauthorized Error

## The Problem

You're seeing this error:
```
POST https://script.google.com/macros/library/d/... 401 (Unauthorized)
```

This means the code is trying to use a **library URL** instead of the **web app URL**.

## The Solution

### Step 1: Verify Your .env File

Your `.env` file should have:
```env
VITE_GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbyJvIQi0ynKIIgA401IbDFjB4D_aTSGRYGjiaicQaoguIXpfcoYUgM6FvRP9IlzV5iN/exec
```

**Important:** 
- ✅ Use `/macros/s/` (web app URL)
- ❌ NOT `/macros/library/d/` (library URL)

### Step 2: Restart Your Dev Server

**This is critical!** Environment variables are only loaded when the server starts.

1. **Stop your dev server** (press `Ctrl+C` in the terminal)
2. **Start it again:**
   ```bash
   npm run dev
   ```

### Step 3: Clear Browser Cache

1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
4. Or press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

### Step 4: Verify the URL is Loaded

After restarting, check the browser console when you submit the form. You should see:
```
📤 Submitting to Google Sheets: {
  url: "https://script.google.com/macros/s/AKfycbyJvIQi0ynKIIgA401IbDFjB4D_aTSGRYGjiaicQaoguIXpfcoYUgM6FvRP9IlzV5iN/exec",
  ...
}
```

If you see a library URL (`/macros/library/d/`), the environment variable isn't loaded correctly.

## Common Issues

### Issue 1: .env File Not in Root Directory
- Make sure `.env` is in the same folder as `package.json`
- Not in `src/` or any subfolder

### Issue 2: Server Not Restarted
- **Must restart** after changing `.env`
- Environment variables are read at startup

### Issue 3: Wrong URL Format
- ✅ Correct: `https://script.google.com/macros/s/.../exec`
- ❌ Wrong: `https://script.google.com/macros/library/d/...`

### Issue 4: Variable Name Typo
- Must be exactly: `VITE_GOOGLE_SHEETS_WEBHOOK_URL`
- Case-sensitive
- Must start with `VITE_` for Vite to load it

## Quick Checklist

- [ ] `.env` file exists in project root
- [ ] URL starts with `https://script.google.com/macros/s/`
- [ ] URL ends with `/exec`
- [ ] Variable name is `VITE_GOOGLE_SHEETS_WEBHOOK_URL`
- [ ] Dev server was restarted after creating/editing `.env`
- [ ] Browser cache cleared
- [ ] Console shows correct URL when submitting

## Still Getting 401?

If you still get 401 after following these steps:

1. **Check Google Apps Script permissions:**
   - Go to [script.google.com](https://script.google.com)
   - Open your script
   - Click "Deploy" > "Manage deployments"
   - Make sure "Who has access" is set to "Anyone"

2. **Verify the web app is deployed:**
   - Not just saved, but actually deployed
   - Should have a deployment URL

3. **Check the exact URL:**
   - Copy the URL from Google Apps Script deployment
   - Make sure it matches exactly in `.env`

