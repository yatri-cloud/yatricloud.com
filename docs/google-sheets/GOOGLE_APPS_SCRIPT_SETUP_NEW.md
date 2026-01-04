# Google Apps Script Setup - New Structure

This guide uses a new structure where sub-sheets are named with full certification names (e.g., "AZ-900: Microsoft Azure Fundamentals").

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
    const subSheetName = `${data.examCode}: ${data.certificationName}`;
    
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
    
    return ContentService.createTextOutput(
      JSON.stringify({ success: true, message: 'Certification submitted successfully' })
    ).setMimeType(ContentService.MimeType.JSON);
    
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
      if (sheetName.includes(':') && !sheetName.startsWith('certified-')) {
        const data = sheet.getDataRange().getValues();
        
        // Skip if no data
        if (data.length < 2) continue;
        
        const headers = data[0];
        
        // Skip header row
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          
          // Skip empty rows
          if (!row[0] && !row[1]) continue;
          
          const cert = {};
          
          // Map headers to values
          headers.forEach((header, index) => {
            const key = header.toLowerCase().replace(/\s+/g, '');
            cert[key] = row[index] || '';
          });
          
          // Add ID and format data
          cert.id = `${sheetName}-${i}`;
          cert.fullName = cert['fullname'] || '';
          cert.email = cert['email'] || '';
          cert.certificationProvider = cert['certificationprovider'] || '';
          cert.certificationName = cert['certificationname'] || '';
          cert.examCode = cert['examcode'] || '';
          cert.certificationDate = cert['certificationdate'] || '';
          cert.linkedinUrl = cert['linkedinurl'] || '';
          cert.verifiedCredential = cert['verifiedcredential'] || '';
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
   - Who has access: "Anyone"
4. Click "Deploy"
5. Copy the web app URL (it will look like: `https://script.google.com/macros/s/.../exec`)
6. Add this URL to your `.env` file as `VITE_GOOGLE_SHEETS_WEBHOOK_URL`

## New Structure

### Main Sheets
- `certified-aws-yatris` - Contains all AWS certifications
- `certified-azure-yatris` - Contains all Azure certifications
- `certified-gcp-yatris` - Contains all GCP certifications
- etc.

### Sub-Sheets (Examples)
- `AZ-900: Microsoft Azure Fundamentals`
- `AZ-104: Microsoft Azure Administrator`
- `AWS Certified Cloud Practitioner`
- `SAA-C03: AWS Certified Solutions Architect - Associate`

## Column Headers

Each sheet (main and sub) should have these columns:
1. Timestamp
2. Full Name
3. Email
4. Certification Provider
5. Certification Name
6. Exam Code
7. Certification Date
8. LinkedIn URL
9. Verified Credential
10. Photo URL
11. Additional Notes

## Notes

- Sub-sheets are automatically created with the format: `"Exam Code: Certification Name"`
- Data is stored in both the main sheet and the appropriate sub-sheet
- The `doGet` function reads from sub-sheets only (they contain the organized data)
- Main sheets serve as a master list of all certifications

