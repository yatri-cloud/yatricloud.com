# Vercel Environment Variables Setup Guide

This guide explains how to add environment variables to your Vercel project for the Yatri Store.

## 📋 Quick Steps

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (`yatri-practice-hub` or similar)
3. Go to **Settings** → **Environment Variables**
4. Add each variable from the list below
5. Select the appropriate **Environment** (Production, Preview, Development)
6. Click **Save**
7. **Redeploy** your project for changes to take effect

---

## 🔧 Environment Variables to Add

### Option 1: Copy from `.env.vercel.test` (TEST MODE - Recommended for Testing)

Use these for testing with **no real money**:

```env
VITE_RAZORPAY_KEY_ID=rzp_test_S05Hqy9qMsJRVs
VITE_API_BASE_URL=https://api.certification.yatricloud.com
VITE_STORE_PRODUCTS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbzQLPzAi5aD6uyjJnAUPYOkEKisUNvMwzmTIKqUObRlgsS-9gsexkuEMurKOgZgKb8-8w/exec
VITE_AZURE_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbyJvIQi0ynKIIgA401IbDFjB4D_aTSGRYGjiaicQaoguIXpfcoYUgM6FvRP9IlzV5iN/exec
VITE_AWS_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbz8I8avfRCcTdYoPcRK95WZlvA3tCVKCJ3IVYA0Z5tkY2U86R4xoR3q7Up1dxW7KJBE/exec
VITE_GCP_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbw_EDOrXoWB0E-WB0B4tfQKZbqDESFrrdtCj7R_sUTHfLVjWnPKQEwxcQ086jPiKCL7/exec
VITE_GITHUB_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycby2NKqOwsFNhR1_6TYSjro6BE5rOEZW3Y17as5WWsaThP4WuqbYeoMaDFHgpYqHmIMr/exec
VITE_ORACLE_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbyrsPGGxL5MKBfJKCyaWn590qYIR5i8AX0P-uZTwEzn6ua2DAztCauRP7vKwhSvwRcF/exec
VITE_SALESFORCE_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbwOFa9Zx25YMK-nGyunllmwyULSGIRE2cZcAAwYOP5irep4IOdjt1O1qXY3m2UMF7M/exec
VITE_SERVICENOW_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbxqQMML8LvjE8bKIknZThbKX3ikehDidqDdzXfSOmbR8ghWZSuurTcROcb5qvgCZ0J-/exec
VITE_UDEMY_YATHARTH_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbzG7mJbtL9kCJxRhKPEawImuKVphW4Dj4H0gI_rxzDCo73exucrgRqqCa9rz9_Pa1Nv/exec
VITE_UDEMY_NENSI_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbxo_PNFMqIZttrLkCzPM6oxaXDA_LJ702_FwCj3hbwv2yHvHzuGV4tZgZktLj9PgIHA/exec
VITE_UDEMY_CREDENTIALS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbwsL5nNkmskfCqKQAwdykxWX0bDj7kaeTE0DIVM9ZioVwKtNVLkhUkAP7AiXjxGDInM/exec
VITE_UDEMY_INSTRUCTOR_TOKEN=YrCJK4kzRFSoPjB3tRQLBpEL7LLQOzC7
```

### Option 2: Copy from `.env.vercel.production` (LIVE MODE - Real Money!)

Use these for **production** with **real payments**:

```env
VITE_RAZORPAY_KEY_ID=rzp_live_S07MgTfbQRNHFr
VITE_API_BASE_URL=https://api.certification.yatricloud.com
VITE_STORE_PRODUCTS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbzQLPzAi5aD6uyjJnAUPYOkEKisUNvMwzmTIKqUObRlgsS-9gsexkuEMurKOgZgKb8-8w/exec
VITE_AZURE_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbyJvIQi0ynKIIgA401IbDFjB4D_aTSGRYGjiaicQaoguIXpfcoYUgM6FvRP9IlzV5iN/exec
VITE_AWS_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbz8I8avfRCcTdYoPcRK95WZlvA3tCVKCJ3IVYA0Z5tkY2U86R4xoR3q7Up1dxW7KJBE/exec
VITE_GCP_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbw_EDOrXoWB0E-WB0B4tfQKZbqDESFrrdtCj7R_sUTHfLVjWnPKQEwxcQ086jPiKCL7/exec
VITE_GITHUB_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycby2NKqOwsFNhR1_6TYSjro6BE5rOEZW3Y17as5WWsaThP4WuqbYeoMaDFHgpYqHmIMr/exec
VITE_ORACLE_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbyrsPGGxL5MKBfJKCyaWn590qYIR5i8AX0P-uZTwEzn6ua2DAztCauRP7vKwhSvwRcF/exec
VITE_SALESFORCE_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbwOFa9Zx25YMK-nGyunllmwyULSGIRE2cZcAAwYOP5irep4IOdjt1O1qXY3m2UMF7M/exec
VITE_SERVICENOW_CERTIFICATIONS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbxqQMML8LvjE8bKIknZThbKX3ikehDidqDdzXfSOmbR8ghWZSuurTcROcb5qvgCZ0J-/exec
VITE_UDEMY_YATHARTH_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbzG7mJbtL9kCJxRhKPEawImuKVphW4Dj4H0gI_rxzDCo73exucrgRqqCa9rz9_Pa1Nv/exec
VITE_UDEMY_NENSI_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbxo_PNFMqIZttrLkCzPM6oxaXDA_LJ702_FwCj3hbwv2yHvHzuGV4tZgZktLj9PgIHA/exec
VITE_UDEMY_CREDENTIALS_WEBHOOK_URL=https://script.google.com/macros/s/AKfycbwsL5nNkmskfCqKQAwdykxWX0bDj7kaeTE0DIVM9ZioVwKtNVLkhUkAP7AiXjxGDInM/exec
VITE_UDEMY_INSTRUCTOR_TOKEN=YrCJK4kzRFSoPjB3tRQLBpEL7LLQOzC7
```

---

## 📸 Step-by-Step Visual Guide

### 1. Navigate to Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Click **Settings** (top navigation)
4. Click **Environment Variables** (left sidebar)

### 2. Add Each Variable

For each variable:

1. Click **Add New**
2. Enter the **Key** (e.g., `VITE_RAZORPAY_KEY_ID`)
3. Enter the **Value** (e.g., `rzp_test_S05Hqy9qMsJRVs`)
4. Select **Environments**:
   - ✅ **Production** (for live site)
   - ✅ **Preview** (for pull request previews)
   - ✅ **Development** (for local development)
5. Click **Save**

### 3. Repeat for All Variables

Add all 14 variables from the list above.

### 4. Redeploy

After adding all variables:

1. Go to **Deployments** tab
2. Click **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger auto-deploy

---

## 🔐 Important Notes

### Backend Environment Variables (Separate Server)

Your **backend server** (`server.js`) needs these variables on **its own hosting** (Render, Railway, etc.):

```env
RAZORPAY_KEY_ID=rzp_live_S07MgTfbQRNHFr  # or test key for testing
RAZORPAY_KEY_SECRET=s3FE9fKVBsTE794cGfYtfzmi  # or test secret for testing
PORT=3001
```

**⚠️ Never add `RAZORPAY_KEY_SECRET` to Vercel!** It's backend-only.

### Test vs Live Mode

- **TEST MODE** (`rzp_test_...`): No real money deducted, use for testing
- **LIVE MODE** (`rzp_live_...`): Real money deducted, use for production

### Environment Selection

- **Production**: Used on `https://certification.yatricloud.com`
- **Preview**: Used on preview deployments (PR previews)
- **Development**: Used when running `vercel dev` locally

---

## ✅ Verification

After deployment, verify:

1. Visit `https://certification.yatricloud.com/yatristore`
2. Open browser console (F12)
3. Check for any errors related to missing env variables
4. Products should load from Google Sheets
5. Checkout should work with Razorpay

---

## 🆘 Troubleshooting

### Variables Not Working?

1. **Redeploy** after adding variables (they don't apply to existing deployments)
2. Check variable names start with `VITE_` (required for Vite)
3. Check for typos in variable names
4. Verify backend API URL is correct (`https://api.certification.yatricloud.com`)

### Still Having Issues?

Check the deployment logs in Vercel:
1. Go to **Deployments** tab
2. Click on a deployment
3. Check **Build Logs** and **Runtime Logs**

