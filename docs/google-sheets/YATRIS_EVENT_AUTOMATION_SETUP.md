# Yatri Event Automation Setup

Complete guide for setting up automated Google Drive folder and Google Sheets creation for events.

## Overview

When you create an event through the admin dashboard, the system automatically:
1. ✅ Creates a dedicated folder in the appropriate city folder
2. ✅ Creates subfolders for gallery, speakers, and media
3. ✅ Creates a Google Spreadsheet with 6 pre-configured sheets
4. ✅ Returns direct links to access everything

## Google Apps Script Deployment

### 1. Create New Script

1. Open [Google Apps Script](https://script.google.com)
2. Click **New Project**
3. Name it: `Yatri Event Automation`

### 2. Copy Script Code

Copy the entire content from `appscript/yatris-event-automation.gs` and paste it into the script editor.

### 3. Configure City Folders

In the script, update the `CITY_FOLDERS` constant with your folder IDs:

```javascript
const CITY_FOLDERS = {
  'bangalore': '1bNWZzxaNEnTjIeCJdzrJ-rtOw4C-ebJ7',
  'karnataka': '1d4XMHRWCvfICBWoUwwM13h0eAtDfN1v1',
  'india': '1OUM6IMngpnDZyZVTTN2Tq-vD0xzfZx3C'
  // Add more cities as needed
};
```

**How to get Folder ID:**
- Open the folder in Google Drive
- The URL will look like: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`
- Copy the ID part

### 4. Deploy as Web App

1. Click **Deploy** > **New deployment**
2. Click the gear icon ⚙️ > Select **Web app**
3. Fill in:
   - **Description**: `Event Automation v1`
   - **Execute as**: `Me (your-email@gmail.com)`
   - **Who has access**: `Anyone`
4. Click **Deploy**
5. **Important**: Copy the Web App URL

### 5. Authorize Permissions

1. First deployment will ask for permissions
2. Click **Review Permissions**
3. Choose your Google account
4. Click **Advanced** > **Go to Yatri Event Automation (unsafe)**
5. Click **Allow**

Required permissions:
- ✅ Create and manage Google Drive folders
- ✅ Create and edit Google Sheets
- ✅ Access your Google Drive

## Frontend Configuration

### Update Environment Variables

Add the Web App URL to your `.env.local` file:

```bash
VITE_EVENT_AUTOMATION_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

Replace `YOUR_SCRIPT_ID` with the actual deployment URL you copied.

## Folder Structure Created

For each event, the system creates:

```
yatri-events-[city]/
  └── [Event Name - Date]/
      ├── [Event Name].sheet (Google Spreadsheet)
      ├── gallery/        (for event photos)
      ├── speakers/       (for speaker materials)
      └── media/          (for videos, presentations)
```

## Google Spreadsheet Structure

Each event gets a spreadsheet with **6 sheets**:

### 1. Event Details
Basic event information and metadata
- Event name, date, city, location
- Description and status
- Registration details
- Organizer contact info

### 2. Attendees
Track all registrations and check-ins
- Timestamp, Name, Email, Phone
- Organization, Ticket Type
- Status, Check-in Time

### 3. Speakers
Manage speaker information
- Name, Title, Organization
- Bio, Contact details
- Photo URL, LinkedIn
- Session topic and time

### 4. Schedule
Event agenda and timeline
- Time, Session Title, Speaker(s)
- Duration, Room/Track
- Session type, Description

### 5. Feedback
Post-event feedback collection
- Timestamp, Attendee info
- Ratings (Overall, Content, Venue, Organization)
- Comments and suggestions

### 6. Analytics
Auto-calculated metrics
- Total registrations
- Total speakers
- Check-in count
- Attendance rate
- Average rating
- Feedback count

## Testing

### Test Script Functionality

Run the test function in the Apps Script editor:

```javascript
// In the script editor
function testEventCreation() {
  const testData = {
    action: 'createEvent',
    eventName: 'Test Event - Cloud Workshop',
    eventDate: '2024-02-15',
    city: 'bangalore',
    location: 'Test Location',
    description: 'Test Description'
  };
  
  const result = createEventStructure(testData);
  Logger.log(result.getContent());
}
```

1. Select `testEventCreation` from function dropdown
2. Click **Run**
3. Check **Execution log** for results
4. Verify folder and sheet created in your Drive

## Adding New Cities

To add a new city:

1. Create the city folder in Google Drive
2. Copy the folder ID
3. Update the script:
   ```javascript
   const CITY_FOLDERS = {
     'bangalore': '...',
     'mumbai': 'NEW_FOLDER_ID_HERE',  // Add new city
     // ... other cities
   };
   ```
4. **Re-deploy** the script (Deploy > Manage deployments > Edit > Version: New version > Deploy)
5. Update frontend city list in `src/lib/event-automation-api.ts`:
   ```typescript
   export const AVAILABLE_CITIES = [
     { value: 'bangalore', label: 'Bangalore' },
     { value: 'mumbai', label: 'Mumbai' },  // Add new city
     // ... other cities
   ];
   ```

## Troubleshooting

### "Event automation is not configured"
- Check that `VITE_EVENT_AUTOMATION_SCRIPT_URL` is set in `.env.local`
- Restart the dev server after adding the variable

### "City folder not configured"
- Verify the city exists in `CITY_FOLDERS` in the script
- City names are case-sensitive and must be lowercase
- Re-deploy the script after making changes

### "Permission denied"
- Re-authorize the script
- Check that deployment is set to "Execute as: Me"
- Verify "Who has access" is set to "Anyone"

### Folder/Sheet not created
- Check Apps Script **Executions** page for errors
- Verify folder IDs are correct
- Ensure you have edit access to the parent folders

## Security Notes

> [!IMPORTANT]
> The script runs with your Google account permissions. Only authorized users should have access to the admin dashboard to prevent unauthorized folder/sheet creation.

> [!WARNING]
> Never share the Web App URL publicly. It should only be used by your admin application.

## Update/Redeploy

When you modify the script:

1. Save changes in script editor
2. **Deploy** > **Manage deployments**
3. Click ✏️ **Edit** on your deployment
4. **Version**: Select **New version**
5. Click **Deploy**
6. The Web App URL remains the same
