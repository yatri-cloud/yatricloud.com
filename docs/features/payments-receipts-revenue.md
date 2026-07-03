# Payments, Receipts & Revenue

The money surfaces: what buyers see (receipts) and what admins see (revenue, invoices, transactions, refunds) — all on Razorpay + Supabase.

## Buyer side
- **My Receipts** (`/my-purchases`, `src/pages/MyPurchases.tsx`): every purchase (store, paid events, trainings) as clickable rows → `/receipt/:number` (`src/pages/ReceiptView.tsx`) to view/download. Search, amount/date sort, pagination.
- Checkout flows: `src/lib/razorpay.ts` — `createRazorpayOrder` → `openRazorpayCheckout` → **server-side verification** at `api/razorpay/verify.ts` (HMAC-SHA256 of `order|payment` against the key secret; records the verified payment into `payments` via service role; marks orders completed). Client `onSuccess` only fires after verify passes. Coupons hook in here — see `coupons.md`.

## Admin side (Payments nav group)
- **Revenue** (`/admin/payments`, `AdminPayments.tsx`): internal receipts **merged with paid Razorpay invoices** (`getRazorpayPaidReceipts` maps invoice → receipt shape using `paid_at` and `amount_paid`) so invoice revenue shows in the same list and date ranges (last 7 days etc.). Search + date-range filter + **CSV export**.
- **Invoices** (`/admin/razorpay-invoices`): create/send/cancel Razorpay invoices; list from the Razorpay API.
- **Transactions** (`/admin/transactions`): all payments with **refund** action (outlined button); minimal dot+text status pills (deliberate design decision — colored chips were rejected twice as "AI-looking").
- **Coupons** (`/admin/coupons`): see `coupons.md`.

## The serverless gateway (Vercel Hobby constraint)
Vercel Hobby caps the project at **12 serverless functions** — a hard ceiling. Admin Razorpay operations therefore share **one gateway**: `api/razorpay/admin.ts` with an `action` field (`invoices.list|create|cancel`, `payments.list|refund`). Admin auth = Supabase access token verified server-side + role check; Razorpay auth = Basic. **Never add a new `api/` file when an action on an existing gateway will do.**

## Money-handling rules
- Currency conversion is decimal-aware (`toSmallestUnit`): INR paise ×100, JPY whole yen ×1, KWD ×1000.
- Discounts (coupons) apply to the INR base **before** conversion; order `items[].price_inr` stores the discounted value so receipts match the charge.
- Local dev note: Vercel functions don't run under `npm run dev` (Vite only) — `/api/*` 500s locally but works in production; the admin gateway degrades gracefully.

## Secrets
`RAZORPAY_KEY_SECRET` lives only in Vercel env (server-side); the client sees only `VITE_RAZORPAY_KEY_ID`. Test keys (`rzp_test_…`) belong in local `.env` only; production uses live keys.

## How to test
Use a test-mode checkout end to end (test keys locally against a deployed preview): pay → verify endpoint 200 → row in `payments` → receipt in My Receipts → shows in admin Revenue within the date filter. Refund from Transactions → status pill updates.
