/**
 * Yatri Training Portal Backend
 * Handles folder structure creation, metadata storage, and provider management.
 */

// Configuration
const TRAINING_ROOT_FOLDER_ID = "1bqZMNcH5NWT6N-sKbEfLTw7jpHzwAxHi";
const TRAINING_ROOT_FOLDER_NAME = "Yatri Training Content";
const TRAINING_SHEET_NAME = "Training Data";
const PROVIDERS_SHEET_NAME = "Training Providers";
const ENROLLMENTS_SHEET_NAME = "Enrollments";

/**
 * Helper to get the database spreadsheet robustly
 */
function getTrainingDatabase() {
  var DB_NAME = "Yatri Training Master Database";

  try {
    // 1. Try to get the spreadsheet the script is bound to
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) return ss;
  } catch (e) {}

  // 2. Search inside the target folder first
  try {
    var targetFolder = DriveApp.getFolderById(TRAINING_ROOT_FOLDER_ID);
    var folderFiles = targetFolder.getFilesByName(DB_NAME);
    if (folderFiles.hasNext()) {
      return SpreadsheetApp.open(folderFiles.next());
    }
  } catch (e) {}

  // 3. Fallback: Search anywhere in Drive
  var files = DriveApp.getFilesByName(DB_NAME);
  if (files.hasNext()) {
    var file = files.next();
    // Move it into the target folder if it's not there already
    try {
      var targetFolder2 = DriveApp.getFolderById(TRAINING_ROOT_FOLDER_ID);
      targetFolder2.addFile(file);
      DriveApp.getRootFolder().removeFile(file);
    } catch (moveErr) {
      Logger.log("Could not move existing DB to target folder: " + moveErr);
    }
    return SpreadsheetApp.open(file);
  }

  // 4. Create it inside the target folder
  var newSs = SpreadsheetApp.create(DB_NAME);
  try {
    var newFile = DriveApp.getFileById(newSs.getId());
    var folder = DriveApp.getFolderById(TRAINING_ROOT_FOLDER_ID);
    folder.addFile(newFile);
    DriveApp.getRootFolder().removeFile(newFile);
    Logger.log("Created DB in folder: " + TRAINING_ROOT_FOLDER_ID);
  } catch (moveErr) {
    Logger.log("Created DB in root (could not move): " + moveErr);
  }
  return newSs;
}

/**
 * Main Entry Point for the Training Script
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const result = handleTrainingAction(data.action, data);
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Error in Training doPost: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// NOTE: The definitive handleTrainingAction router is defined below (around line 406).
// Do NOT add a duplicate here — in GAS the last definition wins.

/**
 * Grant Google Meet host access to a trainer
 * Creates/updates a Calendar event with the trainer as co-organizer
 */
function grantMeetAccess(data) {
  try {
    var trainerEmail = data.trainerEmail;
    var trainingId = data.trainingId;
    
    if (!trainerEmail || !trainingId) {
      return { success: false, error: "Missing trainerEmail or trainingId" };
    }
    
    // Look up training data to get meet link, course name, and schedule
    var ss = getTrainingDatabase();
    var sheet = ss.getSheetByName(TRAINING_SHEET_NAME);
    if (!sheet) return { success: false, error: "Training sheet not found" };
    
    var allData = sheet.getDataRange().getValues();
    var trainingRow = null;
    for (var i = 1; i < allData.length; i++) {
      if (allData[i][5] === trainingId) { // Column 5 = Folder ID (used as training ID)
        trainingRow = allData[i];
        break;
      }
    }
    
    if (!trainingRow) {
      return { success: false, error: "Training not found for ID: " + trainingId };
    }
    
    var courseName = trainingRow[3] || "Yatri Training";
    var meetLink = trainingRow[23] || "";
    var startDate = trainingRow[21] || "";
    var startTime = trainingRow[22] || "";
    
    // Create a Calendar event with the trainer as co-host
    var eventStart, eventEnd;
    
    if (startDate) {
      try {
        var dateObj = new Date(startDate);
        if (startTime) {
          // Parse time like "10:00 AM" or "14:00"
          var timeParts = startTime.toString().match(/(\d+):(\d+)\s*(AM|PM)?/i);
          if (timeParts) {
            var hours = parseInt(timeParts[1]);
            var minutes = parseInt(timeParts[2]);
            if (timeParts[3] && timeParts[3].toUpperCase() === "PM" && hours < 12) hours += 12;
            if (timeParts[3] && timeParts[3].toUpperCase() === "AM" && hours === 12) hours = 0;
            dateObj.setHours(hours, minutes, 0, 0);
          }
        }
        eventStart = dateObj;
        eventEnd = new Date(dateObj.getTime() + 2 * 60 * 60 * 1000); // 2 hour default duration
      } catch (e) {
        // Fallback: tomorrow at 10 AM
        eventStart = new Date();
        eventStart.setDate(eventStart.getDate() + 1);
        eventStart.setHours(10, 0, 0, 0);
        eventEnd = new Date(eventStart.getTime() + 2 * 60 * 60 * 1000);
      }
    } else {
      eventStart = new Date();
      eventStart.setDate(eventStart.getDate() + 1);
      eventStart.setHours(10, 0, 0, 0);
      eventEnd = new Date(eventStart.getTime() + 2 * 60 * 60 * 1000);
    }
    
    // Use Calendar Advanced Service to create event with conferenceData
    var calendarId = "primary";
    
    var event = {
      summary: "[Trainer] " + courseName,
      description: "You have been granted host access for this training session.\n\nTraining: " + courseName + (meetLink ? "\nMeet Link: " + meetLink : ""),
      start: {
        dateTime: eventStart.toISOString(),
        timeZone: CalendarApp.getDefaultCalendar().getTimeZone()
      },
      end: {
        dateTime: eventEnd.toISOString(),
        timeZone: CalendarApp.getDefaultCalendar().getTimeZone()
      },
      attendees: [
        {
          email: trainerEmail,
          responseStatus: "accepted"
        }
      ],
      conferenceData: {
        createRequest: {
          requestId: "meet-" + trainingId + "-" + Date.now(),
          conferenceSolutionKey: { type: "hangoutsMeet" }
        }
      },
      guestsCanModify: true,
      guestsCanInviteOthers: true
    };
    
    var createdEvent = Calendar.Events.insert(event, calendarId, { conferenceDataVersion: 1, sendUpdates: "all" });
    
    var newMeetLink = "";
    if (createdEvent.conferenceData && createdEvent.conferenceData.entryPoints) {
      for (var ep = 0; ep < createdEvent.conferenceData.entryPoints.length; ep++) {
        if (createdEvent.conferenceData.entryPoints[ep].entryPointType === "video") {
          newMeetLink = createdEvent.conferenceData.entryPoints[ep].uri;
          break;
        }
      }
    }
    
    Logger.log("Created Calendar event with Meet for trainer " + trainerEmail + ". Meet link: " + (newMeetLink || meetLink || "N/A"));
    
    return {
      success: true,
      message: "Meet host access granted to " + trainerEmail,
      meetLink: newMeetLink || meetLink,
      eventId: createdEvent.id
    };
    
  } catch (e) {
    Logger.log("grantMeetAccess error: " + e.toString());
    return { success: false, error: e.toString() };
  }
}


/**
 * CALL THIS MANUALLY FROM THE EDITOR TO GRANT PERMISSIONS
 */
function authorizeDrive() {
  const root = DriveApp.getRootFolder();
  Logger.log("Drive authorized: " + root.getName());
  const ss = getTrainingDatabase();
  Logger.log("Sheet authorized: " + ss.getName());
}

/**
 * Enroll a User
 */
function enrollUser(data) {
  try {
    const ss = getTrainingDatabase();
    let sheet = ss.getSheetByName(ENROLLMENTS_SHEET_NAME);
    
    if (!sheet) {
      sheet = ss.insertSheet(ENROLLMENTS_SHEET_NAME);
      sheet.appendRow([
        "Timestamp", "Training ID", "Training Name", "User Name", 
        "User Email", "Phone", "City", "State", "Country", "LinkedIn",
        "Status", "Payment Status", "Payment ID", "Amount", "Currency"
      ]);
      sheet.setFrozenRows(1);
    }
    
    const { 
      trainingId, trainingName, 
      userName, userEmail, userPhone, 
      city, state, country, linkedIn,
      status = 'Enrolled',
      paymentStatus = 'Free',
      paymentId = '',
      amount = '',
      currency = ''
    } = data;

    sheet.appendRow([
      new Date(),
      trainingId,
      trainingName,
      userName,
      userEmail,
      userPhone,
      city,
      state,
      country,
      linkedIn,
      status,
      paymentStatus,
      paymentId,
      amount,
      currency
    ]);

    // Auto-share training Drive folder with the enrolled user as Viewer
    try {
      if (userEmail && trainingId) {
        var trainingSheet = ss.getSheetByName(TRAINING_SHEET_NAME);
        if (trainingSheet) {
          var trainingData = trainingSheet.getDataRange().getValues();
          for (var t = 1; t < trainingData.length; t++) {
            var folderId = trainingData[t][5]; // Column 5 = Folder ID
            if (folderId === trainingId) {
              try {
                var folder = DriveApp.getFolderById(folderId);
                folder.addViewer(userEmail);
                Logger.log("Shared folder " + folderId + " with " + userEmail);
              } catch (shareErr) {
                Logger.log("Could not share folder: " + shareErr.toString());
              }
              break;
            }
          }
        }
      }
    } catch (driveErr) {
      Logger.log("Drive sharing error (non-fatal): " + driveErr.toString());
    }
    
    return { success: true, message: "Enrolled successfully!" };
    
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Get All Enrollments (for Admin)
 */
function getEnrollments() {
  const ss = getTrainingDatabase();
  const sheet = ss.getSheetByName(ENROLLMENTS_SHEET_NAME);
  if (!sheet) return { success: true, enrollments: [] };
  
  const data = sheet.getDataRange().getValues();
  data.shift(); // Remove header
  
  // Map rows to objects
  // 0:Time, 1:ID, 2:Name, 3:User, 4:Email, 5:Phone, 6:City, 7:State, 8:Country, 9:LinkedIn
  // 10:Status, 11:PayStatus, 12:PayID, 13:Amt, 14:Curr
  const enrollments = data.map((row, index) => ({
    rowIndex: index + 2, // 1-based index + header match
    timestamp: row[0],
    trainingId: row[1],
    trainingName: row[2],
    userName: row[3],
    userEmail: row[4],
    userPhone: row[5],
    city: row[6],
    state: row[7],
    country: row[8],
    linkedIn: row[9],
    status: row[10],
    paymentStatus: row[11],
    paymentId: row[12],
    amount: row[13],
    currency: row[14]
  })).reverse(); // Show newest first
  
  return { success: true, enrollments };
}

/**
 * Update Enrollment Status
 */
function updateEnrollment(data) {
  try {
    const { rowIndex, status, paymentStatus } = data;
    const ss = getTrainingDatabase();
    const sheet = ss.getSheetByName(ENROLLMENTS_SHEET_NAME);
    
    if (status) sheet.getRange(rowIndex, 11).setValue(status); // Col 11 is Status
    if (paymentStatus) sheet.getRange(rowIndex, 12).setValue(paymentStatus); // Col 12 is PayStatus
    
    return { success: true };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Delete Enrollment
 */
function deleteEnrollment(data) {
  try {
    const { rowIndex } = data;
    const ss = getTrainingDatabase();
    const sheet = ss.getSheetByName(ENROLLMENTS_SHEET_NAME);
    sheet.deleteRow(rowIndex);
    return { success: true };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Handle Training-related actions from doPost
 */
function handleTrainingAction(action, payload) {
  switch (action) {
    // Training CRUD
    case 'createTraining':
      return createTrainingStructure(payload);
    case 'updateTraining':
      return updateTraining(payload);
    case 'getTrainingStructure':
      return getTrainingStructure();
    case 'getTrainings':
      return getTrainings();
    case 'getTrainingById':
      return getTrainingById(payload);
    case 'getTrainingByCertification':
      return getTrainingByCertification(payload.certification);
    case 'getAllTraining':
      return getAllTraining();
    case 'deleteTraining':
      return deleteTraining(payload);
    case 'updateTrainingSchedule':
      return updateTrainingSchedule(payload);
    case 'fixAllTrainingPermissions':
      return fixAllTrainingPermissions();

    // Providers
    case 'getProviders':
      return getProviders();
    case 'addProvider':
      return addProvider(payload);
    case 'deleteProvider':
      return deleteProvider(payload);
    case 'updateProvider':
      return updateProvider(payload);

    // Resources
    case 'uploadResource':
      return uploadResource(payload);
    case 'getTrainingResources':
      return getTrainingResources(payload);
    case 'getTrainingQuizzes':
      return getTrainingQuizzes(payload);
    case 'getFoldersInPath':
      return getFoldersInPath(payload);

    // Enrollments
    case 'enroll':
      return enrollUser(payload);
    case 'enrollUser':
      return enrollUser(payload);
    case 'getEnrollments':
      return getEnrollments();
    case 'updateEnrollment':
      return updateEnrollment(payload);
    case 'deleteEnrollment':
      return deleteEnrollment(payload);

    // Trainer Applications
    case 'submitTrainerApplication':
      return submitTrainerApplication(payload);
    case 'getTrainerApplications':
      return getTrainerApplications();
    case 'updateApplicationStatus':
      return updateApplicationStatus(payload);
    case 'approveTrainer':
      return approveTrainer(payload);
    case 'verifyTrainerAccess':
      return verifyTrainerAccess(payload);
    case 'rejectTrainerApplication':
      return rejectTrainerApplication(payload);
    case 'deleteTrainerApplication':
      return deleteTrainerApplication(payload);

    // Trainer Management
    case 'getApprovedTrainers':
      return getApprovedTrainers();
    case 'assignTrainerToCourse':
      return assignTrainerToCourse(payload);
    case 'getTrainerAssignments':
      return getTrainerAssignments(payload);
    case 'revokeTrainerAssignment':
      return revokeTrainerAssignment(payload);
    case 'createTrainerCredentials':
      return createTrainerCredentials(payload);
    case 'trainerLogin':
      return trainerLogin(payload);
    case 'resetTrainerPassword':
      return resetTrainerPassword(payload);
    case 'deleteTrainer':
      return deleteTrainer(payload);

    // Trainer Course Content
    case 'saveCourseContent':
      return saveCourseContent(payload);
    case 'getCourseContent':
      return getCourseContent(payload);
    case 'submitCourseForApproval':
      return submitCourseForApproval(payload);

    // Google Meet
    case 'grantMeetAccess':
      return grantMeetAccess(payload);

    default:
      return { success: false, error: "Unknown training action: " + action };
  }
}

/**
 * Update an existing training record in-place.
 * Finds the row by Folder ID and updates all columns.
 */
function updateTraining(data) {
  try {
    var id = data.id;
    if (!id) return { success: false, error: 'No training ID provided for update' };

    var ss = getTrainingDatabase();
    var sheet = ss.getSheetByName(TRAINING_SHEET_NAME);
    if (!sheet) return { success: false, error: 'Trainings sheet not found' };

    var allData = sheet.getDataRange().getValues();
    var headers = allData[0];
    var colMap = {};
    for (var h = 0; h < headers.length; h++) {
      colMap[headers[h].toString().trim().toLowerCase()] = h;
    }

    var getIdx = function(keys) {
      for (var k = 0; k < keys.length; k++) {
        if (colMap.hasOwnProperty(keys[k])) return colMap[keys[k]];
      }
      return -1;
    };
    // The unique ID is the Folder ID (Column index 5, F)
    // Hardcoded to match getAllTraining and fix misaligned headers
    var folderIdIdx = 5;

    var targetRow = -1;
    for (var i = 1; i < allData.length; i++) {
      var rowId = (allData[i][folderIdIdx] || '').toString().trim();
      var updateId = (id || '').toString().trim();
      if (rowId === updateId) {
        targetRow = i + 1; // 1-based index
        break;
      }
    }

    if (targetRow === -1) {
      return { success: false, error: 'Training not found for update: ' + id };
    }

    // Hardcoded column updates to match logTrainingToSheet
    // Index 0 is Timestamp (Column 1)
    sheet.getRange(targetRow, 2).setValue(data.type || ''); // Index 1
    sheet.getRange(targetRow, 3).setValue(data.subType || ''); // Index 2
    sheet.getRange(targetRow, 4).setValue(data.courseName || ''); // Index 3
    // Index 4 is Folder URL (skip)
    // Index 5 is Folder ID (skip - used for lookup)
    sheet.getRange(targetRow, 7).setValue(data.description || ''); // Index 6
    sheet.getRange(targetRow, 8).setValue(data.instructor || ''); // Index 7
    sheet.getRange(targetRow, 9).setValue(data.level || ''); // Index 8
    sheet.getRange(targetRow, 10).setValue(data.duration || ''); // Index 9
    sheet.getRange(targetRow, 11).setValue(data.skills || ''); // Index 10
    sheet.getRange(targetRow, 12).setValue(data.outcomes || ''); // Index 11
    
    // Calculate modules count if curriculum provided
    if (data.curriculum) {
       sheet.getRange(targetRow, 13).setValue(data.curriculum.length); // Index 12
    }

    sheet.getRange(targetRow, 14).setValue(data.status || 'Draft'); // Index 13

    // New Data
    sheet.getRange(targetRow, 15).setValue(data.mode || 'Online'); // Index 14
    
    // Venue: combine name + address if provided
    var venueVal = data.venueName ? (data.venueName + (data.venueAddress ? " (" + data.venueAddress + ")" : "")) : "";
    sheet.getRange(targetRow, 16).setValue(venueVal); // Index 15
    
    sheet.getRange(targetRow, 17).setValue(data.capacityType === 'Limited' ? data.capacityCount : "Unlimited"); // Index 16
    sheet.getRange(targetRow, 18).setValue(data.paymentType || 'Free'); // Index 17
    sheet.getRange(targetRow, 19).setValue(data.price || ''); // Index 18
    sheet.getRange(targetRow, 20).setValue(data.couponCode || ''); // Index 19
    
    // Index 20 is Thumbnail (handled below)
    
    sheet.getRange(targetRow, 22).setValue(data.startDate || ''); // Index 21
    sheet.getRange(targetRow, 23).setValue(data.startTime || ''); // Index 22
    // Index 23 is Meet Link (handled separately via grantMeetAccess usually, but can update if passed)
    if (data.meetLink) sheet.getRange(targetRow, 24).setValue(data.meetLink);

    // Update curriculum.json in Drive
    if (data.curriculum && data.curriculum.length > 0) {
      try {
        var folder = DriveApp.getFolderById(id);
        // Remove old curriculum.json
        var oldFiles = folder.getFilesByName('curriculum.json');
        while (oldFiles.hasNext()) {
          oldFiles.next().setTrashed(true);
        }
        folder.createFile('curriculum.json', JSON.stringify(data.curriculum, null, 2), 'application/json');
      } catch (e) {
        console.warn('Could not update curriculum.json in Drive:', e);
      }
    }

    // Update Quizzes.csv
    if (data.quizQuestions && data.quizQuestions.length > 0) {
      try {
        var folder2 = DriveApp.getFolderById(id);
        var oldQuiz = folder2.getFilesByName('Quizzes.csv');
        while (oldQuiz.hasNext()) {
          oldQuiz.next().setTrashed(true);
        }
        var csvContent = 'ID,Question,Type,Options,CorrectAnswers,Explanation\n';
        data.quizQuestions.forEach(function(quiz) {
          var optionsJson = JSON.stringify(quiz.options || []).replace(/"/g, '""');
          var correctAnswersJson = JSON.stringify(quiz.correctAnswers || []).replace(/"/g, '""');
          var explanation = (quiz.overallExplanation || '').replace(/"/g, '""');
          var question = (quiz.question || '').replace(/"/g, '""');
          csvContent += '"' + quiz.id + '","' + question + '","' + quiz.questionType + '","' + optionsJson + '","' + correctAnswersJson + '","' + explanation + '"\n';
        });
        folder2.createFile('Quizzes.csv', csvContent, 'text/csv');
      } catch (e) {
        console.warn('Could not update Quizzes.csv:', e);
      }
    }

    // Update Resources.csv
    if (data.resources && data.resources.length > 0) {
      try {
        var folder3 = DriveApp.getFolderById(id);
        var oldRes = folder3.getFilesByName('Resources.csv');
        while (oldRes.hasNext()) {
          oldRes.next().setTrashed(true);
        }
        var resCsv = 'ID,Name,URL,Type,Description\n';
        data.resources.forEach(function(resource) {
          var name = (resource.name || '').replace(/"/g, '""');
          var url = (resource.url || '').replace(/"/g, '""');
          var type = (resource.type || 'Link').replace(/"/g, '""');
          var description = (resource.description || '').replace(/"/g, '""');
          resCsv += '"' + resource.id + '","' + name + '","' + url + '","' + type + '","' + description + '"\n';
        });
        folder3.createFile('Resources.csv', resCsv, 'text/csv');
      } catch (e) {
        console.warn('Could not update Resources.csv:', e);
      }
    }

    // Handle thumbnail update
    if (data.thumbnailBase64) {
      try {
        var folder4 = DriveApp.getFolderById(id);
        var decoded = Utilities.base64Decode(data.thumbnailBase64);
        var blob = Utilities.newBlob(decoded, data.thumbnailMimeType || 'image/png', 'thumbnail');
        var thumbFile = folder4.createFile(blob);
        thumbFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        var thumbnailUrl = 'https://lh3.googleusercontent.com/d/' + thumbFile.getId();
        setCell(['thumbnail url', 'thumbnailurl', 'thumbnail'], thumbnailUrl);
      } catch (e) {
        console.warn('Could not update thumbnail:', e);
      }
    }

    return {
      success: true,
      message: data.status === 'Draft' ? 'Draft updated successfully' : 'Training updated successfully'
    };
  } catch (e) {
    console.error('Error in updateTraining:', e);
    return { success: false, error: e.toString() };
  }
}

/**
 * Update Training Schedule & Generate Meet Link
 */
function updateTrainingSchedule(data) {
  try {
    const { id, startDate, startTime } = data; // id is folderId
    if (!id || !startDate || !startTime) throw new Error("Missing ID, Date or Time");

    const ss = getTrainingDatabase();
    const sheet = ss.getSheetByName(TRAINING_SHEET_NAME);
    const rows = sheet.getDataRange().getValues();
    
    let rowIndex = -1;
    // Find row by FolderID (Col 5 / Index 5)
    for (let i = 1; i < rows.length; i++) {
        if (rows[i][5] === id) {
            rowIndex = i + 1;
            break;
        }
    }

    if (rowIndex === -1) throw new Error("Training not found");

    // 1. Generate Calendar Event
    let meetLink = "";
    try {
        const startDateTime = new Date(`${startDate}T${startTime}`);
        const endDateTime = new Date(startDateTime.getTime() + (60 * 60 * 1000)); // Default 1 hour
        const courseName = rows[rowIndex-1][3];

        const eventResource = {
          summary: `Training: ${courseName}`,
          description: `Join your online training for ${courseName}.\n\nPowered by Yatri Cloud.`,
          start: { dateTime: startDateTime.toISOString() },
          end: { dateTime: endDateTime.toISOString() },
          conferenceData: {
            createRequest: {
              requestId: Math.random().toString(36).substring(7),
              conferenceSolutionKey: { type: "hangoutsMeet" }
            }
          }
        };

        const event = Calendar.Events.insert(eventResource, 'primary', { conferenceDataVersion: 1 });
        
        if (event.conferenceData && event.conferenceData.entryPoints && event.conferenceData.entryPoints.length > 0) {
            meetLink = event.conferenceData.entryPoints[0].uri;
        } else {
            meetLink = event.htmlLink;
        }

    } catch (e) {
        console.warn("Calendar error: " + e.toString());
        if (e.toString().includes("Calendar is not defined")) {
             return { success: false, error: "Please enable 'Google Calendar API' in Apps Script Services." };
        }
        return { success: false, error: "Calendar Error: " + e.toString() };
    }

    // 2. Update Sheet
    // SartDate: 21 (Col 22), StartTime: 22 (Col 23), MeetLink: 23 (Col 24)
    sheet.getRange(rowIndex, 22).setValue(startDate);
    sheet.getRange(rowIndex, 23).setValue(startTime);
    sheet.getRange(rowIndex, 24).setValue(meetLink);

    return { success: true, meetLink: meetLink };

  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * List folders in a specific Drive path (Read-only)
 */
function getFoldersInPath(data) {
  try {
    const { type, provider } = data;
    const rootFolder = DriveApp.getFolderById(TRAINING_ROOT_FOLDER_ID);

    // Case 1: Browse Providers (requires Type folder)
    let typeFolderName = "Certification";
    if (type === "Role-based") typeFolderName = "Role-based Training";
    
    const typeFolders = rootFolder.getFoldersByName(typeFolderName);
    if (!typeFolders.hasNext()) return { success: true, folders: [] };
    const typeFolder = typeFolders.next();

    if (!provider) {
      const folders = [];
      const subfolders = typeFolder.getFolders();
      while (subfolders.hasNext()) {
        const f = subfolders.next();
        if (!f.isTrashed()) folders.push(f.getName());
      }
      return { success: true, folders: folders.sort() };
    }

    // Case 2: Browse Exams (requires Provider folder)
    const providerFolders = typeFolder.getFoldersByName(provider);
    if (!providerFolders.hasNext()) return { success: true, folders: [] };
    const providerFolder = providerFolders.next();

    const folders = [];
    const subfolders = providerFolder.getFolders();
    while (subfolders.hasNext()) {
      const f = subfolders.next();
      if (!f.isTrashed()) folders.push(f.getName());
    }

    return { success: true, folders: folders.sort() };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Delete a Provider/Exam entry and sync with Drive
 */
function deleteProvider(data) {
  try {
    const { type, provider, exam } = data;
    const ss = getTrainingDatabase();
    const sheet = ss.getSheetByName(PROVIDERS_SHEET_NAME);
    if (!sheet) throw new Error("Providers sheet not found");

    // 1. Remove from Sheet
    const rows = sheet.getDataRange().getValues();
    for (let i = rows.length - 1; i >= 1; i--) {
      if (rows[i][0] === type && rows[i][1] === provider && rows[i][2] === exam) {
        sheet.deleteRow(i + 1);
      }
    }

    // 2. Sync with Drive
    try {
      const pathResult = getFoldersInPath({ type, provider });
      const rootFolder = DriveApp.getFolderById(TRAINING_ROOT_FOLDER_ID);
      
      let typeFolderName = (type === "Role-based") ? "Role-based Training" : "Certification";
      let typeFolder = rootFolder.getFoldersByName(typeFolderName).next();
      
      let parentFolder = typeFolder;
      if (provider) {
        parentFolder = typeFolder.getFoldersByName(provider).next();
      }

      const folderNameToTrash = exam;
      const targetFolders = parentFolder.getFoldersByName(folderNameToTrash);
      if (targetFolders.hasNext()) {
        targetFolders.next().setTrashed(true);
      }
    } catch (driveErr) {
      console.warn("Drive sync deletion failed (folder might already be gone): " + driveErr.toString());
    }

    return { success: true, message: "Entry removed and Drive synchronized" };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Update/Rename a Provider/Exam entry
 */
function updateProvider(data) {
  try {
    const { type, provider, exam, oldProvider, oldExam } = data;
    const ss = getTrainingDatabase();
    const sheet = ss.getSheetByName(PROVIDERS_SHEET_NAME);
    if (!sheet) throw new Error("Providers sheet not found");

    // 1. Update Sheet
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === type && rows[i][1] === oldProvider && rows[i][2] === oldExam) {
            sheet.getRange(i + 1, 2).setValue(provider); // Col 2 is Provider/Role Name
            sheet.getRange(i + 1, 3).setValue(exam);     // Col 3 is Exam/Course Name
        }
    }

    // 2. Rename Drive Folder
    try {
        let typeFolderName = (type === "Role-based") ? "Role-based Training" : "Certification";
        let rootFolder = DriveApp.getFolderById(TRAINING_ROOT_FOLDER_ID);
        let typeFolder = rootFolder.getFoldersByName(typeFolderName).next();
        
        // Find the parent folder for the item to be renamed
        let parentFolderForRename = typeFolder;
        if (type === "Certification" && oldProvider) { // For Certifications, exam is under provider
          const providerFolders = typeFolder.getFoldersByName(oldProvider);
          if (providerFolders.hasNext()) {
            parentFolderForRename = providerFolders.next();
          } else {
            throw new Error(`Provider folder '${oldProvider}' not found under '${typeFolderName}'`);
          }
        }

        const oldFolderName = (type === "Role-based") ? oldProvider : oldExam;
        const newFolderName = (type === "Role-based") ? provider : exam;
        
        const targetFolders = parentFolderForRename.getFoldersByName(oldFolderName);
        if (targetFolders.hasNext()) {
          targetFolders.next().setName(newFolderName);
        }
    } catch (e) {
        console.warn("Drive rename failed: " + e.toString());
    }

    return { success: true, message: "Provider updated and Drive synchronized" };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Get Providers and Exams
 */
function getProviders() {
  const ss = getTrainingDatabase();
  const sheet = ss.getSheetByName(PROVIDERS_SHEET_NAME);
  
  if (!sheet) return { success: true, providers: [] };
  
  const data = sheet.getDataRange().getValues();
  data.shift(); // Remove header
  
  // Group by Type + Provider/Role
  const providerMap = {};
  
  data.forEach(row => {
    const type = row[0];
    const name = row[1];
    const exam = row[2];
    
    if (name && exam) {
      const key = `${type}|${name}`;
      if (!providerMap[key]) {
        providerMap[key] = {
          type: type,
          name: name,
          exams: [],
          exists: true // Default to true, will verify below
        };
      }
      // Deduplicate exams
      if (!providerMap[key].exams.includes(exam)) {
        providerMap[key].exams.push(exam);
      }
    }
  });
  
  // Optional: Verify existence (Only for a few to avoid timeout, but let's try for all first)
  const providers = Object.values(providerMap).map(p => {
    try {
      // Basic check: Does the Provider/Role folder exist?
      // Path: Type -> Provider
      const folders = getFoldersInPath({ type: p.type });
      if (folders.success && !folders.folders.includes(p.name)) {
        p.exists = false;
      }
    } catch (e) {
      p.exists = false;
    }
    return p;
  });
  
  return { success: true, providers };
}

/**
 * Add a new Provider/Exam mapping
 */
function addProvider(data) {
  try {
    const { provider, exam, type } = data;
    if (!provider || !exam || !type) throw new Error("Provider, Exam, and Type are required");
    
    // Auto-create Folder Structure: ROOT -> [Certifications | Role-based Training] -> [Provider | Role] -> [Exam]
    try {
      const rootFolder = DriveApp.getFolderById(TRAINING_ROOT_FOLDER_ID);

      // Level 1: Type Folder
      let typeFolderName = "Certification";
      if (type === "Role-based") typeFolderName = "Role-based Training";
      const typeFolder = getOrCreateFolder(typeFolderName, rootFolder);

      // Level 2: Provider Folder
      const providerFolder = getOrCreateFolder(provider, typeFolder);
      
      // Level 3: Exam Folder
      const folderToCreate = exam; 
      getOrCreateFolder(folderToCreate, providerFolder);

    } catch (e) {
      console.warn("Folder creation in addProvider failed: " + e.toString());
      // Proceed to update sheet anyway
    }

    const ss = getTrainingDatabase();
    let sheet = ss.getSheetByName(PROVIDERS_SHEET_NAME);
    
    if (!sheet) {
      sheet = ss.insertSheet(PROVIDERS_SHEET_NAME);
      sheet.appendRow(["Type", "Provider/Role Name", "Exam/Course Name", "Added At"]);
      sheet.setFrozenRows(1);
    } else {
      // Check for duplicates
      const existingData = sheet.getDataRange().getValues();
      const isDuplicate = existingData.some(row => 
        row[0] === type && 
        row[1] === provider && 
        row[2] === exam
      );
      if (isDuplicate) {
        return { success: true, message: "Entry already exists, folders verified." };
      }
    }
    
    sheet.appendRow([type, provider, exam, new Date()]);
    
    return { success: true, message: "Provider added and folders synchronized" };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Create/Update Training Structure
 * Supports 'Draft' vs 'Published' status
 */
function createTrainingStructure(data) {
  try {
    const { 
      type, 
      subType, 
      courseName, 
      description,
      instructor,
      level,
      duration,
      skills,
      outcomes,
      modulesCount = 0,
      curriculum = [],
      status = 'Published', // 'Draft' or 'Published'
      quizQuestions = [],
      resources = [],
      // Advanced Settings
      mode = 'Online',
      venueName = '',
      venueAddress = '',
      venueMapLink = '',
      capacityType = 'Unlimited',
      capacityCount = '',
      paymentType = 'Free',
      price = '',
      currency = 'USD',
      couponCode = '',
      startDate = '',
      startTime = ''
    } = data;
    
    let folderUrl = "";
    let folderId = "";
    let thumbnailUrl = "";
    let meetLink = "";

    // Only create Drive folders if status is Published
    if (status === 'Published') {
      // ROOT -> TYPE -> PROVIDER -> COURSE
      const rootFolder = DriveApp.getFolderById(TRAINING_ROOT_FOLDER_ID);

      // Level 1: Type Folder (e.g. Certification)
      let typeFolderName = type;
      if (type === "Certification") typeFolderName = "Certification"; 
      if (type === "Role-based") typeFolderName = "Role-based Training";
      const typeFolder = getOrCreateFolder(typeFolderName, rootFolder);

      // Level 2: Provider Folder (e.g. AWS)
      const providerFolder = getOrCreateFolder(subType, typeFolder);
      
      // Level 3: Course Folder
      const courseFolder = getOrCreateFolder(courseName, providerFolder);
      folderUrl = courseFolder.getUrl();
      folderId = courseFolder.getId();

      // Curriculum Folders
      if (curriculum && curriculum.length > 0) {
        curriculum.forEach((module, index) => {             
          const moduleTitle = module.title ? ` - ${module.title}` : '';
          const folderName = `Module ${index + 1}${moduleTitle}`;
          getOrCreateFolder(folderName, courseFolder);
        });
        courseFolder.createFile('curriculum.json', JSON.stringify(curriculum, null, 2), 'application/json');
      } else if (modulesCount > 0) {
        for (let i = 1; i <= modulesCount; i++) {
          getOrCreateFolder(`Module ${i}`, courseFolder);
        }
      }
      
      // Thumbnail
      if (data.thumbnailBase64) {
        const decoded = Utilities.base64Decode(data.thumbnailBase64);
        const blob = Utilities.newBlob(decoded, data.thumbnailMimeType || 'image/png', 'thumbnail');
        const thumbFile = courseFolder.createFile(blob);
        thumbFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        thumbnailUrl = `https://lh3.googleusercontent.com/d/${thumbFile.getId()}`; 
      }

      getOrCreateFolder('Resources', courseFolder);

      // Save Quizzes to CSV if provided
      if (quizQuestions && quizQuestions.length > 0) {
        try {
          let csvContent = 'ID,Question,Type,Options,CorrectAnswers,Explanation\n';
          quizQuestions.forEach((quiz) => {
            const optionsJson = JSON.stringify(quiz.options || []).replace(/"/g, '""');
            const correctAnswersJson = JSON.stringify(quiz.correctAnswers || []).replace(/"/g, '""');
            const explanation = (quiz.overallExplanation || '').replace(/"/g, '""');
            const question = (quiz.question || '').replace(/"/g, '""');
            csvContent += `"${quiz.id}","${question}","${quiz.questionType}","${optionsJson}","${correctAnswersJson}","${explanation}"\n`;
          });
          courseFolder.createFile('Quizzes.csv', csvContent, 'text/csv');
        } catch (quizErr) {
          console.error('Error creating Quizzes.csv:', quizErr);
        }
      }

      // Save Resources to CSV if provided
      if (resources && resources.length > 0) {
        try {
          let csvContent = 'ID,Name,URL,Type,Description\n';
          resources.forEach((resource) => {
            const name = (resource.name || '').replace(/"/g, '""');
            const url = (resource.url || '').replace(/"/g, '""');
            const type = (resource.type || 'Link').replace(/"/g, '""');
            const description = (resource.description || '').replace(/"/g, '""');
            csvContent += `"${resource.id}","${name}","${url}","${type}","${description}"\n`;
          });
          courseFolder.createFile('Resources.csv', csvContent, 'text/csv');
        } catch (resourceErr) {
          console.error('Error creating Resources.csv:', resourceErr);
        }
      }

      // Google Meet Integration (Requires 'Google Calendar API' Service enabled)
      if (mode === 'Online' && startDate && startTime) {
        try {
          const startDateTime = new Date(`${startDate}T${startTime}`);
          const endDateTime = new Date(startDateTime.getTime() + (60 * 60 * 1000)); // Default 1 hour

          // Prepare event with Conference Data (Meet)
          const eventResource = {
            summary: `Training: ${courseName}`,
            description: `Join your online training for ${courseName}.\n\nPowered by Yatri Cloud.`,
            start: { dateTime: startDateTime.toISOString() },
            end: { dateTime: endDateTime.toISOString() },
            conferenceData: {
              createRequest: {
                requestId: Math.random().toString(36).substring(7),
                conferenceSolutionKey: { type: "hangoutsMeet" }
              }
            }
          };

          // Use Advanced Calendar API
          const event = Calendar.Events.insert(eventResource, 'primary', { conferenceDataVersion: 1 });
          
          if (event.conferenceData && event.conferenceData.entryPoints && event.conferenceData.entryPoints.length > 0) {
              meetLink = event.conferenceData.entryPoints[0].uri;
          } else {
              meetLink = event.htmlLink;
          }
          
        } catch (calErr) {
          console.warn("Calendar event creation failed: " + calErr.toString());
          if (calErr.toString().includes("Calendar is not defined")) {
               meetLink = "Error: Enable 'Google Calendar API' Service in Apps Script";
          }
        }
      }
    }

    // Unconditionally log to Sheet (Drafts too)
    logTrainingToSheet({
      timestamp: new Date(),
      type,
      subType,
      courseName,
      folderUrl,
      folderId,
      description: description || "",
      instructor: instructor || "",
      level: level || "",
      duration: duration || "",
      skills: skills || "",
      outcomes: outcomes || "",
      modulesCount: curriculum.length || modulesCount || 0,
      status: status,
      // Pass new fields
      mode, venueName, venueAddress, capacityType, capacityCount, paymentType, price, currency, couponCode,
      thumbnailUrl: thumbnailUrl || "",
      startDate: startDate || "",
      startTime: startTime || "",
      meetLink: meetLink || ""
    });

    return { 
      success: true, 
      message: status === 'Draft' ? "Draft saved successfully" : "Training published successfully",
      folderUrl: folderUrl
    };
    
  } catch (e) {
    console.error("Error in createTrainingStructure", e);
    return { success: false, error: e.toString() };
  }
}

function getOrCreateFolder(name, parentFolder) {
  const parent = parentFolder || DriveApp;
  const folders = parent.getFoldersByName(name);
  while (folders.hasNext()) {
    const folder = folders.next();
    if (!folder.isTrashed()) return folder;
  }
  return parent.createFolder(name);
}

function logTrainingToSheet(data) {
  const ss = getTrainingDatabase();
  let sheet = ss.getSheetByName(TRAINING_SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(TRAINING_SHEET_NAME);
    sheet.appendRow([
      "Timestamp", "Type", "Provider/Role", "Course Name", 
      "Folder URL", "Folder ID", "Description", 
      "Instructor", "Level", "Duration", "Skills", "Outcomes", "Modules Count", "Status",
      // New Columns
      "Mode", "Venue Name", "Max Capacity", "Payment", "Price", "Coupon Code", "Thumbnail URL"
    ]);
    sheet.setFrozenRows(1);
  }
  
  sheet.appendRow([
    data.timestamp,
    data.type,
    data.subType,
    data.courseName,
    data.folderUrl,
    data.folderId,
    data.description,
    data.instructor,
    data.level,
    data.duration,
    data.skills,
    data.outcomes,
    data.modulesCount,
    data.status,
    // New Data
    data.mode,
    data.venueName ? `${data.venueName} (${data.venueAddress})` : "",
    data.capacityType === 'Limited' ? data.capacityCount : "Unlimited",
    data.paymentType,
    data.paymentType === 'Paid' ? `${data.currency} ${data.price}` : "Free",
    data.couponCode,
    data.thumbnailUrl, // Index 20
    data.startDate,    // Index 21
    data.startTime,    // Index 22
    data.meetLink      // Index 23
  ]);
}

function getTrainingStructure() {
  const ss = getTrainingDatabase();
  const sheet = ss.getSheetByName(TRAINING_SHEET_NAME);
  if (!sheet) return { success: true, structure: [] };
  
  const data = sheet.getDataRange().getValues();
  data.shift(); // Remove header

  // 0: Timestamp, 1: Type, 2: SubType, 3: CourseName
  // 4: FolderUrl, 5: FolderId, 6: Description, 7: Instructor, 8: Level, 9: Duration
  // 10: Skills, 11: Outcomes, 12: Modules Count, 13: Status
  // 14: Mode, 15: Venue Name, 16: Max Capacity, 17: Payment, 18: Price, 19: Coupon Code
  // 20: Thumbnail URL

  const structure = data
    .filter(row => row[13] && row[13].toString().toLowerCase() === 'published') // Only return Published courses
    .filter(row => {
      // Dynamic check for existence in Drive
      const folderId = row[5];
      if (!folderId) return false;
      try {
        const folder = DriveApp.getFolderById(folderId);
        return !folder.isTrashed();
      } catch (e) {
        return false; // Folder not found or inaccessible
      }
    })
    .map(row => ({
      id: row[5], // Folder ID as unique ID
      timestamp: row[0],
      type: row[1],
      subType: row[2],
      courseName: row[3],
      folderUrl: row[4],
      description: row[6],
      instructor: row[7],
      level: row[8],
      duration: row[9],
      skills: row[10],
      outcomes: row[11],
      modulesCount: row[12],
      status: row[13],
      mode: row[14],
      venue: row[15],
      capacity: row[16],
      paymentType: row[17],
      price: row[18],
      couponCode: row[19],
      thumbnailUrl: (row[20] || "").includes("drive.google.com/thumbnail")
        ? (row[20] || "").replace("drive.google.com/thumbnail?id=", "lh3.googleusercontent.com/d/").split("&")[0]
        : (row[20] || ""),
      startDate: row[21],
      startTime: row[22],
      meetLink: row[23]
    })).reverse(); // Newest first

  return { success: true, structure };
}

/**
 * Get All Training (for Admin - includes Drafts)
 */
function getAllTraining() {
  const ss = getTrainingDatabase();
  const sheet = ss.getSheetByName(TRAINING_SHEET_NAME);
  if (!sheet) return { success: true, structure: [] };
  
  const data = sheet.getDataRange().getValues();
  data.shift(); // Remove header

  // 0: Timestamp, 1: Type, 2: SubType, 3: CourseName
  // 4: FolderUrl, 5: FolderId, 6: Description, 7: Instructor, 8: Level, 9: Duration
  // 10: Skills, 11: Outcomes, 12: Modules Count, 13: Status
  // 14: Mode, 15: Venue Name, 16: Max Capacity, 17: Payment, 18: Price, 19: Coupon Code
  // 20: Thumbnail URL

  const structure = data
    .filter(row => {
      // Dynamic check for existence in Drive
      const folderId = row[5];
      if (!folderId) return false;
      try {
        const folder = DriveApp.getFolderById(folderId);
        return !folder.isTrashed();
      } catch (e) {
        return false; // Folder not found or inaccessible
      }
    })
    .map(row => ({
      id: row[5], // Folder ID as unique ID
      timestamp: row[0],
      type: row[1],
      subType: row[2],
      courseName: row[3],
      folderUrl: row[4],
      description: row[6],
      instructor: row[7],
      level: row[8],
      duration: row[9],
      skills: row[10],
      outcomes: row[11],
      modulesCount: row[12],
      status: row[13],
      mode: row[14],
      venue: row[15],
      capacity: row[16],
      paymentType: row[17],
      price: row[18],
      couponCode: row[19],
      thumbnailUrl: (row[20] || "").includes("drive.google.com/thumbnail")
        ? (row[20] || "").replace("drive.google.com/thumbnail?id=", "lh3.googleusercontent.com/d/").split("&")[0]
        : (row[20] || ""),
      startDate: row[21],
      startTime: row[22],
      meetLink: row[23]
    })).reverse(); // Newest first

  return { success: true, structure };
}

/**
 * Delete Training persistently (Drive + Sheet)
 * @param {Object} data { id: string } where id is the folderId
 */
function deleteTraining(data) {
  try {
    const { id } = data;
    if (!id) throw new Error("Training ID (folderId) is required");

    const ss = getTrainingDatabase();
    const sheet = ss.getSheetByName(TRAINING_SHEET_NAME);
    if (!sheet) throw new Error("Training sheet not found");

    // 1. Remove from Sheet
    const rowValues = sheet.getDataRange().getValues();
    let deletedCount = 0;
    // Iterate backwards to safely delete rows
    for (let i = rowValues.length - 1; i >= 1; i--) {
      if (rowValues[i][5] === id) { // Column 5 is Folder ID
        sheet.deleteRow(i + 1);
        deletedCount++;
      }
    }

    // 2. Trash from Drive
    try {
      const folder = DriveApp.getFolderById(id);
      if (folder) {
        folder.setTrashed(true);
      }
    } catch (driveError) {
      console.warn("Drive folder not found or already deleted: " + driveError.toString());
    }

    // 5. If instructor is selected, assign them
    if (data.instructorId && data.instructorId !== "") {
       assignTrainerToCourse({
         trainerId: data.instructorId,
         trainerName: data.instructor || "Unknown",
         courseId: folder.getId(),
         courseName: data.courseName
       });
    }

    return { 
      success: true, 
      message: `Training deleted successfully. Removed ${deletedCount} record(s) from sheet.` 
    };

  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Scan Training sheet and ensure all thumbnails are shared and use the correct URL format.
 */
function fixAllTrainingPermissions() {
  try {
    const ss = getTrainingDatabase();
    const sheet = ss.getSheetByName(TRAINING_SHEET_NAME);
    if (!sheet) throw new Error("Training sheet not found");

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const thumbColIndex = 20; // 0-indexed column 20 (U)

    let fixedCount = 0;
    for (let i = 1; i < data.length; i++) {
        let thumbUrl = data[i][thumbColIndex];
        if (!thumbUrl) continue;

        let fileId = "";
        // Extract ID from various formats
        if (thumbUrl.includes("id=")) {
            fileId = thumbUrl.split("id=")[1].split("&")[0];
        } else if (thumbUrl.includes("lh3.googleusercontent.com/d/")) {
            fileId = thumbUrl.split("/d/")[1].split("/")[0];
        }

        if (fileId) {
            try {
                const file = DriveApp.getFileById(fileId);
                // Ensure shared
                file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
                
                // Update to standard LH3 format in sheet for consistency
                const newUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
                if (thumbUrl !== newUrl) {
                    sheet.getRange(i + 1, thumbColIndex + 1).setValue(newUrl);
                    fixedCount++;
                }
            } catch (err) {
                console.warn(`Could not fix file ${fileId} at row ${i+1}: ${err}`);
            }
        }
    }

    return { success: true, message: `Scanned ${data.length-1} records. Fixed/Updated ${fixedCount} URLs. All accessible thumbnails set to public.` };

  } catch (e) {
    console.error("Error in fixAllTrainingPermissions: ", e);
    return { success: false, error: e.toString() };
  }
}

/**
 * Get Quiz Questions for a Training
 */
function getTrainingQuizzes(data) {
  try {
    const { trainingId } = data;
    
    // Find the training folder
    const folder = DriveApp.getFolderById(trainingId);
    if (!folder) {
      return { success: false, error: 'Training folder not found' };
    }
    
    // Look for Quizzes.csv
    const files = folder.getFilesByName('Quizzes.csv');
    if (!files.hasNext()) {
      return { success: true, quizzes: [] };
    }
    
    const csvFile = files.next();
    const csvContent = csvFile.getBlob().getDataAsString();
    const rows = Utilities.parseCsv(csvContent);
    
    // Skip header row
    const quizzes = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 6) continue;
      
      try {
        quizzes.push({
          id: row[0],
          question: row[1],
          questionType: row[2],
          options: JSON.parse(row[3]),
          correctAnswers: JSON.parse(row[4]),
          overallExplanation: row[5]
        });
      } catch (parseErr) {
        console.error('Error parsing quiz row:', parseErr);
      }
    }
    
    return { success: true, quizzes: quizzes };
  } catch (e) {
    console.error('Error in getTrainingQuizzes:', e);
    return { success: false, error: e.toString() };
  }
}

/**
 * Get Resources for a Training
 */
function getTrainingResources(data) {
  try {
    const { trainingId } = data;
    
    // Find the training folder
    const folder = DriveApp.getFolderById(trainingId);
    if (!folder) {
      return { success: false, error: 'Training folder not found' };
    }
    
    // Look for Resources.csv
    const files = folder.getFilesByName('Resources.csv');
    if (!files.hasNext()) {
      return { success: true, resources: [] };
    }
    
    const csvFile = files.next();
    const csvContent = csvFile.getBlob().getDataAsString();
    const rows = Utilities.parseCsv(csvContent);
    
    // Skip header row
    const resources = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 5) continue;
      
      resources.push({
        id: row[0],
        name: row[1],
        url: row[2],
        type: row[3],
        description: row[4]
      });
    }
    
    return { success: true, resources: resources };
  } catch (e) {
    console.error('Error in getTrainingResources:', e);
    return { success: false, error: e.toString() };
  }
}

/**
 * Get training by ID for editing.
 * The ID is the Folder ID (used as unique identifier in getAllTraining).
 * Uses dynamic header mapping for robustness.
 */
function getTrainingById(data) {
  try {
    const { id } = data;
    if (!id) return { success: false, error: 'No training ID provided' };

    const ss = getTrainingDatabase();
    const sheet = ss.getSheetByName(TRAINING_SHEET_NAME);

    if (!sheet) {
      return { success: false, error: 'Trainings sheet not found' };
    }

    const allData = sheet.getDataRange().getValues();
    if (allData.length < 2) {
      return { success: false, error: 'No training data found' };
    }

    // Dynamic header mapping
    const headers = allData[0];
    const colMap = {};
    for (let h = 0; h < headers.length; h++) {
      colMap[headers[h].toString().trim().toLowerCase()] = h;
    }

    const getIdx = function(keys) {
      for (var k = 0; k < keys.length; k++) {
        if (colMap.hasOwnProperty(keys[k])) return colMap[keys[k]];
      }
      return -1;
    };

    const getVal = function(row, keys, fallback) {
      var idx = getIdx(keys);
      if (idx > -1 && row[idx] !== undefined && row[idx] !== null && row[idx] !== '') return row[idx];
      return fallback !== undefined ? fallback : '';
    };

    // The unique ID is the Folder ID (Column index 5, F)
    // We hardcode this to match getAllTraining and logTrainingToSheet
    // The previous dynamic header search found "Folder ID" at index 6 (misaligned header), causing failure.
    var folderIdIdx = 5; 

    // console.log('Searching for ID:', id, 'at column index:', folderIdIdx);

    // Find the row matching the ID
    for (var i = 1; i < allData.length; i++) {
      var row = allData[i];
      // Loose comparison for robustness with normalization
      var rowId = (row[folderIdIdx] || '').toString().trim();
      var searchId = (id || '').toString().trim();
      if (rowId === searchId) {
        // Parse curriculum from the Drive folder
        var curriculum = [];
        try {
          var folder = DriveApp.getFolderById(id);
          var curriculumFiles = folder.getFilesByName('curriculum.json');
          if (curriculumFiles.hasNext()) {
            var currFile = curriculumFiles.next();
            curriculum = JSON.parse(currFile.getBlob().getDataAsString());
          }
        } catch (e) {
          console.log('Could not load curriculum from Drive, checking sheet:', e);
        }

        // Parse venue info (stored as "VenueName (Address)")
        var venueRaw = getVal(row, ['venue name', 'venue'], '');
        var venueName = venueRaw;
        var venueAddress = '';
        var venueMatch = venueRaw.match(/^(.+?)\s*\((.+)\)$/);
        if (venueMatch) {
          venueName = venueMatch[1].trim();
          venueAddress = venueMatch[2].trim();
        }

        // Parse capacity
        var capacityRaw = getVal(row, ['max capacity', 'capacity'], 'Unlimited');
        var capacityType = (capacityRaw === 'Unlimited' || !capacityRaw) ? 'Unlimited' : 'Limited';
        var capacityCount = capacityType === 'Limited' ? capacityRaw : '';

        // Parse payment/price (stored as "USD 99" or "Free")
        var paymentType = getVal(row, ['payment', 'payment type'], 'Free');
        var priceRaw = getVal(row, ['price'], '');
        var currency = 'USD';
        var price = '';
        if (priceRaw && priceRaw !== 'Free') {
          var priceParts = priceRaw.toString().split(' ');
          if (priceParts.length === 2) {
            currency = priceParts[0];
            price = priceParts[1];
          } else {
            price = priceRaw;
          }
        }

        // Parse start date
        var startDateRaw = getVal(row, ['startdate', 'start date'], null);
        var startDate = null;
        if (startDateRaw) {
          try {
            startDate = new Date(startDateRaw).toISOString();
          } catch (e) {
            startDate = startDateRaw;
          }
        }

        var training = {
          id: row[folderIdIdx],
          type: getVal(row, ['type']),
          certification: getVal(row, ['provider/role', 'provider', 'subtype', 'sub-type']),
          subType: getVal(row, ['provider/role', 'provider', 'subtype', 'sub-type']),
          courseName: getVal(row, ['course name', 'coursename']),
          description: getVal(row, ['description']),
          instructor: getVal(row, ['instructor']),
          level: getVal(row, ['level'], 'Beginner'),
          duration: getVal(row, ['duration']),
          skills: getVal(row, ['skills']),
          outcomes: getVal(row, ['outcomes']),
          mode: getVal(row, ['mode'], 'Online'),
          curriculum: curriculum,
          venueName: venueName,
          venueAddress: venueAddress,
          venueMapLink: '',
          capacityType: capacityType,
          capacityCount: capacityCount,
          startDate: startDate,
          startTime: getVal(row, ['starttime', 'start time']),
          paymentType: paymentType,
          price: price,
          currency: currency,
          couponCode: getVal(row, ['coupon code', 'couponcode']),
          status: getVal(row, ['status'], 'Draft'),
          folderId: row[folderIdIdx],
          folderUrl: getVal(row, ['folder url', 'folderurl']),
          meetLink: getVal(row, ['meetlink', 'meet link']),
          thumbnail: getVal(row, ['thumbnail url', 'thumbnailurl', 'thumbnail'])
        };

        return { success: true, training: training };
      }
    }

    // Capture debug info
    var debugInfo = {
      sheetId: sheet.getParent().getId(),
      sheetName: sheet.getName(),
      rowCount: allData.length,
      searchColumnIndex: folderIdIdx,
      searchedId: id,
      nomalizedSearchId: (id || '').toString().trim(),
      first5Ids: allData.slice(1, 6).map(r => r[folderIdIdx])
    };

    console.warn('Training not found. Debug:', JSON.stringify(debugInfo));

    return { 
      success: false, 
      error: 'Training not found for ID: ' + id,
      debug: debugInfo
    };
  } catch (e) {
    console.error('Error in getTrainingById:', e);
    return { success: false, error: e.toString() };
  }
}

/**
 * ========================================
 * TRAINER APPLICATION FUNCTIONS
 * ========================================
 */

/**
 * Submit Trainer Application
 * Stores trainer application in the database for admin review
 */
function submitTrainerApplication(data) {
  try {
    const ss = getTrainingDatabase();
    let sheet = ss.getSheetByName('trainer_applications');
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet('trainer_applications');
      sheet.appendRow([
        'Timestamp',
        'Full Name',
        'Email',
        'Country Code',
        'Phone Number',
        'LinkedIn URL',
        'Expertise',
        'Certification Provider',
        'Credentials Links',
        'Years of Experience',
        'Motivation',
        'Status',
        'Admin Notes',
        'Resume URL'
      ]);
      sheet.setFrozenRows(1);
      
      // Format header
      const headerRange = sheet.getRange(1, 1, 1, 14);
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
      headerRange.setFontWeight('bold');
    }
    
    // Check if application already exists for this email
    const existingData = sheet.getDataRange().getValues();
    for (let i = 1; i < existingData.length; i++) {
      if (existingData[i][2] === data.email) { // Email column index is 2
        return {
          success: false,
          error: 'You have already submitted an application. Please wait for our review.'
        };
      }
    }

    // Check if already a trainer
    let trainersSheet = ss.getSheetByName('trainers');
    if (trainersSheet) {
      const trainersData = trainersSheet.getDataRange().getValues();
      for (let i = 1; i < trainersData.length; i++) {
        if (trainersData[i][1] === data.email) { // Email column index is 1 in trainers sheet
          return {
            success: false,
            error: 'You are already a registered trainer. Please log in to the trainer portal.'
          };
        }
      }
    }
    
    // Handle resume upload to Google Drive
    let resumeUrl = '';
    if (data.resumeData && data.resumeFileName) {
      try {
        const parentFolder = DriveApp.getFolderById(TRAINING_DATABASE_ID);
        let resumeFolder;
        const folders = parentFolder.getFoldersByName('Trainer Resumes');
        if (folders.hasNext()) {
          resumeFolder = folders.next();
        } else {
          resumeFolder = parentFolder.createFolder('Trainer Resumes');
        }
        const base64Data = data.resumeData.split(',')[1];
        const blob = Utilities.newBlob(
          Utilities.base64Decode(base64Data),
          'application/pdf',
          data.resumeFileName
        );
        const file = resumeFolder.createFile(blob);
        file.setName(`${data.fullName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().getTime()}.pdf`);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        resumeUrl = file.getUrl();
      } catch (error) {
        Logger.log('Resume upload failed: ' + error.toString());
      }
    }
    
    // Append the application
    // Dynamic Row Construction
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const colMap = {};
    for (let h = 0; h < headers.length; h++) {
       colMap[headers[h].toString().trim().toLowerCase()] = h;
    }
    
    // Helper to find index with aliases
    const getIdx = (keys) => {
      for (const key of keys) {
        if (colMap.hasOwnProperty(key)) return colMap[key];
      }
      return -1;
    };
    
    // Initialize row with empty strings
    const newRow = new Array(headers.length).fill('');
    
    // Map data to indices
    const setVal = (keys, value) => {
      const idx = getIdx(keys);
      if (idx > -1) newRow[idx] = value;
    };
    
    setVal(['timestamp'], new Date());
    setVal(['full name', 'name'], data.fullName || '');
    setVal(['email', 'email address'], data.email || '');
    setVal(['country code'], data.countryCode || '');
    setVal(['phone number', 'phone'], data.phoneNumber || '');
    setVal(['linkedin url', 'linkedin profile', 'linkedin'], data.linkedinUrl || '');
    setVal(['expertise', 'area of expertise'], data.expertise || '');
    setVal(['certification provider'], data.certificationProvider || '');
    setVal(['credentials links'], data.credentialsLinks || '');
    setVal(['years of experience', 'experience'], data.yearsOfExperience || '');
    setVal(['motivation'], data.motivation || '');
    setVal(['status'], 'Pending');
    setVal(['admin notes'], '');
    setVal(['resume url', 'resume'], resumeUrl);
    
    // Check if Status was set (critical). If not found, we might need to append it?
    // No, better to trust the existing headers or maybe the user deleted the Status column?
    // If Status column is missing, we should probably add it? 
    // For now, assuming headers exist as we create them if missing.
    
    sheet.appendRow(newRow);
    
    // --- Send Acknowledgment Email ---
    try {
      if (data.email) {
        MailApp.sendEmail({
          to: data.email,
          subject: "Application Received - Yatri Trainer Program",
          htmlBody: `
            <div style="font-family: Arial, sans-serif; color: #333;">
              <h2>Hello ${data.fullName},</h2>
              <p>Thank you for applying to become a trainer at <strong>Yatri Cloud</strong>.</p>
              <p>We have received your application and will review your profile shortly. Our team typically takes <strong>2-3 business days</strong> to process applications.</p>
              <p>You will receive another email once your application status is updated.</p>
              <br>
              <p>Best regards,</p>
              <p><strong>Yatri Training Team</strong></p>
            </div>
          `
        });
      }
    } catch (mailError) {
      Logger.log("Failed to send acknowledgment email: " + mailError.toString());
    }
    // ---------------------------------
    
    return {
      success: true,
      message: 'Trainer application submitted successfully!'
    };
    
  } catch (error) {
    return {
      success: false,
      error: 'Failed to submit application: ' + error.toString()
    };
  }
}

/**
 * Get Trainer Applications
 * Retrieve all trainer applications for admin review
 */
function getTrainerApplications() {
  try {
    const ss = getTrainingDatabase();
    const sheet = ss.getSheetByName('trainer_applications');
    
    if (!sheet) {
      return {
        success: true,
        applications: []
      };
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const applications = [];
    
    // Dynamic Column Finding
    const colMap = {
      'timestamp': 0,
      'full name': 1,
      'email': 2,
      'country code': 3,
      'phone number': 4,
      'linkedin profile': 5,
      'area of expertise': 6,
      'certification provider': 7,
      'credentials links': 8,
      'years of experience': 9,
      'motivation': 10,
      'status': 11,
      'admin notes': 12,
      'resume url': 13
    };
    
    if (headers) {
      for (let h = 0; h < headers.length; h++) {
        const header = headers[h].toString().trim().toLowerCase();
        if (colMap.hasOwnProperty(header)) {
          colMap[header] = h;
        }
      }
    }
    
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        applications.push({
            timestamp: row[colMap['timestamp']],
            fullName: row[colMap['full name']],
            email: row[colMap['email']],
            countryCode: row[colMap['country code']],
            phoneNumber: row[colMap['phone number']],
            linkedinUrl: row[colMap['linkedin profile']],
            expertise: row[colMap['area of expertise']],
            certificationProvider: row[colMap['certification provider']] || '',
            credentialsLinks: row[colMap['credentials links']] || '',
            yearsOfExperience: row[colMap['years of experience']],
            motivation: row[colMap['motivation']],
            status: row[colMap['status']],
            adminNotes: row[colMap['admin notes']],
            resumeUrl: row[colMap['resume url']] || ''
        });
    }
    
    return {
      success: true,
      applications: applications
    };
    
  } catch (error) {
    return {
      success: false,
      error: 'Failed to fetch applications: ' + error.toString()
    };
  }
}

/**
 * Delete a Trainer Application
 */
function deleteTrainerApplication(data) {
  try {
    var email = data.email;
    if (!email) return { success: false, error: "Missing email" };

    var ss = getTrainingDatabase();
    var sheet = ss.getSheetByName('trainer_applications');
    if (!sheet) return { success: false, error: "Applications sheet not found" };

    var allData = sheet.getDataRange().getValues();
    for (var i = 1; i < allData.length; i++) {
      if (allData[i][2] === email) { // Column 2 = Email
        sheet.deleteRow(i + 1); // +1 because sheet rows are 1-indexed
        return { success: true, message: "Application deleted" };
      }
    }

    return { success: false, error: "Application not found for email: " + email };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Delete an Approved Trainer
 */
function deleteTrainer(data) {
  try {
    var email = data.email;
    if (!email) return { success: false, error: "Missing email" };

    var ss = getTrainingDatabase();
    var sheet = ss.getSheetByName('trainers');
    if (!sheet) return { success: false, error: "Trainers sheet not found" };

    var allData = sheet.getDataRange().getValues();
    var headers = allData[0];
    
    // Dynamic find Email column with aliases
    var emailIndex = 1;
    if (headers) {
      for (var h = 0; h < headers.length; h++) {
        var header = headers[h].toString().trim().toLowerCase();
        if (header === 'email' || header === 'email address') {
          emailIndex = h;
          break;
        }
      }
    }
    
    for (var i = 1; i < allData.length; i++) {
      if (allData[i][emailIndex] === email) { 
        sheet.deleteRow(i + 1);
        return { success: true, message: "Trainer deleted" };
      }
    }

    return { success: false, error: "Trainer not found for email: " + email };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Update Trainer Application Status
 * Approve or reject a trainer application
 */
function updateApplicationStatus(data) {
  try {
    const ss = getTrainingDatabase();
    const sheet = ss.getSheetByName('trainer_applications');
    
    if (!sheet) {
      return {
        success: false,
        error: 'Applications sheet not found'
      };
    }
    
    const allData = sheet.getDataRange().getValues();
    const headers = allData[0];
    
    // Dynamic Column Finding
    let emailIdx = 2;
    let statusIdx = 11;
    let notesIdx = 12;
    
    if (headers) {
      for (let h = 0; h < headers.length; h++) {
        const header = headers[h].toString().trim().toLowerCase();
        if (header === 'email' || header === 'email address') emailIdx = h;
        else if (header === 'status') statusIdx = h;
        else if (header === 'admin notes') notesIdx = h;
      }
    }
    
    // Find the row with matching email
    let targetRow = -1;
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][emailIdx] === data.email) {
        targetRow = i + 1; // +1 because sheet rows are 1-indexed
        break;
      }
    }
    
    if (targetRow === -1) {
      return {
        success: false,
        error: 'Application not found'
      };
    }
    
    // Update status and admin notes
    // getRange(row, column) is 1-indexed. Our indices are 0-indexed. So +1.
    sheet.getRange(targetRow, statusIdx + 1).setValue(data.status); 
    if (data.adminNotes && notesIdx > -1) {
      sheet.getRange(targetRow, notesIdx + 1).setValue(data.adminNotes);
    }
    
    return {
      success: true,
      message: 'Application status updated successfully'
    };
    
  } catch (error) {
    return {
      success: false,
      error: 'Failed to update status: ' + error.toString()
    };
  }
}

/**
 * Upload Resource to Drive
 */
function uploadResource(data) {
  try {
    const { base64, mimeType, fileName, folderId } = data;
    
    // Get root folder
    const rootFolder = DriveApp.getFolderById(TRAINING_ROOT_FOLDER_ID);
    let targetFolder = rootFolder;
    
    // Use specific folder if provided, otherwise "Training Resources" in root
    if (folderId) {
      try {
        targetFolder = DriveApp.getFolderById(folderId);
      } catch (e) {
        console.warn('Invalid folderId, using root resources folder');
        targetFolder = getOrCreateFolder("Training Resources", rootFolder);
      }
    } else {
      targetFolder = getOrCreateFolder("Training Resources", rootFolder);
    }
    
    // Create file
    const decoded = Utilities.base64Decode(base64);
    const blob = Utilities.newBlob(decoded, mimeType, fileName);
    const file = targetFolder.createFile(blob);
    
    // Set public permission
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return {
      success: true,
      url: file.getUrl(),
      downloadUrl: `https://lh3.googleusercontent.com/d/${file.getId()}`,
      id: file.getId(),
      name: file.getName()
    };
    
  } catch (error) {
    return {
      success: false,
      error: 'Upload failed: ' + error.toString()
    };
  }
}

/**
 * Create Trainer Credentials
 * Creates login credentials for an approved trainer
 */
/**
 * Approve Trainer (Google Auth)
 * Adds trainer to the approved list for Google Login access
 */
function approveTrainer(data) {
  try {
    const ss = getTrainingDatabase();
    let trainersSheet = ss.getSheetByName('trainers');
    
    // Create trainers sheet if it doesn't exist
    if (!trainersSheet) {
      trainersSheet = ss.insertSheet('trainers');
      trainersSheet.appendRow([
        'Trainer ID',
        'Email',
        'Full Name',
        'Phone',
        'LinkedIn',
        'Expertise',
        'Username', // Kept for schema compatibility, will be empty/unused
        'Status',
        'Created Date'
      ]);
      trainersSheet.setFrozenRows(1);
      
      // Format header
      const headerRange = trainersSheet.getRange(1, 1, 1, 9);
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
    }
    
    // Check if trainer already exists
    const trainersData = trainersSheet.getDataRange().getValues();
    for (let i = 1; i < trainersData.length; i++) {
      if (trainersData[i][1] === data.email) {
        return {
          success: false,
          error: 'Trainer is already approved'
        };
      }
    }
    
    // Get application details
    const appSheet = ss.getSheetByName('trainer_applications');
    if (!appSheet) {
      return {
        success: false,
        error: 'Applications sheet not found'
      };
    }
    
    // --- Dynamic Column Mapping for Applications Sheet ---
    const appHeaders = appSheet.getRange(1, 1, 1, appSheet.getLastColumn()).getValues()[0];
    const appColMap = {};
    for (let h = 0; h < appHeaders.length; h++) {
       appColMap[appHeaders[h].toString().trim().toLowerCase()] = h;
    }
    
    // Helper to find index in App Sheet
    const getAppIdx = (keys) => {
      for (const key of keys) {
        if (appColMap.hasOwnProperty(key)) return appColMap[key];
      }
      return -1;
    };

    const appEmailIdx = getAppIdx(['email', 'email address']);
    const appStatusIdx = getAppIdx(['status']);
    
    // Find Application Row
    const appData = appSheet.getDataRange().getValues();
    let trainerInfo = null;
    let appRowIndex = -1;
    
    for (let i = 1; i < appData.length; i++) {
      if (appData[i][appEmailIdx] === data.email) {
        appRowIndex = i + 1;
        const row = appData[i];
        trainerInfo = {
          fullName: row[getAppIdx(['full name', 'name'])] || '',
          email: row[appEmailIdx] || '',
          countryCode: row[getAppIdx(['country code'])] || '',
          phoneNumber: row[getAppIdx(['phone number', 'phone'])] || '',
          linkedIn: row[getAppIdx(['linkedin', 'linkedin url', 'linkedin profile'])] || '',
          expertise: row[getAppIdx(['expertise', 'area of expertise'])] || ''
        };
        break;
      }
    }
    
    if (!trainerInfo) {
      return {
        success: false,
        error: 'Application not found'
      };
    }
    
    // Generate trainer ID
    const trainerId = 'TR' + new Date().getTime();
    
    // --- Dynamic Row Construction for Trainers Sheet ---
    const tHeaders = trainersSheet.getRange(1, 1, 1, trainersSheet.getLastColumn()).getValues()[0];
    const tColMap = {};
    for (let h = 0; h < tHeaders.length; h++) {
       tColMap[tHeaders[h].toString().trim().toLowerCase()] = h;
    }
    
    const getTrIdx = (keys) => {
      for (const key of keys) {
        if (tColMap.hasOwnProperty(key)) return tColMap[key];
      }
      return -1;
    };
    
    const newTrainerRow = new Array(tHeaders.length).fill('');
    const setTrVal = (keys, value) => {
      const idx = getTrIdx(keys);
      if (idx > -1) newTrainerRow[idx] = value;
    };
    
    setTrVal(['trainer id'], trainerId);
    setTrVal(['email', 'email address'], trainerInfo.email);
    setTrVal(['full name', 'name'], trainerInfo.fullName);
    setTrVal(['phone'], (trainerInfo.countryCode + ' ' + trainerInfo.phoneNumber).trim());
    setTrVal(['linkedin', 'linkedin profile'], trainerInfo.linkedIn);
    setTrVal(['expertise', 'area of expertise'], trainerInfo.expertise);
    setTrVal(['username'], ''); // Unused
    setTrVal(['status'], 'Active');
    setTrVal(['created date', 'created'], new Date());
    
    trainersSheet.appendRow(newTrainerRow);
    
    // Update application status to Approved
    if (appRowIndex !== -1 && appStatusIdx !== -1) {
      appSheet.getRange(appRowIndex, appStatusIdx + 1).setValue('Approved');
    }
    
    // --- Send Approval Email ---
    try {
      if (trainerInfo.email) {
        MailApp.sendEmail({
          to: trainerInfo.email,
          subject: "Welcome to Yatri Training - Application Approved!",
          htmlBody: `
            <div style="font-family: Arial, sans-serif; color: #333;">
              <h2>Congratulations ${trainerInfo.fullName}!</h2>
              <p>We are excited to inform you that your application to become a Yatri Trainer has been <strong>APPROVED</strong>.</p>
              <p>You can now access the Trainer Portal using your Google Account.</p>
              <p>
                <a href="${data.portalUrl || 'https://yatri-practice-hub.vercel.app/trainer/login'}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Access Trainer Dashboard
                </a>
              </p>
              <p>You can also access Exam Dump via this link: <br> ${data.portalUrl || 'https://yatri-practice-hub.vercel.app/trainer/login'}</p>
              <br>
              <p>We look forward to collaborating with you!</p>
              <p><strong>Yatri Training Team</strong></p>
            </div>
          `
        });
      }
    } catch (mailError) {
      Logger.log("Failed to send approval email: " + mailError.toString());
    }
    // ---------------------------
    
    return {
      success: true,
      message: 'Trainer approved successfully. Notification email sent.',
      trainerId: trainerId
    };
    
  } catch (error) {
    return {
      success: false,
      error: 'Failed to approve trainer: ' + error.toString()
    };
  }
}

/**
 * Verify Trainer Access (Google Login)
 */
function verifyTrainerAccess(data) {
  try {
    const email = data.email;
    if (!email) return { success: false, error: 'Email is required' };
    
    const ss = getTrainingDatabase();
    const trainersSheet = ss.getSheetByName('trainers');
    
    if (!trainersSheet) return { success: false, error: 'Trainer database not initialization' };
    
    const trainersData = trainersSheet.getDataRange().getValues();
    const headers = trainersData[0];
    
    // Dynamic Column Finding with Aliases
    let indices = {
      email: 1,
      fullName: 2,
      expertise: 5,
      status: 7,
      trainerId: 0
    };
    
    if (headers) {
       for (let h = 0; h < headers.length; h++) {
         const header = headers[h].toString().trim().toLowerCase();
         if (header === 'email') indices.email = h;
         else if (header === 'status') indices.status = h;
         else if (header === 'full name' || header === 'name') indices.fullName = h;
         else if (header === 'expertise' || header === 'area of expertise') indices.expertise = h;
         else if (header === 'trainer id') indices.trainerId = h;
       }
    }
    
    for (let i = 1; i < trainersData.length; i++) {
       const row = trainersData[i];
       if (row[indices.email] === email) {
        if (row[indices.status] === 'Active') {
           return {
             success: true,
             trainer: {
               trainerId: row[indices.trainerId],
               email: row[indices.email],
               fullName: row[indices.fullName],
               expertise: row[indices.expertise]
             }
           };
        } else {
          return { success: false, error: 'Trainer account is suspended or inactive' };
        }
      }
    }
    
    return { success: false, error: 'Access denied. You are not an approved trainer.' };
    
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Reject Trainer Application
 */
function rejectTrainerApplication(data) {
  try {
    const email = data.email;
    const ss = getTrainingDatabase();
    
    // 1. Update Application Status to 'Rejected'
    const appSheet = ss.getSheetByName('trainer_applications');
    if (appSheet) {
      const appData = appSheet.getDataRange().getValues();
      for (let i = 1; i < appData.length; i++) {
        if (appData[i][2] === email) {
           appSheet.getRange(i + 1, 12).setValue('Rejected'); // Status column
           break;
        }
      }
    }
    
    // 2. Remove from trainers list if exists (Revoke access)
    const trainersSheet = ss.getSheetByName('trainers');
    if (trainersSheet) {
      const trainersData = trainersSheet.getDataRange().getValues();
      for (let i = 1; i < trainersData.length; i++) {
        if (trainersData[i][1] === email) {
          trainersSheet.deleteRow(i + 1);
          break;
        }
      }
    }
    
    return { success: true, message: 'Application rejected and access revoked if applicable.' };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}


/**
 * Get Approved Trainers
 * Retrieves list of approved trainers with credentials
 */
function getApprovedTrainers() {
  try {
    const ss = getTrainingDatabase();
    const trainersSheet = ss.getSheetByName('trainers');
    
    if (!trainersSheet) {
      return {
        success: true,
        trainers: []
      };
    }
    
    const data = trainersSheet.getDataRange().getValues();
    const headers = data[0];
    const trainers = [];
    
    // Dynamic Column Finding
    const colMap = {
      'trainer id': 0,
      'email': 1,
      'full name': 2,
      'name': 2, // Alias
      'phone': 3,
      'linkedin': 4,
      'linkedin profile': 4, // Alias
      'expertise': 5,
      'area of expertise': 5, // Alias
      'username': 6,
      'status': 7, 
      'created date': 8,
      'created': 8 // Alias
    };
    
    // Default indices if not found
    let indices = {
      trainerId: 0,
      email: 1,
      fullName: 2,
      phone: 3,
      linkedIn: 4,
      expertise: 5,
      username: 6,
      status: 7,
      createdDate: 8
    };

    if (headers) {
      for (let h = 0; h < headers.length; h++) {
        const header = headers[h].toString().trim().toLowerCase();
        // Update indices based on map
        // We check if header matches any key in colMap
        if (colMap.hasOwnProperty(header)) {
           // We need to map back to our internal keys
           if (header === 'trainer id') indices.trainerId = h;
           else if (header === 'email') indices.email = h;
           else if (header === 'full name' || header === 'name') indices.fullName = h;
           else if (header === 'phone') indices.phone = h;
           else if (header === 'linkedin' || header === 'linkedin profile') indices.linkedIn = h;
           else if (header === 'expertise' || header === 'area of expertise') indices.expertise = h;
           else if (header === 'username') indices.username = h;
           else if (header === 'status') indices.status = h;
           else if (header === 'created date' || header === 'created') indices.createdDate = h;
        }
      }
    }
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      // Check status (Case-insensitive check for safety)
      const currentStatus = (row[indices.status] || '').toString();
      
      if (currentStatus === 'Active') { 
        trainers.push({
          trainerId: row[indices.trainerId],
          email: row[indices.email],
          fullName: row[indices.fullName],
          phone: row[indices.phone],
          linkedIn: row[indices.linkedIn],
          expertise: row[indices.expertise],
          username: row[indices.username],
          status: currentStatus,
          createdDate: row[indices.createdDate]
        });
      }
    }
    
    return {
      success: true,
      trainers: trainers
    };
    
  } catch (error) {
    return {
      success: false,
      error: 'Failed to fetch trainers: ' + error.toString()
    };
  }
}

/**
 * Assign Trainer to Course
 * Links a trainer to a specific course
 */
function assignTrainerToCourse(data) {
  try {
    const ss = getTrainingDatabase();
    let assignmentsSheet = ss.getSheetByName('trainer_course_assignments');
    
    // Create assignments sheet if it doesn't exist
    if (!assignmentsSheet) {
      assignmentsSheet = ss.insertSheet('trainer_course_assignments');
      assignmentsSheet.appendRow([
        'Assignment ID',
        'Trainer ID',
        'Trainer Name',
        'Course ID',
        'Course Name',
        'Assigned Date',
        'Status'
      ]);
      assignmentsSheet.setFrozenRows(1);
      
      // Format header
      const headerRange = assignmentsSheet.getRange(1, 1, 1, 7);
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
    }
    
    // Check if assignment already exists
    const assignmentsData = assignmentsSheet.getDataRange().getValues();
    for (let i = 1; i < assignmentsData.length; i++) {
      if (assignmentsData[i][1] === data.trainerId && assignmentsData[i][3] === data.courseId) {
        return {
          success: false,
          error: 'This trainer is already assigned to this course'
        };
      }
    }
    
    // Generate assignment ID
    const assignmentId = 'ASN' + new Date().getTime();
    
    // Add assignment
    assignmentsSheet.appendRow([
      assignmentId,
      data.trainerId,
      data.trainerName,
      data.courseId,
      data.courseName,
      new Date(),
      'Active'
    ]);
    
    // --- Send Assignment Email ---
    try {
      // Fetch trainer email (data.trainerEmail might not be passed, so look it up if needed, but ideally passed from frontend)
      // Since assignTrainerToCourse uses trainerId, we should look up email if not provided in data
      let trainerEmail = data.trainerEmail;
      
      if (!trainerEmail) {
             // Lookup trainer email from trainers sheet
             const trainersSheet = ss.getSheetByName('trainers');
             if (trainersSheet) {
               const tData = trainersSheet.getDataRange().getValues();
               const tHeaders = tData[0];
               
               let tIndices = { tId: 0, tEmail: 1 };
               
               if (tHeaders) {
                 for (let h = 0; h < tHeaders.length; h++) {
                   const th = tHeaders[h].toString().trim().toLowerCase();
                   if (th === 'trainer id') tIndices.tId = h;
                   else if (th === 'email') tIndices.tEmail = h;
                 }
               }
               
               for(let k=1; k<tData.length; k++) {
                 if(tData[k][tIndices.tId] === data.trainerId) {
                   trainerEmail = tData[k][tIndices.tEmail];
                   break;
                 }
               }
             }
          }

      if (trainerEmail) {
        MailApp.sendEmail({
          to: trainerEmail,
          subject: "New Training Assignment - Yatri Cloud",
          htmlBody: `
            <div style="font-family: Arial, sans-serif; color: #333;">
              <h2>New Course Assignment</h2>
              <p>Hello <strong>${data.trainerName}</strong>,</p>
              <p>You have been assigned as the instructor for the following training:</p>
              <ul>
                <li><strong>Course:</strong> ${data.courseName}</li>
                <li><strong>Assigned Date:</strong> ${new Date().toLocaleDateString()}</li>
              </ul>
              <p>Please log in to your dashboard to view course details and manage sessions.</p>
              <p>
                 <a href="https://yatri-practice-hub.vercel.app/trainer/login" style="background-color: #2196F3; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px;">
                  Go to Dashboard
                </a>
              </p>
              <br>
              <p>Best regards,</p>
              <p><strong>Yatri Training Team</strong></p>
            </div>
          `
        });
      }
    } catch (mailError) {
      Logger.log("Failed to send assignment email: " + mailError.toString());
    }
    // -----------------------------

    return {
      success: true,
      message: 'Trainer assigned and notified successfully',
      assignmentId: assignmentId
    };
    
  } catch (error) {
    return {
      success: false,
      error: 'Failed to assign trainer: ' + error.toString()
    };
  }
}

/**
 * Get Trainer Assignments
 * Get all course assignments for a specific trainer
 */
function getTrainerAssignments(data) {
  try {
    const ss = getTrainingDatabase();
    const assignmentsSheet = ss.getSheetByName('trainer_course_assignments');
    
    if (!assignmentsSheet) {
      return {
        success: true,
        assignments: []
      };
    }
    
    const assignmentsData = assignmentsSheet.getDataRange().getValues();
    const assignments = [];
    
    for (let i = 1; i < assignmentsData.length; i++) {
      const row = assignmentsData[i];
      if (row[1] === data.trainerId && row[6] === 'Active') {
        assignments.push({
          assignmentId: row[0],
          trainerId: row[1],
          trainerName: row[2],
          courseId: row[3],
          courseName: row[4],
          assignedDate: row[5],
          status: row[6]
        });
      }
    }
    
    return {
      success: true,
      assignments: assignments
    };
    
  } catch (error) {
    return {
      success: false,
      error: 'Failed to fetch assignments: ' + error.toString()
    };
  }
}

/**
 * Revoke Trainer Assignment
 * Removes a specific assignment
 */
function revokeTrainerAssignment(data) {
  try {
    const ss = getTrainingDatabase();
    const assignmentsSheet = ss.getSheetByName('trainer_course_assignments');
    
    if (!assignmentsSheet) {
      return { success: false, error: 'Assignments sheet not found' };
    }
    
    const assignmentsData = assignmentsSheet.getDataRange().getValues();
    
    // Find and delete the assignment
    for (let i = 1; i < assignmentsData.length; i++) {
        // Check by Assignment ID if provided, otherwise by TrainerId + CourseId
        if (data.assignmentId) {
             if (assignmentsData[i][0] === data.assignmentId) {
                assignmentsSheet.deleteRow(i + 1);
                return { success: true, message: 'Assignment revoked successfully' };
            }
        } else if (data.trainerId && data.courseId) {
             if (assignmentsData[i][1] === data.trainerId && assignmentsData[i][3] === data.courseId) {
                assignmentsSheet.deleteRow(i + 1);
                return { success: true, message: 'Assignment revoked successfully' };
            }
        }
    }
    
    return { success: false, error: 'Assignment not found' };
    
  } catch (error) {
    return { success: false, error: 'Failed to revoke assignment: ' + error.toString() };
  }
}

/**
 * Trainer Login
 * Authenticates a trainer and returns their profile with assigned courses
 */
function trainerLogin(data) {
  try {
    const ss = getTrainingDatabase();
    const trainersSheet = ss.getSheetByName('trainers');
    
    if (!trainersSheet) {
      return {
        success: false,
        error: 'Trainers database not found'
      };
    }
    
    const trainersData = trainersSheet.getDataRange().getValues();
    
    // Find trainer by username
    for (let i = 1; i < trainersData.length; i++) {
      const row = trainersData[i];
      if (row[6] === data.username) { // Username at index 6
        // Verify password (simple base64 comparison)
        const passwordHash = Utilities.base64Encode(data.password);
        if (row[7] === passwordHash) { // Password hash at index 7
          // Get trainer assignments
          const assignmentsSheet = ss.getSheetByName('trainer_course_assignments');
          const assignments = [];
          
          if (assignmentsSheet) {
            const assignmentsData = assignmentsSheet.getDataRange().getValues();
            for (let j = 1; j < assignmentsData.length; j++) {
              if (assignmentsData[j][1] === row[0] && assignmentsData[j][6] === 'Active') {
                assignments.push({
                  assignmentId: assignmentsData[j][0],
                  courseId: assignmentsData[j][3],
                  courseName: assignmentsData[j][4],
                  assignedDate: assignmentsData[j][5]
                });
              }
            }
          }
          
          // Return trainer profile
          return {
            success: true,
            trainer: {
              trainerId: row[0],
              email: row[1],
              fullName: row[2],
              phone: row[3],
              linkedIn: row[4],
              expertise: row[5],
              username: row[6],
              status: row[8]
            },
            assignments: assignments
          };
        } else {
          return {
            success: false,
            error: 'Invalid password'
          };
        }
      }
    }
    
    return {
      success: false,
      error: 'Trainer not found'
    };
    
  } catch (error) {
    return {
      success: false,
      error: 'Login failed: ' + error.toString()
    };
  }
}

/**
 * Save Course Content
 * Saves modules and lessons for a course
 */
function saveCourseContent(data) {
  try {
    const ss = getTrainingDatabase();
    
    // Create course_modules sheet if needed
    let modulesSheet = ss.getSheetByName('course_modules');
    if (!modulesSheet) {
      modulesSheet = ss.insertSheet('course_modules');
      modulesSheet.appendRow([
        'Module ID',
        'Course ID',
        'Module Name',
        'Order',
        'Created By (Trainer ID)',
        'Created Date'
      ]);
      modulesSheet.setFrozenRows(1);
      const headerRange = modulesSheet.getRange(1, 1, 1, 6);
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
    }
    
    // Create course_lessons sheet if needed
    let lessonsSheet = ss.getSheetByName('course_lessons');
    if (!lessonsSheet) {
      lessonsSheet = ss.insertSheet('course_lessons');
      lessonsSheet.appendRow([
        'Lesson ID',
        'Module ID',
        'Lesson Title',
        'Duration',
        'Content Type',
        'Content URL',
        'Description',
        'Order',
        'Created Date'
      ]);
      lessonsSheet.setFrozenRows(1);
      const headerRange = lessonsSheet.getRange(1, 1, 1, 9);
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
    }
    
    // Delete existing content for this course
    const modulesData = modulesSheet.getDataRange().getValues();
    for (let i = modulesData.length - 1; i > 0; i--) {
      if (modulesData[i][1] === data.courseId) {
        modulesSheet.deleteRow(i + 1);
      }
    }
    
    const lessonsData = lessonsSheet.getDataRange().getValues();
    for (let i = lessonsData.length - 1; i > 0; i--) {
      // Check if lesson's module belongs to this course
      const moduleId = lessonsData[i][1];
      if (data.modules.some(m => m.moduleId === moduleId)) {
        lessonsSheet.deleteRow(i + 1);
      }
    }
    
    // Save new modules and lessons
    data.modules.forEach(module => {
      modulesSheet.appendRow([
        module.moduleId,
        data.courseId,
        module.moduleName,
        module.order,
        data.trainerId,
        new Date()
      ]);
      
      // Save lessons for this module
      module.lessons.forEach(lesson => {
        lessonsSheet.appendRow([
          lesson.lessonId,
          module.moduleId,
          lesson.lessonTitle,
          lesson.duration || '',
          lesson.contentType,
          lesson.contentUrl,
          lesson.description || '',
          lesson.order,
          new Date()
        ]);
      });
    });
    
    return {
      success: true,
      message: 'Course content saved successfully'
    };
    
  } catch (error) {
    return {
      success: false,
      error: 'Failed to save content: ' + error.toString()
    };
  }
}

/**
 * Get Course Content
 * Retrieves modules and lessons for a course
 */
function getCourseContent(data) {
  try {
    const ss = getTrainingDatabase();
    const modulesSheet = ss.getSheetByName('course_modules');
    const lessonsSheet = ss.getSheetByName('course_lessons');
    
    if (!modulesSheet) {
      return {
        success: true,
        modules: []
      };
    }
    
    const modulesData = modulesSheet.getDataRange().getValues();
    const modules = [];
    
    // Get modules for this course
    for (let i = 1; i < modulesData.length; i++) {
      const row = modulesData[i];
      if (row[1] === data.courseId) {
        modules.push({
          moduleId: row[0],
          moduleName: row[2],
          order: row[3],
          lessons: []
        });
      }
    }
    
    // Get lessons for each module
    if (lessonsSheet && modules.length > 0) {
      const lessonsData = lessonsSheet.getDataRange().getValues();
      
      for (let i = 1; i < lessonsData.length; i++) {
        const row = lessonsData[i];
        const moduleId = row[1];
        
        const module = modules.find(m => m.moduleId === moduleId);
        if (module) {
          module.lessons.push({
            lessonId: row[0],
            lessonTitle: row[2],
            duration: row[3],
            contentType: row[4],
            contentUrl: row[5],
            description: row[6],
            order: row[7]
          });
        }
      }
    }
    
    // Sort modules and lessons by order
    modules.sort((a, b) => a.order - b.order);
    modules.forEach(module => {
      module.lessons.sort((a, b) => a.order - b.order);
    });
    
    return {
      success: true,
      modules: modules
    };
    
  } catch (error) {
    return {
      success: false,
      error: 'Failed to load content: ' + error.toString()
    };
  }
}

/**
 * Submit Course for Approval
 * Marks a course as pending admin review
 */
function submitCourseForApproval(data) {
  try {
    const ss = getTrainingDatabase();
    let reviewSheet = ss.getSheetByName('course_reviews');
    
    // Create review sheet if needed
    if (!reviewSheet) {
      reviewSheet = ss.insertSheet('course_reviews');
      reviewSheet.appendRow([
        'Review ID',
        'Course ID',
        'Course Name',
        'Trainer ID',
        'Submitted Date',
        'Status',
        'Admin Notes'
      ]);
      reviewSheet.setFrozenRows(1);
      const headerRange = reviewSheet.getRange(1, 1, 1, 7);
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
    }
    
    // Check if already submitted
    const reviewData = reviewSheet.getDataRange().getValues();
    for (let i = 1; i < reviewData.length; i++) {
      if (reviewData[i][1] === data.courseId && reviewData[i][5] === 'Pending') {
        return {
          success: false,
          error: 'This course is already pending review'
        };
      }
    }
    
    // Add review request
    const reviewId = 'REV' + new Date().getTime();
    reviewSheet.appendRow([
      reviewId,
      data.courseId,
      data.courseName,
      data.trainerId,
      new Date(),
      'Pending',
      ''
    ]);
    
    return {
      success: true,
      message: 'Course submitted for review successfully',
      reviewId: reviewId
    };
    
  } catch (error) {
    return {
      success: false,
      error: 'Failed to submit for review: ' + error.toString()
    };
  }
}
