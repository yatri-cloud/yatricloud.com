# Fix CORS Error for GET Requests (Fetching Certifications)

## The Problem
Your browser is blocking the GET request to fetch certifications because Google Apps Script isn't responding properly to CORS preflight requests.

**Error Message:**
```
Access to fetch at 'https://script.google.com/...' from origin 'http://localhost:8080' 
has been blocked by CORS policy: Response to preflight request doesn't pass access 
control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Solution: Update Your Google Apps Script

### Step 1: Open Your Google Apps Script
1. Go to [script.google.com](https://script.google.com)
2. Find your "Certified Yatris API" project
3. Open it

### Step 2: Verify `doOptions` Function Exists

Make sure you have this function in your script:

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

### Step 3: Verify `doGet` Function Has CORS Headers

Your `doGet` function should look like this:

```javascript
function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const allCertifications = [];
    
    // ... your existing code to fetch certifications ...
    
    return ContentService.createTextOutput(
      JSON.stringify({ success: true, certifications: allCertifications })
    ).setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
  }
}
```

### Step 4: Save and Redeploy

1. **Save** your script (Ctrl+S or Cmd+S)
2. Click **"Deploy"** > **"Manage deployments"**
3. Click the **pencil icon (✏️)** next to your deployment
4. Click **"New version"**
5. Click **"Deploy"**
6. **Important:** Make sure **"Who has access"** is set to **"Anyone"**

### Step 5: Test

1. Refresh your browser page (`/achievements`)
2. Open browser console (F12)
3. You should see:
   - `📥 Fetching certifications from: [URL]`
   - `✅ Fetched certifications: [data]`
   - `📊 Found X certifications`

If you still see CORS errors, make sure:
- ✅ The `doOptions` function exists
- ✅ All return statements in `doGet` have `.setHeaders()` with CORS headers
- ✅ You've redeployed the script as a **new version**
- ✅ The deployment is set to **"Anyone"** access

---

## Quick Test: Check if Script is Working

1. Open your browser
2. Go directly to your web app URL:
   ```
   https://script.google.com/macros/s/AKfycbyJvIQi0ynKIIgA401IbDFjB4D_aTSGRYGjiaicQaoguIXpfcoYUgM6FvRP9IlzV5iN/exec
   ```
3. You should see JSON data with certifications
4. If you see an error, check the Google Apps Script execution logs

---

## Still Not Working?

1. **Check Google Apps Script Execution Logs:**
   - In Google Apps Script editor, click "Executions" (clock icon)
   - Look for recent `doGet` executions
   - Check for any errors

2. **Test the Script Manually:**
   - In Google Apps Script editor, select `doGet` function
   - Click "Run" (▶️)
   - Check if it executes without errors

3. **Verify Sheet Access:**
   - Make sure the script has permission to access your Google Sheet
   - The `SPREADSHEET_ID` should be correct

4. **Check Sheet Names:**
   - Make sure your sheet names start with `certified-` (e.g., `certified-aws-yatris`)
   - The script only reads sheets that start with `certified-`

