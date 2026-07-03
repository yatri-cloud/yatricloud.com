# Coupon Codes

Percent-off discount codes for paid **training enrollments** and **event registrations**, managed from the admin, validated securely at checkout.

## User flow
1. On a paid checkout (EnrollmentModal for trainings, RegistrationModal for events) a **"Coupon code (optional)"** field appears with an **Apply** button.
2. A valid code shows "CODE applied — you save N%" and the pay line updates to the discounted amount with the original struck through (also mirrored in the dialog header total).
3. **Remove** clears it. Invalid/expired/exhausted/wrong-scope codes get a friendly error.
4. The discount applies to the **INR base price before currency conversion**, so every currency pays the same discounted value.
5. Usage is counted **only after the payment succeeds** (Razorpay `onSuccess`), never on apply.

## Admin flow — `/admin/coupons` (Payments nav group)
Create/edit: code (stored uppercase, unique), percent off (1–100), scope (Everything / Trainings only / Events only), max uses (empty = unlimited), expiry date (empty = never). List shows usage (`used / max`), status pill (Active / Paused / Expired), with Pause/Resume, Edit, Delete. Search + scope filter + pagination per the standard list convention.

## Data model — `supabase/migrations/032_coupons.sql` (applied live)
`coupons`: `id`, `code` (unique), `percent_off` (1–100 check), `applies_to` (`all|training|event`), `max_uses` (null = unlimited), `used_count`, `expires_at`, `active`, `created_at`.

Two SECURITY DEFINER functions:
- `validate_coupon(p_code, p_scope)` → returns `percent_off` only when the code is active, in scope, unexpired, and under its cap. Case-insensitive, trims whitespace.
- `redeem_coupon(p_code)` → increments `used_count` (same guards).

## Security design (why RPCs)
- The table has **no public read policy** — checkout can never enumerate codes through the REST API; validation goes through the RPC which returns at most one number.
- `validate_coupon` is executable by `anon` + `authenticated` (the field can render pre-login); `redeem_coupon` is **authenticated-only** (both checkouts already require sign-in).
- ⚠️ **Supabase gotcha (bit us live):** default privileges grant `EXECUTE` on new public functions **to `anon` directly**, not via `PUBLIC`. `revoke ... from public` alone still let anon redeem (verified: HTTP 204 + counter bumped). The fix is an explicit `revoke execute on function redeem_coupon(text) from anon;` — kept at the bottom of migration 032. Apply this pattern to every restricted function.
- E2E verified: anon validate OK, wrong scope → `[]`, table read → `[]`, anon redeem → **401** with `used_count` unchanged.

## Code map
| Piece | File |
|---|---|
| Client lib | `src/lib/coupons.ts` — `validateCoupon`, `redeemCoupon` (best-effort, never throws), `discountedInr`, `AppliedCoupon` |
| Training checkout | `src/components/EnrollmentModal.tsx` — `effectiveInr = discountedInr(inrPrice, coupon)` feeds `convertFromInr`, order `items[].price_inr`, and Razorpay amount |
| Event checkout | `src/components/RegistrationModal.tsx` — same pattern with scope `"event"` |
| Admin CRUD | `src/pages/admin/AdminCoupons.tsx`; route in `src/App.tsx`; nav in `src/config/admin-nav.ts` |

## Notes & limits
- Percent-only by design (flat amounts would need per-currency handling).
- Redemption counting is client-triggered post-payment — tolerant of abandonment; a determined user could skip the count but never skip the payment. Move into `api/razorpay/verify.ts` (service role) if strict counting ever matters.
- Order records store the **discounted** INR in `items[].price_inr` so receipts match the charge.

## How to test
Create `TESTPCT10` (10%, Everything) in `/admin/coupons` → open a paid training → Apply → verify the pay line drops 10% and the original shows struck through → complete a test payment → confirm `used_count` incremented. Then try the code on the other checkout type after scoping it to one — it must be rejected.
