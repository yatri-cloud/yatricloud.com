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
  try {
    // 1. Try to get the spreadsheet the script is bound to
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) return ss;
  } catch (e) {}

  // 2. Fallback: Search for "Yatri Training Master Database" in the Individuals folder or root
  const DB_NAME = "Yatri Training Master Database";
  const files = DriveApp.getFilesByName(DB_NAME);
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  }

  // 3. Last Resort: Create it in the root folder so it exists
  const newSs = SpreadsheetApp.create(DB_NAME);
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

/**
 * Action Router
 */
function handleTrainingAction(action, data) {
  switch (action) {
    case 'createTraining': return createTrainingStructure(data);
    case 'getTrainings': return getTrainings();
    case 'getTrainingById': return getTrainingById(data.id);
    case 'getTrainingByCertification': return getTrainingByCertification(data.certification);
    case 'addProvider': return addProvider(data);
    case 'getProviders': return getProviders();
    case 'updateProvider': return updateProvider(data);
    case 'deleteProvider': return deleteProvider(data.providerId);
    case 'enroll': return enrollUser(data);
    case 'getEnrollments': return getEnrollments();
    case 'submitTrainerApplication': return submitTrainerApplication(data);
    case 'getTrainerApplications': return getTrainerApplications();
    case 'updateApplicationStatus': return updateApplicationStatus(data);
    case 'createTrainerCredentials': return createTrainerCredentials(data);
    case 'getApprovedTrainers': return getApprovedTrainers();
    case 'assignTrainerToCourse': return assignTrainerToCourse(data);
    case 'getTrainerAssignments': return getTrainerAssignments(data);
    case 'trainerLogin': return trainerLogin(data);
    case 'saveCourseContent': return saveCourseContent(data);
    case 'getCourseContent': return getCourseContent(data);
    case 'submitCourseForApproval': return submitCourseForApproval(data);
    case 'resetTrainerPassword': return resetTrainerPassword(data);
    case 'deleteTrainer': return deleteTrainer(data);
    case 'deleteTrainerApplication': return deleteTrainerApplication(data);
    default: return { success: false, error: 'Unknown action: ' + action };
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
    case 'createTraining':
      return createTrainingStructure(payload);
    case 'getTrainingStructure':
      return getTrainingStructure();
    case 'getProviders':
      return getProviders();
    case 'addProvider':
      return addProvider(payload);
    case 'enrollUser':
      return enrollUser(payload);
    case 'getEnrollments':
      return getEnrollments();
    case 'updateEnrollment':
      return updateEnrollment(payload);
    case 'deleteEnrollment':
      return deleteEnrollment(payload);
    case 'getFoldersInPath':
      return getFoldersInPath(payload);
    case 'deleteProvider':
      return deleteProvider(payload);
    case 'updateProvider':
      return updateProvider(payload);
    case 'getAllTraining':
      return getAllTraining();
    case 'deleteTraining':
      return deleteTraining(payload);
    case 'fixAllTrainingPermissions':
      return fixAllTrainingPermissions();
    case 'updateTrainingSchedule':
      return updateTrainingSchedule(payload);
    case 'submitTrainerApplication':
      return submitTrainerApplication(payload);
    case 'getTrainerApplications':
      return getTrainerApplications();
    case 'updateApplicationStatus':
      return updateApplicationStatus(payload);
    case 'createTrainerCredentials':
      return createTrainerCredentials(payload);
    case 'getApprovedTrainers':
      return getApprovedTrainers();
    case 'assignTrainerToCourse':
      return assignTrainerToCourse(payload);
    case 'getTrainerAssignments':
      return getTrainerAssignments(payload);
    default:
      return { success: false, error: "Unknown training action: " + action };
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
        'Years of Experience',
        'Motivation',
        'Status',
        'Admin Notes',
        'Resume URL'
      ]);
      sheet.setFrozenRows(1);
      
      // Format header
      const headerRange = sheet.getRange(1, 1, 1, 12);
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
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
    sheet.appendRow([
      new Date(),
      data.fullName || '',
      data.email || '',
      data.countryCode || '',
      data.phoneNumber || '',
      data.linkedinUrl || '',
      data.expertise || '',
      data.yearsOfExperience || '',
      data.motivation || '',
      'Pending', // Initial status
      '', // Admin notes (empty initially)
      resumeUrl
    ]);
    
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
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      applications.push({
        timestamp: row[0],
        fullName: row[1],
        email: row[2],
        countryCode: row[3],
        phoneNumber: row[4],
        linkedinUrl: row[5],
        expertise: row[6],
        yearsOfExperience: row[7],
        motivation: row[8],
        status: row[9],
        adminNotes: row[10],
        resumeUrl: row[11] || ''
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
    
    // Find the row with matching email
    let targetRow = -1;
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][2] === data.email) { // Email is at index 2
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
    
    // Update status (column 10) and admin notes (column 11)
    sheet.getRange(targetRow, 10).setValue(data.status); // Status
    if (data.adminNotes) {
      sheet.getRange(targetRow, 11).setValue(data.adminNotes); // Admin Notes
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
 * Create Trainer Credentials
 * Creates login credentials for an approved trainer
 */
function createTrainerCredentials(data) {
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
        'Username',
        'Password Hash',
        'Status',
        'Created Date'
      ]);
      trainersSheet.setFrozenRows(1);
      
      // Format header
      const headerRange = trainersSheet.getRange(1, 1, 1, 10);
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
          error: 'Trainer credentials already exist for this email'
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
    
    const appData = appSheet.getDataRange().getValues();
    let trainerInfo = null;
    for (let i = 1; i < appData.length; i++) {
      if (appData[i][2] === data.email) {
        trainerInfo = {
          fullName: appData[i][1],
          email: appData[i][2],
          countryCode: appData[i][3],
          phoneNumber: appData[i][4],
          linkedIn: appData[i][5],
          expertise: appData[i][6]
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
    
    // Generate trainer ID (simple implementation)
    const trainerId = 'TR' + new Date().getTime();
    
    // Simple password hash (in production, use proper hashing)
    const passwordHash = Utilities.base64Encode(data.password);
    
    // Add trainer record
    trainersSheet.appendRow([
      trainerId,
      trainerInfo.email,
      trainerInfo.fullName,
      trainerInfo.countryCode + ' ' + trainerInfo.phoneNumber,
      trainerInfo.linkedIn,
      trainerInfo.expertise,
      data.username,
      passwordHash,
      'Active',
      new Date()
    ]);
    
    return {
      success: true,
      message: 'Trainer credentials created successfully',
      trainerId: trainerId,
      username: data.username
    };
    
  } catch (error) {
    return {
      success: false,
      error: 'Failed to create credentials: ' + error.toString()
    };
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
    const trainers = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[8] === 'Active') { // Check status
        trainers.push({
          trainerId: row[0],
          email: row[1],
          fullName: row[2],
          phone: row[3],
          linkedIn: row[4],
          expertise: row[5],
          username: row[6],
          status: row[8],
          createdDate: row[9]
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
    
    return {
      success: true,
      message: 'Trainer assigned to course successfully',
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
