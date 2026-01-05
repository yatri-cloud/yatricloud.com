# Complete Razorpay Payment Flow Setup

## Overview

This guide sets up a **complete Razorpay payment integration** with:
- ✅ Backend order creation API
- ✅ Frontend payment modal
- ✅ Test mode support
- ✅ Proper error handling
- ✅ Payment success/failure callbacks

## Prerequisites

1. **Razorpay Account**: You have API keys from Razorpay Dashboard
2. **Backend Server**: `server.js` is running on port 3001
3. **Test Keys**: Use test keys for development

## Step 1: Get Razorpay API Keys

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Navigate to **Settings** → **API Keys**
3. Generate or copy your keys:
   - **Key ID**: `rzp_test_xxxxxxxxxxxxx` (test) or `rzp_live_xxxxxxxxxxxxx` (production)
   - **Key Secret**: Your secret key

## Step 2: Configure Environment Variables

Add to your `.env` file:

```env
# Razorpay Test Keys (for development)
RAZORPAY_KEY_ID=rzp_test_S05Hqy9qMsJRVs
RAZORPAY_KEY_SECRET=AbZUaer9h9iPXWHK3QNUF3TG

# Frontend Razorpay Key (for payment modal)
VITE_RAZORPAY_KEY_ID=rzp_test_S05Hqy9qMsJRVs

# Backend API URL
VITE_API_BASE_URL=http://localhost:3001
```

**For Production:**
```env
# Replace with your production keys
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_production_secret
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
VITE_API_BASE_URL=https://your-backend-url.com
```

## Step 3: Start Backend Server

```bash
npm run server
```

You should see:
```
🚀 Udemy API Proxy Server running on http://localhost:3001
💳 Razorpay endpoint: http://localhost:3001/api/razorpay/create-order
```

## Step 4: Payment Flow

### How It Works

1. **User adds products to cart** → Products stored in React context
2. **User clicks "Checkout"** → Frontend calls backend API
3. **Backend creates Razorpay order** → Returns order ID
4. **Payment modal opens** → Razorpay checkout modal
5. **User completes payment** → Success/failure callback
6. **Cart cleared** → On successful payment

### Test Mode

When using test keys (`rzp_test_*`):
- ✅ Shows test mode alert in cart
- ✅ Only cards payment method enabled
- ✅ No real money deducted
- ✅ Use test card: `5267 3181 8797 5449`

### Production Mode

When using live keys (`rzp_live_*`):
- ✅ All payment methods available
- ✅ Real money transactions
- ✅ UPI, cards, netbanking all work

## Step 5: Testing

### Test the Complete Flow

1. **Start Backend**: `npm run server` (Terminal 1)
2. **Start Frontend**: `npm run dev` (Terminal 2)
3. **Go to Store**: `http://localhost:8080/yatristore`
4. **Add Product**: Click "Add to Cart" on any product
5. **Open Cart**: Click cart icon (bottom right)
6. **Checkout**: Click "Checkout" button
7. **Payment Modal**: Should open Razorpay payment modal
8. **Test Card**: Use `5267 3181 8797 5449` with CVV `123` and expiry `12/25`
9. **Success**: Should show success toast and clear cart

### Test Cards

**Success (Indian Visa)**: `5267 3181 8797 5449`
- CVV: `123`
- Expiry: `12/25` (any future date)

**Failure**: `4000 0000 0000 0002`
- CVV: Any
- Expiry: Any future date

## API Endpoints

### POST /api/razorpay/create-order

**Request:**
```json
{
  "amount": 10000,
  "currency": "INR",
  "receipt": "receipt_1234567890",
  "notes": {
    "products": "Product 1, Product 2",
    "items": "[{\"id\":\"product-1\",\"title\":\"Product 1\",\"quantity\":1}]"
  }
}
```

**Response:**
```json
{
  "orderId": "order_xxxxxxxxxxxxx",
  "amount": 10000,
  "currency": "INR",
  "receipt": "receipt_1234567890"
}
```

## Troubleshooting

### "Failed to fetch" Error

**Cause**: Backend server not running

**Solution**:
```bash
npm run server
```

### "Razorpay credentials not configured"

**Cause**: Missing environment variables

**Solution**: Add to `.env`:
```env
RAZORPAY_KEY_ID=rzp_test_S05Hqy9qMsJRVs
RAZORPAY_KEY_SECRET=AbZUaer9h9iPXWHK3QNUF3TG
```

### Payment Modal Not Opening

**Cause**: Razorpay script not loading

**Solution**:
- Check browser console for errors
- Verify `VITE_RAZORPAY_KEY_ID` is set
- Check internet connection

### "International cards are not supported"

**Cause**: Using wrong test card

**Solution**: Use Indian test card `5267 3181 8797 5449`

### Order Creation Fails

**Cause**: Wrong API keys or backend error

**Solution**:
- Check backend logs
- Verify Razorpay keys are correct
- Test API endpoint directly:
  ```bash
  curl -X POST http://localhost:3001/api/razorpay/create-order \
    -H "Content-Type: application/json" \
    -d '{"amount": 100, "currency": "INR"}'
  ```

## Payment Verification (Production)

In production, you should verify payments on the backend before marking orders as successful.

### Backend Verification Endpoint (Future)

```javascript
app.post('/api/razorpay/verify-payment', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  
  // Verify signature using Razorpay crypto
  const crypto = require('crypto');
  const text = razorpay_order_id + '|' + razorpay_payment_id;
  const signature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(text)
    .digest('hex');
  
  if (signature === razorpay_signature) {
    // Payment verified - update order status
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Invalid signature' });
  }
});
```

## Security Notes

1. **Never expose Key Secret** in frontend code
2. **Always create orders** on backend (server-side)
3. **Verify payments** on backend before fulfilling orders
4. **Use HTTPS** in production
5. **Validate amounts** on backend before creating orders

## Complete Flow Diagram

```
User → Add to Cart → Checkout Click
  ↓
Frontend → POST /api/razorpay/create-order
  ↓
Backend → Razorpay API (Create Order)
  ↓
Backend → Return Order ID
  ↓
Frontend → Load Razorpay Script
  ↓
Frontend → Open Payment Modal
  ↓
User → Complete Payment
  ↓
Razorpay → Payment Success/Failure
  ↓
Frontend → Callback Handler
  ↓
Success → Clear Cart + Show Success
Failure → Show Error Message
```

---

**Your complete Razorpay payment flow is now set up!** 🎉


