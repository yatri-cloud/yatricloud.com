# Provider Google Sheet IDs Setup

## Current Status

### ✅ Configured (Working)
- **AWS**: `17DBP-Ayd6ysAREEhl7zvw1ZPJxv9kpaKzYKBUD8GOnc`
- **Azure**: `1WjcJIZ5FMPr8ufy6Ij4QUHBogItlE45R2WtMOh4H2Ow`

### ❌ Needs Configuration (Placeholder IDs)
- **GCP**: `YOUR_GCP_SHEET_ID` (needs actual Sheet ID)
- **GitHub**: `YOUR_GITHUB_SHEET_ID` (needs actual Sheet ID)
- **Oracle**: `YOUR_ORACLE_SHEET_ID` (needs actual Sheet ID)
- **Salesforce**: `YOUR_SALESFORCE_SHEET_ID` (needs actual Sheet ID)
- **ServiceNow**: `YOUR_SERVICENOW_SHEET_ID` (needs actual Sheet ID)

## How to Fix

### Step 1: Create Google Sheets

For each provider (GCP, GitHub, Oracle, Salesforce, ServiceNow):

1. **Create a new Google Sheet:**
   - Go to https://sheets.google.com
   - Click "Blank" to create a new sheet
   - Name it: `Certified [Provider] Yatris` (e.g., "Certified GCP Yatris")

2. **Get the Sheet ID:**
   - The Sheet ID is in the URL: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`
   - Copy the `[SHEET_ID]` part

3. **Create the main sheet:**
   - The main sheet should be named: `certified-[provider]-yatris`
   - Example: `certified-gcp-yatris`, `certified-github-yatris`, etc.
   - Add headers in row 1:
     ```
     Timestamp | Full Name | Email | Certification Provider | Certification Name | 
     Exam Code | Certification Date | LinkedIn URL | Verified Credential | 
     Photo URL | Country | State/Province | City | Country Code | Phone Number | Additional Notes
     ```

### Step 2: Update Apps Scripts

For each provider Apps Script file:

1. **Open the Apps Script file:**
   - `appscript/gcp-certifications.gs`
   - `appscript/github-certifications.gs`
   - `appscript/oracle-certifications.gs`
   - `appscript/salesforce-certifications.gs`
   - `appscript/servicenow-certifications.gs`

2. **Replace the SPREADSHEET_ID:**
   ```javascript
   // Change this:
   const SPREADSHEET_ID = 'YOUR_GCP_SHEET_ID';
   
   // To this (with your actual Sheet ID):
   const SPREADSHEET_ID = 'YOUR_ACTUAL_SHEET_ID_HERE';
   ```

3. **Save the script**

4. **Deploy as new version:**
   - Click "Deploy" → "Manage deployments"
   - Click the edit icon (pencil) next to your deployment
   - Click "New version"
   - Click "Deploy"
   - **Important:** Copy the new Web App URL if it changed

5. **Update .env file:**
   - If the Web App URL changed, update the corresponding environment variable:
     - `VITE_GCP_CERTIFICATIONS_WEBHOOK_URL`
     - `VITE_GITHUB_CERTIFICATIONS_WEBHOOK_URL`
     - `VITE_ORACLE_CERTIFICATIONS_WEBHOOK_URL`
     - `VITE_SALESFORCE_CERTIFICATIONS_WEBHOOK_URL`
     - `VITE_SERVICENOW_CERTIFICATIONS_WEBHOOK_URL`

6. **Restart dev server:**
   ```bash
   npm run dev
   ```

### Step 3: Verify Setup

1. **Test submission:**
   - Submit a certification for the provider
   - Check browser console for success messages
   - Check Google Apps Script execution logs

2. **Check Google Sheet:**
   - Verify data appears in the main sheet
   - Verify a sub-sheet is created with format: `Exam Code: Certification Name`
   - Example: `GCP-ACE: Google Cloud Professional Cloud Architect`

3. **Check achievements page:**
   - Go to `/achievements`
   - Verify the certification appears
   - Check browser console for fetch logs

## Sub-Sheet Naming

Sub-sheets are automatically created with the format:
```
Exam Code: Certification Name
```

Examples:
- `GCP-ACE: Google Cloud Professional Cloud Architect`
- `AZ-900: Microsoft Azure Fundamentals`
- `SAA-C03: AWS Certified Solutions Architect - Associate`

**Important:** The Apps Script `doGet()` function only reads from sub-sheets (sheets that contain `:` and don't start with `certified-`). Make sure sub-sheets follow this format.

## Troubleshooting

### Issue: "Sub-sheet created as certified-gcp-yatris instead of Exam Code: Name"
- **Cause:** The `subSheetName` is not being sent correctly from the form
- **Fix:** Check browser console logs - should show `📊 Target sheet: certified-gcp-yatris` and sub-sheet name in submission data
- **Verify:** The form sends `subSheetName: "Exam Code: Certification Name"` in the submission

### Issue: "Data not appearing in achievements"
- **Cause:** Apps Script `doGet()` is not reading from sub-sheets correctly
- **Fix:** Ensure sub-sheets are named with `:` format (e.g., `GCP-ACE: ...`)
- **Verify:** Check Apps Script execution logs for `doGet()` calls

### Issue: "CORS errors"
- **Cause:** Apps Script not deployed correctly
- **Fix:** Ensure deployed as "Web app" with "Anyone" access
- **Note:** The form uses `no-cors` mode as fallback, so submissions should still work

