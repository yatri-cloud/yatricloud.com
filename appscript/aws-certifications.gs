// AWS Certifications Google Apps Script
// This script handles form submissions and data retrieval for AWS certifications only

// Configuration
const SPREADSHEET_ID = '17DBP-Ayd6ysAREEhl7zvw1ZPJxv9kpaKzYKBUD8GOnc'; // AWS Google Sheet ID
const MAIN_SHEET_NAME = 'certified-aws-yatris';

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
    
    // Get or create main sheet
    let mainSheet = ss.getSheetByName(MAIN_SHEET_NAME);
    if (!mainSheet) {
      mainSheet = ss.insertSheet(MAIN_SHEET_NAME);
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
        'Country',
        'State/Province',
        'City',
        'Country Code',
        'Phone Number',
        'Photo URL',
        'Additional Notes'
      ]);
    }
    
    // Create sub-sheet name with format: "Exam Code: Certification Name"
    // Example: "SAA-C03: AWS Certified Solutions Architect - Associate"
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
        'Country',
        'State/Province',
        'City',
        'Country Code',
        'Phone Number',
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
      data.country || '',
      data.stateProvince || '',
      data.city || '',
      data.countryCode || '',
      data.phoneNumber || '',
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
      data.country || '',
      data.stateProvince || '',
      data.city || '',
      data.countryCode || '',
      data.phoneNumber || '',
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
      // Sub-sheets contain ":" in their name (e.g., "SAA-C03: AWS Certified Solutions Architect - Associate")
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
          
          // Map location fields (try multiple variations)
          // Headers are already lowercased, so check for 'country' key
          cert.country = 
            cert['country'] || 
            cert['countrycode'] || // Sometimes stored as country code
            '';
          
          // Debug country field for first row
          if (i === 1) {
            console.log('Country field debug:', {
              'cert[country]': cert['country'],
              'cert[countrycode]': cert['countrycode'],
              'cert.country': cert.country,
              'allKeys': Object.keys(cert)
            });
          }
          
          cert.stateProvince = 
            cert['stateprovince'] || 
            cert['state-province'] ||
            cert['state/province'] ||
            cert['State/Province'] ||
            cert['State'] ||
            cert['Province'] ||
            '';
          
          cert.city = 
            cert['city'] || 
            cert['City'] ||
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
