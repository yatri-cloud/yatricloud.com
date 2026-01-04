# Troubleshooting Certification Submissions

## Issue: Only AWS and Azure showing in achievements

### Problem
- Only AWS and Azure certifications appear on the `/achievements` page
- Submissions for other providers (GCP, GitHub, Oracle, Salesforce, ServiceNow) are not showing up

### Solution

#### 1. Verify Environment Variables

Check your `.env` file has all webhook URLs configured:

```env
VITE_AWS_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/.../exec
VITE_AZURE_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/.../exec
VITE_GCP_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/.../exec
VITE_GITHUB_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/.../exec
VITE_ORACLE_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/.../exec
VITE_SALESFORCE_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/.../exec
VITE_SERVICENOW_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/.../exec
```

**Important:** After adding/updating environment variables, **restart your development server** (`npm run dev`).

#### 2. Check Browser Console

Open browser DevTools (F12) → Console tab and look for:

- `📥 Fetching [PROVIDER] certifications from: ...` - Should show all configured providers
- `⚠️ [PROVIDER] webhook URL not configured` - Indicates missing environment variable
- `✅ Fetched X [PROVIDER] certifications` - Confirms data was fetched
- `📊 Breakdown by provider:` - Shows count per provider

#### 3. Verify Google Apps Script Deployment

For each provider, ensure:

1. **Apps Script is deployed as Web App:**
   - Go to Google Apps Script editor
   - Click "Deploy" → "Manage deployments"
   - Verify it's deployed as "Web app" (not library)
   - "Who has access" should be "Anyone"

2. **Web App URL format:**
   - ✅ Correct: `https://script.google.com/macros/s/.../exec`
   - ❌ Wrong: `https://script.google.com/macros/library/d/...`

3. **Script has correct Spreadsheet ID:**
   - Check the `SPREADSHEET_ID` in each Apps Script matches your Google Sheet

#### 4. Verify Google Sheets Structure

Each provider should have:
- **Main sheet:** `certified-[provider]-yatris` (e.g., `certified-gcp-yatris`)
- **Sub-sheets:** `Exam Code: Certification Name` (e.g., `GCP-ACE: Google Cloud Professional Cloud Architect`)

#### 5. Test Submission

1. Submit a certification for a non-AWS/Azure provider (e.g., GCP)
2. Check browser console for:
   - `🔍 Processing certification: ...`
   - `📋 Detected provider: gcp`
   - `📤 Submitting GCP certification: ...`
   - `✅ Successfully submitted GCP certification: ...`
3. Check Google Apps Script execution logs:
   - Go to Apps Script editor
   - Click "Executions" (clock icon)
   - Verify the submission was received
4. Check Google Sheet:
   - Open the provider's sheet
   - Verify data appears in both main sheet and sub-sheet

#### 6. Verify Fetch is Working

1. Go to `/achievements` page
2. Open browser console
3. Look for:
   ```
   📥 Fetching AWS certifications from: ...
   📥 Fetching Azure certifications from: ...
   📥 Fetching GCP certifications from: ...
   📥 Fetching GitHub certifications from: ...
   📥 Fetching Oracle certifications from: ...
   📥 Fetching Salesforce certifications from: ...
   📥 Fetching ServiceNow certifications from: ...
   📊 Total certifications fetched: X
   📊 Breakdown by provider: { AWS: X, Azure: X, GCP: X, ... }
   ```

#### 7. Common Issues

**Issue:** "Webhook URL not configured" error
- **Fix:** Add the environment variable to `.env` and restart dev server

**Issue:** Submissions succeed but don't appear
- **Fix:** Check that `fetchCertifications()` is fetching from all webhooks (see console logs)

**Issue:** CORS errors
- **Fix:** Ensure Apps Script is deployed as "Web app" with "Anyone" access

**Issue:** Data in sheet but not showing
- **Fix:** Check Apps Script `doGet()` function is reading from correct sub-sheets (format: `Exam Code: Certification Name`)

#### 8. Debug Checklist

- [ ] All environment variables set in `.env`
- [ ] Dev server restarted after `.env` changes
- [ ] All Apps Scripts deployed as Web Apps
- [ ] All Web App URLs end with `/exec`
- [ ] All Apps Scripts have correct `SPREADSHEET_ID`
- [ ] Google Sheets have correct structure (main sheet + sub-sheets)
- [ ] Browser console shows all providers being fetched
- [ ] Apps Script execution logs show submissions received
- [ ] Data appears in Google Sheets after submission

## Still Having Issues?

1. Check browser console for detailed error messages
2. Check Apps Script execution logs for server-side errors
3. Verify Google Sheet permissions (should be viewable by anyone with link)
4. Test webhook URLs directly in browser (should return JSON)

