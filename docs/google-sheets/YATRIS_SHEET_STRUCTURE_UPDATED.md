# Yatris Sheet Structure - Updated

## Spreadsheet Layout

```
Google Spreadsheet: yatris (ID: 13OmomLAxfEoHBiqLLlPUw1TuM3CWUZQ4w6UJY6qSd-E)
│
├── 📄 Tab 1: "yatris" (Main sheet for certifications)
│   └── Columns: Full Name | Email | Certification Provider | ... (13 columns)
│
└── 📄 Tab 2: "users" (Sub sheet for user accounts)
    └── Columns: Email | Password Hash | Full Name | ... (15 columns)
```

## Sheet Structure Details

### Tab 1: `yatris` (Certifications Sheet)

**Purpose**: Stores all certification submissions from all providers

**Headers (Row 1)**:
```
A: Full Name
B: Email
C: Certification Provider
D: Certification Name
E: Exam Code
F: Certification Date
G: LinkedIn URL
H: Photo URL
I: Country
J: Verified Credential
K: Additional Notes
L: Submitted At
M: Updated At
```

**Note**: This sheet is used for reference. Actual certifications are stored in provider-specific sheets (certified-aws-yatris, certified-azure-yatris, etc.)

---

### Tab 2: `users` (User Accounts Sheet)

**Purpose**: Stores user account information, authentication data, and profile details

**Headers (Row 1)**:
```
A: Email
B: Password Hash
C: Full Name
D: LinkedIn URL
E: Photo URL
F: Country
G: State/Province
H: City
I: Country Code
J: Phone Number
K: Token
L: Token Expiry
M: Created At
N: Last Login
O: Status
```

**Column Details**:

| Column | Field | Type | Required | Description |
|--------|-------|------|----------|-------------|
| A | Email | String | ✅ Yes | User's email address (unique identifier) |
| B | Password Hash | String | ✅ Yes | MD5 hash of password + email (salted) |
| C | Full Name | String | ✅ Yes | User's full name |
| D | LinkedIn URL | String | ✅ Yes | LinkedIn profile URL |
| E | Photo URL | String | ✅ Yes | Base64 encoded photo or URL |
| F | Country | String | ✅ Yes | Country ISO code (e.g., "IN" for India) |
| G | State/Province | String | ✅ Yes | State or province name |
| H | City | String | ✅ Yes | City name |
| I | Country Code | String | ✅ Yes | Phone country code (e.g., "+91") |
| J | Phone Number | String | ✅ Yes | Phone number without country code |
| K | Token | String | Auto | Authentication token (generated on login) |
| L | Token Expiry | DateTime | Auto | Token expiration date (30 days) |
| M | Created At | DateTime | Auto | Account creation timestamp |
| N | Last Login | DateTime | Auto | Last login timestamp |
| O | Status | String | Auto | Account status ("active" or "inactive") |

---

## Provider-Specific Certification Sheets

Certifications are stored in separate sheets per provider:

- `certified-aws-yatris` - AWS certifications
- `certified-azure-yatris` - Azure certifications
- `certified-gcp-yatris` - Google Cloud certifications
- `certified-github-yatris` - GitHub certifications
- `certified-oracle-yatris` - Oracle certifications
- `certified-salesforce-yatris` - Salesforce certifications
- `certified-servicenow-yatris` - ServiceNow certifications

**Each provider sheet has the same structure**:
```
A: Full Name
B: Email
C: Certification Provider
D: Certification Name
E: Exam Code
F: Certification Date
G: LinkedIn URL
H: Photo URL
I: Country
J: State/Province
K: City
L: Country Code
M: Phone Number
N: Verified Credential
O: Additional Notes
P: Submitted At
Q: Updated At
```

---

## Data Flow

### Signup Flow:
1. User fills signup form with:
   - Email, Password, Full Name
   - LinkedIn URL (optional)
   - Photo (optional)
   - Country, State/Province, City
   - Country Code, Phone Number
2. Data saved to `users` sheet (columns A-J)
3. Token generated and saved (columns K-L)

### Certification Submission Flow:
1. User selects certifications
2. User enters certification-specific details:
   - Year Passed
   - Verified Credential URL
   - Additional Notes
3. System uses profile data from `users` sheet:
   - Full Name, Email, LinkedIn URL, Photo URL
   - Country, State/Province, City
   - Country Code, Phone Number
4. Certification saved to provider-specific sheet (e.g., `certified-aws-yatris`)

---

## How to Set Up

### Step 1: Open Your Spreadsheet
Go to: https://docs.google.com/spreadsheets/d/13OmomLAxfEoHBiqLLlPUw1TuM3CWUZQ4w6UJY6qSd-E

### Step 2: Create Sheet Tabs

**Option A: If sheets don't exist**
1. At the bottom left, click the **"+"** button to add a new sheet
2. Right-click the new tab → **Rename** → Type `yatris`
3. Click **"+"** again to add another sheet
4. Right-click the new tab → **Rename** → Type `users`

**Option B: If `yatris` sheet already exists**
1. Click **"+"** to add a new sheet
2. Rename it to `users`

### Step 3: Add Headers

**For `yatris` tab:**
1. Click on the `yatris` tab
2. In Row 1, add these headers (one per column):
   ```
   A: Full Name
   B: Email
   C: Certification Provider
   D: Certification Name
   E: Exam Code
   F: Certification Date
   G: LinkedIn URL
   H: Photo URL
   I: Country
   J: Verified Credential
   K: Additional Notes
   L: Submitted At
   M: Updated At
   ```

**For `users` tab:**
1. Click on the `users` tab
2. In Row 1, add these headers (one per column):
   ```
   A: Email
   B: Password Hash
   C: Full Name
   D: LinkedIn URL
   E: Photo URL
   F: Country
   G: State/Province
   H: City
   I: Country Code
   J: Phone Number
   K: Token
   L: Token Expiry
   M: Created At
   N: Last Login
   O: Status
   ```

---

## Visual Example

### Tab: `users`
```
| A: Email              | B: Password Hash | C: Full Name      | D: LinkedIn URL | E: Photo URL | F: Country | G: State/Province | H: City    | I: Country Code | J: Phone Number | K: Token | ... |
|-----------------------|------------------|-------------------|-----------------|--------------|------------|-------------------|------------|-----------------|-----------------|----------|-----|
| yatharth@example.com  | a1b2c3...        | Yatharth Chauhan  | https://...     | data:image...| IN         | Karnataka         | BENGALURU  | +91             | 9876543210      | xyz123...| ... |
```

### Tab: `yatris` (Reference Sheet)
```
| A: Full Name      | B: Email              | C: Provider | D: Certification Name | ... |
|-------------------|------------------------|-------------|------------------------|-----|
| Yatharth Chauhan  | yatharth@example.com   | AWS         | Solutions Architect    | ... |
```

### Provider Sheet: `certified-azure-yatris`
```
| A: Full Name      | B: Email              | C: Provider | D: Certification Name | E: Exam Code | F: Certification Date | G: LinkedIn URL | H: Photo URL | I: Country | J: State/Province | K: City    | L: Country Code | M: Phone Number | ... |
|-------------------|------------------------|-------------|------------------------|--------------|------------------------|-----------------|--------------|------------|-------------------|------------|-----------------|-----------------|-----|
| Yatharth Chauhan  | yatharth@example.com   | Azure       | Azure Fundamentals     | AZ-900       | 2022                   | https://...     | data:image...| IN         | Karnataka         | BENGALURU  | +91             | 9876543210      | ... |
```

---

## Important Notes

✅ **Both sheets are in the SAME spreadsheet file**
- They are separate tabs, not separate files
- The Apps Script accesses them by name: `yatris` and `users`
- Both tabs share the same spreadsheet ID

✅ **Sheet Names Must Match Exactly**
- Tab name must be exactly: `yatris` (lowercase)
- Tab name must be exactly: `users` (lowercase)
- Case-sensitive!

✅ **Headers Must Be in Row 1**
- First row is always headers
- Data starts from Row 2

✅ **Profile Data in Signup Only**
- LinkedIn URL, Country, State/Province, City, Country Code, Phone Number are collected during signup
- These fields are NOT in the certification form
- Certification submissions use profile data from the `users` sheet

---

## Verification Checklist

- [ ] Spreadsheet is accessible
- [ ] `yatris` tab exists
- [ ] `users` tab exists
- [ ] Headers are in Row 1 of both tabs
- [ ] Headers match exactly (case-sensitive)
- [ ] `users` sheet has 15 columns (A-O)
- [ ] `yatris` sheet has 13 columns (A-M)
- [ ] Apps Script is deployed
- [ ] Apps Script has access to the spreadsheet

---

## Troubleshooting

### "Sheet not found" error
- Check tab names match exactly: `yatris` and `users`
- Verify tabs exist in the spreadsheet
- Check spreadsheet ID in Apps Script matches

### "Permission denied" error
- Make sure Apps Script is deployed with "Anyone" access
- Verify spreadsheet sharing settings
- Check Apps Script execution permissions

### Data not saving
- Verify headers are correct
- Check column order matches documentation
- Ensure Apps Script has edit permissions

### Profile fields not showing
- Verify user data is saved in `users` sheet
- Check that all 15 columns exist in `users` sheet
- Ensure data is being fetched from API correctly
