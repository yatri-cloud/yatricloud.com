# Separate Google Apps Scripts for Each Provider

This folder contains separate Google Apps Script files for each certification provider. Each script works with its own Google Sheet.

## Files

- `azure-certifications.gs` - For Azure certifications only
- `aws-certifications.gs` - For AWS certifications only
- `gcp-certifications.gs` - For GCP certifications (if needed)
- `all-providers.gs` - Combined script for all providers (optional)

## Setup Instructions

### For Azure Certifications

1. **Use the existing Google Sheet** for Azure certifications
   - Sheet ID: `1WjcJIZ5FMPr8ufy6Ij4QUHBogItlE45R2WtMOh4H2Ow`
   - URL: https://docs.google.com/spreadsheets/d/1WjcJIZ5FMPr8ufy6Ij4QUHBogItlE45R2WtMOh4H2Ow/edit
   - Main sheet: `certified-azure-yatris`

2. **Create Google Apps Script**
   - Go to [script.google.com](https://script.google.com)
   - Click "New Project"
   - Copy the contents of `azure-certifications.gs`
   - **Sheet ID is already configured** (line 5)

3. **Deploy as Web App**
   - Click "Deploy" > "New deployment"
   - Click the gear icon ⚙️ and choose "Web app"
   - Set:
     - Description: "Azure Certifications API"
     - Execute as: "Me"
     - Who has access: "Anyone"
   - Click "Deploy"
   - Copy the web app URL

4. **Add to Environment**
   - Add the web app URL to your `.env` file as `VITE_AZURE_CERTIFICATIONS_WEBHOOK_URL`

### For AWS Certifications

1. **Use the existing Google Sheet** for AWS certifications
   - Sheet ID: `1GkP6S1DM0SO-0FlQO-MtBIdND6C95H0E9yGqHzmnnaU`
   - URL: https://docs.google.com/spreadsheets/d/1GkP6S1DM0SO-0FlQO-MtBIdND6C95H0E9yGqHzmnnaU/edit
   - Main sheet: `certified-aws-yatris`

2. **Create Google Apps Script**
   - Go to [script.google.com](https://script.google.com)
   - Click "New Project"
   - Copy the contents of `aws-certifications.gs`
   - **Sheet ID is already configured** (line 5)

3. **Deploy as Web App**
   - Deploy with "Who has access: Anyone"
   - Copy the web app URL

4. **Add to Environment**
   - Add the web app URL to your `.env` file as `VITE_AWS_CERTIFICATIONS_WEBHOOK_URL`

## Sheet Structure

Each sheet will have:

### Main Sheet
- `certified-azure-yatris` (for Azure)
- `certified-aws-yatris` (for AWS)

### Sub-Sheets (Auto-created)
- `AZ-900: Microsoft Azure Fundamentals`
- `AZ-104: Microsoft Azure Administrator`
- `SAA-C03: AWS Certified Solutions Architect - Associate`
- etc.

## Column Headers

Each sheet has these 11 columns:

1. Timestamp
2. Full Name
3. Email
4. Certification Provider
5. Certification Name
6. Exam Code
7. Certification Date
8. LinkedIn URL
9. Verified Credential
10. Photo URL
11. Additional Notes

## Benefits of Separate Scripts

1. **Isolation** - Each provider has its own sheet and script
2. **Scalability** - Easy to manage and update independently
3. **Security** - Separate access controls if needed
4. **Performance** - Smaller sheets = faster queries
5. **Flexibility** - Can customize each script for provider-specific needs

## Frontend Integration

You'll need to update your frontend to:
1. Route submissions to the correct webhook URL based on provider
2. Fetch from multiple webhooks and combine results
3. Or create separate forms for each provider

See `src/lib/google-sheets.ts` for integration examples.

