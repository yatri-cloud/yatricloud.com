# Troubleshooting 500 Error on `/api/yatris-proxy`

If you're getting a 500 Internal Server Error when trying to register or login, follow these steps:

## Step 1: Check Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `certification.yatricloud.com`
3. Go to **Settings** → **Environment Variables**
4. Verify that `YATRIS_USERS_API_URL` is set:
   ```
   YATRIS_USERS_API_URL=https://script.google.com/macros/s/AKfycbxHqWK2-fa7hRWf40_jZBKOUxLktgeVawx6e7pe68V83-dx9Ol34ShdqPtXTn0fNiOT5g/exec
   ```
5. Make sure it's enabled for **Production**, **Preview**, and **Development** environments
6. **Redeploy** your project after adding/updating the variable

## Step 2: Check Vercel Function Logs

1. Go to Vercel Dashboard → Your Project → **Deployments**
2. Click on the latest deployment
3. Go to **Functions** tab
4. Click on `api/yatris-proxy`
5. Check the **Logs** tab for error messages

Look for:
- `YATRIS_USERS_API_URL not configured` → Environment variable missing
- `Failed to connect to Google Apps Script` → Network/URL issue
- `Google Apps Script error` → Script deployment issue

## Step 3: Verify Google Apps Script Deployment

1. Open your Google Apps Script project
2. Go to **Deploy** → **Manage deployments**
3. Verify the web app is deployed and active
4. Check the deployment URL matches `YATRIS_USERS_API_URL`
5. Make sure **Execute as** is set to "Me"
6. Make sure **Who has access** is set to "Anyone"

## Step 4: Test Google Apps Script Directly

Test the script URL directly in your browser:
```
https://script.google.com/macros/s/AKfycbxHqWK2-fa7hRWf40_jZBKOUxLktgeVawx6e7pe68V83-dx9Ol34ShdqPtXTn0fNiOT5g/exec
```

You should see a JSON response (even if it's an error). If you see HTML, the script has an error.

## Step 5: Check Google Apps Script Execution Logs

1. Open your Google Apps Script project
2. Go to **Executions** (clock icon)
3. Check recent executions for errors
4. Click on failed executions to see error details

## Step 6: Common Issues

### Issue: "YATRIS_USERS_API_URL not configured"
**Solution**: Add the environment variable in Vercel and redeploy

### Issue: "Failed to connect to Google Apps Script"
**Solution**: 
- Verify the script URL is correct
- Check if the script is deployed
- Verify the script has "Anyone" access

### Issue: "Google Apps Script returned HTML error page"
**Solution**:
- Check the script execution logs
- Verify the script code is correct
- Make sure all required functions exist (doPost, registerUser, etc.)

### Issue: "Invalid response format"
**Solution**:
- The script might be returning an error in HTML format
- Check the script execution logs
- Verify the script is returning JSON

## Step 7: Quick Fix Checklist

- [ ] `YATRIS_USERS_API_URL` is set in Vercel environment variables
- [ ] Environment variable is enabled for Production environment
- [ ] Project has been redeployed after adding the variable
- [ ] Google Apps Script is deployed as a web app
- [ ] Web app has "Anyone" access
- [ ] Script execution logs show no errors
- [ ] Script URL is accessible in browser

## Still Having Issues?

1. Check the browser console for detailed error messages
2. Check Vercel function logs for server-side errors
3. Check Google Apps Script execution logs
4. Verify the script code matches the latest version in the repository
