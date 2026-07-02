# Payments and Platform Commission — Decision Doc

> Status: Phase 1 plumbing BUILT and shipped, guarded and inactive until Route is turned on.
> See the "Build status" section at the bottom.
> Goal: take a platform commission (for example 5 percent or 10 percent, configurable) on each
> mentorship booking, settle the rest to the mentor automatically, and support both domestic
> India payments and foreign inbound payments.
> Not legal or tax advice. The compliance items below must be confirmed with a chartered
> accountant (CA) who handles marketplace and cross border work before going live.

---

## 1. The model we need: split payments (managed marketplace)

Today the money flows mentee to our Razorpay account in full. For commission we need a
marketplace or split settlement model:

```
mentee pays 1000
   -> held
   -> 900 settles to the mentor
   -> 100 (our 10 percent) stays with the platform
   automatically, per transaction
```

We do NOT want to receive the full amount and pay mentors manually later. That is slow, error
prone, and in India it can create tax and regulatory problems because it looks like the platform
earned the whole 1000. Split settlement attributes each rupee correctly from the first moment.

---

## 2. Option A — Razorpay Route (the native answer)

Razorpay's marketplace product is called Route. It is effectively managed escrow built into the
Razorpay account we already use.

- **Linked accounts**: each mentor becomes a linked account under our Razorpay. They submit KYC
  and bank details. We already collect mentor identity, so this is a natural extension.
- **Split on each payment**: we specify the transfer, for example 90 percent to the mentor's
  linked account and 10 percent retained as platform fee.
- **Hold period**: we can hold the mentor's share for X days (until the session is completed)
  before releasing. That hold is our escrow layer for refunds and no shows.
- Razorpay handles settlement, so we never manually disburse.

**To activate**: request Route on the Razorpay dashboard. It needs a registered business account
(not individual), and Razorpay reviews the use case. Mentor KYC is required per linked account.

---

## 3. Option B — the international piece (the hard part in India)

Foreign card or foreign buyer payments are a separate activation and a separate compliance world.

1. **Razorpay International Payments** must be enabled separately. Approval is stricter for cross
   border and we will need to justify the model.
2. **Export of services**: when a foreign mentee pays an Indian platform, that is legally an export
   of service under RBI and FEMA. We need FIRC or FIRA (foreign inward remittance certificates) for
   reconciliation, and there are GST implications (exports can be zero rated but with conditions).
3. Cross border settlement is slower and carries higher fees and an FX markup.
4. Splitting an international payment across linked accounts is more constrained than domestic.
   Confirm directly with Razorpay whether Route and International compose for our exact case,
   because the combination is not always straightforward.

Honest note: the GST treatment, TDS, and FEMA and export compliance genuinely need a CA who does
marketplace and cross border work. Bring that person in before enabling international, not after.

---

## 4. Compliance flags we cannot skip (India marketplace)

| Item | What it means for us |
|---|---|
| TDS under Section 194-O | As an e-commerce operator we are generally required to deduct 1 percent TDS on the mentor's gross sale and deposit it. Route can help but we must account for it. |
| GST on commission | Our platform fee is a service we provide, so GST applies on the commission amount. |
| Mentor KYC and PAN | Required for linked accounts and for TDS reporting. |
| Refund and dispute policy | Decide the hold period and who absorbs the fee on refunds before launch. |

---

## 5. Alternatives to Razorpay for the split model

- **Cashfree Easy Split** — direct competitor to Route, often praised for marketplace splits and
  vendor settlement. Worth a quote comparison.
- **Stripe Connect (Stripe India)** — excellent for split payments and genuinely strong at
  international, but Stripe India domestic support has varied. Check current availability for our
  entity.
- **PayPal** — simplest for purely foreign inbound, but weak for the domestic split and expensive.
- **Dedicated RBI approved escrow provider** — heavier, usually only worth it at larger volumes or
  higher trust requirements.

---

## 6. Recommendation

1. **Phase 1 (domestic commission)**: Razorpay Route, mentors as linked accounts, hold the mentor
   share until the session completes, retain our percentage automatically. This reuses everything
   we already have.
2. **Phase 2 (international)**: activate Razorpay International Payments separately, and bring in a
   CA for export compliance and FIRC before going live. If Route plus International turns out
   clumsy, evaluate Stripe Connect for the foreign flow specifically.
3. Make the **commission percentage a config value** (a column on the mentor or a platform
   setting), not hardcoded, so we can run 5 percent for some mentors and 10 percent for others and
   change it without a deploy.

---

## 7. What this touches in our current build (for later, not now)

Good news: the schema is already commission ready in spirit. We record `orders`, `payments`, and
`mentorship_bookings` separately. To add Route later we would mainly:

- Store each mentor's **linked account id** (one new column on `mentors`).
- Add a **commission_percent** setting (a column on `mentors` for per mentor rates, plus a default
  in `site_settings`).
- Extend the `/api/razorpay/verify` step to create the transfer or split and record the platform
  fee and the mentor payout on the booking (new columns: `platform_fee`, `mentor_payout`,
  `transfer_id`).
- Optionally add a payouts or ledger view in admin so we can see fees earned and mentor balances.

No rework of the booking flow or the mentor dashboard is needed. The commercial and compliance
side can move at its own pace, and the technical change later stays contained.

---

## 8. Open decisions to make before building

- [ ] Business entity registered and eligible for Route (private limited or similar).
- [ ] Commission rate policy: flat 10 percent, or tiered, or per mentor.
- [ ] Hold period length before releasing the mentor share (for example release after the session
      time passes, or after 3 days).
- [ ] Refund policy and who absorbs the gateway fee.
- [ ] CA engaged for GST, TDS 194-O, and export or FEMA compliance.
- [ ] Domestic first, then international, or both together.
- [ ] Razorpay Route vs Cashfree Easy Split vs Stripe Connect (get quotes and confirm international
      support for each).

---

## Build status (Phase 1 shipped, inactive until Route is enabled)

**Probed the test account** (rzp_test): auth works and plain orders work, but Route is not
activated. Creating a linked account returns Access Denied and an order with a transfer returns
"This transfer is not supported". So the split cannot run until Route is switched on.

**What is built now (guarded, safe, does nothing until eligible):**
- Migration 017: `mentors.razorpay_account_id`, `mentors.commission_percent`,
  `mentorship_bookings.platform_fee` and `mentor_payout` and `transfer_id`, and a
  `site_settings.commission` default of `{"mentorship_percent": 10}`.
- `api/razorpay/create-order.ts`: for a mentorship booking, when `RAZORPAY_ROUTE_ENABLED=true`
  AND the mentor has a `razorpay_account_id`, the order carries an on hold transfer of the mentor
  share. The commission stays with the platform automatically. The split is computed on the server
  from the database, never from the client. Every other payment path is unchanged.
- `api/razorpay/verify.ts`: after a paid booking is confirmed, it records `transfer_id`,
  `mentor_payout` and `platform_fee` on the booking. Best effort, never affects the payment verdict.
- Admin -> Mentorship -> Mentors edit dialog: fields for the linked account id and a per mentor
  commission override.
- `RAZORPAY_ROUTE_ENABLED` env flag (default false) is a master switch.

**The transfer is created with `on_hold: 1`** so the mentor share is held, which is our escrow for
refunds and no shows. Releasing the hold (on session completion) is the next step, via the modify
settlement hold API from the admin bookings page. Not built yet.

## What YOU need to do to turn it on

1. In the Razorpay dashboard, activate **Route** (Settings or Products). For test mode this may need
   a support request or a dashboard toggle.
2. Create a **linked account** for each mentor (their KYC and bank details) from the dashboard under
   Route -> Linked Accounts. Programmatic creation via the API returned Access Denied on this
   account, so dashboard creation is the reliable path.
3. Copy each mentor's account id (acc_...) into Admin -> Mentorship -> Mentors -> edit -> Razorpay
   linked account id.
4. Set `RAZORPAY_ROUTE_ENABLED=true` in the environment (local .env for testing, Vercel env for
   production).
5. Test a booking end to end in test mode: the mentor share should appear as a transfer on the
   payment, and the booking should show the fee and payout.

## Next steps after Route is live
- Release the on hold transfer when a session is marked completed (modify settlement hold API).
- Editable commission default in Admin site settings UI (the value already lives in
  `site_settings.commission`).
- International: separate activation and a CA for export compliance, per the sections above.
