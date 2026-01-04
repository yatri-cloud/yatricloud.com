# Debugging: Form Submitted But No Data in Sheet

## Step 1: Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Submit the form again
4. Look for:
   - `📤 Submitting to Google Sheets:` - Shows what data is being sent
   - `✅ Google Sheets response:` - Shows success response
   - `❌ Google Sheets error:` - Shows any errors

## Step 2: Check Google Apps Script Execution Logs

1. Go to [script.google.com](https://script.google.com)
2. Open your "Certified Yatris API" project
3. Click "Executions" in the left menu
4. Look for recent executions
5. Click on the latest execution to see:
   - Execution status (Success/Failed)
   - Execution log (any errors)
   - Duration

## Step 3: Verify Google Apps Script Code

Make sure your script has:

1. **Correct Spreadsheet ID:**
   ```javascript
   const SPREADSHEET_ID = '1WjcJIZ5FMPr8ufy6Ij4QUHBogItlE45R2WtMOh4H2Ow';
   ```

2. **doPost function** that processes the data

3. **Error handling** that logs errors

## Step 4: Test the Script Directly

1. In Google Apps Script, click "Run" (▶️) next to `doPost`
2. You'll need to provide test data
3. Or use the "Test" function below

## Step 5: Common Issues

### Issue 1: Script Not Receiving Data
**Symptoms:** No execution logs appear
**Solution:**
- Check that the web app URL is correct
- Verify the script is deployed (not just saved)
- Check "Who has access" is set to "Anyone"

### Issue 2: Permission Errors
**Symptoms:** Error in execution logs about permissions
**Solution:**
- Make sure the script has permission to access the spreadsheet
- Re-authorize the script when prompted

### Issue 3: Sheet Not Found
**Symptoms:** Error about sheet not existing
**Solution:**
- The script should create sheets automatically
- Check if sheet names match exactly (case-sensitive)
- Verify the spreadsheet ID is correct

### Issue 4: Data Format Mismatch
**Symptoms:** Data appears but in wrong columns
**Solution:**
- Check that the script expects the same field names
- Verify the data structure matches

## Step 6: Add Test Function to Google Apps Script

Add this to your Google Apps Script to test manually:

```javascript
function testSubmission() {
  const testData = {
    fullName: "Test User",
    email: "test@example.com",
    certificationProvider: "aws",
    certificationName: "AWS Certified Solutions Architect - Associate",
    examCode: "SAA-C03",
    certificationDate: "2024-01-15",
    linkedinUrl: "https://linkedin.com/in/test",
    photoUrl: "https://via.placeholder.com/150",
    additionalNotes: "Test submission",
    sheetName: "certified-aws-yatris",
    subSheetName: "saac03",
    timestamp: new Date().toISOString()
  };
  
  const mockEvent = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  const result = doPost(mockEvent);
  Logger.log(result.getContent());
}
```

Run this function to test if the script works.

## Step 7: Check Spreadsheet Permissions

1. Open your Google Sheet
2. Click "Share" button
3. Make sure the script's service account or your account has "Editor" access
4. If using a service account, share the sheet with the service account email

## Quick Checklist

- [ ] Browser console shows data being sent
- [ ] Google Apps Script shows execution logs
- [ ] No errors in execution logs
- [ ] Spreadsheet ID is correct in script
- [ ] Script has permission to edit spreadsheet
- [ ] Web app is deployed (not just saved)
- [ ] "Who has access" is set to "Anyone"

## Still Not Working?

1. **Check the exact error message** in Google Apps Script execution logs
2. **Verify the data format** matches what the script expects
3. **Test with a simple submission** (minimal data)
4. **Check if sheets are being created** (they should appear automatically)

