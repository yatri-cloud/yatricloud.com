# Google Sheets Integration Setup

This guide will help you set up Google Apps Script to handle form submissions and data retrieval for the Certified Yatris feature.

## Step 1: Create Google Apps Script

1. Go to [Google Apps Script](https://script.google.com/)
2. Click "New Project"
3. Replace the default code with the script below

## Step 2: Google Apps Script Code

```javascript
// Configuration
const SPREADSHEET_ID = '1WjcJIZ5FMPr8ufy6Ij4QUHBogItlE45R2WtMOh4H2Ow'; // Your Google Sheet ID
const SHEET_NAMES = {
  'aws': 'certified-aws-yatris',
  'azure': 'certified-azure-yatris',
  'gcp': 'certified-gcp-yatris',
  'kubernetes': 'certified-kubernetes-yatris',
  'terraform': 'certified-terraform-yatris',
  'other': 'certified-other-yatris'
};

/**
 * Handle CORS preflight requests
 */
function doOptions() {
  // CORS preflight - return empty response
  // Headers are handled automatically by Google Apps Script when deployed as web app
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle POST request - Submit certification
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Open the spreadsheet
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Determine main sheet name
    const mainSheetName = SHEET_NAMES[data.certificationProvider] || SHEET_NAMES['other'];
    
    // Get or create main sheet
    let mainSheet = ss.getSheetByName(mainSheetName);
    if (!mainSheet) {
      mainSheet = ss.insertSheet(mainSheetName);
      // Add headers
      mainSheet.appendRow([
        'Timestamp',
        'Full Name',
        'Email',
        'Certification Provider',
        'Certification Name',
        'Exam Code',
        'Certification Date',
        'LinkedIn URL',
        'Verified Credential',
        'Photo URL',
        'Additional Notes'
      ]);
    }
    
    // Create sub-sheet name with format: "Exam Code: Certification Name"
    // Example: "AZ-900: Microsoft Azure Fundamentals"
    // Use the subSheetName from data (already formatted) or create it
    const subSheetName = data.subSheetName || `${data.examCode}: ${data.certificationName}`;
    
    // Get or create sub-sheet
    let subSheet = ss.getSheetByName(subSheetName);
    if (!subSheet) {
      subSheet = ss.insertSheet(subSheetName);
      // Add headers
      subSheet.appendRow([
        'Timestamp',
        'Full Name',
        'Email',
        'Certification Provider',
        'Certification Name',
        'Exam Code',
        'Certification Date',
        'LinkedIn URL',
        'Verified Credential',
        'Photo URL',
        'Additional Notes'
      ]);
    }
    
    // Add data to main sheet
    mainSheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.fullName,
      data.email,
      data.certificationProvider,
      data.certificationName,
      data.examCode,
      data.certificationDate,
      data.linkedinUrl,
      data.verifiedCredential || '',
      data.photoUrl,
      data.additionalNotes || ''
    ]);
    
    // Add data to sub-sheet
    subSheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.fullName,
      data.email,
      data.certificationProvider,
      data.certificationName,
      data.examCode,
      data.certificationDate,
      data.linkedinUrl,
      data.verifiedCredential || '',
      data.photoUrl,
      data.additionalNotes || ''
    ]);
    
    const output = ContentService.createTextOutput(
      JSON.stringify({ success: true, message: 'Certification submitted successfully' })
    );
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
    
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle GET request - Fetch certifications
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const allCertifications = [];
    
    // Get all sheets
    const sheets = ss.getSheets();
    
    for (let sheet of sheets) {
      const sheetName = sheet.getName();
      
      // Only process sub-sheets (format: "Exam Code: Certification Name")
      // Skip main sheets (they start with "certified-")
      // Sub-sheets contain ":" in their name (e.g., "AZ-900: Microsoft Azure Fundamentals")
      if (sheetName.includes(':') && !sheetName.startsWith('certified-')) {
        const data = sheet.getDataRange().getValues();
        const headers = data[0];
        
        // Skip header row
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          const cert = {};
          
          headers.forEach((header, index) => {
            const key = header.toLowerCase().replace(/\s+/g, '');
            cert[key] = row[index] || '';
          });
          
          // Debug: Log headers and first row to check field mapping
          if (i === 1) {
            console.log('Headers:', headers);
            console.log('First row data:', row);
            console.log('Mapped keys:', Object.keys(cert));
          }
          
          // Add ID and format data
          cert.id = `${sheetName}-${i}`;
          cert.fullName = cert['fullname'] || '';
          cert.email = cert['email'] || '';
          cert.certificationProvider = cert['certificationprovider'] || '';
          cert.certificationName = cert['certificationname'] || '';
          cert.examCode = cert['examcode'] || '';
          cert.certificationDate = cert['certificationdate'] || '';
          cert.linkedinUrl = cert['linkedinurl'] || '';
          
          // Try multiple variations for verified credential
          cert.verifiedCredential = 
            cert['verifiedcredential'] || 
            cert['verified-credential'] ||
            cert['verified_credential'] ||
            '';
          
          // Debug verified credential field
          if (cert.verifiedCredential) {
            console.log(`✅ Found verifiedCredential for row ${i}:`, cert.verifiedCredential);
          } else {
            console.log(`⚠️ No verifiedCredential for row ${i}. Available keys:`, Object.keys(cert));
          }
          
          cert.photoUrl = cert['photourl'] || '';
          cert.additionalNotes = cert['additionalnotes'] || '';
          
          allCertifications.push(cert);
        }
      }
    }
    
    return ContentService.createTextOutput(
      JSON.stringify({ success: true, certifications: allCertifications })
    ).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
```

## Step 3: Deploy as Web App

1. Click "Deploy" > "New deployment"
2. Click the gear icon ⚙️ next to "Select type" and choose "Web app"
3. Set:
   - Description: "Certified Yatris API"
   - Execute as: "Me"
   - Who has access: "Anyone" (or "Anyone with Google account" for more security)
4. Click "Deploy"
5. Copy the Web App URL
6. Authorize the script when prompted

## Step 4: Configure Environment Variable

Add the Web App URL to your `.env` file:

```env
VITE_GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

## Step 5: Test the Integration

1. Submit a test certification through the form
2. Check your Google Sheet to verify the data was added
3. Check the Wall of Fame to see if data loads correctly

## Notes

- The script automatically creates sheets if they don't exist
- Sub-sheets are created based on exam codes (e.g., "az900", "saa-c03")
- Photo URLs are stored as base64 strings (consider using an image hosting service for production)
- The script handles both main sheets and sub-sheets as specified

## Alternative: Direct Google Sheets API

If you prefer using the Google Sheets API directly, you'll need to:
1. Create a Google Cloud Project
2. Enable Google Sheets API
3. Create a Service Account
4. Share your Google Sheet with the service account email
5. Use the service account credentials in your backend

This approach is more secure but requires backend infrastructure.

