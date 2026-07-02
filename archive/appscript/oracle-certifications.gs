// Oracle Certifications Google Apps Script
// This script handles form submissions and data retrieval for Oracle certifications only

// Configuration
const SPREADSHEET_ID = 'YOUR_ORACLE_SHEET_ID'; // Replace with your Oracle Google Sheet ID
const MAIN_SHEET_NAME = 'certified-oracle-yatris';

/**
 * Handle CORS preflight requests
 */
function doOptions() {
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
    
    // Get or create main sheet
    let mainSheet = ss.getSheetByName(MAIN_SHEET_NAME);
    if (!mainSheet) {
      mainSheet = ss.insertSheet(MAIN_SHEET_NAME);
      // Add headers
      mainSheet.appendRow([
        'Timestamp', 'Full Name', 'Email', 'Certification Provider', 'Certification Name', 
        'Exam Code', 'Certification Date', 'LinkedIn URL', 'Verified Credential', 
        'Photo URL', 'Country', 'State/Province', 'City', 'Country Code', 'Phone Number', 'Additional Notes'
      ]);
    }
    
    // Create sub-sheet name with format: "Exam Code: Certification Name"
    const subSheetName = data.subSheetName || `${data.examCode}: ${data.certificationName}`;
    
    // Get or create sub-sheet
    let subSheet = ss.getSheetByName(subSheetName);
    if (!subSheet) {
      subSheet = ss.insertSheet(subSheetName);
      // Add headers
      subSheet.appendRow([
        'Timestamp', 'Full Name', 'Email', 'Certification Provider', 'Certification Name', 
        'Exam Code', 'Certification Date', 'LinkedIn URL', 'Verified Credential', 
        'Photo URL', 'Country', 'State/Province', 'City', 'Country Code', 'Phone Number', 'Additional Notes'
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
      data.photoUrl || '',
      data.country || '',
      data.stateProvince || '',
      data.city || '',
      data.countryCode || '',
      data.phoneNumber || '',
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
      data.photoUrl || '',
      data.country || '',
      data.stateProvince || '',
      data.city || '',
      data.countryCode || '',
      data.phoneNumber || '',
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
        const headers = data[0];
        
        // Skip header row
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          const cert = {};
          
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
          cert.verifiedCredential = cert['verifiedcredential'] || cert['verified-credential'] || cert['verified_credential'] || '';
          cert.photoUrl = cert['photourl'] || '';
          cert.country = cert['country'] || '';
          cert.stateProvince = cert['state/province'] || cert['stateprovince'] || '';
          cert.city = cert['city'] || '';
          cert.countryCode = cert['countrycode'] || '';
          cert.phoneNumber = cert['phonenumber'] || '';
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

