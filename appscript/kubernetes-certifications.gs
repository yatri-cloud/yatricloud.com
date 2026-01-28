// Kubernetes Certifications Google Apps Script
// Sheet: https://docs.google.com/spreadsheets/d/1wlIbExUZYteasDbDmPz5cfXGzGmYVpZUSHUMxzPVcZ8/edit?gid=0
// Main sheet name: certified-kubernetes-yatris
//
// Supports KCNA, KCSA, CKAD, CKA, CKS, etc. Generic flow like other providers.

// Configuration
const SPREADSHEET_ID = '1y0QDjukWv9z0SxNYKGPSPhsH-1QiLfk_7Bb0dNRefyc';
const MAIN_SHEET_NAME = 'certified-kubernetes-yatris';

function doOptions() {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

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
+        'City',
        'Country Code',
        'Phone Number',
        'Additional Notes'
      ]);
    }

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

function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const allCertifications = [];
    const sheets = ss.getSheets();

    sheets.forEach(sheet => {
      const sheetName = sheet.getName();
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


