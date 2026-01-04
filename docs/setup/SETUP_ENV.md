# Environment Variables Setup

## Quick Setup

1. **Create a `.env` file** in the root of your project (same folder as `package.json`)

2. **Add your Google Sheets Webhook URL:**

```env
VITE_GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbyJvIQi0ynKIIgA401IbDFjB4D_aTSGRYGjiaicQaoguIXpfcoYUgM6FvRP9IlzV5iN/exec
```

3. **Restart your development server** after creating/updating `.env`:
   ```bash
   # Stop the server (Ctrl+C) and restart:
   npm run dev
   ```

## Your Current Web App URL

✅ **Your Google Apps Script Web App URL:**
```
https://script.google.com/macros/s/AKfycbyJvIQi0ynKIIgA401IbDFjB4D_aTSGRYGjiaicQaoguIXpfcoYUgM6FvRP9IlzV5iN/exec
```

This URL is already working and returning data! ✅

## Testing

After setting up the `.env` file:

1. Navigate to `/certifiedyatris`
2. Fill out the form
3. Submit
4. Check your Google Sheet to verify data was added

## Troubleshooting

**If you still see CORS errors:**
- The code will automatically fall back to `no-cors` mode
- Data will still be saved to your sheet
- For better error handling, update your Google Apps Script with CORS headers (see `CORS_FIX_INSTRUCTIONS.md`)

**If form submission fails:**
- Check browser console for errors
- Verify the URL in `.env` matches your deployed web app URL
- Check Google Apps Script execution logs

## Production

For production (Vercel, Netlify, etc.):
- Add the environment variable in your hosting platform's settings
- The variable name is: `VITE_GOOGLE_SHEETS_WEBHOOK_URL`

