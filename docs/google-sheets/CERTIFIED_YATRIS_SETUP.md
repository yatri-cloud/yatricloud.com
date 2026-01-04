# Certified Yatris Feature - Setup Guide

## Overview

The `/certifiedyatris` page allows users to submit their certification achievements and view them on a "Wall of Fame". All data is stored in Google Sheets.

## Features

1. **Certification Submission Form**
   - Full name, email, LinkedIn profile
   - Certification provider (AWS, Azure, GCP, etc.)
   - Certification name and exam code
   - Certification date
   - Photo upload
   - Additional notes

2. **Wall of Fame Display**
   - Grid view of all certifications
   - Filter by provider, exam code, or search
   - Shows photo, name, certification details, and LinkedIn link

3. **Google Sheets Integration**
   - Data stored in organized sheets
   - Main sheets: `certified-aws-yatris`, `certified-azure-yatris`, etc.
   - Sub-sheets: Exam codes like `az900`, `saac03`, etc.

## Setup Instructions

### 1. Google Apps Script Setup

Follow the instructions in `GOOGLE_APPS_SCRIPT_SETUP.md` to:
- Create a Google Apps Script web app
- Deploy it and get the webhook URL
- Add the URL to your `.env` file

### 2. Environment Variables

Add to your `.env` file:

```env
VITE_GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### 3. Google Sheet Structure

Your Google Sheet should have the following structure:

**Main Sheets:**
- `certified-aws-yatris`
- `certified-azure-yatris`
- `certified-gcp-yatris`
- `certified-kubernetes-yatris`
- `certified-terraform-yatris`
- `certified-other-yatris`

**Sub-sheets (within each main sheet):**
- Exam codes like: `az900`, `az104`, `saac03`, `clfc02`, etc.

The Google Apps Script will automatically create these sheets if they don't exist.

### 4. Testing

1. Navigate to `/certifiedyatris`
2. Fill out the form and submit
3. Check your Google Sheet to verify data was added
4. View the Wall of Fame to see your submission

## File Structure

```
src/
├── pages/
│   └── CertifiedYatris.tsx          # Main page component
├── components/
│   └── certified-yatris/
│       ├── CertificationForm.tsx     # Submission form
│       └── WallOfFame.tsx             # Display component
└── lib/
    └── google-sheets.ts               # Google Sheets integration
```

## Supported Certifications

### AWS
- Cloud Practitioner (CLF-C02)
- Solutions Architect Associate (SAA-C03)
- Developer Associate (DVA-C02)
- SysOps Administrator Associate (SOA-C02)
- CloudOps Engineer Associate (SOA-C03)
- Solutions Architect Professional (SAP-C02)
- DevOps Engineer Professional (DOP-C02)
- Security Specialty (SCS-C02)
- Machine Learning Specialty (MLS-C01)
- Data Engineer Associate (DEA-C01)
- AI Practitioner (AIF-C01)
- GenAI Developer Professional

### Azure
- Fundamentals (AZ-900)
- Administrator Associate (AZ-104)
- Developer Associate (AZ-204)
- Solutions Architect Expert (AZ-305)
- DevOps Engineer Expert (AZ-400)
- Security Engineer Associate (AZ-500)
- Network Engineer Associate (AZ-700)
- AI Fundamentals (AI-900)
- AI Engineer Associate (AI-102)

## Customization

### Adding New Certifications

Edit `src/components/certified-yatris/CertificationForm.tsx`:

1. Add to `AWS_CERTIFICATIONS` or `AZURE_CERTIFICATIONS` arrays
2. Or add a new provider array and update `getCertifications()`

### Styling

The components use Tailwind CSS and shadcn/ui components. Customize styles in:
- `src/components/certified-yatris/CertificationForm.tsx`
- `src/components/certified-yatris/WallOfFame.tsx`
- `src/pages/CertifiedYatris.tsx`

## Production Considerations

1. **Image Storage**: Currently photos are stored as base64 in Google Sheets. For production, consider:
   - Uploading to Imgur, Cloudinary, or your own image hosting service
   - Update `uploadPhoto()` function in `google-sheets.ts`

2. **Security**: 
   - Add rate limiting to prevent spam
   - Add CAPTCHA to the form
   - Validate and sanitize all inputs

3. **Performance**:
   - Implement pagination for Wall of Fame
   - Cache certification data
   - Use image CDN for photos

4. **Error Handling**:
   - Add retry logic for failed submissions
   - Show user-friendly error messages
   - Log errors for debugging

## Troubleshooting

### Form not submitting
- Check browser console for errors
- Verify `VITE_GOOGLE_SHEETS_WEBHOOK_URL` is set correctly
- Check Google Apps Script execution logs

### Wall of Fame not loading
- Check Google Apps Script `doGet()` function
- Verify sheet permissions
- Check browser console for errors

### Photos not displaying
- Verify photo URL format in Google Sheet
- Check if base64 images are too large (consider image hosting)
- Verify image URLs are accessible

## Support

For issues or questions, check:
- Google Apps Script logs
- Browser console
- Network tab for API calls
- Google Sheet data format

