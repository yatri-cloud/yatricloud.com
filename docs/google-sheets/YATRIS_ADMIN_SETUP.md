# Yatri Cloud Admin Setup

To enable the Universal Admin Login, you need to configure a Google Sheet and deploy a Google Apps Script.

## 1. Google Sheet Setup

**Spreadsheet ID**: `1LNnCwfYSi-ARwwmpDHOxzxDEEgRCnYVhN_i_66lRt5g` (From your request)
**Link**: [Google Sheet](https://docs.google.com/spreadsheets/d/1LNnCwfYSi-ARwwmpDHOxzxDEEgRCnYVhN_i_66lRt5g/edit)

You need to create two sheets (tabs) in this spreadsheet:

### Tab 1: `credentials-admin`
This sheet stores the allowed admin users.

| Row | Column A (Email) | Column B (Password) |
| :--- | :--- | :--- |
| **1** | **Email** | **Password** |
| **2** | `admin@yatricloud.com` | `YatharthNensi2311@yatricl0ud` |

**Action**:
1.  Rename a tab to `credentials-admin`.
2.  Add headers `Email` and `Password` in the first row.
3.  Add the credential pair above in the second row.

### Tab 2: `/admin`
This sheet logs login attempts. The script will create this automatically if it doesn't exist, but you can create it manually.

| Row | Column A | Column B | Column C | Column D |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Timestamp** | **Email** | **Password** | **Status** |

---

## 2. Google Apps Script Setup

1.  Open the script file: `appscript/yatris-admin-auth.gs` in your local project.
2.  Copy its content.
3.  Go to your Google Sheet (`1LNnCwfYSi...`).
4.  Click **Extensions** > **Apps Script**.
5.  Paste the code into `Code.gs`.
6.  Click **Deploy** > **New Deployment**.
7.  Select type: **Web app**.
8.  Description: `Admin Auth v1`.
9.  Execute as: **Me**.
10. Who has access: **Anyone** (Required for the frontend to access it).
11. Click **Deploy**.
12. **Copy the Web App URL**.

## 3. Frontend Configuration

You will need to add the Web App URL to your `.env` file (or hardcode it for testing, though `.env` is recommended).

`VITE_ADMIN_AUTH_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec`
