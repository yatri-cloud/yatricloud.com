// Yatris Users - Google Apps Script
// Handles ONLY User Authentication & Profile Management

// Configuration
const SPREADSHEET_ID = '13OmomLAxfEoHBiqLLlPUw1TuM3CWUZQ4w6UJY6qSd-E'; // Users Sheet ID
const USERS_SHEET_NAME = 'users';

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
    const token = e.parameter.token;

    if (action === 'getUser') {
      if (!token) throw new Error('Token required');
      const user = getUserByToken(token);
      if (!user) throw new Error('Invalid token');
      return sendResponse({ success: true, user: user });
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

    if (action === 'register') return sendResponse(registerUser(data));
    if (action === 'login') return sendResponse(loginUser(data.email, data.password));
    
    // Authenticated actions
    if (action === 'updateProfile') {
      if (!data.token) return sendResponse({ success: false, error: 'Token required' });
      const user = getUserByToken(data.token);
      if (!user) return sendResponse({ success: false, error: 'Invalid or expired token' });
      
      return sendResponse(updateUserProfile(data, user));
    }
    
    // Google Login Action
    if (action === 'googleLogin') {
      return sendResponse(googleLogin(data));
    }
    
    return sendResponse({ success: false, error: 'Invalid action code' });
  } catch (err) {
    return sendResponse({ success: false, error: err.toString() });
  }
}

// --- CORE FUNCTIONS ---

function googleLogin(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(USERS_SHEET_NAME);
  if (!sheet) {
     sheet = ss.insertSheet(USERS_SHEET_NAME);
     sheet.appendRow(['Email', 'Password Hash', 'Full Name', 'LinkedIn URL', 'Photo URL', 'Country', 'Phone Number', 'State', 'City', 'Token', 'Token Expiry', 'Created At', 'Last Login', 'Status']);
  }

  const row = findUserRow(sheet, data.email);

  // LOGIN EXISTING USER
  if (row) {
    // Update token
    const token = generateToken();
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30); // 30 Day session

    sheet.getRange(row, 10).setValue(token);
    sheet.getRange(row, 11).setValue(expiry.toISOString());
    sheet.getRange(row, 13).setValue(new Date().toISOString()); // Last Login updated
    
    // Update photo if provided and currently empty, or always update? Let's update if provided.
    if (data.photoUrl) sheet.getRange(row, 5).setValue(data.photoUrl);

    // Fetch user data to return
    let values = sheet.getRange(row, 1, 1, 14).getValues()[0];
    return {
      success: true,
      token: token,
      user: {
        email: values[0],
        fullName: values[2],
        linkedinUrl: values[3],
        photoUrl: values[4], 
        country: values[5],
        phoneNumber: values[6] || '',
        stateProvince: values[7] || '',
        city: values[8] || ''
      }
    };
  } else {
    // REGISTER NEW USER FROM GOOGLE
    const passwordHash = "GOOGLE_AUTH_USER"; // Marker for Google users
    const token = generateToken();
    const tokenExpiry = new Date();
    tokenExpiry.setDate(tokenExpiry.getDate() + 30);

    sheet.appendRow([
      data.email,
      passwordHash,
      data.fullName || data.email.split('@')[0],
      '', // LinkedIn
      data.photoUrl || '',
      '', // Country
      '', // Phone
      '', // State
      '', // City
      token,
      tokenExpiry.toISOString(),
      new Date().toISOString(),
      new Date().toISOString(),
      'active'
    ]);

     return {
      success: true,
      token: token,
      user: {
        email: data.email,
        fullName: data.fullName || data.email.split('@')[0],
        linkedinUrl: '',
        photoUrl: data.photoUrl || '',
        country: '',
        phoneNumber: '',
        stateProvince: '',
        city: ''
      }
    };
  }
}

function registerUser(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(USERS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(USERS_SHEET_NAME);
    sheet.appendRow(['Email', 'Password Hash', 'Full Name', 'LinkedIn URL', 'Photo URL', 'Country', 'Phone Number', 'State', 'City', 'Token', 'Token Expiry', 'Created At', 'Last Login', 'Status']);
  }

  // Check existence
  const existing = findUserRow(sheet, data.email);
  if (existing) return { success: false, error: 'User already exists' };

  const passwordHash = hashPassword(data.password, data.email);
  const token = generateToken();
  const tokenExpiry = new Date();
  tokenExpiry.setDate(tokenExpiry.getDate() + 30);

  sheet.appendRow([
    data.email,
    passwordHash,
    data.fullName,
    data.linkedinUrl || '',
    data.photoUrl || '',
    data.country || '',
    data.phoneNumber || '', // Col 7
    data.stateProvince || '', // Col 8
    data.city || '', // Col 9
    token, // Col 10
    tokenExpiry.toISOString(), // Col 11
    new Date().toISOString(),
    new Date().toISOString(),
    'active'
  ]);

  return {
    success: true,
    token: token,
    user: {
      email: data.email,
      fullName: data.fullName,
      linkedinUrl: data.linkedinUrl,
      photoUrl: data.photoUrl,
      country: data.country,
      phoneNumber: data.phoneNumber,
      stateProvince: data.stateProvince,
      city: data.city
    }
  };
}

function loginUser(email, password) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(USERS_SHEET_NAME);
  if (!sheet) return { success: false, error: 'No user database found' };

  const row = findUserRow(sheet, email);
  if (!row) return { success: false, error: 'Invalid credentials' };
  
  // Row data: Email(0)... Country(5), Phone(6), State(7), City(8), Token(9), Expiry(10), Created(11), Last Login(12), Status(13)
  let values = sheet.getRange(row, 1, 1, 14).getValues()[0];
  const storedHash = values[1];
  
  if (hashPassword(password, email) !== storedHash) return { success: false, error: 'Invalid credentials' };

  // Update token
  const token = generateToken();
  const expiry = new Date(); 
  expiry.setDate(expiry.getDate() + 30);
  
  sheet.getRange(row, 10).setValue(token); // Col 10 = Token
  sheet.getRange(row, 11).setValue(expiry.toISOString()); // Col 11 = Expiry
  sheet.getRange(row, 13).setValue(new Date().toISOString()); // Col 13 = Last Login

  return {
    success: true,
    token: token,
    user: {
      email: values[0],
      fullName: values[2],
      linkedinUrl: values[3],
      photoUrl: values[4],
      country: values[5],
      phoneNumber: values[6] || '',
      stateProvince: values[7] || '',
      city: values[8] || ''
    }
  };
}

function updateUserProfile(data, user) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(USERS_SHEET_NAME);
  const row = findUserRow(sheet, user.email);
  
  if (!row) return { success: false, error: 'User not found' };

  // Update fields if provided
  if (data.fullName) sheet.getRange(row, 3).setValue(data.fullName);
  if (data.linkedinUrl) sheet.getRange(row, 4).setValue(data.linkedinUrl);
  if (data.photoUrl) sheet.getRange(row, 5).setValue(data.photoUrl);
  if (data.country) sheet.getRange(row, 6).setValue(data.country);
  if (data.phoneNumber) sheet.getRange(row, 7).setValue(data.phoneNumber);
  if (data.stateProvince) sheet.getRange(row, 8).setValue(data.stateProvince);
  if (data.city) sheet.getRange(row, 9).setValue(data.city);

  return { success: true, message: 'Profile updated' };
}

// --- HELPERS ---

function getUserByToken(token) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(USERS_SHEET_NAME);
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  // Find row with token at col index 9 (10th column)
  for (let i = 1; i < data.length; i++) {
    if (data[i][9] === token) {
      const expiry = new Date(data[i][10]);
      if (expiry > new Date()) {
        return {
          email: data[i][0],
          fullName: data[i][2],
          linkedinUrl: data[i][3],
          photoUrl: data[i][4],
          country: data[i][5],
          phoneNumber: data[i][6] || '',
          stateProvince: data[i][7] || '',
          city: data[i][8] || ''
        };
      }
    }
  }
  return null;
}

function findUserRow(sheet, email) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === email) return i + 1;
  }
  return null;
}

function hashPassword(password, salt) {
  const raw = password + salt;
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, raw, Utilities.Charset.UTF_8);
  return digest.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
}

function generateToken() {
  return Utilities.getUuid();
}

function sendResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
