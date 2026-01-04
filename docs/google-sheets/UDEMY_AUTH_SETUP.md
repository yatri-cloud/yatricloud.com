# Udemy Admin Authentication Setup

This guide explains how to set up secure authentication for the Udemy course submission form.

## Overview

The `/udemy` page is now protected with email/password authentication. Users must login before accessing the course submission form.

## Google Sheet Setup

1. **Open the credentials sheet:**
   - URL: https://docs.google.com/spreadsheets/d/1LNnCwfYSi-ARwwmpDHOxzxDEEgRCnYVhN_i_66lRt5g/edit?gid=0#gid=0

2. **Main Sheet: `credentials-admin`**
   - Create a sheet named `credentials-admin` (if it doesn't exist)
   - Add headers in row 1:
     - Column A: `Email`
     - Column B: `Password`
   - Add credentials in row 2:
     - Email: `info@yatricloud.com`
     - Password: `Udemy@yatricl0ud` (note: capital U)

3. **Sub Sheet: `/udemy`**
   - The script will automatically create this sheet for logging login attempts
   - Headers: `Timestamp`, `Email`, `Password`, `Status`

## Google Apps Script Setup

1. **Create a new Google Apps Script project:**
   - Go to https://script.google.com
   - Click "New Project"
   - Copy the code from `appscript/udemy-credentials.gs`

2. **Update the Spreadsheet ID:**
   - The script is already configured with: `1LNnCwfYSi-ARwwmpDHOxzxDEEgRCnYVhN_i_66lRt5g`
   - Verify this matches your credentials sheet

3. **Deploy as Web App:**
   - Click "Deploy" → "New deployment"
   - Choose type: "Web app"
   - Description: "Udemy Credentials API"
   - Execute as: "Me"
   - **IMPORTANT:** Who has access: **"Anyone"** (this is required for CORS to work)
   - Click "Deploy"
   - **Authorize the script** when prompted (click "Authorize access" and grant permissions)
   - Copy the Web App URL (it should look like: `https://script.google.com/macros/s/.../exec`)
   - **Note:** Make sure you're copying the Web App URL, NOT the library URL

4. **Add to Environment Variables:**
   - Add the webhook URL to your `.env` file:
     ```
     VITE_UDEMY_CREDENTIALS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
     ```

5. **Restart Development Server:**
   - Stop and restart `npm run dev` to load the new environment variable

## Credentials

- **Email:** `info@yatricloud.com`
- **Password:** `Udemy@yatricl0ud` (note: capital U, lowercase d)

## Security Features

1. **Session Storage:** Authentication token is stored in `sessionStorage` (cleared when browser closes)
2. **Login Logging:** All login attempts are logged in the `/udemy` sub-sheet
3. **Password Protection:** Passwords are not logged in the sub-sheet (shown as `***`)

## Testing

1. Navigate to `/udemy`
2. You should see the login form
3. Enter credentials:
   - Email: `info@yatricloud.com`
   - Password: `Udemy@yatricl0ud` (note: capital U)
4. After successful login, you'll see the course submission form
5. Click "Logout" to end your session

## Troubleshooting

- **"Failed to fetch" error:**
  - Ensure the Apps Script is deployed as a "Web app" (not a library)
  - Verify "Who has access" is set to "Anyone"
  - Check that you're using the Web App URL (ends with `/exec`), not the library URL
  - Try redeploying the script as a new version
  - Check browser console for detailed error messages
  - Verify the script has been authorized (you should see an authorization prompt when deploying)

- **"Authentication service not configured":** 
  - Check that `VITE_UDEMY_CREDENTIALS_WEBHOOK_URL` is set in `.env`
  - Restart your development server after adding the environment variable

- **"Invalid email or password":** 
  - Verify credentials in the `credentials-admin` sheet
  - Check that email is in column A and password is in column B
  - Ensure there are no extra spaces in the credentials
  - Password is case-sensitive: `Udemy@yatricl0ud` (capital U, lowercase d)

- **CORS errors:** 
  - Ensure the Apps Script is deployed as "Web app" with "Anyone" access
  - The script should automatically handle CORS when deployed correctly
  - Try redeploying as a new version

- **Login not working:** 
  - Check the Apps Script execution logs (View → Executions)
  - Check the `/udemy` sub-sheet for login attempt logs
  - Verify the `credentials-admin` sheet exists and has data

