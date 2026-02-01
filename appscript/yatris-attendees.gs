// Yatris Attendees - Google Apps Script
// Handles Event Registration & Attendees Data

// Configuration
const ATTENDEES_SPREADSHEET_ID = '1UHHE0_Lew9dP-p_dlo6FWP-nlIMIF20KF9AxEihAaiw'; // Event registrations Sheet
const ATTENDEES_SHEET_NAME = 'attendees';

// NOTE: Ideally, you should also authenticate the user token against the Users Sheet here.
// For simplicity and separation as requested, we will proceed with the email provided in the request,
// assuming the frontend has already authenticated the user via yatris-users.gs.

/**
 * Handle CORS preflight
 */
function doOptions(e) {
  // Google Apps Script handles CORS headers automatically when deployed as a Web App
  return ContentService.createTextOutput('');
}

/**
 * Handle GET request
 */
function doGet(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  
  try {
    const action = e.parameter.action;
    const email = e.parameter.email; // We use email directly as the filter

    if (action === 'getRegisteredEvents') {
        if (!email) throw new Error('Email required');
        const events = getUserRegisteredEvents(email);
        return sendResponse({ success: true, events: events });
    }

    return sendResponse({ error: 'Invalid action' });
  } catch (err) {
    return sendResponse({ success: false, error: err.toString() });
  }
}

/**
 * Handle POST request
 */
function doPost(e) {
  if (e.parameter && e.parameter.method === 'OPTIONS') return doOptions(e);
  
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === 'registerEvent') {
      // Basic validation
      if (!data.eventId || !data.email) return sendResponse({ success: false, error: 'Missing required fields' });
      return sendResponse(registerEvent(data));
    }

    return sendResponse({ success: false, error: 'Invalid action code' });
  } catch (err) {
    return sendResponse({ success: false, error: err.toString() });
  }
}

// --- CORE FUNCTIONS ---

function registerEvent(data) {
  const ss = SpreadsheetApp.openById(ATTENDEES_SPREADSHEET_ID);
  let sheet = ss.getSheetByName(ATTENDEES_SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(ATTENDEES_SHEET_NAME);
    // Headers
    sheet.appendRow(['Event ID', 'Event Name', 'User Email', 'User Name', 'User Phone', 'Registration Date', 'Tickets', 'Total Amount', 'Attendees Data', 'Status']);
  }

  sheet.appendRow([
    data.eventId,
    data.eventName,
    data.email,
    data.userName,
    data.phone || '', // New User Phone field
    new Date().toISOString(),
    data.tickets || 1,
    data.totalAmount || 0,
    JSON.stringify(data.attendees || []),
    'confirmed'
  ]);

  return { success: true, message: 'Registration confirmed!' };
}

function getUserRegisteredEvents(email) {
    const ss = SpreadsheetApp.openById(ATTENDEES_SPREADSHEET_ID);
    const sheet = ss.getSheetByName(ATTENDEES_SHEET_NAME);
    if (!sheet) return [];
    
    const data = sheet.getDataRange().getValues();
    // Headers: EventID(0), Name(1), Email(2), UserName(3), Phone(4), RegDate(5), Tickets(6), Amount(7), Attendees(8), Status(9)
    
    // Skip header row
    return data.slice(1)
        .filter(row => row[2] === email) // Filter by User Email column
        .map(row => ({
            id: 'reg_' + row[0] + '_' + Math.random().toString(36).substr(2, 5),
            eventId: row[0],
            eventName: row[1],
            registrationDate: row[5], // Index 5
            attendees: safeJSONParse(row[8]), // Index 8
            status: row[9], // Index 9
            // Placeholders for frontend display (images/location would need to come from event data or match ID)
            eventImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=450&fit=crop', 
            eventDate: new Date().toISOString(), 
            eventLocation: 'View Details' 
        }));
}

// --- HELPERS ---

function sendResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function safeJSONParse(str) {
    try { return JSON.parse(str); } catch (e) { return []; }
}
