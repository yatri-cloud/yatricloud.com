# Yatris Users - Google Sheets Structure & Setup

## Sheet Structure

**Important:** Both sheets (`yatris` and `users`) are **separate tabs** within the **same Google Spreadsheet**.

Spreadsheet: https://docs.google.com/spreadsheets/d/13OmomLAxfEoHBiqLLlPUw1TuM3CWUZQ4w6UJY6qSd-E

### Sheet Tab 1: `yatris`
This sheet stores all certification submissions.

**Columns:**
| Column | Name | Type | Description | Required |
|--------|------|------|-------------|----------|
| A | Full Name | Text | Person's full name | Yes |
| B | Email | Text | Person's email address | Yes |
| C | Certification Provider | Text | AWS, Azure, GCP, etc. | Yes |
| D | Certification Name | Text | Name of certification | Yes |
| E | Exam Code | Text | Exam code (e.g., SAA-C03) | Yes |
| F | Certification Date | Date/Text | Date of certification | Yes |
| G | LinkedIn URL | URL | LinkedIn profile URL | No |
| H | Photo URL | URL | Profile photo URL | No |
| I | Country | Text | Country name | No |
| J | Verified Credential | URL | Link to verified credential | No |
| K | Additional Notes | Text | Additional information | No |
| L | Submitted At | DateTime | When submitted | Auto |
| M | Updated At | DateTime | Last update time | Auto |

**Sample Row:**
```
Yatharth Chauhan | yatharth@example.com | AWS | AWS Certified Solutions Architect | SAA-C03 | 2024-01-15 | https://linkedin.com/in/yatharth | https://example.com/photo.jpg | India | https://credly.com/... | Great experience | 2024-01-20T10:00:00Z | 2024-01-20T10:00:00Z
```

### Sheet Tab 2: `users`
This sheet stores user accounts and authentication data. It's a **separate tab** in the same spreadsheet as `yatris`.

**Columns:**
| Column | Name | Type | Description | Required |
|--------|------|------|-------------|----------|
| A | Email | Text | User's email (unique) | Yes |
| B | Password Hash | Text | Hashed password | Yes |
| C | Full Name | Text | User's full name | Yes |
| D | LinkedIn URL | URL | LinkedIn profile URL | No |
| E | Photo URL | URL | Profile photo URL | No |
| F | Country | Text | Country name | No |
| G | Token | Text | Authentication token | Auto |
| H | Token Expiry | DateTime | Token expiration date | Auto |
| I | Created At | DateTime | Account creation date | Auto |
| J | Last Login | DateTime | Last login timestamp | Auto |
| K | Status | Text | active/inactive | Auto |

**Sample Row:**
```
yatharth@example.com | a1b2c3d4e5f6... | Yatharth Chauhan | https://linkedin.com/in/yatharth | https://example.com/photo.jpg | India | xyz123token... | 2024-02-20T10:00:00Z | 2024-01-20T10:00:00Z | 2024-01-21T15:30:00Z | active
```

## Google Apps Script Setup

### Step 1: Open Google Apps Script

1. Go to your Google Sheet: https://docs.google.com/spreadsheets/d/13OmomLAxfEoHBiqLLlPUw1TuM3CWUZQ4w6UJY6qSd-E
2. Click **Extensions** → **Apps Script**
3. Delete any existing code
4. Copy the code from `appscript/yatris-users.gs`
5. Paste it into the Apps Script editor

### Step 2: Configure the Script

The script is already configured with:
- **Spreadsheet ID:** `13OmomLAxfEoHBiqLLlPUw1TuM3CWUZQ4w6UJY6qSd-E`
- **Main Sheet:** `yatris`
- **Users Sheet:** `users`

### Step 3: Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Configure:
   - **Description:** Yatris Users API
   - **Execute as:** Me
   - **Who has access:** Anyone
5. Click **Deploy**
6. Copy the **Web app URL** - you'll need this for your frontend

### Step 4: Set Up Sheets

**Important:** Both sheets are tabs within the same spreadsheet file.

1. **Open your spreadsheet:**
   - Go to: https://docs.google.com/spreadsheets/d/13OmomLAxfEoHBiqLLlPUw1TuM3CWUZQ4w6UJY6qSd-E

2. **Create `yatris` sheet tab:**
   - If it doesn't exist, click the "+" button at the bottom to add a new sheet
   - Rename it to `yatris` (right-click on tab → Rename)
   - Add the headers (columns A-M) as listed above

3. **Create `users` sheet tab:**
   - Click the "+" button again to add another new sheet
   - Rename it to `users` (right-click on tab → Rename)
   - Add the headers (columns A-K) as listed above

4. **Verify sheet structure:**
   - You should now have at least 2 tabs: `yatris` and `users`
   - Both tabs are in the same spreadsheet file
   - The Apps Script can access both tabs using their names

5. **Set Permissions:**
   - Make sure the spreadsheet is accessible
   - The Apps Script will handle read/write operations on both tabs

## API Endpoints

### Base URL
Your deployed Apps Script web app URL (from Step 3)

### Endpoints

#### 1. Register User
```
POST /exec
Body: {
  "action": "register",
  "email": "user@example.com",
  "password": "password123",
  "fullName": "Your Name",
  "linkedinUrl": "https://linkedin.com/in/johndoe",
  "photoUrl": "https://example.com/photo.jpg",
  "country": "India"
}
```

#### 2. Login
```
POST /exec
Body: {
  "action": "login",
  "email": "user@example.com",
  "password": "password123"
}
```

#### 3. Get User (by token)
```
GET /exec?action=getUser&token=xyz123...
```

#### 4. Get User Certifications
```
GET /exec?action=getUserCertifications&token=xyz123...
```

#### 5. Submit Certification
```
POST /exec
Body: {
  "action": "submitCertification",
  "token": "xyz123...",
  "certificationProvider": "AWS",
  "certificationName": "AWS Certified Solutions Architect",
  "examCode": "SAA-C03",
  "certificationDate": "2024-01-15",
  "verifiedCredential": "https://credly.com/...",
  "additionalNotes": "Great experience"
}
```

#### 6. Update Profile
```
POST /exec
Body: {
  "action": "updateProfile",
  "token": "xyz123...",
  "fullName": "Your Name Updated",
  "linkedinUrl": "https://linkedin.com/in/johndoe",
  "photoUrl": "https://example.com/new-photo.jpg",
  "country": "USA"
}
```

## Security Notes

⚠️ **Important Security Considerations:**

1. **Password Hashing:**
   - Current implementation uses MD5 (for simplicity)
   - **For production, consider using bcrypt or similar**
   - The script includes email as salt

2. **Token Security:**
   - Tokens expire after 30 days
   - Tokens are randomly generated
   - Consider implementing refresh tokens

3. **CORS:**
   - Currently allows all origins (`*`)
   - For production, restrict to your domain

4. **Rate Limiting:**
   - Consider adding rate limiting
   - Google Apps Script has execution time limits

## Frontend Integration

### Environment Variable
Add to your `.env`:
```env
VITE_YATRIS_USERS_API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### Example Usage

```typescript
// Register
const response = await fetch(`${API_URL}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'register',
    email: 'user@example.com',
    password: 'password123',
    fullName: 'Your Name'
  })
});

// Login
const loginResponse = await fetch(`${API_URL}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'login',
    email: 'user@example.com',
    password: 'password123'
  })
});

// Store token
const { token } = await loginResponse.json();
localStorage.setItem('yatris_token', token);
```

## Troubleshooting

### Issue: "Sheet not found"
- Verify sheet names match exactly: `yatris` and `users`
- Check that sheets exist in the spreadsheet

### Issue: "Permission denied"
- Make sure the Apps Script is deployed with "Anyone" access
- Check that the spreadsheet is accessible

### Issue: "Invalid token"
- Token may have expired (30 days)
- User needs to login again
- Check token expiry in the `users` sheet

### Issue: "User already exists"
- Email must be unique
- Check existing users in the `users` sheet

## Next Steps

1. ✅ Set up Google Sheets structure
2. ✅ Deploy Apps Script
3. ✅ Test API endpoints
4. ✅ Integrate with frontend
5. ✅ Add login/signup UI
6. ✅ Add form submission
7. ✅ Add edit functionality

See the frontend integration guide for UI implementation.
