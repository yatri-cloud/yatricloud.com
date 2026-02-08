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
        'Admin Notes'
      ]);
      sheet.setFrozenRows(1);
      
      // Format header
      const headerRange = sheet.getRange(1, 1, 1, 11);
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
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
      '' // Admin notes (empty initially)
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
