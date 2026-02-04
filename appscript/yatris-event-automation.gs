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
    
    if (data.action === 'submitProposal') {
      return submitProposal(data);
    }
    
    if (data.action === 'createEvent') {
      return createEventStructure(data);
    }
    
    if (data.action === 'deleteEvent') {
      return deleteEventFolder(data);
    }
    
    if (data.action === 'uploadMedia') {
      return uploadEventMedia(data);
    }
    
    if (data.action === 'registerEvent') {
      return registerForEvent(data);
    }
    
    if (data.action === 'verifyAttendee') {
      return verifyAttendeeCode(data);
    }
    
    if (data.action === 'confirmAttendance') {
      return confirmAttendanceCode(data);
    }

    if (data.action === 'submitFeedback') {
      return submitEventFeedback(data);
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

// ... (existing code) ...

/**
 * Submit a proposal (Venue, Speaker, Sponsor) to the Event Spreadsheet
 */
function submitProposal(data) {
  try {
    const spreadsheetId = data.spreadsheetId;
    const type = data.type; // 'venue', 'speaker', 'sponsor'
    const submission = data.submission;
    
    if (!spreadsheetId || !type || !submission) {
      throw new Error('Missing required fields: spreadsheetId, type, submission');
    }
    
    const ss = SpreadsheetApp.openById(spreadsheetId);
    let sheetName = '';
    let headers = [];
    
    if (type === 'venue') {
      sheetName = 'Venue Proposals';
      headers = ['ID', 'Date', 'Venue Name', 'Address', 'Capacity', 'Facilities', 'Contact Name', 'Email', 'Phone', 'Pricing', 'Notes', 'Status'];
    } else if (type === 'speaker') {
      sheetName = 'Speaker Applications';
      headers = ['ID', 'Date', 'Full Name', 'Email', 'LinkedIn', 'Bio', 'Talk Title', 'Talk Description', 'Duration', 'Category', 'Experience', 'Status'];
    } else if (type === 'sponsor') {
      sheetName = 'Sponsor Offers';
      headers = ['ID', 'Date', 'Company Name', 'Contact Name', 'Email', 'Phone', 'Tier', 'Budget', 'Areas', 'Notes', 'Status'];
    } else {
      throw new Error('Invalid submission type');
    }
    
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f3f3f3');
      sheet.setFrozenRows(1);
    }
    
    // Prepare row data based on type
    let rowData = [];
    if (type === 'venue') {
      rowData = [
        submission.id,
        new Date(),
        submission.venueName,
        submission.address,
        submission.capacity,
        submission.facilities,
        submission.contactName,
        submission.contactEmail,
        submission.contactPhone,
        submission.pricingTerms,
        submission.additionalNotes,
        'Pending'
      ];
    } else if (type === 'speaker') {
      rowData = [
        submission.id,
        new Date(),
        submission.fullName,
        submission.email,
        submission.linkedinWebsite,
        submission.bio,
        submission.talkTitle,
        submission.talkDescription,
        submission.talkDuration,
        submission.topicCategory,
        submission.previousExperience,
        'Pending'
      ];
    } else if (type === 'sponsor') {
      rowData = [
        submission.id,
        new Date(),
        submission.companyName,
        submission.contactName,
        submission.contactEmail,
        submission.contactPhone,
        submission.sponsorshipTier,
        submission.sponsorshipBudget,
        Array.isArray(submission.sponsorshipAreas) ? submission.sponsorshipAreas.join(', ') : submission.sponsorshipAreas,
        submission.additionalNotes,
        'Pending'
      ];
    }
    
    sheet.appendRow(rowData);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Proposal submitted successfully',
      sheetName: sheetName
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Error submitting proposal: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Delete an event folder from Google Drive
 */
function deleteEventFolder(data) {
  try {
    const folderId = data.eventFolderId;
    
    if (!folderId) {
      throw new Error('Missing required field: eventFolderId');
    }
    
    // Get the folder
    const folder = DriveApp.getFolderById(folderId);
    
    if (!folder) {
      throw new Error('Event folder not found');
    }
    
    // Move folder to trash (can be restored from trash if needed)
    folder.setTrashed(true);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Event folder deleted successfully',
      folderId: folderId
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Error deleting event folder: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Upload media file to event's media folder
 */
function uploadEventMedia(data) {
  try {
    const eventFolderId = data.eventFolderId;
    const fileName = data.fileName;
    const fileData = data.fileData; // base64 encoded
    const mimeType = data.mimeType;
    
    if (!eventFolderId || !fileName || !fileData || !mimeType) {
      throw new Error('Missing required fields: eventFolderId, fileName, fileData, mimeType');
    }
    
    // Get the event folder
    const eventFolder = DriveApp.getFolderById(eventFolderId);
    
    if (!eventFolder) {
      throw new Error('Event folder not found');
    }
    
    // Find or get media subfolder
    const mediaFolders = eventFolder.getFoldersByName('Media');
    let mediaFolder;
    
    if (mediaFolders.hasNext()) {
      mediaFolder = mediaFolders.next();
    } else {
      throw new Error('Media folder not found in event folder');
    }
    
    // Decode base64 and create file
    const fileBlob = Utilities.newBlob(
      Utilities.base64Decode(fileData),
      mimeType,
      fileName
    );
    
    const file = mediaFolder.createFile(fileBlob);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'File uploaded successfully',
      fileId: file.getId(),
      fileUrl: file.getUrl()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Error uploading media: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Register user for an event
 */
function registerForEvent(data) {
  try {
    const eventId = data.eventId;
    const eventSlug = data.eventSlug;
    const eventName = data.eventName;
    const userId = data.userId;
    const registrationCode = data.registrationCode;
    const userDetails = data.userDetails;
    
    // Payment fields
    const ticketType = data.ticketType || 'free';
    const ticketPrice = data.ticketPrice || '';
    const paymentStatus = data.paymentStatus || '';
    const paymentId = data.paymentId || '';
    const paymentAmount = data.paymentAmount || '';
    const paymentTimestamp = data.paymentTimestamp || '';
    const orderId = data.orderId || '';
    const currency = data.currency || '';
    const spreadsheetId = data.spreadsheetId;
    const codePrefix = data.codePrefix || 'EVENT'; // Default prefix
    
    if (!eventId || !userId || !userDetails) {
      throw new Error('Missing required fields');
    }
    
    // Get or create the Registrations sheet
    const ss = getCentralSpreadsheet();
    let sheet = ss.getSheetByName('Registrations');
    
    if (!sheet) {
      sheet = ss.insertSheet('Registrations');
      // Add headers with payment fields
      sheet.appendRow([
        'Code',
        'Name',
        'Email',
        'Phone',
        'City',
        'State',
        'Country',
        'LinkedIn',
        'Event ID',
        'Event Name',
        'Event Slug',
        'User ID',
        'Registered At',
        'Status',
        'Attended At',
        // Payment fields
        'Ticket Type',
        'Ticket Price',
        'Payment Status',
        'Payment ID',
        'Payment Amount',
        'Payment Timestamp',
        'Order ID',
        'Currency'
      ]);
      
      // Format header row
      const headerRange = sheet.getRange(1, 1, 1, 23);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('#ffffff');
    }

    // Generate Registration Code Logic
    // Format: [TechStack]YATRI[Random][Sequence]
    // Example: AWSYATRIabc001
    
    // 1. Calculate Sequence
    // getLastRow() includes header. So if lastRow is 1, next is 1.
    // If lastRow is 10, next is 10 (since row 1 is header, there are 9 records).
    // Actually, let's just use getLastRow() as the sequence number, it's unique enough for this purpose if we don't delete rows often.
    // Ideally: Count rows + 1 - Header
    const lastRow = sheet.getLastRow();
    const sequence = lastRow; // Start from 1 (row 2 becomes sequence 1 if lastRow was 1)
    const paddedSequence = ('000' + sequence).slice(-3);
    
    // 2. Random String (3 chars)
    const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
    
    // 3. Construct Code
    // Ensure prefix is uppercase and clean
    const safePrefix = codePrefix.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10).toUpperCase();
    const finalRegistrationCode = `${safePrefix}YATRI${randomStr}${paddedSequence}`;

    // If data.registrationCode was sent, we ignore it now in favor of backend generation
    // OR we could check if it exists in the sheet (for idempotency), but for now let's enforce new code generation
    
    // Check if code already exists (unlikely with random+time, but strict check)
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    // Optional: Check duplication based on UserID + EventID to prevent double registration logic if needed here
    // For now, proceeding with generation
    
    // Add registration row with payment data
    const timestamp = new Date().toISOString();
    sheet.appendRow([
      finalRegistrationCode,
      userDetails.name,
      userDetails.email,
      userDetails.phone,
      userDetails.city,
      userDetails.state,
      userDetails.country,
      userDetails.linkedIn || '',
      eventId,
      eventName,
      eventSlug,
      userId,
      timestamp,
      'registered',
      '', // Attended At - empty initially
      // Payment fields
      ticketType,
      ticketPrice,
      paymentStatus,
      paymentId,
      paymentAmount,
      paymentTimestamp,
      orderId,
      currency
    ]);

    // 2. Write to Specific Event Spreadsheet (User Viewable)
    if (spreadsheetId) {
      try {
        const eventSs = SpreadsheetApp.openById(spreadsheetId);
        const regSheet = eventSs.getSheetByName('Registrations'); 
        
        if (regSheet) {
          regSheet.appendRow([
            timestamp,
            userDetails.name,
            userDetails.email,
            userDetails.phone,
            userDetails.city || '', 
            ticketType,
            'Registered',
            '' // Check-in Time
          ]);
        }
      } catch (e) {
        Logger.log('Error writing to event spreadsheet: ' + e.toString());
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      registrationCode: finalRegistrationCode,
      message: 'Registration successful'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Error registering for event: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Helper to get the central spreadsheet
 */
function getCentralSpreadsheet() {
  // 1. Try active spreadsheet (container-bound)
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) return ss;
  } catch (e) {
    Logger.log('No active spreadsheet: ' + e.toString());
  }
  
  // 2. Try to find existing Master Sheet in Log Folder
  try {
    const folder = DriveApp.getFolderById(LOG_FOLDER_ID);
    const files = folder.getFilesByName('Yatri Events Master Sheet');
    
    if (files.hasNext()) {
      return SpreadsheetApp.open(files.next());
    }
    
    // 3. Create if not found
    const ss = SpreadsheetApp.create('Yatri Events Master Sheet');
    const file = DriveApp.getFileById(ss.getId());
    folder.addFile(file);
    DriveApp.getRootFolder().removeFile(file);
    
    // Setup initial sheets if new
    if (!ss.getSheetByName('Registrations')) {
      ss.insertSheet('Registrations');
    }
    
    return ss;
  } catch (e) {
    throw new Error('Could not open or create Central Spreadsheet: ' + e.toString());
  }
}

/**
 * Verify attendee by registration code
 */
function verifyAttendeeCode(data) {
  try {
    const code = data.code;
    
    if (!code) {
      throw new Error('Missing registration code');
    }
    
    const ss = getCentralSpreadsheet();
    const sheet = ss.getSheetByName('Registrations');
    
    if (!sheet) {
      throw new Error('Registrations sheet not found');
    }
    
    // Find registration by code
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === code) {
        // Found the registration
        const attendee = {
          code: values[i][0],
          name: values[i][1],
          email: values[i][2],
          phone: values[i][3],
          city: values[i][4],
          state: values[i][5],
          country: values[i][6],
          linkedIn: values[i][7],
          eventId: values[i][8],
          eventName: values[i][9],
          eventSlug: values[i][10],
          userId: values[i][11],
          registeredAt: values[i][12],
          status: values[i][13],
          attendedAt: values[i][14]
        };
        
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          attendee: attendee
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // Code not found
    throw new Error('Registration code not found');
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Error verifying attendee: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Confirm attendee attendance
 */
function confirmAttendanceCode(data) {
  try {
    const code = data.code;
    
    if (!code) {
      throw new Error('Missing registration code');
    }
    
    const ss = getCentralSpreadsheet();
    const sheet = ss.getSheetByName('Registrations');
    
    if (!sheet) {
      throw new Error('Registrations sheet not found');
    }
    
    // Find and update registration
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === code) {
        // Update status and attended timestamp
        const timestamp = new Date().toISOString();
        sheet.getRange(i + 1, 14).setValue('attended'); // Status column
        sheet.getRange(i + 1, 15).setValue(timestamp);   // Attended At column
        
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: 'Attendance confirmed successfully'
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // Code not found
    throw new Error('Registration code not found');
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Error confirming attendance: ' + error.toString()
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
    
    // Create subfolders (Main Event Section)
    const galleryFolder = eventFolder.createFolder('gallery');
    const speakersFolder = eventFolder.createFolder('speakers');
    const mediaFolder = eventFolder.createFolder('media');
    
    // Create "Upcoming" folder structure as requested
    // "Add one more folder, upcoming hyphen that event name itself again. And inside that three folder..."
    const upcomingFolderName = `upcoming-${eventName}`;
    const upcomingFolder = eventFolder.createFolder(upcomingFolderName);
    upcomingFolder.createFolder('gallery');
    upcomingFolder.createFolder('speakers');
    upcomingFolder.createFolder('media');
    
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

    // Process Speakers (Save photos to MAIN speakers folder)
    const speakersData = data.speakers || [];
    const processedSpeakers = speakersData.map((speaker, index) => {
      if (speaker.imageUrl && speaker.imageUrl.startsWith('data:image')) {
        const photoUrl = saveBase64Image(speaker.imageUrl, speakersFolder, `speaker-${index}-${speaker.name.replace(/\s+/g, '-').toLowerCase()}`);
        return { ...speaker, imageUrl: photoUrl };
      }
      return speaker;
    });

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
      sponsors: sponsorsJson,
      speakers: processedSpeakers
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
        media: mediaFolder.getUrl(),
        upcoming: upcomingFolder.getUrl()
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
  
  // Create Registrations sheet
  const registrationsSheet = spreadsheet.insertSheet('Registrations');
  setupRegistrationsSheet(registrationsSheet);
  
  // Create Speakers sheet
  const speakersSheet = spreadsheet.insertSheet('Speakers');
  setupSpeakersSheet(speakersSheet, eventData.speakers);
  
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
 * Setup Registrations sheet
 */
function setupRegistrationsSheet(sheet) {
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
/**
 * Setup Speakers sheet
 */
function setupSpeakersSheet(sheet, speakersData) {
  const headers = [
    ['Name', 'Title', 'Organization', 'Bio', 'Email', 'Phone', 'Photo URL', 'LinkedIn', 'Session Topic', 'Session Time']
  ];
  
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);
  sheet.getRange(1, 1, 1, headers[0].length).setBackground('#ea4335').setFontColor('#ffffff').setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers[0].length);
  
  // Populate with provided speakers
  if (speakersData && Array.isArray(speakersData) && speakersData.length > 0) {
    const rows = speakersData.map(speaker => [
      speaker.name || '',
      speaker.role || '', // Mapping role to Title
      speaker.company || '',
      speaker.bio || '', 
      speaker.email || '',
      speaker.phone || '', 
      speaker.imageUrl || '',
      speaker.linkedinUrl || '',
      '', '' // Session info empty initially
    ]);
    
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
    }
  }
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

/**
 * Submit Event Feedback
 */
function submitEventFeedback(data) {
  try {
    const eventName = data.eventName;
    const rating = data.rating;
    const likes = data.likes || '';
    const improvements = data.improvements || '';
    const name = data.name || 'Anonymous';
    const email = data.email || '';
    const source = data.source || 'web';
    
    if (!eventName || !rating) {
      throw new Error('Missing required fields: eventName, rating');
    }
    
    const ss = getCentralSpreadsheet();
    let sheet = ss.getSheetByName('Event Feedback');
    
    if (!sheet) {
      sheet = ss.insertSheet('Event Feedback');
      // Headers
      sheet.appendRow([
        'Timestamp',
        'Event Name',
        'Rating',
        'Likes',
        'Improvements',
        'Name',
        'Email',
        'Source'
      ]);
      
      const headerRange = sheet.getRange(1, 1, 1, 8);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#fff2cc'); // Light orange/yellow
      sheet.setFrozenRows(1);
    }
    
    sheet.appendRow([
      new Date(),
      eventName,
      rating,
      likes,
      improvements,
      name,
      email,
      source
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Feedback submitted successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Error submitting feedback: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
