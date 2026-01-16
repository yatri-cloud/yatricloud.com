# Canva Integration - Next Steps Checklist

## ✅ What's Already Done

- [x] API route created (`api/canva/generate-image.ts`)
- [x] Client library created (`src/lib/canva-api.ts`)
- [x] Download function updated to support Canva
- [x] Template ID extracted: `DAG-Uwaecgc`
- [x] Documentation created

## 📋 Next Steps Checklist

### Step 1: Add Environment Variables

**For Local Development:**
1. Create or update `.env` file in project root:
   ```env
   CANVA_CLIENT_ID=your_canva_client_id_here
   CANVA_CLIENT_SECRET=your_canva_client_secret_here
   VITE_CANVA_TEMPLATE_ID=DAG-Uwaecgc
   ```
2. Restart your dev server: `npm run dev`

**For Vercel Deployment:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add these three variables:
   - `CANVA_CLIENT_ID` = `your_canva_client_id_here`
   - `CANVA_CLIENT_SECRET` = `your_canva_client_secret_here`
   - `VITE_CANVA_TEMPLATE_ID` = `DAG-Uwaecgc`
5. Select **All Environments** (Production, Preview, Development)
6. Click **Save**
7. **Redeploy** your project

### Step 2: Verify Canva Template Setup

1. **Open your Canva template:**
   - Go to: https://www.canva.com/design/DAG-Uwaecgc/...

2. **Check Autofill Variables:**
   Your template should have these variables set up:
   - `name` - For person's full name
   - `photo` - For person's photo URL
   - `certifications` - For certification text (e.g., "2x AWS • 3x Azure")
   - `country` - For country name (optional)
   - `totalCertifications` - For total count (optional)

3. **If variables don't match:**
   - Update your template variables in Canva
   - OR update the variable mapping in `api/canva/generate-image.ts` (lines 101-108)

### Step 3: Test the Integration

**Local Testing:**
1. Start your dev server: `npm run dev`
2. Navigate to the achievements page
3. Click on any person card
4. Click the "Download" button
5. Check if image is generated from Canva template

**Check for Errors:**
- Open browser console (F12)
- Look for any error messages
- Check network tab for API calls

### Step 4: Verify API Endpoints

The current implementation uses Canva's REST API. If you encounter authentication issues:

1. **Check Canva API Documentation:**
   - Visit: https://www.canva.dev/docs/connect/
   - Verify the OAuth endpoint is correct

2. **Alternative: Use Connect API:**
   If REST API doesn't work, we may need to switch to Connect API with OAuth flow

### Step 5: Customize Template Variables (If Needed)

If your Canva template uses different variable names, update `api/canva/generate-image.ts`:

```typescript
autofill: {
  // Update these to match your Canva template variables
  your_template_variable_name: data.name,
  photo_url: data.photoUrl,
  // etc.
}
```

## 🐛 Troubleshooting

### Issue: "Canva API credentials not configured"
**Solution:**
- Verify `.env` file exists and has correct values
- Restart dev server after adding variables
- For Vercel, redeploy after adding environment variables

### Issue: "Failed to authenticate with Canva"
**Solution:**
- Verify Client ID and Secret are correct
- Check Canva Developer Portal - ensure integration is active
- Verify scopes are enabled: `design:content`, `design:meta`, `asset:read`

### Issue: "Failed to create design"
**Solution:**
- Verify template ID is correct: `DAG-Uwaecgc`
- Check that template is published and accessible
- Verify template variables match the mapping

### Issue: Template variables not updating
**Solution:**
- Check variable names match exactly (case-sensitive)
- Verify template uses Autofill feature
- Review Canva's Autofill documentation

## 📚 Additional Resources

- **Full Setup Guide:** `docs/canva/CANVA_SETUP.md`
- **Environment Setup:** `docs/canva/ENV_SETUP.md`
- **Quick Start:** `docs/canva/QUICK_START.md`
- **Canva API Docs:** https://www.canva.dev/docs/connect/

## 🎯 Success Criteria

You'll know it's working when:
- ✅ Environment variables are set
- ✅ Clicking "Download" generates an image
- ✅ Image matches your Canva template design
- ✅ Person's data (name, photo, certifications) appears correctly

## 💡 Tips

1. **Test with one person first** before testing with all
2. **Check browser console** for detailed error messages
3. **Verify template is published** in Canva
4. **Keep html2canvas as fallback** - it will automatically use it if Canva fails

## 🚀 Ready to Deploy?

Once everything works locally:
1. Add environment variables to Vercel
2. Redeploy your project
3. Test on production
4. Monitor for any errors in Vercel function logs
