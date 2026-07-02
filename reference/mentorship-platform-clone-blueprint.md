# Topmate-Style Creator Monetization & Mentorship Platform — Full Clone + Optimization Blueprint

> **Purpose of this document:** A complete, build-ready specification reverse-engineered from a live creator-monetization / mentorship platform (Topmate-style). It captures every observed feature, the end-to-end workflows, the pros and cons, the inferred system/backend design, and a ready-to-paste build prompt for your AI coding agent (Claude Code / Cursor / etc.). The goal is **not to copy** but to build an **optimized next-generation version**.

---

## 0. TL;DR — What This Product Is

A **creator/expert monetization platform** where an individual ("creator/mentor/expert") gets a single public link (\`platform.com/username\`) that acts as a mini storefront. Visitors ("buyers") discover services, pick a time slot, pay, and get a booked call / digital product / DM answer. The creator manages everything (services, calendar, bookings, payouts, analytics) from a dashboard. The platform takes a **commission (~5% + transaction cost)** per sale.

It is essentially: **Linktree + Calendly + Gumroad + Stripe payouts + a lightweight CRM/analytics**, fused into one link-in-bio commerce experience.

---

## 1. Core Entities / Domain Model

| Entity | Description |
|---|---|
| **Creator** | The expert. Has a public username page, services, availability, payout account. |
| **Buyer** | The customer. Books/purchases; may be anonymous until checkout. |
| **Service** | A monetizable offering. 5 types (see §3). Has price, duration, media, questions. |
| **Booking / Order** | A purchase of a service by a buyer. Has state (upcoming/completed), payment, invitee data. |
| **Availability / Schedule** | Creator's bookable time (timezone, weekly schedule, buffers, notice, booking window). |
| **Payout Account** | Bank / payment-provider connection for withdrawals. |
| **Transaction** | Ledger entry (sale, hold, withdrawal, fee, refund). |
| **Testimonial / Review** | Buyer feedback shown on profile & service pages. |
| **Discount Code** | Creator-defined promo. |
| **Add-on / Upsell** | Order-bump items (e.g. session recording). |
| **Integration** | Calendar sync, video conferencing, Meta Pixel, outbound webhooks. |

---

## 2. Information Architecture (Observed Navigation)

**Creator Dashboard — bottom nav:**
- **Home** — snapshot analytics (visits, earnings, sales), "In focus" recommendations, content studio promo, "Ask Loop" AI assistant.
- **Bookings** — tabs by service type (1:1 Calls, Webinars & Cohorts, Products/Courses, Package); sub-tabs Upcoming / Completed.
- **Services** — CRUD for all 5 service types; per-service Edit / Analytics / Share / Duplicate / Delete.
- **Calendar** — Settings (timezone, reschedule policy, booking period, notice period) + Schedule (weekly availability).
- **Analytics** — Profile analytics with date ranges (Today…6M/Custom), Service Views, Earnings, Sales, traffic sources, conversion funnel, location, device.
- **More** — drawer to remaining areas.

**Settings (tabbed):** Account · Payments · Add-on's · Integrations · Advanced · Subscriptions.

**Payments:** Withdrawable balance, Withdraw, payout method, In-withdrawal, Lifetime earnings, transactions ledger (filter + export), Payout FAQs.

**Public side:** \`/username\` profile page → service detail page → date/time picker → \`/pay\` checkout.

---

## 3. Service Types (the monetization primitives)

1. **1:1 Call** — video meeting; duration + price; invitee questions; scheduling via calendar.
2. **Webinars & Cohorts** — one-to-many live sessions / multi-session cohorts.
3. **Products/Courses (Digital Products)** — downloadable / hosted digital goods (e.g. "1600+ Legal Business Documents ₹5,999").
4. **Package** — bundle of multiple services sold together.
5. **Priority DM** — async text Q&A with a guaranteed reply window (e.g. "answered within 24 hours").

Each service has: **Public/Private visibility**, price with **slash (compare-at) pricing**, "Popular"/"Best Seller" badges, and per-service analytics.

---

## 4. Service Editor — Full Field Inventory

The editor has three tabs:

**Basic Details**
- Title, Short Description, Price (currency-aware)
- Rich Service Description (long form, formatting, emoji bullets)
- Duration (mins)
- **Invitee questions** (custom intake questions, e.g. "Which role are you applying for…"), add multiple, typed (Text, etc.)
- Service Actions: Delete, Duplicate
- "Create service landing page" (beta, conversion-optimized long-form page)

**Design**
- Cover Image(s), Thumbnail
- Payment Button Label (custom CTA text, e.g. "Build Now")
- Service Label (badge)
- **Showcase testimonials** (hand-pick which reviews appear)
- **Slash Pricing** (compare-at price, e.g. ~~₹999~~ ₹499)
- **Sell session recording** (paid recording add-on)

**Advanced**
- **Discount codes**
- **Country-based pricing (PPP)** — purchasing-power parity by buyer country
- Custom booking confirmation message
- Redirect URL after booking
- Scheduling profile selection (which availability set applies)
- **Buffer time** between calls

---

## 5. Calendar / Scheduling

- **Timezone** (creator's canonical tz; buyer sees localized).
- **Reschedule policy** (whether/how buyers can reschedule).
- **Booking Period** — how far ahead bookings are allowed (e.g. 2 months).
- **Notice Period** — minimum lead time before a slot.
- **Schedule** — weekly recurring availability.
- **Buffer time** — gap between consecutive calls.
- **Calendar Integration** — connect Google/Outlook to auto-block busy times.
- **Meeting Location** — Zoom (Pro), Google Meet, or custom personal meeting link.

---

## 6. Public Profile & Booking Funnel (Buyer Journey)

1. **Profile page** (\`/username\`): avatar, name, bio, AI-generated highlight card (from recommendations), service filter tabs (All / type), service cards (price, slash price, badges), ratings summary (e.g. 4.3/5, 11 ratings), testimonials carousel, "About me".
2. **Service detail page** (\`/username/<serviceId>\`): AI-generated trait chips ("Patient, Helpful, Friendly"), description, testimonials, and a **date picker** (horizontal day strip spanning the booking window) + **time-of-day slot** + **timezone selector** + CTA ("Build Now").
3. **Checkout** (\`/username/<serviceId>/pay?time=…\`): booking summary + Change; invitee form (Name, Email, custom question(s), Phone with full country dropdown, "receive booking details on phone"); **order bump / upsell** ("People also bought → Get session recording" with a **countdown timer** "Valid till HH:MM"); **Order Summary** (line items, add-on, platform fee, total); "Confirm and Pay" with terms/refund acknowledgement.

**Notable conversion mechanics:** slash pricing, badges, AI trait/summary cards, testimonials at 3 layers (profile, service, checkout), order bumps with scarcity timer, localized currency/PPP, custom CTA labels, UTM tagging on links.

---

## 7. Payments, Payouts & Commercials

- **Commission model:** ~5% + transaction cost per sale (platform fee also shown to buyer, e.g. ₹10→₹5).
- **Wallet ledger:** Withdrawable balance, holds, In-withdrawal, Lifetime earnings.
- **Withdraw** to a connected payout method (e.g. Indian bank; provider-dependent).
- **Transactions table** with type filter + CSV/export + support links.
- **Currency:** default currency, localized currency for buyers, country-based pricing.
- **Subscriptions:** platform plan tiers for creators (feature gating, e.g. Zoom Pro requires upgrade).

---

## 8. Integrations / Extensibility (Backend-relevant)

- **Calendar sync** (Google/Outlook, multi-account) → availability conflict blocking.
- **Video conferencing:** Zoom, Google Meet, custom link → auto-generated meeting links per booking.
- **Meta Pixel** → fires PageView + conversion events on profile/service/checkout.
- **Outbound Webhooks** → real-time HTTP POST of the booking/purchase payload to a creator endpoint, with configurable headers; fires on 1:1 calls, webinars, priority DMs, packages, and digital-product purchases.
- **Content Studio** (AI video/poster/slideshow/site generation) — adjacent creator-content tooling.
- **"Ask Loop"** — an in-dashboard AI assistant.

---

## 9. Analytics

- Date ranges: Today, Yesterday, 3D, 7D, 30D, 3M, 6M, Custom; granularity Hour/Day/Week/Month.
- Metrics: Visits/Service Views, Earnings, Sales, with period-over-period deltas.
- Deep-dives (lazy-loaded): traffic sources, conversion **funnel**, location, device analytics.
- Per-service analytics from the Services list.

---

## 10. Pros & Cons (Honest Teardown)

### Strengths (keep / emulate)
- **One-link storefront** removes friction; extremely fast creator onboarding.
- **Five flexible service primitives** cover most expert monetization needs.
- **Deep conversion tooling** baked in (slash pricing, PPP, badges, testimonials at every step, order bumps + scarcity, custom CTAs).
- **Solid scheduling core** (timezones, buffers, notice, booking window, calendar sync).
- **Real extensibility** (webhooks, Pixel, calendar/video) makes it composable.
- **Clean mobile-first IA** (bottom nav) and progressive disclosure (lazy analytics).
- **AI-assisted trust** (auto trait chips, testimonial summaries) increases perceived credibility.

### Weaknesses / Gaps (opportunities to beat)
- **Discovery is weak** — profiles are largely direct-traffic; no strong marketplace/SEO engine surfaced.
- **Commission + platform fee** stacks cost onto both sides; creators feel the take-rate.
- **Payout coverage is region-limited** (bank-provider dependent); global creators underserved.
- **Async/product delivery** (Priority DM, digital files) feels secondary to calls.
- **Limited CRM** — no rich buyer profiles, segments, lifecycle emails, or repeat-purchase nurturing observed.
- **No native team/agency mode** — everything is single-creator centric.
- **Feature gating** (e.g. Zoom Pro) can nickel-and-dime.
- **AI-generated testimonial/trait copy** risks authenticity/trust concerns if unlabeled.
- **Scarcity timers/order bumps** can feel manipulative; needs tasteful, honest defaults.
- **Recording/upsell** is add-on gated rather than value-bundled.

---

## 11. Inferred System Design / Architecture

> Inferred from observed routes, payloads, and behavior — treat as a sensible reference architecture, not the original's internals.

**Frontend**
- SPA/SSR hybrid (dashboard = app; public profile/service/checkout = SSR for SEO + share previews). Next.js-style. Mobile-first.

**Backend (service-oriented / modular monolith to start)**
- **Auth & Accounts:** creators, sessions, MFA-ready, plan/subscription state.
- **Catalog/Service service:** service CRUD, pricing, media, questions, visibility, discount codes, PPP rules.
- **Scheduling service:** availability rules, timezone math, buffers, notice, booking window, slot generation; calendar-sync workers (Google/MS Graph) for busy-time blocking.
- **Booking/Order service:** cart → order → payment → fulfillment; invitee data capture; state machine (pending → paid → scheduled → completed/cancelled/refunded).
- **Payments/Ledger service:** gateway integration (Razorpay/Stripe/PayPal by region), double-entry ledger (sale, fee, hold, payout, refund), payout scheduling, KYC.
- **Meeting service:** Zoom/Meet API to mint per-booking links; ICS generation.
- **Notifications:** email/SMS/WhatsApp confirmations & reminders; templated.
- **Analytics/Events:** event pipeline (page_view, service_view, checkout_start, purchase) → warehouse; funnel/traffic/location/device rollups; Meta Pixel forwarding (server-side CAPI recommended).
- **Webhooks:** signed outbound POSTs with retry/backoff + delivery logs.
- **AI service:** testimonial summarization, trait extraction, assistant ("Ask Loop"), content studio generation.

**Data stores**
- Primary relational DB (Postgres) for accounts/catalog/orders/ledger.
- Cache (Redis) for slot availability + rate limits.
- Object storage (S3) for media/recordings/digital products.
- Analytics warehouse (ClickHouse/BigQuery) for events.
- Queue (SQS/Kafka) for calendar sync, webhooks, emails, payouts.

**Key data models (sketch)**
\`\`\`
Creator(id, username, name, bio, avatar, plan, currency, default_tz, commission_rate)
Service(id, creator_id, type, title, short_desc, description, price, compare_at_price,
        duration_min, visibility, thumbnail, cover[], questions[], badges[],
        buffer_min, schedule_id, redirect_url, confirmation_msg, sell_recording, recording_price)
Availability(id, creator_id, tz, weekly_rules[], notice_min, booking_window_days)
Order(id, service_id, buyer{name,email,phone,country}, answers[], slot_start, slot_end,
      status, amount, addons[], discount_code, platform_fee, gateway_ref, created_at)
LedgerEntry(id, creator_id, order_id, type[sale|fee|hold|payout|refund], amount, balance_after)
Testimonial(id, creator_id, service_id?, rating, text, author, created_at, showcased)
Integration(id, creator_id, kind[gcal|outlook|zoom|meet|pixel|webhook], config_json)
\`\`\`

---

## 12. YOUR OPTIMIZED V2 — Recommended Improvements (Beat, Don't Copy)

1. **Discovery engine:** SEO-first service pages + an opt-in **marketplace/directory** with categories, search, and ranking, plus programmatic landing pages. This is the biggest growth lever the original lacks.
2. **Fairer economics:** lower/transparent take-rate, optional flat-fee pro plan with 0% commission, and clear buyer-side fee display.
3. **Global-first payouts:** multi-gateway (Stripe Connect + Razorpay + PayPal + local rails), instant/express payout options.
4. **Real CRM & lifecycle:** buyer profiles, tags/segments, post-session automations, repeat-purchase nudges, review requests, win-back emails.
5. **Async-first products:** first-class digital product delivery, license keys, drip content, and a proper LMS-lite for courses/cohorts.
6. **Trust done right:** verified reviews (only from real bookings), clearly-labeled AI summaries, creator verification badges.
7. **Ethical conversion:** keep slash pricing/upsells but make scarcity honest (real inventory/time), and A/B test framework built in.
8. **Team/agency mode:** multi-seat, roles, shared calendars, revenue splits.
9. **Server-side analytics + CAPI** for accuracy in a cookieless world; native funnel/attribution dashboards.
10. **AI co-pilot for creators:** auto-draft services, pricing suggestions from market data, auto-reply drafts for Priority DM, smart scheduling.
11. **Reliability:** idempotent payments, webhook signing + replay, double-entry ledger, full audit log.
12. **Accessibility & i18n** from day one (currency, language, RTL, WCAG).

---

## 13. BUILD PROMPT — Paste this into your AI coding agent

> Copy the block below verbatim to Claude Code / Cursor / your AI builder. Fill in the \`{{...}}\` placeholders.

\`\`\`text
ROLE: You are a senior full-stack engineer + product architect. Build a production-grade,
multi-tenant "creator monetization & mentorship" platform (a modern, improved Topmate/Calendly/
Gumroad hybrid). Do NOT clone code; design a clean, original, well-architected system.

PRODUCT SUMMARY:
Each creator gets a public link (app.com/{username}) acting as a storefront. Buyers discover
services, pick a time slot (for calls) or buy instantly (for products/DMs), pay, and get fulfilled.
Creators manage services, availability, bookings, payouts, analytics from a dashboard.
Platform charges a transparent commission per sale.

MUST-HAVE FEATURES:
1) Five service types: 1:1 Call, Webinar/Cohort, Digital Product/Course, Package (bundle), Priority DM (async Q&A with SLA).
2) Service editor with tabs: Basic (title, short desc, rich description, price, duration, custom
   invitee questions), Design (cover/thumbnail, custom CTA label, badges, slash/compare-at pricing,
   showcase-selected testimonials, paid session recording toggle), Advanced (discount codes,
   country-based PPP pricing, custom confirmation message, redirect URL, scheduling profile, buffer time).
3) Scheduling: creator timezone, weekly availability, notice period, booking window, buffers,
   reschedule policy; buyer sees localized timezone; conflict-blocking via Google/Outlook calendar sync.
4) Public profile page: bio, service filter tabs, service cards with slash pricing + badges,
   ratings summary, testimonials, About. Service detail page with date strip + time slots + timezone.
5) Checkout: booking summary, invitee form (name, email, phone+country, custom questions),
   order-bump upsell (e.g., recording) with honest scarcity, order summary with itemized fees, pay.
6) Payments & payouts: multi-gateway (Stripe Connect + Razorpay + PayPal), double-entry ledger,
   holds, withdrawable balance, withdraw flow, transactions table with export, refunds.
7) Meeting provisioning: auto-generate Zoom/Google Meet link per booking + ICS + reminders (email/SMS/WhatsApp).
8) Analytics: date ranges (Today..6M/Custom), Visits/Views/Earnings/Sales with deltas, funnel,
   traffic sources, location, device; server-side event pipeline + Meta Pixel/CAPI.
9) Integrations: calendar sync, video conferencing, Meta Pixel, signed outbound webhooks (with retries + delivery log).
10) Creator plans/subscriptions with feature gating; transparent take-rate display to buyers.

IMPROVE ON THE ORIGINAL (V2 DIFFERENTIATORS — implement these):
- SEO-first public/service pages + an opt-in marketplace/directory (search, categories, ranking, programmatic pages).
- Lower/transparent economics + optional 0%-commission pro plan.
- Global-first multi-gateway payouts.
- Built-in CRM: buyer profiles, tags/segments, lifecycle automations, review requests, win-back.
- First-class async/digital delivery + LMS-lite for courses/cohorts (drip, license keys).
- Verified-only reviews; clearly-labeled AI summaries; creator verification badges.
- Native A/B testing + honest scarcity; AI creator co-pilot (draft services, price suggestions, DM auto-drafts).
- Team/agency mode (multi-seat, roles, revenue splits).

ARCHITECTURE:
- Frontend: Next.js (App Router), TypeScript, Tailwind, SSR for public pages (SEO + share previews), mobile-first.
- Backend: modular monolith (NestJS or Node/Express) split into modules: auth, catalog/service,
  scheduling, booking/order, payments/ledger, meeting, notifications, analytics/events, webhooks, ai.
- DB: Postgres (accounts/catalog/orders/ledger) with Prisma; Redis (slots/rate-limit); S3 (media/products/recordings);
  ClickHouse or BigQuery (events); queue (BullMQ/Kafka) for sync/webhooks/emails/payouts.
- Payments abstracted behind a Gateway interface; idempotency keys; double-entry ledger; webhook signature verification.
- Timezone math via a robust library; generate slots server-side; cache availability.

DELIVERABLES (produce in this order):
1) Data model (Prisma schema) for: Creator, Service, Availability, Order, LedgerEntry, Testimonial,
   DiscountCode, Addon, Integration, Webhook, BuyerProfile, Subscription, Event.
2) API design (REST or tRPC) with endpoints for each module + auth + RBAC.
3) Scheduling slot-generation algorithm (timezone-correct, buffers, notice, window, calendar-conflict).
4) Checkout + payment + ledger flow with idempotency and refund handling.
5) Public profile/service/checkout pages (SSR) + creator dashboard (Home, Bookings, Services,
   Calendar, Analytics, Settings/Integrations/Payments).
6) Integrations: Google/Outlook sync worker, Zoom/Meet link minting, Meta Pixel/CAPI, signed webhooks.
7) Seed data + tests (unit for scheduling/ledger, e2e for booking→pay→fulfill).

CONSTRAINTS:
- Clean, documented, original code. Security-first (validate inputs, sign webhooks, no secrets in client).
- Accessibility (WCAG) and i18n/multi-currency from the start.
- Provide a README with setup, env vars, and run instructions.

TECH STACK PREFERENCES: {{Next.js + NestJS + Postgres/Prisma + Redis + Stripe Connect, or your choice}}
BRAND/NAME: {{your platform name}}
PRIMARY REGION(S) & CURRENCIES: {{e.g., India + Global, INR/USD}}

Start by proposing the folder structure and the Prisma schema, then wait for my confirmation before generating module code.
\`\`\`

---

## 14. Build Order Checklist (for you)

1. Lock domain model (§1, §11) → 2. Auth + creator onboarding → 3. Service CRUD (§4) →
4. Availability + slot engine (§5) → 5. Public profile + service pages (§6) →
6. Checkout + payments + ledger (§7) → 7. Meeting provisioning + notifications →
8. Analytics events + dashboards (§9) → 9. Integrations + webhooks (§8) →
10. V2 differentiators (§12) → 11. Plans/subscriptions + admin → 12. Hardening (idempotency, audit, tests).

---

*Generated as a build blueprint from a live platform teardown. Use it to design an improved, original product — not a copy.*
