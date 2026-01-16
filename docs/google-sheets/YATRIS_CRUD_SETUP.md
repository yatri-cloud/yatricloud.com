# Yatris Users CRUD Setup Complete

## ✅ What's Been Implemented

### 1. CORS Fix - Proxy API Route
- Created `/api/yatris-proxy.ts` to proxy requests to Google Apps Script
- Avoids CORS issues by routing through Vercel serverless function
- Frontend → Vercel (same origin, no CORS)
- Vercel → Google Apps Script (server-to-server, no CORS)

### 2. CRUD Operations Added

#### Apps Script (`appscript/yatris-users.gs`)
- ✅ `updateCertification()` - Update existing certification
- ✅ `deleteCertification()` - Delete certification
- ✅ `getUserCertifications()` - Already existed, now properly integrated

#### Frontend API (`src/lib/yatris-api.ts`)
- ✅ `updateCertification()` - Update certification
- ✅ `deleteCertification()` - Delete certification
- ✅ `getUserCertifications()` - Fetch user's certifications
- ✅ All functions use proxy API route

### 3. CertificationForm Updates (`src/components/certified-yatris/CertificationForm.tsx`)

#### User Integration
- ✅ Accepts `user` prop
- ✅ Pre-fills form fields with user data (name, email, LinkedIn, country, photo)
- ✅ Loads user photo on mount

#### Certification Management UI
- ✅ Displays user's existing certifications in a card list
- ✅ Shows certification details (name, provider, exam code, date)
- ✅ Edit button to modify certifications
- ✅ Delete button with confirmation
- ✅ Loading state while fetching certifications

#### Submission Logic
- ✅ Uses new `yatris-api.ts` for authenticated users
- ✅ Falls back to old `google-sheets.ts` for non-authenticated users
- ✅ Reloads certifications after successful submission

## 🔧 Setup Required

### 1. Environment Variable

Add to Vercel Dashboard → Settings → Environment Variables:

```env
YATRIS_USERS_API_URL=https://script.google.com/macros/s/AKfycbxHqWK2-fa7hRWf40_jZBKOUxLktgeVawx6e7pe68V83-dx9Ol34ShdqPtXTn0fNiOT5g/exec
```

**Important**: This is a **server-side** variable (no `VITE_` prefix) because it's used by the Vercel serverless function, not the browser.

### 2. Redeploy Vercel

After adding the environment variable:
1. Go to Vercel Dashboard
2. Select your project
3. Click **Deployments** → **Redeploy** (or push a new commit)

### 3. Verify Google Apps Script Deployment

Make sure `yatris-users.gs` is deployed as:
- **Execute as**: Me
- **Who has access**: Anyone
- **New version** created (not just saved)

## 🎯 User Flow

1. **Sign Up/Login** → User authenticates
2. **View Certifications** → See all their submitted certifications
3. **Submit New** → Fill form (pre-filled with user data)
4. **Edit** → Click edit on any certification
5. **Delete** → Click delete (with confirmation)

## 📝 Notes

- The form automatically pre-fills with user data after login
- User certifications are loaded on mount
- After submission, certifications list refreshes automatically
- Edit functionality pre-fills form with certification data
- Delete requires confirmation to prevent accidental deletion

## 🐛 Troubleshooting

### CORS Errors Still Occurring?
1. Check `YATRIS_USERS_API_URL` is set in Vercel
2. Verify it's deployed as a **new version** (not just saved)
3. Ensure "Who has access" is set to **Anyone**
4. Redeploy Vercel after adding environment variable

### Certifications Not Loading?
- Check browser console for errors
- Verify user is authenticated (check localStorage for `yatris_token`)
- Check Apps Script execution logs for errors

### Edit/Delete Not Working?
- Verify user owns the certification (email matches)
- Check Apps Script logs for authorization errors
- Ensure certification ID is correct (row index in sheet)
