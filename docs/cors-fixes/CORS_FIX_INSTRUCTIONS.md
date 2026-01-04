# Fix CORS Error - Quick Guide

## The Problem
Google Apps Script doesn't send CORS headers by default, causing browser CORS errors.

## Solution: Update Your Google Apps Script

### Step 1: Open Your Google Apps Script
1. Go to [script.google.com](https://script.google.com)
2. Find your "Certified Yatris API" project
3. Open it

### Step 2: Update the Code

Add this function at the top (before `doPost`):

```javascript
/**
 * Handle CORS preflight requests
 */
function doOptions() {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '3600'
    });
}
```

### Step 3: Update doPost Function

Add CORS headers to the return statement in `doPost`:

**Find this:**
```javascript
return ContentService.createTextOutput(
  JSON.stringify({ success: true, message: 'Certification submitted successfully' })
).setMimeType(ContentService.MimeType.JSON);
```

**Replace with:**
```javascript
return ContentService.createTextOutput(
  JSON.stringify({ success: true, message: 'Certification submitted successfully' })
).setMimeType(ContentService.MimeType.JSON)
.setHeaders({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
});
```

**Also update the error return:**
```javascript
return ContentService.createTextOutput(
  JSON.stringify({ success: false, error: error.toString() })
).setMimeType(ContentService.MimeType.JSON)
.setHeaders({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
});
```

### Step 4: Update doGet Function

Add the same CORS headers to `doGet` function returns (both success and error).

### Step 5: Redeploy

1. Click "Deploy" > "Manage deployments"
2. Click the pencil icon (✏️) next to your deployment
3. Click "New version"
4. Click "Deploy"
5. **Important:** Make sure "Who has access" is set to "Anyone" (or "Anyone with Google account")

### Step 6: Test

Try submitting the form again. The CORS error should be gone!

---

## Alternative: Quick Workaround (Temporary)

If you can't update the script right now, I've already updated the frontend code to use `mode: 'no-cors'`. This will:
- ✅ Allow submissions to go through
- ❌ But you won't see error messages if submission fails
- ❌ Can't verify if submission was successful

**To use this workaround:**
- The code is already updated in `src/lib/google-sheets.ts`
- Just try submitting again - it should work, but you won't get confirmation

**Recommended:** Update the Google Apps Script with CORS headers for proper error handling.

