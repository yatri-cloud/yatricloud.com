# Razorpay Setup Guide

## Important: You DON'T Need to Add Products in Razorpay

**Razorpay doesn't require you to pre-add products.** Orders are created dynamically when customers checkout. Each order is created on-the-fly with the product details you send.

## Setup Steps

### 1. Get Your Razorpay API Keys

Since Razorpay has granted API keys for `https://yatricloud.com`, follow these steps:

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Navigate to **Settings** → **API Keys**
3. Generate API keys following: https://razorpay.com/docs/api/#generate-api-key
4. You'll get:
   - **Key ID** (starts with `rzp_live_` for production or `rzp_test_` for test)
   - **Key Secret** (keep this secret!)

### 2. Add Keys to Environment Variables

Add these to your `.env` file:

```env
# Razorpay Production Keys (from Razorpay Dashboard)
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_production_secret_key

# Or use VITE_ prefix for frontend access (optional)
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx

# Backend API URL
VITE_API_BASE_URL=http://localhost:3001
# For production, use your backend URL:
# VITE_API_BASE_URL=https://api.yatricloud.com
```

### 3. Backend Server Configuration

The backend server (`server.js`) will automatically use these environment variables:

- `RAZORPAY_KEY_ID` or `VITE_RAZORPAY_KEY_ID` - Your Razorpay Key ID
- `RAZORPAY_KEY_SECRET` or `VITE_RAZORPAY_KEY_SECRET` - Your Razorpay Key Secret

### 4. Frontend Configuration

The frontend (`src/lib/razorpay.ts`) reads from:
- `VITE_RAZORPAY_KEY_ID` - Razorpay Key ID (for payment modal)
- `VITE_API_BASE_URL` - Backend API URL

## How It Works

1. **Customer adds products to cart** → Products are stored locally
2. **Customer clicks checkout** → Frontend calls backend API
3. **Backend creates Razorpay order** → Order is created dynamically with product details
4. **Payment modal opens** → Customer completes payment
5. **Payment success** → Order is complete

## Troubleshooting "Failed to Fetch" Error

### Check 1: Is Backend Server Running?

```bash
# Start the backend server
npm run server

# Should see:
# 🚀 Udemy API Proxy Server running on http://localhost:3001
# 💳 Razorpay endpoint: http://localhost:3001/api/razorpay/create-order
```

### Check 2: CORS Configuration

The server is configured to allow all origins. If you still get CORS errors:

1. Check browser console for specific CORS error
2. Verify `VITE_API_BASE_URL` matches your backend URL
3. Make sure backend server is running before starting frontend

### Check 3: Environment Variables

Verify your `.env` file has:
```env
RAZORPAY_KEY_ID=your_key_here
RAZORPAY_KEY_SECRET=your_secret_here
VITE_API_BASE_URL=http://localhost:3001
```

### Check 4: Network Tab

1. Open browser DevTools → Network tab
2. Click checkout
3. Look for the request to `/api/razorpay/create-order`
4. Check:
   - Request URL is correct
   - Request method is POST
   - Response status code
   - Response body for error messages

### Check 5: Backend Logs

Check your backend server console for errors:
```
❌ Razorpay order creation error: ...
```

Common errors:
- **401 Unauthorized**: Wrong API keys
- **400 Bad Request**: Missing amount or invalid data
- **Network Error**: Backend server not running or wrong URL

## Testing

### Test Mode (Development)

Use test keys:
```env
RAZORPAY_KEY_ID=rzp_test_S05Hqy9qMsJRVs
RAZORPAY_KEY_SECRET=AbZUaer9h9iPXWHK3QNUF3TG
```

Test card: `4111 1111 1111 1111`

### Production Mode

Use live keys from Razorpay Dashboard:
```env
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_live_secret
```

## Quick Fix Checklist

- [ ] Backend server is running (`npm run server`)
- [ ] `.env` file has Razorpay keys
- [ ] `VITE_API_BASE_URL` is correct
- [ ] Browser console shows the actual error
- [ ] Network tab shows the API request
- [ ] Backend logs show any errors

## Still Having Issues?

1. **Check browser console** - Look for the exact error message
2. **Check backend logs** - See what the server is receiving
3. **Test API directly** - Use Postman/curl to test the endpoint:
   ```bash
   curl -X POST http://localhost:3001/api/razorpay/create-order \
     -H "Content-Type: application/json" \
     -d '{"amount": 100, "currency": "INR"}'
   ```

## Production Deployment

For production (`https://yatricloud.com`):

1. **Backend**: Deploy `server.js` to your server (Render, Railway, etc.)
2. **Environment Variables**: Set production Razorpay keys
3. **Frontend**: Update `VITE_API_BASE_URL` to your production backend URL
4. **Domain**: Make sure Razorpay keys are for `yatricloud.com` domain

---

**Remember**: You don't need to add products in Razorpay. Orders are created dynamically!

