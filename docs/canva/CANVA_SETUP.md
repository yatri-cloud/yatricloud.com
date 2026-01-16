# Canva API Integration Setup Guide

This guide will help you set up Canva API integration to automatically generate certification images from your Canva Pro templates.

## Overview

With Canva API integration, you can:
- Use your existing Canva Pro templates
- Automatically generate images with person data
- Maintain consistent branding and design
- Export high-quality images programmatically

## Prerequisites

1. **Canva Pro Account** - You need a Canva Pro subscription
2. **Canva API Access** - Request API access from Canva
3. **Canva Template** - Create a template in Canva with variable placeholders

## Step 1: Get Canva API Credentials

1. **Request API Access**
   - Visit: https://www.canva.com/developers/
   - Sign in with your Canva Pro account
   - Request API access (may require approval)

2. **Create API Application**
   - Go to Canva Developer Portal
   - Create a new application
   - Note down your:
     - **API Key** (Client ID)
     - **API Secret** (Client Secret)

## Step 2: Create Your Canva Template

1. **Design Your Template**
   - Open Canva
   - Create a new design (1000x1000px for square format)
   - Design your certification card with:
     - Placeholder for photo
     - Placeholder for name
     - Placeholder for certifications
     - Yatri Cloud branding

2. **Set Up Template Variables**
   - Use Canva's Autofill feature
   - Create variables for:
     - `name` - Person's full name
     - `photo` - Person's photo URL
     - `certifications` - Certification text (e.g., "2x AWS • 3x Azure")
     - `country` - Country name (optional)
     - `totalCertifications` - Total count (optional)

3. **Get Template ID**
   - Publish your template
   - Copy the template ID from the URL or API response
   - Format: Usually looks like `DAFxxxxx` or similar

## Step 3: Configure Environment Variables

Add these to your `.env` file (or Vercel environment variables):

```env
# Canva Connect API Credentials
CANVA_CLIENT_ID=your_canva_client_id_here
CANVA_CLIENT_SECRET=your_canva_client_secret_here

# Canva Template ID (optional - set after creating your template)
VITE_CANVA_TEMPLATE_ID=your_template_id_here
```

**Quick Setup:**
- Copy `.env.example` to `.env`
- Add your credentials:
  - `CANVA_CLIENT_ID`: Your Client ID from Step 2
  - `CANVA_CLIENT_SECRET`: Your Client Secret from Step 2
  - `VITE_CANVA_TEMPLATE_ID`: Your template ID (after creating template)

See `docs/canva/ENV_SETUP.md` for detailed instructions.

## Step 4: Update Your Code

The integration is already set up! You just need to:

1. **Enable Canva Mode** (optional)
   - The code will automatically use Canva if `VITE_CANVA_TEMPLATE_ID` is set
   - Or you can add a toggle in the UI to switch between methods

2. **Customize Template Variables** (if needed)
   - Edit `api/canva/generate-image.ts`
   - Update the `autofill` mapping to match your template variables

## Step 5: Test the Integration

1. **Test API Connection**
   ```bash
   # Test the API endpoint
   curl -X POST http://localhost:3000/api/canva/generate-image \
     -H "Content-Type: application/json" \
     -d '{
       "templateId": "your_template_id",
       "data": {
         "name": "Test User",
         "photoUrl": "https://example.com/photo.jpg",
         "certifications": "2x AWS • 3x Azure"
       }
     }'
   ```

2. **Test in UI**
   - Open the achievements page
   - Click on a person card
   - Click "Download"
   - The image should be generated from your Canva template

## Template Variable Mapping

The API maps your data to Canva template variables as follows:

| Your Data | Canva Variable | Description |
|-----------|---------------|-------------|
| `name` | `name` | Person's full name |
| `photoUrl` | `photo` | Person's photo URL |
| `certifications` | `certifications` | Certification text |
| `country` | `country` | Country name |
| `totalCertifications` | `totalCertifications` | Total certification count |

**Note:** Adjust these mappings in `api/canva/generate-image.ts` if your template uses different variable names.

## Troubleshooting

### Issue: "Failed to authenticate with Canva"
- **Solution:** Check that your API credentials are correct
- Verify your Canva Pro account is active
- Ensure API access has been granted

### Issue: "Failed to create design"
- **Solution:** Verify your template ID is correct
- Check that the template is published and accessible
- Ensure template variables match the mapping

### Issue: "Export timeout"
- **Solution:** Large templates may take longer to export
- Increase the `maxAttempts` value in the API route
- Check Canva API status

### Issue: Template variables not updating
- **Solution:** Verify variable names match exactly
- Check that your template uses Autofill variables
- Review Canva's Autofill documentation

## Alternative: Using Canva Design API Directly

If you prefer more control, you can use Canva's Design API directly:

```typescript
// Create a design from template
const design = await fetch('https://api.canva.com/rest/v1/designs', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    template_id: templateId,
    autofill: {
      // Your variables here
    },
  }),
});
```

## Resources

- [Canva Developer Documentation](https://www.canva.dev/)
- [Canva Connect API Reference](https://www.canva.dev/docs/connect/)
- [Canva Autofill Guide](https://www.canva.dev/docs/connect/reference-apps/nourish/)
- [Canva Export API](https://www.canva.dev/docs/connect/api-reference/exports/)

## Support

If you encounter issues:
1. Check Canva API status
2. Review API rate limits
3. Verify your Canva Pro subscription
4. Check the browser console for detailed error messages
