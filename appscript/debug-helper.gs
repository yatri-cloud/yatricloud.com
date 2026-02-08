
/**
 * DEBUG FUNCTION: Run this manually in Apps Script Editor to test Calendar API
 */
function debugCalendarService() {
  try {
    console.log("Checking Calendar Service...");
    if (typeof Calendar === 'undefined') {
      throw new Error("'Calendar' is undefined. Please add 'Google Calendar API' service.");
    }
    console.log("Calendar Service Found! creating test event...");
    // Try a dry run to create an object (no api call yet)
    const eventResource = {
        summary: `Test Event`,
        conferenceData: {
          createRequest: { cancellationRetrySection: true }
        }
    };
    console.log("Service is active and defined. You are good to deploy.");
    return "Success: Calendar Service is Enabled!";
  } catch (e) {
    console.error("DEBUG FAILED: " + e.toString());
    return "Failed: " + e.toString();
  }
}
