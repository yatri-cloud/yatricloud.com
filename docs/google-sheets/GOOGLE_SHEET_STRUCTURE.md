# Google Sheet Structure Guide

## Overview

The Google Apps Script will **automatically create** the sheets and headers when you first submit a form. However, if you want to manually set it up or understand the structure, here's what you need:

## Sheet Structure

### Main Sheets (Automatically Created)

The script creates main sheets based on certification provider:

1. **`certified-aws-yatris`** - For all AWS certifications
2. **`certified-azure-yatris`** - For all Azure certifications
3. **`certified-gcp-yatris`** - For Google Cloud certifications
4. **`certified-kubernetes-yatris`** - For Kubernetes certifications
5. **`certified-terraform-yatris`** - For Terraform certifications
6. **`certified-other-yatris`** - For other certifications

### Sub-Sheets (Automatically Created)

For each exam code, a sub-sheet is created with the format: **"Exam Code: Certification Name"**. Examples:
- `AZ-900: Microsoft Azure Fundamentals` - Azure Fundamentals
- `AZ-104: Microsoft Azure Administrator Associate` - Azure Administrator
- `SAA-C03: AWS Certified Solutions Architect - Associate` - AWS Solutions Architect
- `CLF-C02: AWS Certified Cloud Practitioner` - AWS Cloud Practitioner
- `DEA-C01: AWS Certified Data Engineer - Associate` - AWS Data Engineer

**Note:** Sub-sheet names use the format "Exam Code: Certification Name" for better readability and organization.

## Column Headers (Row 1)

Each sheet should have these **16 columns** in this exact order:

| Column | Header Name | Description | Example |
|--------|-------------|-------------|---------|
| A | **Timestamp** | When the form was submitted | 2024-01-15T10:30:00.000Z |
| B | **Full Name** | Person's full name | Your Name |
| C | **Email** | Email address | john@example.com |
| D | **Certification Provider** | Provider name (lowercase) | aws, azure, gcp |
| E | **Certification Name** | Full certification name | AWS Certified Solutions Architect - Associate |
| F | **Exam Code** | Exam code | SAA-C03, AZ-900 |
| G | **Certification Date** | Date certified | 2024-01-15 |
| H | **LinkedIn URL** | LinkedIn profile URL | https://linkedin.com/in/johndoe |
| I | **Verified Credential** | Verified credential URL (Credly, Microsoft Learn, etc.) | https://www.credly.com/badges/... |
| J | **Country** | Country ISO code | US, IN, GB, CA |
| K | **State/Province** | State or province ISO code/name | CA, MH, California |
| L | **City** | City name | Mumbai, New York |
| M | **Country Code** | Phone country code | +1, +91, +44 |
| N | **Phone Number** | Phone number (without country code) | 9876543210 |
| O | **Photo URL** | Photo image URL (base64 or link) | data:image/jpeg;base64,... |
| P | **Additional Notes** | Optional notes | Great course! |

## Manual Setup (Optional)

If you want to manually create the sheets before using the form:

### Step 1: Create Main Sheets

1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1WjcJIZ5FMPr8ufy6Ij4QUHBogItlE45R2WtMOh4H2Ow/edit
2. Create sheets with these exact names:
   - `certified-aws-yatris`
   - `certified-azure-yatris`
   - `certified-gcp-yatris`
   - `certified-kubernetes-yatris`
   - `certified-terraform-yatris`
   - `certified-other-yatris`

### Step 2: Add Headers to Each Main Sheet

In each main sheet, add this header row (Row 1):

```
Timestamp | Full Name | Email | Certification Provider | Certification Name | Exam Code | Certification Date | LinkedIn URL | Verified Credential | Country | State/Province | City | Country Code | Phone Number | Photo URL | Additional Notes
```

### Step 3: Format Headers (Optional but Recommended)

1. Select Row 1
2. Make it **Bold**
3. Freeze Row 1 (View → Freeze → 1 row)
4. Set background color (e.g., light blue)

## Example Data Row

Here's what a complete row looks like:

| Timestamp | Full Name | Email | Certification Provider | Certification Name | Exam Code | Certification Date | LinkedIn URL | Verified Credential | Country | State/Province | City | Country Code | Phone Number | Photo URL | Additional Notes |
|-----------|-----------|-------|----------------------|-------------------|-----------|-------------------|-------------|---------------------|---------|----------------|------|--------------|--------------|-----------|------------------|
| 2024-01-15T10:30:00Z | Your Name | john@example.com | aws | AWS Certified Solutions Architect - Associate | SAA-C03 | 2024-01-15 | https://linkedin.com/in/johndoe | https://www.credly.com/badges/... | US | CA | San Francisco | +1 | 9876543210 | data:image/jpeg;base64,/9j/4AAQ... | Great course! |

## Important Notes

1. **Automatic Creation**: The Google Apps Script will automatically create sheets and headers if they don't exist, so manual setup is **optional**.

2. **Sheet Names Must Match**: The sheet names must match exactly (case-sensitive):
   - ✅ `certified-aws-yatris`
   - ❌ `Certified AWS Yatris`
   - ❌ `certified-aws-yatri`

3. **Sub-Sheets**: Sub-sheets are created automatically based on exam codes. You don't need to create them manually.

4. **Photo URLs**: Currently, photos are stored as base64 strings. For production, consider using an image hosting service (Imgur, Cloudinary) and storing just the URL.

5. **Permissions**: Make sure your Google Apps Script has permission to edit the spreadsheet.

## Quick Setup Checklist

- [ ] Open your Google Sheet
- [ ] (Optional) Create main sheets manually
- [ ] (Optional) Add headers to each main sheet
- [ ] Deploy Google Apps Script (see `GOOGLE_APPS_SCRIPT_SETUP.md`)
- [ ] Test form submission
- [ ] Verify data appears in correct sheets

## Troubleshooting

**If data isn't appearing:**
1. Check Google Apps Script execution logs
2. Verify sheet names match exactly
3. Check that headers are in Row 1
4. Verify column order matches the structure above

**If you see "Sheet not found" errors:**
- The script will create sheets automatically, but you can also create them manually with the exact names listed above

