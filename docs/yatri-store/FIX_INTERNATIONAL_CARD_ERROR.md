# Fix "International Cards Not Supported" Error

## Problem

In Razorpay test mode, you might see:
```
Payment could not be completed
International cards are not supported. Please contact our support team for help
```

## Solution

### Option 1: Use Correct Indian Test Cards

Razorpay test mode requires **specific Indian test cards**. Use these:

**✅ Working Indian Test Cards:**

1. **Visa (Recommended)**:
   - Card: `5267 3181 8797 5449`
   - CVV: `123`
   - Expiry: `12/25` (any future date)

2. **Mastercard**:
   - Card: `5104 0600 0000 0008`
   - CVV: `123`
   - Expiry: `12/25`

3. **RuPay**:
   - Card: `6074 8400 0000 0000`
   - CVV: `123`
   - Expiry: `12/25`

### Option 2: Check Razorpay Dashboard Settings

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Navigate to **Settings** → **Payment Methods**
3. Ensure **Cards** are enabled
4. Check if there are any restrictions on card types
5. Make sure your account is set to accept Indian cards

### Option 3: Verify Test Mode

1. In Razorpay Dashboard, go to **Settings** → **API Keys**
2. Make sure you're using **Test Keys** (starts with `rzp_test_`)
3. Your `.env` should have:
   ```env
   RAZORPAY_KEY_ID=rzp_test_S05Hqy9qMsJRVs
   RAZORPAY_KEY_SECRET=AbZUaer9h9iPXWHK3QNUF3TG
   VITE_RAZORPAY_KEY_ID=rzp_test_S05Hqy9qMsJRVs
   ```

### Option 4: Contact Razorpay Support

If the issue persists:

1. Check if your Razorpay account is properly configured for Indian payments
2. Verify your account is in test mode
3. Contact Razorpay support with:
   - Your merchant ID
   - Test order ID
   - Error message screenshot

## Current Configuration

The app is configured to:
- ✅ Only show Cards payment method in test mode
- ✅ Disable UPI, Netbanking, Wallet, Pay Later
- ✅ Use Indian phone format (10 digits)
- ✅ Set INR currency

## Test Card Format

**Important**: Enter the card number **without spaces**:
- ✅ Correct: `5267318187975449`
- ❌ Wrong: `5267 3181 8797 5449` (with spaces)

## Still Not Working?

1. **Clear browser cache** and try again
2. **Use incognito/private mode** to test
3. **Try a different browser**
4. **Check browser console** for any JavaScript errors
5. **Verify backend is running** (`npm run server`)

---

**Note**: This is a Razorpay test mode limitation. In production mode with live keys, all Indian payment methods work normally.


