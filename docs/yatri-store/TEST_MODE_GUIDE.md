# Test Mode Guide - Razorpay

## ✅ IMPORTANT: No Real Money Deducted in Test Mode!

**In test mode, NO real money is ever deducted from your account.** All transactions are simulated.

## 🚫 UPI Doesn't Work in Test Mode

**UPI payments (PhonePe, Google Pay, Paytm, etc.) DO NOT work in Razorpay test mode.**

If you try to scan a UPI QR code or use UPI in test mode, you'll get an "incorrect" error. This is **normal** and **expected**.

## ✅ Use Test Cards Instead

In test mode, you must use **test credit/debit cards**:

### Test Card Details (Indian Cards Only)

**Card Number**: `5267 3181 8797 5449` (Indian Visa card)
- **CVV**: `123`
- **Expiry Date**: `12/25` (any future date)
- **Name**: Any name

### Other Indian Test Cards

- **Success (Visa)**: `5267 3181 8797 5449`
- **Success (Mastercard)**: `5104 0600 0000 0008`
- **Failure**: `4000 0000 0000 0002`
- **3D Secure**: `4012 0010 3714 1112`

**⚠️ Important**: Use Indian test cards only. International cards (like `4111 1111 1111 1111`) will show "International cards are not supported" error.

## 🧪 How to Identify Test Mode

The cart will show a yellow alert banner:
```
🧪 TEST MODE - No Real Money Deducted
UPI doesn't work in test mode. Use test card: 4111 1111 1111 1111
```

## 💰 Test Mode vs Production Mode

### Test Mode (Development)
- **Key starts with**: `rzp_test_`
- **No real money**: All transactions are simulated
- **UPI**: ❌ Not available
- **Cards**: ✅ Test cards work
- **Netbanking**: ❌ Limited
- **Wallet**: ❌ Not available

### Production Mode (Live)
- **Key starts with**: `rzp_live_`
- **Real money**: Actual transactions
- **UPI**: ✅ Works
- **Cards**: ✅ All cards work
- **Netbanking**: ✅ Works
- **Wallet**: ✅ Works

## 🔍 Check Your Mode

Your Razorpay key in `.env` file determines the mode:

```env
# Test Mode
VITE_RAZORPAY_KEY_ID=rzp_test_S05Hqy9qMsJRVs

# Production Mode  
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
```

## 📝 Testing Checklist

- [ ] Cart shows "TEST MODE" alert
- [ ] Payment modal opens
- [ ] Use test card: `4111 1111 1111 1111`
- [ ] Any CVV (e.g., `123`)
- [ ] Any future expiry (e.g., `12/25`)
- [ ] Payment succeeds (no real money deducted)

## ❓ Common Questions

### Q: Why does UPI show "incorrect" error?
**A**: UPI doesn't work in test mode. Use test cards instead.

### Q: Will I be charged real money?
**A**: **NO!** Test mode never charges real money. Only production mode charges real money.

### Q: How do I test UPI?
**A**: You can't test UPI in test mode. Switch to production mode (with live keys) to test UPI, but be careful - production mode charges real money!

### Q: Can I use my real card in test mode?
**A**: No, real cards won't work in test mode. You must use test cards.

## 🎯 Quick Test Steps

1. **Add product to cart** (₹1 for testing)
2. **Click checkout**
3. **See test mode alert** (yellow banner)
4. **Payment modal opens** (only Cards option available)
5. **Enter Indian test card**: `5267 3181 8797 5449`
6. **Enter CVV**: `123`
7. **Enter expiry**: `12/25`
8. **Complete payment**
9. **Success!** (No real money deducted)

## 🚀 Moving to Production

When ready for production:

1. Get production keys from Razorpay Dashboard
2. Update `.env`:
   ```env
   VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=your_live_secret
   ```
3. Restart servers
4. Test mode alert will disappear
5. UPI will work
6. **⚠️ Real money will be charged!**

---

**Remember**: Test mode = No real money. Production mode = Real money!

