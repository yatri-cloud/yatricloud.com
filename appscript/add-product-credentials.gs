// Yatri Store Admin Credentials Google Apps Script
// This script handles login verification for the /addproduct admin form

// Configuration
const SPREADSHEET_ID = '1LNnCwfYSi-ARwwmpDHOxzxDEEgRCnYVhN_i_66lRt5g'; // credentials-admin Google Sheet ID
const MAIN_SHEET_NAME = 'credentials-admin';
const SUB_SHEET_NAME = '/addproduct';

/**
 * Handle CORS preflight requests
 */
function doOptions() {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle POST request - Verify login credentials for Yatri Store admin
 */
function doPost(e) {
  try {
    // Handle both JSON and URL-encoded form data
    let data;
    if (e.postData && e.postData.contents) {
      const contentType = e.postData.type || '';
      if (contentType.includes('application/json')) {
        data = JSON.parse(e.postData.contents);
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const params = e.parameter || {};
        data = {
          email: params.email || '',
          password: params.password || ''
        };
      } else {
        try {
          data = JSON.parse(e.postData.contents);
        } catch {
          data = e.parameter || {};
        }
      }
    } else {
      data = e.parameter || {};
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    // Get or create sub-sheet for /addproduct login attempts
    let subSheet = ss.getSheetByName(SUB_SHEET_NAME);
    if (!subSheet) {
      subSheet = ss.insertSheet(SUB_SHEET_NAME);
      subSheet.appendRow([
        'Timestamp',
        'Email',
        'Password',
        'Status'
      ]);
    }

    // Ensure headers exist
    const headers = subSheet.getRange(1, 1, 1, subSheet.getLastColumn()).getValues()[0];
    if (headers.length === 0 || headers[0] === '') {
      subSheet.getRange(1, 1, 1, 4).setValues([[
        'Timestamp',
        'Email',
        'Password',
        'Status'
      ]]);
    }

    // Get or create main credentials sheet
    let mainSheet = ss.getSheetByName(MAIN_SHEET_NAME);
    if (!mainSheet) {
      mainSheet = ss.insertSheet(MAIN_SHEET_NAME);
      mainSheet.appendRow([
        'Email',
        'Password'
      ]);
      // Seed with Udemy + Yatri Store default rows (you can edit directly in Google Sheets)
      mainSheet.appendRow([
        'info@yatricloud.com',
        'Udemy@yatricl0ud'
      ]);
      mainSheet.appendRow([
        'info@yatricloud.com',
        'YatriStore@yatricl0ud'
      ]);

      subSheet.appendRow([
        new Date().toISOString(),
        'SYSTEM',
        '***',
        'INFO - Main sheet created with default credentials (Udemy + Yatri Store)'
      ]);
    }

    let mainData = mainSheet.getDataRange().getValues();

    // If only headers present, ensure at least the two default rows exist
    if (mainData.length <= 1) {
      if (mainData.length === 0 || (mainData.length === 1 && mainData[0][0] !== 'Email')) {
        mainSheet.appendRow([
          'Email',
          'Password'
        ]);
      }

      mainSheet.appendRow([
        'info@yatricloud.com',
        'Udemy@yatricl0ud'
      ]);
      mainSheet.appendRow([
        'info@yatricloud.com',
        'YatriStore@yatricl0ud'
      ]);

      subSheet.appendRow([
        new Date().toISOString(),
        'SYSTEM',
        '***',
        'INFO - Default credentials added (Udemy + Yatri Store)'
      ]);

      mainData = mainSheet.getDataRange().getValues();
    }

    // Find matching credentials (check all rows except header)
    let authenticated = false;
    for (let i = 1; i < mainData.length; i++) {
      const row = mainData[i];
      const sheetEmail = (row[0] || '').toString().trim().toLowerCase();
      const sheetPassword = (row[1] || '').toString();

      const inputEmail = (data.email || '').toString().trim().toLowerCase();
      const inputPassword = (data.password || '').toString();

      if (sheetEmail === inputEmail && sheetPassword === inputPassword) {
        authenticated = true;
        break;
      }
    }

    // Log attempt
    subSheet.appendRow([
      new Date().toISOString(),
      data.email || '',
      '***',
      authenticated ? 'SUCCESS' : 'FAILED'
    ]);

    if (authenticated) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          message: 'Authentication successful',
          token: Utilities.getUuid()
        })
      ).setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          error: 'Invalid email or password'
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: error.toString()
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle GET request - Health check (optional)
 */
function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({
      success: true,
      message: 'Yatri Store credentials API is running'
    })
  ).setMimeType(ContentService.MimeType.JSON);
}


