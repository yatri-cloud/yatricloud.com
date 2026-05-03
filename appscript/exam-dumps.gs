// Exam Dumps Management - Google Apps Script
// Handles exam dump submissions and data retrieval

// Configuration
const SPREADSHEET_ID = '1fHKV9moStqvkc5LiL1YstH4LfygPAnhg0s6M78mNMcA'; 
const EXAM_DUMPS_SHEET_NAME = 'exam-dumps';

/**
 * Handle CORS preflight requests
 */
function doOptions() {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle POST request - Add/Update/Delete exam dump
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    let sheet = ss.getSheetByName(EXAM_DUMPS_SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(EXAM_DUMPS_SHEET_NAME);
      sheet.appendRow([
        'Timestamp',
        'ID',
        'Title',
        'Provider',
        'Original Price',
        'Price',
        'Image',
        'Download URL',
        'Description',
        'Status'
      ]);
    }

    const action = data.action || 'add';
    const timestamp = new Date().toISOString();
    const id = data.id || `dump-${Date.now()}`;

    if (action === 'add') {
      const rowData = [
        timestamp,
        id,
        data.title || '',
        data.provider || '',
        data.originalPrice || 0,
        data.price || 0,
        data.image || '',
        data.downloadUrl || '',
        data.description || '',
        'active'
      ];
      sheet.appendRow(rowData);
      return createJsonResponse({ success: true, message: 'Exam dump added', id });
    }

    // Update and Delete would require searching for the ID row, which I'll implement if needed.
    // For now, let's stick to adding as requested.

    return createJsonResponse({ success: false, error: 'Unsupported action' });
    
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * Handle GET request - Fetch exam dumps
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(EXAM_DUMPS_SHEET_NAME);
    
    if (!sheet) {
      return createJsonResponse({ success: true, dumps: [] });
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return createJsonResponse({ success: true, dumps: [] });
    }
    
    const headers = data[0];
    const dumps = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const dump = {};
      headers.forEach((header, index) => {
        const key = header.toLowerCase().replace(/\s+/g, '');
        dump[key] = row[index];
      });
      
      // Normalize fields
      const normalizedDump = {
        id: dump.id || `dump-${i}`,
        title: dump.title || '',
        provider: dump.provider || '',
        originalPrice: parseFloat(dump.originalprice || 0),
        price: parseFloat(dump.price || 0),
        image: dump.image || '',
        downloadUrl: dump.downloadurl || '',
        description: dump.description || '',
        status: dump.status || 'active'
      };
      
      if (normalizedDump.status === 'active') {
        dumps.push(normalizedDump);
      }
    }
    
    return createJsonResponse({ success: true, dumps });
    
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString(), dumps: [] });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
