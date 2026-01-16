# How to Set Up Autofill Variables in Canva

This guide will walk you through setting up Autofill variables in your Canva template so the API can automatically populate person data.

## Step 1: Open Your Template

1. Go to your Canva template: https://www.canva.com/design/DAG-Uwaecgc/...
2. Click **"Edit design"** to open it in the editor

## Step 2: Enable Autofill Feature

1. In Canva, look for the **"Apps"** menu (usually in the left sidebar or top menu)
2. Search for **"Autofill"** or **"Bulk Create"**
3. If you don't see it, you may need to:
   - Go to **Apps** → **Browse all apps**
   - Search for "Autofill" or "Bulk Create"
   - Install the app if needed

## Step 3: Set Up Variables in Your Design

### Method 1: Using Canva's Autofill App

1. **Add Text Elements:**
   - Add a text box where you want the person's name
   - Add a text box for certifications
   - Add a text box for country (if needed)

2. **Add Image Element:**
   - Add an image placeholder where you want the person's photo

3. **Connect to Autofill:**
   - Select each element (text or image)
   - Look for **"Connect to data"** or **"Autofill"** option
   - Create or select a variable name

### Method 2: Using Brand Templates (Enterprise Feature)

If you have Canva Enterprise:

1. Go to **Brand Templates** in Canva
2. Create a new brand template
3. Set up variables using the Brand Templates interface
4. Variables will be available via API

## Step 4: Create Variables

For each element in your design, create these variables:

### Variable 1: Name
- **Variable Name:** `name`
- **Type:** Text
- **Location:** Where person's full name should appear
- **Example Value:** "Yatharth Chauhan"

### Variable 2: Photo
- **Variable Name:** `photo`
- **Type:** Image/URL
- **Location:** Where person's photo should appear
- **Example Value:** "https://example.com/photo.jpg"

### Variable 3: Certifications
- **Variable Name:** `certifications`
- **Type:** Text
- **Location:** Where certification text should appear
- **Example Value:** "2x AWS • 3x Azure"

### Variable 4: Country (Optional)
- **Variable Name:** `country`
- **Type:** Text
- **Location:** Where country name should appear
- **Example Value:** "India"

### Variable 5: Total Certifications (Optional)
- **Variable Name:** `totalCertifications`
- **Type:** Text
- **Location:** Where total count should appear
- **Example Value:** "5"

## Step 5: Test Your Variables

1. **Use Test Data:**
   - In Canva's Autofill interface, add test data
   - Verify all variables populate correctly
   - Check formatting and positioning

2. **Example Test Data:**
   ```json
   {
     "name": "Test User",
     "photo": "https://via.placeholder.com/300",
     "certifications": "2x AWS • 3x Azure",
     "country": "India",
     "totalCertifications": "5"
   }
   ```

## Step 6: Publish Your Template

1. Once variables are set up, **publish** your template
2. Make sure it's accessible via API
3. Note the template ID: `DAG-Uwaecgc`

## Alternative: Manual Variable Mapping

If Canva's Autofill doesn't work as expected, you can:

1. **Use Fixed Text with Placeholders:**
   - Use text like `{{name}}`, `{{certifications}}` in your design
   - The API will replace these placeholders

2. **Update API Code:**
   - Modify `api/canva/generate-image.ts`
   - Change the variable mapping to match your template

## Troubleshooting

### Issue: Can't Find Autofill Feature
**Solution:**
- Autofill may be a Pro/Enterprise feature
- Check if you have the right Canva plan
- Try using Brand Templates instead

### Issue: Variables Not Showing in API
**Solution:**
- Verify variable names match exactly (case-sensitive)
- Check that template is published
- Ensure you're using the correct template ID

### Issue: Image Not Loading
**Solution:**
- Verify photo URL is accessible (not behind authentication)
- Use publicly accessible image URLs
- Check CORS settings if hosting images yourself

## Step-by-Step Visual Guide

### For Text Variables:

1. **Add Text Element:**
   ```
   Click "Text" → Add heading/text
   ```

2. **Connect to Variable:**
   ```
   Select text → Right-click → "Connect to data"
   → Create variable "name"
   ```

3. **Repeat for Each Text Element:**
   - Certifications text → variable "certifications"
   - Country text → variable "country"
   - Total count → variable "totalCertifications"

### For Image Variables:

1. **Add Image Placeholder:**
   ```
   Click "Elements" → Add image frame/placeholder
   ```

2. **Connect to Variable:**
   ```
   Select image → Right-click → "Connect to data"
   → Create variable "photo"
   → Set type to "Image URL"
   ```

## Variable Name Reference

Make sure your Canva variables use these **exact names** (case-sensitive):

| Variable Name | Type | Required | Description |
|--------------|------|----------|-------------|
| `name` | Text | ✅ Yes | Person's full name |
| `photo` | Image URL | ✅ Yes | Person's photo URL |
| `certifications` | Text | ✅ Yes | Certification text |
| `country` | Text | ❌ No | Country name |
| `totalCertifications` | Text | ❌ No | Total certification count |

## Testing Your Setup

After setting up variables:

1. **Test in Canva:**
   - Use Autofill preview with sample data
   - Verify all elements populate correctly

2. **Test via API:**
   ```bash
   curl -X POST http://localhost:3000/api/canva/generate-image \
     -H "Content-Type: application/json" \
     -d '{
       "templateId": "DAG-Uwaecgc",
       "data": {
         "name": "Test User",
         "photoUrl": "https://via.placeholder.com/300",
         "certifications": "2x AWS • 3x Azure",
         "country": "India"
       }
     }'
   ```

3. **Check Results:**
   - Image should download
   - All variables should be populated
   - Formatting should match your template

## Need Help?

If you're having trouble:

1. **Check Canva Documentation:**
   - https://www.canva.com/help/autofill/
   - https://www.canva.dev/docs/connect/reference-apps/nourish/

2. **Verify Template Access:**
   - Make sure template is published
   - Check template ID is correct
   - Verify API credentials have access

3. **Alternative Approach:**
   - If Autofill doesn't work, we can modify the API to use a different method
   - Contact support or check Canva API documentation

## Next Steps

Once variables are set up:
1. ✅ Test in Canva with sample data
2. ✅ Add environment variables to your project
3. ✅ Test the download button
4. ✅ Verify images are generated correctly

See `docs/canva/NEXT_STEPS.md` for the complete setup checklist.
