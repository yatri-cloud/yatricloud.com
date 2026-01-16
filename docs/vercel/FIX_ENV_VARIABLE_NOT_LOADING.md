# Fix: Environment Variable Not Loading in Vercel

If you've added `YATRIS_USERS_API_URL` to Vercel but it's still showing as "not configured", follow these steps:

## Step 1: Verify Variable Name (CRITICAL)

The variable name must be **exactly**:
```
YATRIS_USERS_API_URL
```

**Common mistakes:**
- ❌ `VITE_YATRIS_USERS_API_URL` (wrong - this is for client-side)
- ❌ `YATRIS_API_URL` (wrong - missing `_USERS_`)
- ❌ `YATRIS_USERS_API` (wrong - missing `_URL`)
- ✅ `YATRIS_USERS_API_URL` (correct)

## Step 2: Check Environment Scope

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Find `YATRIS_USERS_API_URL`
3. **CRITICAL**: Make sure it's enabled for **Production** environment
4. Also enable for **Preview** and **Development** if needed

## Step 3: Verify the Value

The value should be:
```
https://script.google.com/macros/s/AKfycbxHqWK2-fa7hRWf40_jZBKOUxLktgeVawx6e7pe68V83-dx9Ol34ShdqPtXTn0fNiOT5g/exec
```

**Make sure:**
- No extra spaces before or after
- No quotes around the URL
- The URL is complete and correct

## Step 4: Redeploy (REQUIRED)

**After adding or updating environment variables, you MUST redeploy:**

1. Go to **Deployments** tab
2. Click the **three dots** (⋯) on the latest deployment
3. Click **Redeploy**
4. Or create a new deployment by pushing to your main branch

**Important**: Environment variables are only loaded when the function is deployed. Simply adding them doesn't apply to existing deployments.

## Step 5: Test the Diagnostic Endpoint

After redeploying, test this URL:
```
https://certification.yatricloud.com/api/yatris-proxy-check
```

You should see:
```json
{
  "configured": true,
  "variableName": "YATRIS_USERS_API_URL",
  "value": "https://script.google.com/macros/s/AKfycbxHqWK2..."
}
```

If `configured` is `false`, the variable is still not set correctly.

## Step 6: Check Vercel Function Logs

1. Go to **Deployments** → Latest deployment → **Functions** → `api/yatris-proxy`
2. Check the **Logs** tab
3. Look for: `❌ YATRIS_USERS_API_URL not configured`
4. Also check: `Available env vars:` to see what variables are actually loaded

## Common Issues and Solutions

### Issue 1: Variable Added but Not Redeployed
**Symptom**: Variable shows in Vercel dashboard but function still says it's not configured
**Solution**: Redeploy the project (Step 4)

### Issue 2: Wrong Environment Selected
**Symptom**: Variable is set but only for Development/Preview, not Production
**Solution**: Enable the variable for **Production** environment

### Issue 3: Typo in Variable Name
**Symptom**: Variable exists but with slightly different name
**Solution**: Delete the old one and create new with exact name: `YATRIS_USERS_API_URL`

### Issue 4: Variable Value Has Issues
**Symptom**: Variable is set but URL is incorrect
**Solution**: 
- Remove any quotes
- Remove trailing spaces
- Verify the Google Apps Script URL is correct

## Quick Fix Checklist

- [ ] Variable name is exactly: `YATRIS_USERS_API_URL` (no typos)
- [ ] Variable is enabled for **Production** environment
- [ ] Variable value is the complete Google Apps Script URL (no quotes, no spaces)
- [ ] Project has been **redeployed** after adding the variable
- [ ] Diagnostic endpoint (`/api/yatris-proxy-check`) shows `configured: true`

## Still Not Working?

1. **Delete and Recreate the Variable**:
   - Delete `YATRIS_USERS_API_URL` from Vercel
   - Create it again with the exact name and value
   - Redeploy

2. **Check for Multiple Projects**:
   - Make sure you're editing the correct Vercel project
   - Verify the project URL matches `certification.yatricloud.com`

3. **Contact Support**:
   - Check Vercel function logs for detailed error messages
   - The logs will show which environment variables are actually available
