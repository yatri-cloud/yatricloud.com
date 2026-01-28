# Yatris Sheet Structure - Visual Guide

## Spreadsheet Layout

```
Google Spreadsheet: yatris (ID: 13OmomLAxfEoHBiqLLlPUw1TuM3CWUZQ4w6UJY6qSd-E)
│
├── 📄 Tab 1: "yatris" (Main sheet for certifications)
│   └── Columns: Full Name | Email | Certification Provider | ... (13 columns)
│
└── 📄 Tab 2: "users" (Sub sheet for user accounts)
    └── Columns: Email | Password Hash | Full Name | ... (11 columns)
```

## How to Set Up

### Step 1: Open Your Spreadsheet
Go to: https://docs.google.com/spreadsheets/d/13OmomLAxfEoHBiqLLlPUw1TuM3CWUZQ4w6UJY6qSd-E

### Step 2: Create Sheet Tabs

**Option A: If sheets don't exist**
1. At the bottom left, you'll see sheet tabs
2. Click the **"+"** button to add a new sheet
3. Right-click the new tab → **Rename** → Type `yatris`
4. Click **"+"** again to add another sheet
5. Right-click the new tab → **Rename** → Type `users`

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
   G: Token
   H: Token Expiry
   I: Created At
   J: Last Login
   K: Status
   ```

## Visual Example

### Tab: `yatris`
```
| A: Full Name      | B: Email              | C: Provider | D: Certification Name | ... |
|-------------------|------------------------|-------------|------------------------|-----|
| Yatharth Chauhan  | yatharth@example.com   | AWS         | Solutions Architect    | ... |
| Your Name          | john@example.com       | Azure       | Administrator         | ... |
```

### Tab: `users`
```
| A: Email              | B: Password Hash | C: Full Name      | D: LinkedIn URL | ... |
|-----------------------|------------------|-------------------|-----------------|-----|
| yatharth@example.com  | a1b2c3...        | Yatharth Chauhan  | https://...     | ... |
| john@example.com      | x9y8z7...        | Your Name          | https://...     | ... |
```

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

## Verification Checklist

- [ ] Spreadsheet is accessible
- [ ] `yatris` tab exists
- [ ] `users` tab exists
- [ ] Headers are in Row 1 of both tabs
- [ ] Headers match exactly (case-sensitive)
- [ ] Apps Script is deployed
- [ ] Apps Script has access to the spreadsheet

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
