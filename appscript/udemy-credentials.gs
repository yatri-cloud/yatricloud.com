// Udemy Admin Credentials Google Apps Script
// This script handles login verification for the Udemy course submission form

// Configuration
const SPREADSHEET_ID = '1LNnCwfYSi-ARwwmpDHOxzxDEEgRCnYVhN_i_66lRt5g'; // Credentials Google Sheet ID
const MAIN_SHEET_NAME = 'credentials-admin';
const SUB_SHEET_NAME = '/udemy';

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
 * Handle POST request - Verify login credentials
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
        // Parse URL-encoded data
        const params = e.parameter || {};
        data = {
          email: params.email || '',
          password: params.password || ''
        };
      } else {
        // Try to parse as JSON anyway
        try {
          data = JSON.parse(e.postData.contents);
        } catch {
          data = e.parameter || {};
        }
      }
    } else {
      data = e.parameter || {};
    }
    
    // Open the spreadsheet
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Get or create sub-sheet
    let subSheet = ss.getSheetByName(SUB_SHEET_NAME);
    if (!subSheet) {
      subSheet = ss.insertSheet(SUB_SHEET_NAME);
      // Add headers
      subSheet.appendRow([
        'Timestamp',
        'Email',
        'Password',
        'Status'
      ]);
    }
    
    // Check if headers exist, if not add them
    const headers = subSheet.getRange(1, 1, 1, subSheet.getLastColumn()).getValues()[0];
    if (headers.length === 0 || headers[0] === '') {
      subSheet.getRange(1, 1, 1, 4).setValues([[
        'Timestamp',
        'Email',
        'Password',
        'Status'
      ]]);
    }
    
    // Get or create credentials main sheet
    let mainSheet = ss.getSheetByName(MAIN_SHEET_NAME);
    if (!mainSheet) {
      // Create the main sheet if it doesn't exist
      mainSheet = ss.insertSheet(MAIN_SHEET_NAME);
      // Add headers
      mainSheet.appendRow([
        'Email',
        'Password'
      ]);
      // Add default credentials
      mainSheet.appendRow([
        'info@yatricloud.com',
        'Udemy@yatricl0ud'
      ]);
      
      // Log that sheet was created
      subSheet.appendRow([
        new Date().toISOString(),
        'SYSTEM',
        '***',
        'INFO - Main sheet created with default credentials'
      ]);
    }
    
    // Read credentials from main sheet
    let mainData = mainSheet.getDataRange().getValues();
    
    // Check if sheet has headers only (no data rows)
    if (mainData.length <= 1) {
      // Check if we need to add headers
      if (mainData.length === 0 || (mainData.length === 1 && mainData[0][0] !== 'Email')) {
        // Add headers if they don't exist
        mainSheet.appendRow([
          'Email',
          'Password'
        ]);
      }
      
      // Add default credentials if sheet is empty (only headers)
      mainSheet.appendRow([
        'info@yatricloud.com',
        'Udemy@yatricl0ud'
      ]);
      
      // Log that credentials were added
      subSheet.appendRow([
        new Date().toISOString(),
        'SYSTEM',
        '***',
        'INFO - Default credentials added to empty sheet'
      ]);
      
      // Re-read data after adding default credentials
      mainData = mainSheet.getDataRange().getValues();
    }
    
    // Find matching credentials (check all rows except header)
    let authenticated = false;
    for (let i = 1; i < mainData.length; i++) {
      const row = mainData[i];
      const sheetEmail = (row[0] || '').toString().trim().toLowerCase(); // First column: email
      const sheetPassword = (row[1] || '').toString(); // Second column: password
      
      const inputEmail = (data.email || '').toString().trim().toLowerCase();
      const inputPassword = (data.password || '').toString();
      
      // Compare email (case-insensitive) and password (case-sensitive)
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
          token: Utilities.getUuid() // Generate a simple token (in production, use JWT)
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
      message: 'Udemy credentials API is running'
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

