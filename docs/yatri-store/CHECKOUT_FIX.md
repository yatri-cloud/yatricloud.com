# Fix "Failed to Fetch" Error - Quick Guide

## ✅ Answer: NO, You DON'T Need to Add Products in Razorpay!

**Razorpay creates orders dynamically** - you don't need to pre-add products. Each checkout creates a new order with the product details.

## 🔧 Quick Fix Steps

### Step 1: Make Sure Backend Server is Running

```bash
# In terminal, run:
npm run server

# You should see:
# 🚀 Udemy API Proxy Server running on http://localhost:3001
# 💳 Razorpay endpoint: http://localhost:3001/api/razorpay/create-order
```

**Important**: Keep this terminal open and running!

### Step 2: Add Razorpay Keys to .env File

Create or update `.env` file in root directory:

```env
# Razorpay Production Keys (get from https://dashboard.razorpay.com/)
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_production_secret_key

# For frontend (optional, can use same as above)
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx

# Backend API URL
VITE_API_BASE_URL=http://localhost:3001
```

### Step 3: Get Your Razorpay Keys

1. Go to https://dashboard.razorpay.com/
2. Login to your account
3. Go to **Settings** → **API Keys**
4. Generate new keys or copy existing ones
5. Copy **Key ID** and **Key Secret**
6. Add them to `.env` file

### Step 4: Restart Both Servers

```bash
# Stop both servers (Ctrl+C)
# Then restart:

# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend  
npm run dev
```

## 🐛 Common Issues & Solutions

### Issue 1: "Failed to fetch" Error

**Cause**: Backend server not running or wrong URL

**Solution**:
1. Check if backend is running: `http://localhost:3001/health`
2. Check browser console for exact error
3. Verify `VITE_API_BASE_URL` in `.env` matches backend URL

### Issue 2: CORS Error

**Cause**: Backend CORS not configured

**Solution**: Already fixed! Server now allows all origins.

### Issue 3: "Razorpay credentials not configured"

**Cause**: Missing environment variables

**Solution**: Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to `.env`

### Issue 4: Network Error

**Cause**: Backend server not accessible

**Solution**:
- Check if server is running
- Check if port 3001 is available
- Try accessing `http://localhost:3001/health` in browser

## 🧪 Test the API Directly

Test if backend is working:

```bash
curl -X POST http://localhost:3001/api/razorpay/create-order \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "currency": "INR"}'
```

Should return:
```json
{
  "orderId": "order_xxxxx",
  "amount": 100,
  "currency": "INR"
}
```

## 📋 Checklist

Before testing checkout:

- [ ] Backend server is running (`npm run server`)
- [ ] `.env` file exists with Razorpay keys
- [ ] `VITE_API_BASE_URL=http://localhost:3001` in `.env`
- [ ] Frontend server is running (`npm run dev`)
- [ ] Browser console shows no errors
- [ ] Network tab shows API request to `/api/razorpay/create-order`

## 🎯 Testing Flow

1. **Start Backend**: `npm run server` (Terminal 1)
2. **Start Frontend**: `npm run dev` (Terminal 2)
3. **Open Browser**: Go to `http://localhost:8080/yatristore`
4. **Add Product**: Click "Add to Cart" on any product (₹1)
5. **Open Cart**: Click cart icon (bottom right)
6. **Checkout**: Click "Checkout" button
7. **Check Console**: Should see "Creating Razorpay order..." log
8. **Payment Modal**: Should open Razorpay payment modal

## 💡 Important Notes

1. **No Products in Razorpay**: You don't need to add products. Orders are created dynamically.

2. **Environment Variables**: 
   - Backend reads: `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
   - Frontend reads: `VITE_RAZORPAY_KEY_ID` and `VITE_API_BASE_URL`

3. **Production**: When deploying, update `VITE_API_BASE_URL` to your production backend URL.

4. **Razorpay Keys**: Use production keys from Razorpay Dashboard for `yatricloud.com`

## 🆘 Still Not Working?

1. **Check Browser Console** (F12) - Look for exact error message
2. **Check Backend Terminal** - Look for error logs
3. **Check Network Tab** - See the actual API request/response
4. **Test API Directly** - Use curl command above

---

**Remember**: Keep backend server running while testing!

