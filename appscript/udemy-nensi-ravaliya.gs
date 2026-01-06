// Udemy Courses - Nensi Ravaliya Google Apps Script
// This script handles form submissions and data retrieval for Nensi Ravaliya's Udemy courses

// Configuration
const SPREADSHEET_ID = '1Z6bGUMMIoPfWpKXE6xUnAFFp6dBSPP6VSvXUO0rLNz8'; // Nensi Ravaliya Google Sheet ID
const MAIN_SHEET_NAME = 'udemy-nensi-ravaliya';

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
 * Handle POST request - Submit course
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
        'Course Title',
        'Course Link',
        'Image Link',
        'Creator',
        'Tech',
        'Category'
      ]);
    }
    
    // Check if headers exist, if not add them
    const headers = mainSheet.getRange(1, 1, 1, mainSheet.getLastColumn()).getValues()[0];
    if (headers.length === 0 || headers[0] === '') {
      mainSheet.getRange(1, 1, 1, 7).setValues([[
        'Timestamp',
        'Course Title',
        'Course Link',
        'Image Link',
        'Creator',
        'Tech',
        'Category'
      ]]);
    }
    
    // Add data to main sheet
    // Note: imageLink can be either a URL or a base64 encoded image string
    mainSheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.courseTitle || '',
      data.courseLink || '',
      data.imageLink || '', // Can be URL or base64 image
      data.creator || '',
      data.tech || '',
      data.category || ''
    ]);
    
    const output = ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        message: 'Course submitted successfully'
      })
    );
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
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
 * Handle GET request - Fetch courses
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const allCourses = [];
    
    // Get main sheet
    const mainSheet = ss.getSheetByName(MAIN_SHEET_NAME);
    if (!mainSheet) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          courses: []
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = mainSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: true,
          courses: []
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    const headers = data[0];
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const course = {};
      
      headers.forEach((header, index) => {
        const key = header.toLowerCase().replace(/\s+/g, '');
        course[key] = row[index] || '';
      });
      
      // Normalize field names - create new object with proper structure
      const normalizedCourse = {
        id: `${MAIN_SHEET_NAME}-${i}`,
        title: course['coursetitle'] || course['course title'] || '',
        udemyUrl: course['courselink'] || course['course link'] || '',
        imageUrl: course['imagelink'] || course['image link'] || '',
        creator: course['creator'] || 'nensi-ravaliya',
        certification: course['tech'] || '',
        category: course['category'] || '',
        timestamp: course['timestamp'] || ''
      };
      
      // Only add if course has required fields
      if (normalizedCourse.title && normalizedCourse.udemyUrl) {
        allCourses.push(normalizedCourse);
      }
    }
    
    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        courses: allCourses
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: error.toString()
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

