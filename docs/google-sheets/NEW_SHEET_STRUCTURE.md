# New Google Sheet Structure

## Overview

The new structure uses sub-sheets with descriptive names in the format: **"Exam Code: Certification Name"**

## Structure

### Main Sheets (Master Lists)
- `certified-aws-yatris` - All AWS certifications
- `certified-azure-yatris` - All Azure certifications  
- `certified-gcp-yatris` - All GCP certifications
- `certified-kubernetes-yatris` - All Kubernetes certifications
- `certified-terraform-yatris` - All Terraform certifications
- `certified-other-yatris` - Other certifications

### Sub-Sheets (Organized by Certification)

Each sub-sheet is named with the format: **"Exam Code: Certification Name"**

#### Azure Examples:
- `AZ-900: Microsoft Azure Fundamentals`
- `AZ-104: Microsoft Azure Administrator`
- `AZ-204: Azure Developer Associate`
- `AZ-305: Azure Solutions Architect Expert`

#### AWS Examples:
- `CLF-C02: AWS Certified Cloud Practitioner`
- `SAA-C03: AWS Certified Solutions Architect - Associate`
- `DVA-C02: AWS Certified Developer - Associate`
- `AWS Certified Cloud Practitioner` (if no exam code)

## How It Works

### Form Submission
1. User fills out the form
2. Data is sent to Google Apps Script
3. Script creates/updates:
   - **Main sheet** (e.g., `certified-azure-yatris`) - Master list
   - **Sub-sheet** (e.g., `AZ-900: Microsoft Azure Fundamentals`) - Organized by certification

### Data Retrieval
1. `doGet` function reads from **sub-sheets only**
2. Sub-sheets are identified by containing ":" in their name
3. Main sheets (starting with "certified-") are skipped during retrieval
4. All certifications from all sub-sheets are combined and returned

## Column Headers

Each sheet (main and sub) has these 11 columns:

1. **Timestamp** - When submitted
2. **Full Name** - Person's name
3. **Email** - Email address
4. **Certification Provider** - aws, azure, gcp, etc.
5. **Certification Name** - Full certification name
6. **Exam Code** - Exam code (e.g., AZ-900, SAA-C03)
7. **Certification Date** - Date certified
8. **LinkedIn URL** - LinkedIn profile
9. **Verified Credential** - Credly/Microsoft Learn URL
10. **Photo URL** - Profile photo
11. **Additional Notes** - Optional notes

## Benefits

1. **Better Organization** - Each certification has its own sheet
2. **Easy Filtering** - Can view all people with a specific certification
3. **Clear Naming** - Sub-sheet names are descriptive and human-readable
4. **Scalable** - Easy to add new certifications without cluttering

## Example Data Flow

### Submission:
```
Form Data → Google Apps Script
  ↓
Main Sheet: certified-azure-yatris (row added)
  ↓
Sub-Sheet: "AZ-900: Microsoft Azure Fundamentals" (row added)
```

### Retrieval:
```
doGet() → Reads all sub-sheets (containing ":")
  ↓
Combines all rows
  ↓
Returns JSON array
```

## Migration Notes

If you have existing data in the old format:
1. Old sub-sheets (like "az900", "saac03") will still work
2. New submissions will create sheets in the new format
3. You can manually rename old sub-sheets to match the new format
4. The `doGet` function reads from both formats (any sheet with ":" in the name)

