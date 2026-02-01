/**
 * Yatri Events - Automated Event Folder & Sheet Creation
 * 
 * This script automatically creates:
 * 1. Event folder in the appropriate city folder
 * 2. Subfolders (gallery, speakers, media)
 * 3. Google Spreadsheet with multiple sheets for event management
 */

// ==================== CONFIGURATION ====================

// City Folder ID Mapping
// Add more cities as needed
const CITY_FOLDERS = {
  'bangalore': '1OUM6IMngpnDZyZVTTN2Tq-vD0xzfZx3C', // Mapping to India folder as requested
  'karnataka': '1OUM6IMngpnDZyZVTTN2Tq-vD0xzfZx3C', // Mapping to India folder as requested
  'india': '1OUM6IMngpnDZyZVTTN2Tq-vD0xzfZx3C'
};

// Log folder ID for tracking (using the only valid folder)
const LOG_FOLDER_ID = '1OUM6IMngpnDZyZVTTN2Tq-vD0xzfZx3C'; 

/**
 * Handle POST requests from the web application
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'createEvent') {
      return createEventStructure(data);
    }
    
    if (data.action === 'getEvents') {
      return getEvents();
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Invalid action: ' + (data.action || 'none')
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Error in doPost: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ... (rest of the file until createEventStructure)

/**
 * Create complete event structure
 */
function createEventStructure(data) {
  try {
    const eventName = data.eventName;
    const eventDate = data.eventDate;
    const state = data.state ? data.state.toLowerCase() : 'karnataka';
    const city = data.city ? data.city.toLowerCase() : 'bangalore';
    const location = data.location || '';
    const description = data.description || '';
    const aboutEvent = data.aboutEvent || '';
    const communityLink = data.communityLink || '';
    const pricingType = data.pricingType || 'free';
    const price = data.price || '';
    const capacity = data.capacity || '';
    const registrationDeadline = data.registrationDeadline || '';
    const organizerName = data.organizerName || '';
    const organizerEmail = data.organizerEmail || '';
    const organizerPhone = data.organizerPhone || '';
    const timezone = data.timezone || '';
    const endDate = data.endDate || '';
    const mapLink = data.mapLink || '';
    const imageUrl = data.imageUrl || '';
    const sponsorsData = data.sponsors || [];
    
    // Validate required fields
    if (!eventName) {
      throw new Error('Event name is required');
    }
    
    // Root Folder (India)
    const rootFolderId = LOG_FOLDER_ID; // Using India folder as root
    const rootFolder = DriveApp.getFolderById(rootFolderId);
    
    // 1. Create or get state folder: yatri-events-{state}
    const stateFolderName = `yatri-events-${state}`;
    let stateFolder = null;
    const stateFolders = rootFolder.getFoldersByName(stateFolderName);
    if (stateFolders.hasNext()) {
      stateFolder = stateFolders.next();
    } else {
      stateFolder = rootFolder.createFolder(stateFolderName);
      Logger.log(`Created state folder: ${stateFolderName}`);
    }
    
    // 2. Create or get city folder inside state folder: yatri-events-{city}
    const cityFolderName = `yatri-events-${city}`;
    let cityFolder = null;
    const cityFolders = stateFolder.getFoldersByName(cityFolderName);
    if (cityFolders.hasNext()) {
      cityFolder = cityFolders.next();
    } else {
      cityFolder = stateFolder.createFolder(cityFolderName);
      Logger.log(`Created city folder: ${cityFolderName}`);
    }
    
    // Create folder name
    const folderName = eventDate ? `${eventName} - ${eventDate}` : eventName;
    
    // 3. Create event folder inside city folder
    const eventFolder = cityFolder.createFolder(folderName);
    
    // Create subfolders
    const galleryFolder = eventFolder.createFolder('gallery');
    const speakersFolder = eventFolder.createFolder('speakers');
    const mediaFolder = eventFolder.createFolder('media');
    
    // 4. Save base64 images to media folder to avoid 50k character limit in Sheets
    const processedImageUrl = saveBase64Image(imageUrl, mediaFolder, `poster-${eventName.replace(/\s+/g, '-').toLowerCase()}`);
    
    const processedSponsors = sponsorsData.map((sponsor, index) => {
      if (sponsor.logo && sponsor.logo.startsWith('data:image')) {
        const logoUrl = saveBase64Image(sponsor.logo, mediaFolder, `sponsor-${index}-${sponsor.name.replace(/\s+/g, '-').toLowerCase()}`);
        return { ...sponsor, logo: logoUrl };
      }
      return sponsor;
    });
    const sponsorsJson = JSON.stringify(processedSponsors);

    // Create Google Spreadsheet
    const spreadsheet = createEventSpreadsheet(eventFolder, eventName, {
      eventName: eventName,
      eventDate: eventDate,
      state: state,
      city: city,
      location: location,
      description: description,
      aboutEvent: aboutEvent,
      communityLink: communityLink,
      pricingType: pricingType,
      price: price,
      capacity: capacity,
      registrationDeadline: registrationDeadline,
      organizerName: organizerName,
      organizerEmail: organizerEmail,
      organizerPhone: organizerPhone,
      timezone: timezone,
      endDate: endDate,
      mapLink: mapLink,
      imageUrl: processedImageUrl,
      sponsors: sponsorsJson
    });
    
    // Log the creation
    logEventCreation(eventName, `${state}/${city}`, eventFolder.getId(), spreadsheet.getId());
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      eventFolderId: eventFolder.getId(),
      eventFolderUrl: eventFolder.getUrl(),
      spreadsheetId: spreadsheet.getId(),
      spreadsheetUrl: spreadsheet.getUrl(),
      subfolders: {
        gallery: galleryFolder.getUrl(),
        speakers: speakersFolder.getUrl(),
        media: mediaFolder.getUrl()
      }
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error creating event structure: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get all published events from spreadsheets
 */
function getEvents() {
  try {
    const logFolder = DriveApp.getFolderById(LOG_FOLDER_ID);
    const files = logFolder.getFilesByName('Event Creation Log');
    
    if (!files.hasNext()) {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        data: []
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const logFile = files.next();
    const logText = logFile.getBlob().getDataAsString();
    const lines = logText.split('\n');
    
    const events = [];
    
    // Process unique sheet IDs (last entry for each event name)
    const latestSheets = new Map();
    lines.forEach(line => {
      if (!line.trim()) return;
      const parts = line.split(' | ');
      if (parts.length < 5) return;
      
      const eventName = parts[1].split(': ')[1];
      const sheetId = parts[4].split(': ')[1];
      latestSheets.set(eventName, sheetId);
    });
    
    for (const [eventName, sheetId] of latestSheets.entries()) {
      try {
        const ss = SpreadsheetApp.openById(sheetId);
        const sheet = ss.getSheetByName('Event Details');
        if (!sheet) continue;
        
        const dataRows = sheet.getDataRange().getValues();
        const eventData = {};
        
        // Skip header
        for (let i = 1; i < dataRows.length; i++) {
          const key = dataRows[i][0];
          const value = dataRows[i][1];
          if (key && value !== undefined && value !== '') {
            eventData[key] = value;
          }
        }
        
        events.push({
          id: sheetId,
          name: eventData['Event Name'] || eventName,
          date: eventData['Event Date'] || '',
          endDate: eventData['End Date'] || '',
          timezone: eventData['Time Zone'] || '',
          description: eventData['Description'] || '',
          aboutEvent: eventData['About Event'] || '',
          imageUrl: eventData['Poster URL'] || '',
          location: {
            venue: eventData['Location'] || '',
            city: eventData['City'] || '',
            state: eventData['State'] || '',
            type: (eventData['Location'] || '').toLowerCase().includes('online') ? 'online' : 'offline',
            country: 'India' // Defaulting for now
          },
          category: 'Meetup', // Default categorizing from sheet
          status: 'upcoming',
          price: eventData['Price (INR)'] || 'Free'
        });
      } catch (e) {
        Logger.log(`Error reading sheet ${sheetId}: ${e.toString()}`);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      data: events
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Create event spreadsheet with multiple sheets
 */
function createEventSpreadsheet(folder, eventName, eventData) {
  // Create spreadsheet in the event folder
  const spreadsheet = SpreadsheetApp.create(eventName);
  const file = DriveApp.getFileById(spreadsheet.getId());
  
  // Move to event folder
  folder.addFile(file);
  DriveApp.getRootFolder().removeFile(file);
  
  // Get default sheet and rename to "Event Details"
  const eventDetailsSheet = spreadsheet.getActiveSheet();
  eventDetailsSheet.setName('Event Details');
  
  // Setup Event Details sheet
  setupEventDetailsSheet(eventDetailsSheet, eventData);
  
  // Create Attendees sheet
  const attendeesSheet = spreadsheet.insertSheet('Attendees');
  setupAttendeesSheet(attendeesSheet);
  
  // Create Speakers sheet
  const speakersSheet = spreadsheet.insertSheet('Speakers');
  setupSpeakersSheet(speakersSheet);
  
  // Create Schedule sheet
  const scheduleSheet = spreadsheet.insertSheet('Schedule');
  setupScheduleSheet(scheduleSheet);
  
  // Create Feedback sheet
  const feedbackSheet = spreadsheet.insertSheet('Feedback');
  setupFeedbackSheet(feedbackSheet);
  
  // Create Analytics sheet
  const analyticsSheet = spreadsheet.insertSheet('Analytics');
  setupAnalyticsSheet(analyticsSheet);
  
  return spreadsheet;
}

// ==================== SHEET SETUP FUNCTIONS ====================

/**
 * Setup Event Details sheet
 */
function setupEventDetailsSheet(sheet, eventData) {
  const headers = [
    ['Field', 'Value']
  ];
  
  const data = [
    ['Event Name', eventData.eventName || ''],
    ['Event Date', eventData.eventDate || ''],
    ['End Date', eventData.endDate || ''],
    ['Time Zone', eventData.timezone || ''],
    ['State', eventData.state || ''],
    ['City', eventData.city || ''],
    ['Location', eventData.location || ''],
    ['Description', eventData.description || ''],
    ['About Event', eventData.aboutEvent || ''],
    ['Community Link', eventData.communityLink || ''],
    ['Map Link', eventData.mapLink || ''],
    ['Poster URL', eventData.imageUrl || ''],
    ['Sponsors Data', eventData.sponsors || ''],
    ['Status', 'Upcoming'],
    ['Created At', new Date().toISOString()],
    ['', ''],
    ['Pricing', ''],
    ['Pricing Type', eventData.pricingType || 'Free'],
    ['Price (INR)', eventData.pricingType === 'paid' ? (eventData.price || '0') : 'Free'],
    ['', ''],
    ['Registration Details', ''],
    ['Total Registrations', '0'],
    ['Capacity', eventData.capacity || ''],
    ['Registration Deadline', eventData.registrationDeadline || ''],
    ['', ''],
    ['Contact Information', ''],
    ['Organizer Name', eventData.organizerName || ''],
    ['Organizer Email', eventData.organizerEmail || ''],
    ['Organizer Phone', eventData.organizerPhone || '']
  ];
  
  sheet.getRange(1, 1, headers.length, headers[0].length).setValues(headers);
  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
  
  // Format headers and section titles
  sheet.getRange(1, 1, 1, 2).setBackground('#4285f4').setFontColor('#ffffff').setFontWeight('bold');
  sheet.getRange('A13').setFontWeight('bold').setBackground('#e8f0fe'); // Pricing
  sheet.getRange('A17').setFontWeight('bold').setBackground('#e8f0fe'); // Registration
  sheet.getRange('A22').setFontWeight('bold').setBackground('#e8f0fe'); // Contact
  
  // Auto-resize columns
  sheet.autoResizeColumns(1, 2);
  sheet.setColumnWidth(2, 400);
}

/**
 * Setup Attendees sheet
 */
function setupAttendeesSheet(sheet) {
  const headers = [
    ['Timestamp', 'Name', 'Email', 'Phone', 'Organization', 'Ticket Type', 'Status', 'Check-in Time']
  ];
  
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);
  sheet.getRange(1, 1, 1, headers[0].length).setBackground('#34a853').setFontColor('#ffffff').setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers[0].length);
}

/**
 * Setup Speakers sheet
 */
function setupSpeakersSheet(sheet) {
  const headers = [
    ['Name', 'Title', 'Organization', 'Bio', 'Email', 'Phone', 'Photo URL', 'LinkedIn', 'Session Topic', 'Session Time']
  ];
  
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);
  sheet.getRange(1, 1, 1, headers[0].length).setBackground('#ea4335').setFontColor('#ffffff').setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers[0].length);
}

/**
 * Setup Schedule sheet
 */
function setupScheduleSheet(sheet) {
  const headers = [
    ['Time', 'Session Title', 'Speaker(s)', 'Duration (mins)', 'Room/Track', 'Type', 'Description']
  ];
  
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);
  sheet.getRange(1, 1, 1, headers[0].length).setBackground('#fbbc04').setFontColor('#000000').setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers[0].length);
}

/**
 * Setup Feedback sheet
 */
function setupFeedbackSheet(sheet) {
  const headers = [
    ['Timestamp', 'Attendee Name', 'Email', 'Overall Rating', 'Content Rating', 'Venue Rating', 'Organization Rating', 'Comments', 'Suggestions']
  ];
  
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);
  sheet.getRange(1, 1, 1, headers[0].length).setBackground('#9c27b0').setFontColor('#ffffff').setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers[0].length);
}

/**
 * Setup Analytics sheet
 */
function setupAnalyticsSheet(sheet) {
  const headers = [
    ['Metric', 'Value']
  ];
  
  const data = [
    ['Total Registrations', '=COUNTA(Attendees!B:B)-1'],
    ['Total Speakers', '=COUNTA(Speakers!A:A)-1'],
    ['Check-ins', '=COUNTIF(Attendees!G:G,"Checked In")'],
    ['Attendance Rate', '=IF(A2>0,A3/A2,0)'],
    ['Average Rating', '=AVERAGE(Feedback!D:D)'],
    ['Total Feedback', '=COUNTA(Feedback!B:B)-1'],
    ['', ''],
    ['Session Count', '=COUNTA(Schedule!A:A)-1']
  ];
  
  sheet.getRange(1, 1, headers.length, headers[0].length).setValues(headers);
  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
  
  // Format
  sheet.getRange(1, 1, 1, 2).setBackground('#4285f4').setFontColor('#ffffff').setFontWeight('bold');
  sheet.autoResizeColumns(1, 2);
}

// ==================== LOGGING ====================

/**
 * Log event creation
 */
function logEventCreation(eventName, city, folderId, spreadsheetId) {
  try {
    const logFolder = DriveApp.getFolderById(LOG_FOLDER_ID);
    const logFileName = 'Event Creation Log';
    
    // Find or create log file
    let logFile;
    const files = logFolder.getFilesByName(logFileName);
    
    if (files.hasNext()) {
      logFile = files.next();
    } else {
      logFile = logFolder.createFile(logFileName, '', MimeType.PLAIN_TEXT);
    }
    
    const logEntry = `${new Date().toISOString()} | Event: ${eventName} | City: ${city} | Folder: ${folderId} | Sheet: ${spreadsheetId}\n`;
    logFile.setContent(logFile.getBlob().getDataAsString() + logEntry);
    
  } catch (error) {
    Logger.log('Error logging event creation: ' + error.toString());
  }
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Test function to verify setup - RUN THIS IN EDITOR
 * This bypasses the doPost handler and tests the core functionality directly
 */
function testEventCreation() {
  Logger.log('========================================');
  Logger.log('Testing Full Event Creation (with New Fields)');
  Logger.log('========================================');
  
  const testData = {
    action: 'createEvent',
    eventName: 'Yatri Cloud Summit 2026 (Test)',
    eventDate: '2026-05-15T09:00',
    endDate: '2026-05-16T18:00',
    timezone: 'Asia/Kolkata',
    city: 'bangalore',
    location: 'Bangalore Tech Park, MG Road',
    mapLink: 'https://maps.app.goo.gl/example123',
    communityLink: 'https://chat.whatsapp.com/test-invite',
    description: 'A comprehensive workshop on cloud computing fundamentals (Automated Test)',
    aboutEvent: 'Detailed description of the event goes here. It spans multiple days.',
    imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30',
    organizerName: 'Yatri Cloud Test',
    organizerEmail: 'test@yatricloud.com',
    organizerPhone: '+91 9876543210',
    pricingType: 'paid',
    price: 499,
    capacity: 100,
    registrationDeadline: '2026-05-10T23:59',
    sponsors: [
      { name: 'TechCorp', tier: 'Platinum', website: 'https://techcorp.io', logo: 'https://via.placeholder.com/150' },
      { name: 'StartUp Inc', tier: 'Gold', website: 'https://startup.com', logo: '' }
    ]
  };
  
  Logger.log('Test Data Payload:');
  Logger.log(JSON.stringify(testData, null, 2));
  Logger.log('');
  
  // Call the function directly (not via doPost to debug easier)
  try {
    const output = createEventStructure(testData); // This calls the main logic, returns TextOutput
    
    // Parse the result from the TextOutput object
    const result = JSON.parse(output.getContent());
    
    Logger.log('Result Object:');
    Logger.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      Logger.log('');
      Logger.log('✅ SUCCESS!');
      Logger.log('Event Folder URL: ' + result.eventFolderUrl);
      Logger.log('Spreadsheet URL: ' + result.spreadsheetUrl);
      Logger.log('');
      Logger.log('Check Google Drive!');
    } else {
      Logger.log('');
      Logger.log('❌ FAILED! Error: ' + result.error);
    }
  } catch (error) {
    Logger.log('');
    Logger.log('❌ ERROR EXCEPTION!');
    Logger.log(error.toString());
  }
  
  Logger.log('========================================');
}

/**
 * List configured cities
 */
function listConfiguredCities() {
  Logger.log('Configured Cities:');
  for (const city in CITY_FOLDERS) {
    Logger.log(`- ${city}: ${CITY_FOLDERS[city]}`);
  }
}

/**
 * Save a base64 image string as a file in Google Drive
 * Returns the public URL of the saved file
 */
function saveBase64Image(base64Data, folder, fileName) {
  if (!base64Data || !base64Data.startsWith('data:image')) {
    return base64Data; // Return as is if not a base64 image
  }
  
  try {
    // Extract mime type and base64 content
    const match = base64Data.match(/^data:(image\/[a-z]+);base64,(.+)$/);
    if (!match) return base64Data;
    
    const mimeType = match[1];
    const bytes = Utilities.base64Decode(match[2]);
    const blob = Utilities.newBlob(bytes, mimeType, fileName);
    
    const file = folder.createFile(blob);
    // Set file to be viewable by anyone with link
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Return the URL for the spreadsheet
    return file.getUrl();
  } catch (error) {
    Logger.log('Error saving base64 image: ' + error.toString());
    return 'Error saving image: ' + error.toString();
  }
}
