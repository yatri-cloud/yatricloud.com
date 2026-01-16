// Yatris Users - Google Apps Script
// Handles user authentication, registration, and CRUD operations for certified yatris

// Configuration
const SPREADSHEET_ID = '13OmomLAxfEoHBiqLLlPUw1TuM3CWUZQ4w6UJY6qSd-E';
const MAIN_SHEET_NAME = 'yatris';
const USERS_SHEET_NAME = 'users';

/**
 * Handle CORS preflight requests
 * Google Apps Script automatically handles CORS headers when deployed as web app with "Anyone" access
 */
function doOptions() {
  // Return empty response - CORS headers are handled automatically by Google Apps Script
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle GET request - Get user data or list users
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    const token = e.parameter.token;
    
    // Create output - CORS headers are handled automatically by Google Apps Script
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);

    if (action === 'getUser') {
      // Get user by token
      if (!token) {
        output.setContent(JSON.stringify({ error: 'Token is required' }));
        return output;
      }
      
      const user = getUserByToken(token);
      if (!user) {
        output.setContent(JSON.stringify({ error: 'Invalid token' }));
        return output;
      }
      
      output.setContent(JSON.stringify({ success: true, user: user }));
      return output;
    }
    
    if (action === 'getUserCertifications') {
      // Get user's certifications
      if (!token) {
        output.setContent(JSON.stringify({ error: 'Token is required' }));
        return output;
      }
      
      const user = getUserByToken(token);
      if (!user) {
        output.setContent(JSON.stringify({ error: 'Invalid token' }));
        return output;
      }
      
      const certifications = getUserCertifications(user.email);
      output.setContent(JSON.stringify({ success: true, certifications: certifications }));
      return output;
    }

    output.setContent(JSON.stringify({ error: 'Invalid action' }));
    return output;
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      error: 'Server error', 
      message: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle POST request - Register, login, or submit data
 */
function doPost(e) {
  // Handle OPTIONS preflight request
  if (e.parameter && e.parameter.method === 'OPTIONS') {
    return doOptions();
  }

  try {
    // Handle empty postData (sometimes happens with CORS preflight)
    if (!e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ 
        success: false,
        error: 'No data provided' 
      })).setMimeType(ContentService.MimeType.JSON);
    }

    let data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseError) {
      return ContentService.createTextOutput(JSON.stringify({ 
        success: false,
        error: 'Invalid JSON data',
        message: parseError.toString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const action = data.action;
    
    if (!action) {
      return ContentService.createTextOutput(JSON.stringify({ 
        success: false,
        error: 'Action is required'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Create output - CORS headers are handled automatically by Google Apps Script
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);

    if (action === 'register') {
      // Register new user
      try {
        const result = registerUser(data);
        output.setContent(JSON.stringify(result));
        return output;
      } catch (error) {
        output.setContent(JSON.stringify({ 
          success: false,
          error: 'Registration failed', 
          message: error.toString() 
        }));
        return output;
      }
    }

    if (action === 'login') {
      // Login user
      const result = loginUser(data.email, data.password);
      output.setContent(JSON.stringify(result));
      return output;
    }

    if (action === 'submitCertification') {
      // Submit certification
      if (!data.token) {
        output.setContent(JSON.stringify({ error: 'Token is required' }));
        return output;
      }
      
      const user = getUserByToken(data.token);
      if (!user) {
        output.setContent(JSON.stringify({ error: 'Invalid token' }));
        return output;
      }
      
      const result = submitCertification(data, user);
      output.setContent(JSON.stringify(result));
      return output;
    }

    if (action === 'updateProfile') {
      // Update user profile
      if (!data.token) {
        output.setContent(JSON.stringify({ error: 'Token is required' }));
        return output;
      }
      
      const user = getUserByToken(data.token);
      if (!user) {
        output.setContent(JSON.stringify({ error: 'Invalid token' }));
        return output;
      }
      
      const result = updateUserProfile(data, user);
      output.setContent(JSON.stringify(result));
      return output;
    }

    if (action === 'changePassword') {
      // Change password
      if (!data.token) {
        output.setContent(JSON.stringify({ error: 'Token is required' }));
        return output;
      }
      
      const user = getUserByToken(data.token);
      if (!user) {
        output.setContent(JSON.stringify({ error: 'Invalid token' }));
        return output;
      }
      
      const result = changeUserPassword(data, user);
      output.setContent(JSON.stringify(result));
      return output;
    }

    if (action === 'changeEmail') {
      // Change email
      if (!data.token) {
        output.setContent(JSON.stringify({ error: 'Token is required' }));
        return output;
      }
      
      const user = getUserByToken(data.token);
      if (!user) {
        output.setContent(JSON.stringify({ error: 'Invalid token' }));
        return output;
      }
      
      const result = changeUserEmail(data, user);
      output.setContent(JSON.stringify(result));
      return output;
    }

    if (action === 'updateCertification') {
      // Update certification
      if (!data.token) {
        output.setContent(JSON.stringify({ error: 'Token is required' }));
        return output;
      }
      
      const user = getUserByToken(data.token);
      if (!user) {
        output.setContent(JSON.stringify({ error: 'Invalid token' }));
        return output;
      }
      
      const result = updateCertification(data, user);
      output.setContent(JSON.stringify(result));
      return output;
    }

    if (action === 'deleteCertification') {
      // Delete certification
      if (!data.token) {
        output.setContent(JSON.stringify({ error: 'Token is required' }));
        return output;
      }
      
      const user = getUserByToken(data.token);
      if (!user) {
        output.setContent(JSON.stringify({ error: 'Invalid token' }));
        return output;
      }
      
      const result = deleteCertification(data.certificationId, user);
      output.setContent(JSON.stringify(result));
      return output;
    }

    output.setContent(JSON.stringify({ success: false, error: 'Invalid action' }));
    return output;
  } catch (error) {
    Logger.log('doPost error: ' + error.toString());
    Logger.log('Error stack: ' + (error.stack || 'No stack trace'));
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false,
      error: 'Server error', 
      message: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Register a new user
 */
function registerUser(data) {
  try {
    // Validate input data exists
    if (!data) {
      return { success: false, error: 'No data provided' };
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    if (!ss) {
      return { success: false, error: 'Failed to access spreadsheet' };
    }

    let usersSheet = ss.getSheetByName(USERS_SHEET_NAME);
    
    if (!usersSheet) {
      usersSheet = ss.insertSheet(USERS_SHEET_NAME);
      // Add headers
      usersSheet.appendRow([
        'Email',
        'Password Hash',
        'Full Name',
        'LinkedIn URL',
        'Photo URL',
        'Country',
        'State/Province',
        'City',
        'Country Code',
        'Phone Number',
        'Token',
        'Token Expiry',
        'Created At',
        'Last Login',
        'Status'
      ]);
    }

    // Check if user already exists
    const existingUser = getUserByEmail(data.email);
    if (existingUser) {
      return { success: false, error: 'User already exists with this email' };
    }

    // Validate required fields
    if (!data.email || !data.email.trim()) {
      return { success: false, error: 'Email is required' };
    }
    if (!data.password || !data.password.trim()) {
      return { success: false, error: 'Password is required' };
    }
    if (!data.fullName || !data.fullName.trim()) {
      return { success: false, error: 'Full name is required' };
    }
    if (!data.linkedinUrl || !data.linkedinUrl.trim()) {
      return { success: false, error: 'LinkedIn URL is required' };
    }
    if (!data.country || !data.country.trim()) {
      return { success: false, error: 'Country is required' };
    }
    if (!data.stateProvince || !data.stateProvince.trim()) {
      return { success: false, error: 'State/Province is required' };
    }
    if (!data.city || !data.city.trim()) {
      return { success: false, error: 'City is required' };
    }
    if (!data.countryCode || !data.countryCode.trim()) {
      return { success: false, error: 'Country code is required' };
    }
    if (!data.phoneNumber || !data.phoneNumber.trim()) {
      return { success: false, error: 'Phone number is required' };
    }
    if (!data.photoUrl || !data.photoUrl.trim()) {
      return { success: false, error: 'Photo is required' };
    }

    // Hash password (simple hash - in production, use proper hashing)
    const passwordHash = Utilities.computeDigest(
      Utilities.DigestAlgorithm.MD5,
      data.password + data.email, // Add salt
      Utilities.Charset.UTF_8
    ).map(function(byte) {
      return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('');

    // Generate token
    const token = generateToken();
    const tokenExpiry = new Date();
    tokenExpiry.setDate(tokenExpiry.getDate() + 30); // 30 days expiry

    // Add user
    usersSheet.appendRow([
      data.email,
      passwordHash,
      data.fullName,
      data.linkedinUrl,
      data.photoUrl,
      data.country,
      data.stateProvince,
      data.city,
      data.countryCode,
      data.phoneNumber,
      token,
      tokenExpiry.toISOString(),
      new Date().toISOString(),
      new Date().toISOString(),
      'active'
    ]);

      return {
        success: true,
        message: 'User registered successfully',
        token: token,
        user: {
          email: data.email,
          fullName: data.fullName,
          linkedinUrl: data.linkedinUrl,
          photoUrl: data.photoUrl,
          country: data.country,
          stateProvince: data.stateProvince || '',
          city: data.city || '',
          countryCode: data.countryCode || '',
          phoneNumber: data.phoneNumber || ''
        }
      };
  } catch (error) {
    Logger.log('Registration error: ' + error.toString());
    Logger.log('Error stack: ' + (error.stack || 'No stack trace'));
    return { 
      success: false,
      error: 'Registration failed', 
      message: error.toString() 
    };
  }
}

/**
 * Login user
 */
function loginUser(email, password) {
  try {
    const user = getUserByEmail(email);
    if (!user) {
      return { error: 'Invalid email or password' };
    }

    // Verify password
    const passwordHash = Utilities.computeDigest(
      Utilities.DigestAlgorithm.MD5,
      password + email,
      Utilities.Charset.UTF_8
    ).map(function(byte) {
      return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('');

    if (user.passwordHash !== passwordHash) {
      return { error: 'Invalid email or password' };
    }

    // Check if user is active
    if (user.status !== 'active') {
      return { error: 'Account is not active' };
    }

    // Generate new token
    const token = generateToken();
    const tokenExpiry = new Date();
    tokenExpiry.setDate(tokenExpiry.getDate() + 30);

    // Update token and last login
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const usersSheet = ss.getSheetByName(USERS_SHEET_NAME);
    const data = usersSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === email) {
        // Handle both old format (11 columns) and new format (15 columns)
        const hasNewFields = data[i].length >= 15;
        const tokenCol = hasNewFields ? 11 : 7;
        const expiryCol = hasNewFields ? 12 : 8;
        const lastLoginCol = hasNewFields ? 14 : 10;
        
        usersSheet.getRange(i + 1, tokenCol).setValue(token);
        usersSheet.getRange(i + 1, expiryCol).setValue(tokenExpiry.toISOString());
        usersSheet.getRange(i + 1, lastLoginCol).setValue(new Date().toISOString());
        break;
      }
    }

      return {
        success: true,
        message: 'Login successful',
        token: token,
        user: {
          email: user.email,
          fullName: user.fullName,
          linkedinUrl: user.linkedinUrl,
          photoUrl: user.photoUrl,
          country: user.country,
          stateProvince: user.stateProvince || '',
          city: user.city || '',
          countryCode: user.countryCode || '',
          phoneNumber: user.phoneNumber || ''
        }
      };
  } catch (error) {
    return { error: 'Login failed', message: error.toString() };
  }
}

/**
 * Get user by email
 */
function getUserByEmail(email) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const usersSheet = ss.getSheetByName(USERS_SHEET_NAME);
    
    if (!usersSheet) return null;

    const data = usersSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === email) {
        // Handle both old format (11 columns) and new format (15 columns)
        const hasNewFields = data[i].length >= 15;
        return {
          email: data[i][0],
          passwordHash: data[i][1],
          fullName: data[i][2],
          linkedinUrl: data[i][3],
          photoUrl: data[i][4],
          country: data[i][5],
          stateProvince: hasNewFields ? (data[i][6] || '') : '',
          city: hasNewFields ? (data[i][7] || '') : '',
          countryCode: hasNewFields ? (data[i][8] || '') : '',
          phoneNumber: hasNewFields ? (data[i][9] || '') : '',
          token: hasNewFields ? data[i][10] : data[i][6],
          tokenExpiry: hasNewFields ? data[i][11] : data[i][7],
          createdAt: hasNewFields ? data[i][12] : data[i][8],
          lastLogin: hasNewFields ? data[i][13] : data[i][9],
          status: hasNewFields ? data[i][14] : data[i][10]
        };
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Get user by token
 */
function getUserByToken(token) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const usersSheet = ss.getSheetByName(USERS_SHEET_NAME);
    
    if (!usersSheet) return null;

    const data = usersSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      // Check both old and new token column positions
      const tokenCol = data[i].length >= 15 ? 10 : 6;
      if (data[i][tokenCol] === token) {
        // Check token expiry
        const expiryCol = data[i].length >= 15 ? 11 : 7;
        const tokenExpiry = new Date(data[i][expiryCol]);
        if (tokenExpiry < new Date()) {
          return null; // Token expired
        }
        
        // Handle both old and new format
        const hasNewFields = data[i].length >= 15;
        return {
          email: data[i][0],
          passwordHash: data[i][1],
          fullName: data[i][2],
          linkedinUrl: data[i][3],
          photoUrl: data[i][4],
          country: data[i][5],
          stateProvince: hasNewFields ? (data[i][6] || '') : '',
          city: hasNewFields ? (data[i][7] || '') : '',
          countryCode: hasNewFields ? (data[i][8] || '') : '',
          phoneNumber: hasNewFields ? (data[i][9] || '') : '',
          token: data[i][tokenCol],
          tokenExpiry: data[i][expiryCol],
          createdAt: hasNewFields ? data[i][12] : data[i][8],
          lastLogin: hasNewFields ? data[i][13] : data[i][9],
          status: hasNewFields ? data[i][14] : data[i][10]
        };
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Submit certification
 */
function submitCertification(data, user) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let mainSheet = ss.getSheetByName(MAIN_SHEET_NAME);
    
    if (!mainSheet) {
      mainSheet = ss.insertSheet(MAIN_SHEET_NAME);
      // Add headers - adjust based on your certification structure
      mainSheet.appendRow([
        'Full Name',
        'Email',
        'Certification Provider',
        'Certification Name',
        'Exam Code',
        'Certification Date',
        'LinkedIn URL',
        'Photo URL',
        'Country',
        'Verified Credential',
        'Additional Notes',
        'Submitted At',
        'Updated At'
      ]);
    }

    // Add certification
    mainSheet.appendRow([
      user.fullName || data.fullName,
      user.email,
      data.certificationProvider,
      data.certificationName,
      data.examCode,
      data.certificationDate,
      user.linkedinUrl || data.linkedinUrl,
      user.photoUrl || data.photoUrl,
      user.country || data.country,
      data.verifiedCredential || '',
      data.additionalNotes || '',
      new Date().toISOString(),
      new Date().toISOString()
    ]);

    return {
      success: true,
      message: 'Certification submitted successfully'
    };
  } catch (error) {
    return { error: 'Submission failed', message: error.toString() };
  }
}

/**
 * Get user certifications
 */
function getUserCertifications(email) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const mainSheet = ss.getSheetByName(MAIN_SHEET_NAME);
    
    if (!mainSheet) return [];

    const data = mainSheet.getDataRange().getValues();
    const certifications = [];

    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === email) { // Email column
        certifications.push({
          id: i,
          fullName: data[i][0],
          email: data[i][1],
          certificationProvider: data[i][2],
          certificationName: data[i][3],
          examCode: data[i][4],
          certificationDate: data[i][5],
          linkedinUrl: data[i][6],
          photoUrl: data[i][7],
          country: data[i][8],
          verifiedCredential: data[i][9],
          additionalNotes: data[i][10],
          submittedAt: data[i][11],
          updatedAt: data[i][12]
        });
      }
    }
    return certifications;
  } catch (error) {
    return [];
  }
}

/**
 * Update user profile
 */
function updateUserProfile(data, user) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const usersSheet = ss.getSheetByName(USERS_SHEET_NAME);
    const sheetData = usersSheet.getDataRange().getValues();
    
    for (let i = 1; i < sheetData.length; i++) {
      if (sheetData[i][0] === user.email) {
        // Update user fields (columns: Email, Password Hash, Full Name, LinkedIn URL, Photo URL, Country, State/Province, City, Country Code, Phone Number)
        if (data.fullName !== undefined) usersSheet.getRange(i + 1, 3).setValue(data.fullName);
        if (data.linkedinUrl !== undefined) usersSheet.getRange(i + 1, 4).setValue(data.linkedinUrl);
        if (data.photoUrl !== undefined) usersSheet.getRange(i + 1, 5).setValue(data.photoUrl);
        if (data.country !== undefined) usersSheet.getRange(i + 1, 6).setValue(data.country);
        if (data.stateProvince !== undefined) usersSheet.getRange(i + 1, 7).setValue(data.stateProvince);
        if (data.city !== undefined) usersSheet.getRange(i + 1, 8).setValue(data.city);
        if (data.countryCode !== undefined) usersSheet.getRange(i + 1, 9).setValue(data.countryCode);
        if (data.phoneNumber !== undefined) usersSheet.getRange(i + 1, 10).setValue(data.phoneNumber);
        
        return {
          success: true,
          message: 'Profile updated successfully'
        };
      }
    }
    
    return { error: 'User not found' };
  } catch (error) {
    return { error: 'Update failed', message: error.toString() };
  }
}

/**
 * Change password
 */
function changeUserPassword(data, user) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const usersSheet = ss.getSheetByName(USERS_SHEET_NAME);
    const sheetData = usersSheet.getDataRange().getValues();
    
    for (let i = 1; i < sheetData.length; i++) {
      if (sheetData[i][0] === user.email) {
        // Verify current password
        const currentPasswordHash = Utilities.computeDigest(
          Utilities.DigestAlgorithm.MD5,
          data.currentPassword + user.email,
          Utilities.Charset.UTF_8
        ).map(function(byte) {
          return ('0' + (byte & 0xFF).toString(16)).slice(-2);
        }).join('');
        
        if (sheetData[i][1] !== currentPasswordHash) {
          return { error: 'Current password is incorrect' };
        }
        
        // Hash new password
        const newPasswordHash = Utilities.computeDigest(
          Utilities.DigestAlgorithm.MD5,
          data.newPassword + user.email,
          Utilities.Charset.UTF_8
        ).map(function(byte) {
          return ('0' + (byte & 0xFF).toString(16)).slice(-2);
        }).join('');
        
        // Update password
        usersSheet.getRange(i + 1, 2).setValue(newPasswordHash);
        
        return {
          success: true,
          message: 'Password changed successfully'
        };
      }
    }
    
    return { error: 'User not found' };
  } catch (error) {
    return { error: 'Password change failed', message: error.toString() };
  }
}

/**
 * Change email
 */
function changeUserEmail(data, user) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const usersSheet = ss.getSheetByName(USERS_SHEET_NAME);
    const sheetData = usersSheet.getDataRange().getValues();
    
    // Check if new email already exists
    const existingUser = getUserByEmail(data.newEmail);
    if (existingUser) {
      return { error: 'Email already exists. Please use a different email address.' };
    }
    
    for (let i = 1; i < sheetData.length; i++) {
      if (sheetData[i][0] === user.email) {
        // Verify current password
        const currentPasswordHash = Utilities.computeDigest(
          Utilities.DigestAlgorithm.MD5,
          data.currentPassword + user.email,
          Utilities.Charset.UTF_8
        ).map(function(byte) {
          return ('0' + (byte & 0xFF).toString(16)).slice(-2);
        }).join('');
        
        if (sheetData[i][1] !== currentPasswordHash) {
          return { error: 'Current password is incorrect' };
        }
        
        // Update email in users sheet
        usersSheet.getRange(i + 1, 1).setValue(data.newEmail);
        
        // Update email in all certification sheets (yatris main sheet)
        const mainSheet = ss.getSheetByName(MAIN_SHEET_NAME);
        if (mainSheet) {
          const mainData = mainSheet.getDataRange().getValues();
          for (let j = 1; j < mainData.length; j++) {
            if (mainData[j][1] === user.email) { // Email column
              mainSheet.getRange(j + 1, 2).setValue(data.newEmail);
            }
          }
        }
        
        // Also update in all provider-specific sheets
        const providerSheets = [
          'certified-aws-yatris',
          'certified-azure-yatris',
          'certified-gcp-yatris',
          'certified-github-yatris',
          'certified-oracle-yatris',
          'certified-salesforce-yatris',
          'certified-servicenow-yatris'
        ];
        
        providerSheets.forEach(sheetName => {
          const providerSheet = ss.getSheetByName(sheetName);
          if (providerSheet) {
            const providerData = providerSheet.getDataRange().getValues();
            for (let k = 1; k < providerData.length; k++) {
              if (providerData[k][1] === user.email) { // Email column
                providerSheet.getRange(k + 1, 2).setValue(data.newEmail);
              }
            }
          }
        });
        
        return {
          success: true,
          message: 'Email changed successfully. Please sign in with your new email.'
        };
      }
    }
    
    return { error: 'User not found' };
  } catch (error) {
    return { error: 'Email change failed', message: error.toString() };
  }
}

/**
 * Update certification
 */
function updateCertification(data, user) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const mainSheet = ss.getSheetByName(MAIN_SHEET_NAME);
    
    if (!mainSheet) {
      return { error: 'Sheet not found' };
    }

    const sheetData = mainSheet.getDataRange().getValues();
    
    // Find the certification row (id is row index)
    const rowIndex = data.certificationId;
    if (rowIndex < 1 || rowIndex >= sheetData.length) {
      return { error: 'Certification not found' };
    }

    // Verify ownership
    if (sheetData[rowIndex][1] !== user.email) {
      return { error: 'Unauthorized' };
    }

    // Update fields
    if (data.certificationProvider) mainSheet.getRange(rowIndex + 1, 3).setValue(data.certificationProvider);
    if (data.certificationName) mainSheet.getRange(rowIndex + 1, 4).setValue(data.certificationName);
    if (data.examCode !== undefined) mainSheet.getRange(rowIndex + 1, 5).setValue(data.examCode);
    if (data.certificationDate) mainSheet.getRange(rowIndex + 1, 6).setValue(data.certificationDate);
    if (data.verifiedCredential !== undefined) mainSheet.getRange(rowIndex + 1, 10).setValue(data.verifiedCredential);
    if (data.additionalNotes !== undefined) mainSheet.getRange(rowIndex + 1, 11).setValue(data.additionalNotes);
    
    // Update timestamp
    mainSheet.getRange(rowIndex + 1, 13).setValue(new Date().toISOString());

    return {
      success: true,
      message: 'Certification updated successfully'
    };
  } catch (error) {
    return { error: 'Update failed', message: error.toString() };
  }
}

/**
 * Delete certification
 */
function deleteCertification(certificationId, user) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const mainSheet = ss.getSheetByName(MAIN_SHEET_NAME);
    
    if (!mainSheet) {
      return { error: 'Sheet not found' };
    }

    const sheetData = mainSheet.getDataRange().getValues();
    
    // Find the certification row (id is row index)
    const rowIndex = certificationId;
    if (rowIndex < 1 || rowIndex >= sheetData.length) {
      return { error: 'Certification not found' };
    }

    // Verify ownership
    if (sheetData[rowIndex][1] !== user.email) {
      return { error: 'Unauthorized' };
    }

    // Delete the row
    mainSheet.deleteRow(rowIndex + 1);

    return {
      success: true,
      message: 'Certification deleted successfully'
    };
  } catch (error) {
    return { error: 'Delete failed', message: error.toString() };
  }
}

/**
 * Generate secure token
 */
function generateToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
