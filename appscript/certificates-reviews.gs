/**
 * ====================================================================
 * Certificates Reviews Manager for Google Sheets
 * Spreadsheet: yatri-certifications-reviews
 * Subsheet: certificates-reviews
 * ====================================================================
 */

// Configuration
const SPREADSHEET_ID = '1G2A3f-6FU76c8PoE9ZtZaQKUjAlypW5DURWunWYh89k';
const SHEET_NAME = 'certificates-reviews';

// Expected header columns
const HEADERS = ['timestamp', 'name', 'feedback', 'rating', 'linkedinProfile', 'source'];

/**
 * Initialize or get the sheet, ensuring headers exist.
 * @returns {Sheet} The certificates-reviews sheet
 */
function getSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    initializeHeaders(sheet);
    Logger.log(`Created new sheet: ${SHEET_NAME}`);
  } else {
    // Verify headers
    const firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
    const headersMatch = HEADERS.every((h, i) => firstRow[i] === h);
    if (!headersMatch) {
      initializeHeaders(sheet);
      Logger.log(`Updated headers in ${SHEET_NAME}`);
    }
  }

  return sheet;
}

/**
 * Initialize sheet headers.
 * @param {Sheet} sheet
 */
function initializeHeaders(sheet) {
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  // Format header row: bold, centered, light background
  const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  headerRange.setBackground('#f0f0f0');
}

/**
 * Add a single review to the sheet.
 * @param {Object} data - Review data { name, feedback, rating, linkedinProfile, source }
 * @returns {Object} { success: boolean, message: string }
 */
function addReview(data) {
  try {
    // Validate required fields
    if (!data.name || !data.name.trim()) {
      return { success: false, message: 'Name is required' };
    }
    if (!data.feedback || !data.feedback.trim()) {
      return { success: false, message: 'Feedback is required' };
    }
    if (!data.rating) {
      return { success: false, message: 'Rating is required' };
    }
    
    // Validate rating is 1-5
    const rating = parseInt(data.rating, 10);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return { success: false, message: 'Rating must be between 1 and 5' };
    }

    // Validate LinkedIn URL if provided
    if (data.linkedinProfile && data.linkedinProfile.trim()) {
      if (!/^https?:\/\/(www\.)?linkedin\.com\//.test(data.linkedinProfile)) {
        return { success: false, message: 'Invalid LinkedIn URL' };
      }
    }

    const sheet = getSheet();
    const row = [
      new Date(),
      data.name.trim(),
      data.feedback.trim(),
      rating,
      data.linkedinProfile ? data.linkedinProfile.trim() : '',
      data.source ? data.source.trim() : 'web'
    ];

    sheet.appendRow(row);
    Logger.log(`Review added: ${data.name} - Rating: ${rating}`);
    return { success: true, message: 'Review added successfully' };
  } catch (err) {
    Logger.error(`Error adding review: ${err.message}`);
    return { success: false, message: `Error: ${err.message}` };
  }
}

/**
 * Retrieve all reviews (optionally filtered).
 * @param {Object} options - Filter options { minRating, maxRating, limit }
 * @returns {Array<Object>} Array of review objects
 */
function getReviews(options = {}) {
  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) return [];

    // Skip header row
    const reviews = data.slice(1).map((row, idx) => ({
      id: idx + 2, // row number
      timestamp: row[0],
      name: row[1],
      feedback: row[2],
      rating: row[3],
      linkedinProfile: row[4],
      source: row[5]
    }));

    // Apply filters
    let filtered = reviews;
    if (options.minRating) {
      filtered = filtered.filter(r => r.rating >= options.minRating);
    }
    if (options.maxRating) {
      filtered = filtered.filter(r => r.rating <= options.maxRating);
    }

    // Apply limit
    if (options.limit) {
      filtered = filtered.slice(-options.limit); // Last N reviews
    }

    return filtered;
  } catch (err) {
    Logger.error(`Error retrieving reviews: ${err.message}`);
    return [];
  }
}

/**
 * Get review count and average rating.
 * @returns {Object} { totalCount, avgRating }
 */
function getReviewStats() {
  try {
    const reviews = getReviews();
    if (reviews.length === 0) {
      return { totalCount: 0, avgRating: 0 };
    }

    const totalRating = reviews.reduce((sum, r) => sum + parseInt(r.rating, 10), 0);
    return {
      totalCount: reviews.length,
      avgRating: (totalRating / reviews.length).toFixed(2)
    };
  } catch (err) {
    Logger.error(`Error calculating stats: ${err.message}`);
    return { totalCount: 0, avgRating: 0 };
  }
}

/**
 * HTTP POST handler for external forms/webhooks.
 * Accepts JSON: { name, feedback, rating, linkedinProfile, source }
 * @param {Object} e - Event object from doPost
 * @returns {TextOutput} JSON response with CORS headers
 */
function doPost(e) {
  try {
    let payload = {};

    // Parse JSON body or URL-encoded form data
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else {
      payload = e.parameter;
    }

    const result = addReview(payload);

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON)
      .addHeader('Access-Control-Allow-Origin', '*')
      .addHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      .addHeader('Access-Control-Allow-Headers', 'Content-Type');
  } catch (err) {
    Logger.error(`doPost error: ${err.message}`);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: err.message }))
      .setMimeType(ContentService.MimeType.JSON)
      .addHeader('Access-Control-Allow-Origin', '*')
      .addHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      .addHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
}

/**
 * Handle OPTIONS preflight requests for CORS.
 * @param {Object} e - Event object from doOptions
 * @returns {TextOutput} Empty response with CORS headers
 */
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .addHeader('Access-Control-Allow-Origin', '*')
    .addHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    .addHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * HTTP GET handler for retrieving reviews.
 * Query params: ?action=all&limit=10 or ?action=stats
 * @param {Object} e - Event object from doGet
 * @returns {TextOutput} JSON response with CORS headers
 */
function doGet(e) {
  try {
    const action = e.parameter.action || 'all';

    if (action === 'stats') {
      const stats = getReviewStats();
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, data: stats }))
        .setMimeType(ContentService.MimeType.JSON)
        .addHeader('Access-Control-Allow-Origin', '*')
        .addHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
        .addHeader('Access-Control-Allow-Headers', 'Content-Type');
    }

    const limit = e.parameter.limit ? parseInt(e.parameter.limit, 10) : null;
    const reviews = getReviews({ limit });
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, data: reviews }))
      .setMimeType(ContentService.MimeType.JSON)
      .addHeader('Access-Control-Allow-Origin', '*')
      .addHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
      .addHeader('Access-Control-Allow-Headers', 'Content-Type');
  } catch (err) {
    Logger.error(`doGet error: ${err.message}`);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: err.message }))
      .setMimeType(ContentService.MimeType.JSON)
      .addHeader('Access-Control-Allow-Origin', '*')
      .addHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
      .addHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
}

/**
 * ====================================================================
 * UTILITY FUNCTIONS (for development/testing)
 * ====================================================================
 */

/**
 * Test: Add a sample review.
 */
function testAddSampleReview() {
  const result = addReview({
    name: 'John Doe',
    feedback: 'This platform helped me understand cloud certifications better. Highly recommended!',
    rating: 5,
    linkedinProfile: 'https://www.linkedin.com/in/johndoe',
    source: 'manual-test'
  });
  Logger.log(result);
  SpreadsheetApp.getUi().alert(JSON.stringify(result));
}

/**
 * Test: Retrieve and log all reviews.
 */
function testGetReviews() {
  const reviews = getReviews();
  Logger.log(`Total reviews: ${reviews.length}`);
  reviews.forEach((r, i) => {
    Logger.log(`[${i + 1}] ${r.name} - ${r.rating} stars`);
  });
}

/**
 * Test: Display stats.
 */
function testGetStats() {
  const stats = getReviewStats();
  Logger.log(`Stats: ${JSON.stringify(stats)}`);
  SpreadsheetApp.getUi().alert(`Total: ${stats.totalCount}, Avg: ${stats.avgRating}`);
}

/**
 * ====================================================================
 * MENU & TRIGGERS
 * ====================================================================
 */

/**
 * Create a custom menu in the spreadsheet UI.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Yatri Reviews')
    .addItem('Initialize Sheet', 'initializeSheetMenu')
    .addSeparator()
    .addItem('Add Sample Review', 'testAddSampleReview')
    .addItem('View All Reviews', 'testGetReviews')
    .addItem('View Stats', 'testGetStats')
    .addToUi();
}

/**
 * Menu handler: Ensure sheet is initialized.
 */
function initializeSheetMenu() {
  const sheet = getSheet();
  SpreadsheetApp.getUi().alert(`✓ Sheet ready: ${SHEET_NAME}\n\nHeaders:\n${HEADERS.join(', ')}`);
}
