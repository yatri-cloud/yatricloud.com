// OpenAI Certifications Google Apps Script
// Sheet: https://docs.google.com/spreadsheets/d/1KD_9CnVgrZTl-jB2bgoC6EfdPpTydLPMcYBZ9W9v67w/edit?gid=0
// Main sheet name: certified-openai-yatris
//
// This follows the same flow as the existing provider scripts:
// - POST (doPost): append to main sheet + per-exam sub-sheet
// - GET  (doGet):  aggregate all rows from per-exam sub-sheets

// Configuration
const SPREADSHEET_ID = '1huMfCTkqMrkL0qQOZa-XOBTIdyt8myWrqt8hsDbThrc';
const MAIN_SHEET_NAME = 'certified-openai-yatris';

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

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    // Main sheet
    let mainSheet = ss.getSheetByName(MAIN_SHEET_NAME);
    if (!mainSheet) {
      mainSheet = ss.insertSheet(MAIN_SHEET_NAME);
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
        'Country',
        'State/Province',
        'City',
        'Country Code',
        'Phone Number',
        'Additional Notes'
      ]);
    }

    // Sub-sheet name: "ExamCode: Certification Name"
    const subSheetName = data.subSheetName || `${data.examCode}: ${data.certificationName}`;
    let subSheet = ss.getSheetByName(subSheetName);
    if (!subSheet) {
      subSheet = ss.insertSheet(subSheetName);
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
        'Country',
        'State/Province',
        'City',
        'Country Code',
        'Phone Number',
        'Additional Notes'
      ]);
    }

    const row = [
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
    ];

    mainSheet.appendRow(row);
    subSheet.appendRow(row);

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
    const sheets = ss.getSheets();

    sheets.forEach(sheet => {
      const sheetName = sheet.getName();

      // Only process sub-sheets like "EXAM: Name", skip main sheets (certified-*)
      if (sheetName.includes(':') && !sheetName.startsWith('certified-')) {
        const data = sheet.getDataRange().getValues();
        if (data.length < 2) return;

        const headers = data[0];

        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (!row[0] && !row[1]) continue;

          const cert = {};
          headers.forEach((header, index) => {
            const key = header.toLowerCase().replace(/\s+/g, '');
            cert[key] = row[index] || '';
          });

          cert.id = `${sheetName}-${i}`;
          cert.fullName = cert['fullname'] || '';
          cert.email = cert['email'] || '';
          cert.certificationProvider = cert['certificationprovider'] || '';
          cert.certificationName = cert['certificationname'] || '';
          cert.examCode = cert['examcode'] || '';
          cert.certificationDate = cert['certificationdate'] || '';
          cert.linkedinUrl = cert['linkedinurl'] || '';
          cert.verifiedCredential =
            cert['verifiedcredential'] ||
            cert['verified-credential'] ||
            cert['verified_credential'] ||
            '';
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
    });

    return ContentService.createTextOutput(
      JSON.stringify({ success: true, certifications: allCertifications })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}


