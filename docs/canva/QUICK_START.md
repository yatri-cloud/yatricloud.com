# Canva Integration - Quick Start

## ✅ What's Already Done

1. ✅ API route created: `api/canva/generate-image.ts`
2. ✅ Client library created: `src/lib/canva-api.ts`
3. ✅ Download function updated to support Canva
4. ✅ Environment variable names configured

## 🚀 Next Steps

### 1. Add Environment Variables

**For Local Development:**
Create a `.env` file in the project root:

```env
CANVA_CLIENT_ID=your_canva_client_id_here
CANVA_CLIENT_SECRET=your_canva_client_secret_here
VITE_CANVA_TEMPLATE_ID=your_template_id_here
```

**For Vercel:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add these three variables:
   - `CANVA_CLIENT_ID` = `your_canva_client_id_here`
   - `CANVA_CLIENT_SECRET` = `your_canva_client_secret_here`
   - `VITE_CANVA_TEMPLATE_ID` = `your_template_id_here`

### 2. Create Your Canva Template

1. **Design Your Template**
   - Open Canva
   - Create a 1000x1000px design
   - Design your certification card

2. **Set Up Autofill Variables**
   - Use Canva's Autofill feature
   - Create variables for:
     - `name` - Person's full name
     - `photo` - Person's photo URL
     - `certifications` - Certification text (e.g., "2x AWS • 3x Azure")
     - `country` - Country name (optional)
     - `totalCertifications` - Total count (optional)

3. **Get Template ID**
   - Publish your template
   - Get the template ID (usually from the template URL or API)
   - Add it to `VITE_CANVA_TEMPLATE_ID` in your environment variables

### 3. Test the Integration

1. **Restart your dev server** (if running locally)
2. **Open the achievements page**
3. **Click on a person card**
4. **Click "Download"**
5. The image should be generated from your Canva template!

## 📚 Documentation

- **Full Setup Guide**: `docs/canva/CANVA_SETUP.md`
- **Environment Variables**: `docs/canva/ENV_SETUP.md`
- **Vercel Setup**: `docs/vercel/ENV_VARIABLES_REFERENCE.md`

## 🔧 How It Works

1. User clicks "Download" on a person card
2. System checks if `VITE_CANVA_TEMPLATE_ID` is set
3. If set, uses Canva API to generate image from template
4. If not set, falls back to html2canvas method
5. Downloads the generated image

## ⚠️ Important Notes

- **Template Variables**: Make sure your Canva template variable names match:
  - `name`
  - `photo`
  - `certifications`
  - `country` (optional)
  - `totalCertifications` (optional)

- **API Endpoints**: The integration uses Canva's REST API endpoints
- **OAuth Flow**: Uses client credentials flow for server-to-server operations
- **Fallback**: If Canva fails, it automatically falls back to html2canvas

## 🐛 Troubleshooting

### "Canva API credentials not configured"
- Make sure you've added `CANVA_CLIENT_ID` and `CANVA_CLIENT_SECRET`
- Restart your dev server
- For Vercel, redeploy after adding variables

### "Failed to authenticate with Canva"
- Verify your Client ID and Secret are correct
- Check that your Canva integration is active
- Ensure you have the correct scopes enabled in Canva Developer Portal

### Template not found
- Verify your template ID is correct
- Make sure the template is published
- Check that the template is accessible with your API credentials

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Check Vercel function logs (if deployed)
3. Review `docs/canva/CANVA_SETUP.md` for detailed troubleshooting
