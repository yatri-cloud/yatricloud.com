# Canva Environment Variables Setup

## Environment Variables

Add these environment variables to your project:

### For Local Development (.env file)

Create a `.env` file in the root of your project:

```env
# Canva Connect API Credentials
CANVA_CLIENT_ID=your_canva_client_id_here
CANVA_CLIENT_SECRET=your_canva_client_secret_here

# Canva Template ID
# Template: https://www.canva.com/design/DAG-Uwaecgc/...
VITE_CANVA_TEMPLATE_ID=DAG-Uwaecgc
```

### For Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `CANVA_CLIENT_ID` | `your_canva_client_id_here` | Production, Preview, Development |
| `CANVA_CLIENT_SECRET` | `your_canva_client_secret_here` | Production, Preview, Development |
| `VITE_CANVA_TEMPLATE_ID` | `your_template_id_here` | Production, Preview, Development |

**Important Notes:**
- `CANVA_CLIENT_ID` and `CANVA_CLIENT_SECRET` are server-side only (not prefixed with `VITE_`)
- `VITE_CANVA_TEMPLATE_ID` is client-side accessible (prefixed with `VITE_`)
- Never commit your `.env` file to git (it should already be in `.gitignore`)

## Getting Your Template ID

1. Create your template in Canva
2. Publish the template
3. Get the template ID from:
   - The template URL (if available)
   - The Canva API when listing templates
   - Or use the Canva Developer Portal

## Testing

After setting up the environment variables:

1. Restart your development server
2. Test the API endpoint:
   ```bash
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

3. Check the browser console for any errors

## Troubleshooting

### "Canva API credentials not configured"
- Make sure you've added `CANVA_CLIENT_ID` and `CANVA_CLIENT_SECRET` to your environment
- Restart your dev server after adding variables
- For Vercel, redeploy after adding environment variables

### "Failed to authenticate with Canva"
- Verify your Client ID and Secret are correct
- Check that your Canva integration is active
- Ensure you have the correct scopes enabled
