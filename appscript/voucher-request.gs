/**
 * Yatri Cloud - Certification Voucher Request Handler
 * Saves form submissions to a spreadsheet
 * 
 * Deployment Instructions:
 * 1. Create a Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Paste this code
 * 4. Deploy as Web App (Execute as: Me, Access: Anyone)
 */

function doPost(e) {
  try {
    // Parse the incoming JSON data
    var data = JSON.parse(e.postData.contents);
    
    // Get the active spreadsheet
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Log to the "Master Requests" sheet
    var masterSheet = ss.getSheetByName("Master Requests") || ss.insertSheet("Master Requests");
    
    // Create headers if the sheet is new
    if (masterSheet.getLastRow() === 0) {
      masterSheet.appendRow([
        "Timestamp", 
        "Full Name", 
        "Email", 
        "WhatsApp/Contact", 
        "Exam Provider", 
        "Exams Requested", 
        "Reason/Message"
      ]);
      masterSheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#f3f3f3");
    }
    
    // Prepare the data row
    // Join multiple exams with a comma for better readability in the sheet
    var examsString = Array.isArray(data.exams) ? data.exams.join(", ") : data.exams;
    
    var rowData = [
      new Date(),
      data.fullName,
      data.email,
      data.whatsapp,
      data.provider,
      examsString,
      data.reason || "N/A"
    ];
    
    // Append to Master Sheet
    masterSheet.appendRow(rowData);
    
    // 2. Optional: Create/Append to provider-specific sheets (Subsets)
    // Extract provider name for sheet tab (e.g., "AWS", "Microsoft")
    // If it's a custom provider, we'll clean up the name to be a valid sheet tab name
    var providerName = data.provider.split("(")[0].trim().substring(0, 30).replace(/[^a-zA-Z0-9 ]/g, ""); 
    var providerSheet = ss.getSheetByName(providerName) || ss.insertSheet(providerName);
    
    if (providerSheet.getLastRow() === 0) {
      providerSheet.appendRow(["Timestamp", "Full Name", "Email", "Exams", "Reason"]);
      providerSheet.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#e6f3ff");
    }
    providerSheet.appendRow([new Date(), data.fullName, data.email, examsString, data.reason || "N/A"]);

    // Return success response
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Request logged successfully"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
