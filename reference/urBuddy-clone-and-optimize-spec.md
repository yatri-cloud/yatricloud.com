# Yatri Cloud Clone & Optimization — Master Build Specification

> **Purpose of this document:** A complete, reverse-engineered product + engineering specification of the urBuddy mentorship marketplace (www.urbuddy.in), captured feature-by-feature, with pros, cons, workflows, data model, and system design — PLUS an "improved next-gen version" spec. Hand this whole file to your AI coding agent (Claude Code / Cursor / etc.) as the source of truth to build your own platform.
>
> _This is an independent analysis of observable, public-facing product behavior for the purpose of building an ORIGINAL competing product. It is not a copy of any proprietary source code, database, or asset. Do not clone logos, copy, mentor data, testimonials, or brand identity — build your own._

---

## 0. TL;DR — What This Product Is

urBuddy is a **two-sided mentorship marketplace** connecting students/early-career professionals ("mentees") with vetted industry experts ("mentors") for paid 1:1 sessions, long-term mentorship programs, and bundled packages.

- **Mentee side:** Discover mentors → view profile → pick a service → pick a time slot → verify phone → pay → attend live session → review.
- **Mentor side:** Apply & get vetted → build profile → create services (priced) → set weekly availability → receive bookings → get paid out to bank.
- **Business model:** Marketplace take-rate (commission) on each paid booking; GST-compliant (India); INR pricing.
- **Operator:** Hackcomm Technology Private Limited (also runs "OSCode" community). Bengaluru, India.

---

## 1. Core Value Proposition & Positioning

- Headline angle: _"AI is changing your industry. Mentorship helps you stay ahead."_
- Trust lever: **"Rigorously vetted"** mentors ("Now Vetting Experts", "Star Mentor" badges).
- Domains covered: Interviewing, AI & ML, DSA, Masters/GATE prep, Sales, Web-Dev, DevOps, Cybersecurity, Data Science, Entrepreneurship, SaaS, Startups.
- Social proof: star ratings + review counts per mentor, testimonials, vanity stats ("paid bookings", "mentoring minutes", "vetted mentors").
- Growth hook: "Coming Soon — Your AI Learning Companion" (waitlist capture) to practice 24/7 and prep for sessions.

---

## 2. Personas & Roles

| Role | Goal | Key surfaces |
|---|---|---|
| **Mentee (Student)** | Find the right expert, book affordable time, get career outcomes | Landing, Browse/Search, Mentor profile, Booking modal, Checkout |
| **Mentor (Expert)** | Monetize expertise, manage availability & payouts | Dashboard, Services, Calendar, Bookings, Reviews, Payouts, Account |
| **Admin/Ops (implied)** | Vet mentors, moderate, handle disputes/refunds | (internal, not public) |

A single account can be both mentee and mentor (the logged-in mentor could also book others; the dashboard shows both "My Reviews" written and reviews received).

---

## 3. FULL FEATURE INVENTORY (observed)

### 3.1 Public / Mentee-Facing

**A. Landing page**
- Hero with rotating domain keywords + primary CTA "Find Your Mentor" and search box (Company, Skills, Job Role).
- "Mentor Spotlight" carousel: avatar, @handle, location, ⭐ rating (count), current role/title, bio, "Next: <date/time>" availability, "View Profile".
- "Get Expert Help in 3 Simple Steps": (1) Discover, (2) Book with confidence, (3) Connect & grow.
- Vanity metrics band.
- Testimonials wall (name + role/company).
- "AI Learning Companion" waitlist (email capture, launch notification).
- FAQ accordion.
- Footer: product links (OSCode community/chapters/events), platform (Find/Become a mentor), company (contact, privacy, terms, refund policy), socials.
- Novel touch: "Ask ChatGPT / Gemini / Claude / Perplexity" buttons (LLM-assisted trust/《ask an AI about us》).

**B. Browse / Search (`/mentors`)**
- Free-text search (company, skills, role).
- Category tabs: All, Software, AI & Data, Product, Design, Business, Marketing, HR.
- Curated collections/rails: "For Software Engineers", "Cracking Campus Placements", "Data Science & AI/ML", "Product & Strategy", "Finance & Consulting", etc.
- Mentor cards: avatar, name, role @ company (company logo auto-fetched via Brandfetch), rating or "New", availability status ("available").

**C. Mentor Profile (`/mentors/<handle>`)**
- Avatar, name, "Star Mentor" badge, headline/title, skill-area count ("14 skill areas").
- Experience section, "About Me" (expandable Read more), Focus Areas (tag chips: cloud, web, ui/ux, dsa, AI/ML, Interview Prep, frontend, backend...).
- Services list, each card: type tag (1:1 Session / LTM), title, duration, price (INR), description, "Book Session".
- Long-Term Mentorship (LTM) offering: cadence ("2-3 sessions per week"), total price, program description, "Explore Plan".

**D. Booking funnel**
1. Service detail page (`/mentors/<handle>/services/<uuid>`): tag, title, Price, "Category" (= duration e.g. 30 min), Overview, "Reserve Slot".
2. Slot modal: 7-day rolling date picker (derived from mentor availability + timezone) → time-of-day grid (30-min increments) → "Continue".
3. Identity step: phone-based auth ("Use your verified phone number"); Name, Email, Phone (+country code), "Phone verified" state, "Continue to payment".
4. Payment → confirmation → session (live video) → post-session review.

### 3.2 Mentor Dashboard (`/dashboard`)

**Navigation:** Home, Bookings, Reviews | (Mentor) Calendar, Services, Payouts | Get Help, Account.

**A. Home** — Welcome banner, upcoming-sessions count, Bookings count card, Upcoming/recent bookings list, Recent reviews, "View profile", persistent "Complete setup" onboarding widget.

**B. Onboarding checklist ("Complete setup")** — 3 gated steps with progress ticks: (1) Add a service ✓, (2) Set your availability, (3) Add bank details for payouts.

**C. Bookings** — Incoming session bookings from students (empty state: "When a student books a session with you, it will show up here").

**D. Reviews** — Two-way: reviews received + reviews the user has written after completed sessions.

**E. Calendar / Availability** — Timezone selector (e.g. GMT+5:30). Per-day (S/M/T/W/T/F/S) availability with start–end time ranges, add (+) multiple ranges per day, remove (×). Drives bookable slots.

**F. Services** — Summary cards: Total, Packages, Public Services, Sessions. Tabs: Sessions | Packages. Each service: type tag (1:1 Mentorship), Public/Private visibility, title, price (INR), Edit / Delete. "Add service".
  - **Create service wizard:** Step 1 choose type — **1-1 Video Call** / **Long Term Mentorship** / **Package**. Step 2 form: Title, Amount (INR), Duration (minutes), Description, **Advanced → Public Listing** toggle. "Create Service".

**G. Payouts** — Connect bank; cards: Available balance, Lifetime payouts, Pending; "Request payout" (gated on bank details); Transaction history.

**H. Account/Settings** — Avatar upload (png/jpg/webp/gif, sq, ≤3MB); Profile: First/Last name, Email, Phone, City, Country.

---

## 4. END-TO-END WORKFLOWS

### 4.1 Mentor lifecycle
Apply to Mentor → vetting/approval → create account → complete profile (avatar, bio, focus areas) → **Add service(s)** (price, duration, visibility) → **Set availability** (timezone + weekly ranges) → **Connect bank** → go live/public → receive bookings → deliver live sessions → get reviewed → **Request payout** → bank settlement (5–7 business days).

### 4.2 Mentee booking
Discover (landing/browse/search) → open mentor profile → choose service → "Reserve Slot" → pick date + time → phone-verified identity (name/email/phone) → pay → booking confirmed (email + dashboard) → attend live session → leave review.

### 4.3 Money flow
Mentee pays gross (service price + GST) → platform holds funds → on completed session, mentor's **Available balance** increases (minus platform commission) → mentor requests payout → settled to bank. Refunds per policy (see §6).

### 4.4 Availability → slots (the "seamless" bit)
Mentor sets timezone + weekly time ranges → system generates rolling 7-day, 30-min (service-duration-aware) slot grid on the public profile → already-booked slots are removed → mentee books in their own perceived time.

---

## 5. SYSTEM DESIGN & OBSERVED TECH (reverse-engineered)

**Confirmed from inspection:**
- **Frontend/Framework:** Next.js (App Router; `/_next/static/chunks/*`), deployed on **Vercel** (`dpl_` deployment IDs). React Server Components — data fetched server-side / via server actions (no public client `/api` JSON calls observed for page data).
- **Company logos:** **Brandfetch API** (`api.brandfetch.io/v2/search/<Company>`) to auto-render employer logos on cards.
- **Auth:** Phone-number based (OTP verification; "Phone verified" state). Likely an OTP/SMS provider.
- **Media:** avatar uploads (image pipeline / object storage/CDN).
- **Currency/Tax:** INR, GST-aware (Indian entity).

**Inferred (typical for this stack — implement, don't assume theirs):**
- **DB:** Postgres (relational: users, mentors, services, availability, bookings, reviews, payouts, transactions).
- **Payments:** an Indian gateway (Razorpay/Cashfree/Stripe-India) with connected-account/route payouts.
- **Video:** external meeting link generation (Google Meet/Zoom/Daily/100ms).
- **Email:** transactional email (confirmations, refunds, reschedules).
- **Background jobs:** slot generation, reminders, payout settlement, no-show handling.

### 5.1 Suggested data model (for your build)
```
User(id, name, email, phone, phone_verified, avatar_url, city, country, role[mentee|mentor|both], created_at)
MentorProfile(id, user_id, handle, headline, bio, focus_areas[], skill_count, is_vetted, star_badge, timezone, rating_avg, rating_count, status)
Availability(id, mentor_id, weekday, start_time, end_time)   // multiple rows per day
Service(id, mentor_id, type[one_on_one|ltm|package], title, description, amount_inr, duration_min, cadence, is_public, created_at)
PackageItem(package_id, service_id, quantity)
Booking(id, service_id, mentor_id, mentee_id, start_at, end_at, status[pending|confirmed|completed|cancelled|no_show], meeting_url, amount_paid, gst_amount, commission, created_at)
Payment(id, booking_id, gateway_ref, status, gross, gst, net, method)
Review(id, booking_id, author_id, target_id, rating, text, created_at)
Payout(id, mentor_id, amount, status[requested|processing|settled], bank_ref, requested_at, settled_at)
Transaction(id, mentor_id, type[credit|debit|payout|refund], amount, booking_id, created_at)
BankAccount(id, mentor_id, ...tokenized via gateway...)   // never store raw bank data
```

### 5.2 Key screens/routes to build
Public: `/`, `/mentors` (browse+search), `/mentors/[handle]`, `/mentors/[handle]/services/[id]`, `/mentor/apply`, legal pages.
Auth-gated mentor: `/dashboard`, `/dashboard/bookings`, `/dashboard/reviews`, `/dashboard/calendar`, `/dashboard/services` (+ `/new`, `/[id]/edit`), `/dashboard/payouts`, `/dashboard/settings`.

---

## 6. BUSINESS RULES / POLICIES (observed)
- **Mentee cancel <24h:** mentor-approval, no guaranteed refund. After session start: no refund.
- **Mentor cancels:** automatic full refund + email; repeated cancels → account suspension.
- **No-show:** mentee no-show = no refund (deemed delivered); mentor no-show = auto full refund.
- **Reschedule:** mentee free >24h before; <24h needs mentor approval. Mentor may propose alt time; decline → full refund.
- **Non-refundable:** digital products, recordings/pre-recorded courses, multi-session packages (unless mentor cancels).
- **Refund processing:** 5–7 business days to original method; GST refunded per rules. Disputes to support within 7 days.

---

## 7. PROS (what's good — keep these)
1. **Clear two-sided flow** with minimal friction; phone-verified checkout is fast for the Indian market.
2. **Guided mentor onboarding** (3-step checklist with progress) reduces empty-profile drop-off.
3. **Flexible service model:** one-off calls, long-term mentorship, and packages cover multiple willingness-to-pay tiers.
4. **Timezone-aware availability → auto slot generation** feels seamless to mentees.
5. **Strong trust signals:** vetting, Star Mentor badges, ratings, testimonials, auto company logos (Brandfetch) look premium cheaply.
6. **Curated discovery rails** ("For Software Engineers", "Cracking Placements") aid navigation better than a flat list.
7. **Clean, fast, modern stack** (Next.js + Vercel) = good SEO + performance.
8. **Transparent, fair refund policy** builds buyer confidence.
9. **Clever growth loops:** AI-companion waitlist; "Ask an AI about us" buttons.

## 8. CONS / GAPS (fix these in your version)
1. **Cold-start & empty states** everywhere ("0 bookings", vanity stats at "0") — weak first impression; no demo/sandbox data.
2. **Discovery is shallow:** category tabs only; no filters for price, rating, language, availability window, experience level, price range, sort.
3. **No visible messaging/pre-session Q&A** between mentee and mentor before booking.
4. **No in-platform video** confirmed — reliance on external links is fragile (no recording, no attendance tracking baked in).
5. **Phone-only auth** can exclude users; no email/Google SSO fallback shown.
6. **Weak mentee-side account** (profile is mentor-centric); no mentee learning history/goals hub.
7. **No packages/subscription clarity** on pricing math, GST breakdown at point of sale.
8. **No reviews moderation / verified-purchase indicator** visible.
9. **No AI companion yet** (waitlist only) — the headline promise is undelivered.
10. **No analytics for mentors** (earnings trends, conversion, profile views).
11. **Limited internationalization** (INR/GST-only; single timezone default).
12. **No mobile app / PWA** signals; no calendar sync (Google/Outlook) shown.
13. **No dispute/booking chat trail** surfaced for support.
14. **Accessibility & SEO of dynamic profiles** not verified; heavy client rails may hurt indexing.

---

## 9. YOUR OPTIMIZED / NEXT-GEN VERSION (build spec — not a copy)

Build an original, better product. Differentiators to implement:

**Discovery & matching**
- Rich filters (price range, rating, languages, next-availability, seniority, company, outcome tags) + sort + saved searches.
- **AI matchmaker:** mentee describes goal ("crack SDE-2 at a FAANG in 3 months") → ranked mentor + service recommendations.
- Verified-purchase reviews with helpfulness voting and mentor responses.

**Auth & accounts**
- Phone OTP **plus** Google/email SSO; separate, rich mentee hub (goals, saved mentors, session history, notes, resources).

**Booking & delivery**
- Native video (100ms/Daily/LiveKit) with in-app recording, auto-transcript, and AI session summary + action items emailed after.
- Google/Outlook calendar 2-way sync; automated reminders (email + WhatsApp/SMS).
- Pre-session intake form + async chat so mentors arrive prepared.

**The AI Companion (ship it, don't waitlist it)**
- 24/7 practice: mock interviews, DSA drills, resume review, roadmap generation.
- "Prep for your session" and "continue after your session" flows tied to a specific mentor's focus.
- Uses your LLM (e.g., Claude) with RAG over the mentor's public materials + the mentee's goals.

**Mentor tooling**
- Analytics dashboard (views → book conversion, earnings trends, repeat-rate, review sentiment).
- Smart pricing suggestions, promo codes, subscription/retainer LTM billing.
- Bulk availability + time-off + buffer rules; auto no-show handling.

**Payments & trust**
- Transparent price+GST breakdown pre-pay; wallet/credits; instant/scheduled payouts; escrow with auto-release on completion.
- KYC + fraud checks; connected-account payouts via gateway (never store raw bank/card data).

**Platform**
- PWA + responsive; i18n + multi-currency; strong SSR/SEO for profile pages; audit logs; role-based admin console for vetting, moderation, disputes, refunds.

**Recommended stack for your build**
- Next.js (App Router) + TypeScript on Vercel; Postgres (Supabase/Neon) + Prisma/Drizzle; Auth (Clerk/Auth.js) with phone OTP + SSO; Payments (Razorpay/Stripe) with connected accounts; Video (LiveKit/100ms/Daily); Object storage/CDN (S3/Cloudflare R2 + image optimization); Email (Resend/Postmark); Queue/cron (Inngest/Trigger.dev) for slots, reminders, payouts; Brandfetch (or your own logo service) for company logos; LLM (Claude API) for AI companion + matchmaker; Analytics (PostHog).

---

## 10. READY-TO-USE PROMPT FOR YOUR AI CODING AGENT

Paste the block below (plus this whole spec) into Claude Code / Cursor / your agent:

```
You are my senior full-stack engineer. Build an ORIGINAL two-sided mentorship marketplace
(inspired by the attached spec, NOT a copy — original branding, code, and content).

STACK: Next.js 14 (App Router, TypeScript, Server Actions), Tailwind + shadcn/ui, Postgres via
Prisma, Auth.js (phone OTP + Google SSO), Razorpay (payments + connected-account payouts),
LiveKit (native video + recording), Resend (email), Inngest (cron/queues), PostHog (analytics),
Claude API (AI companion + matchmaker). Deploy on Vercel.

DELIVER IN PHASES, each with migrations, tests, and a seed script with realistic demo data
(so there are NO empty states):

PHASE 1 — Foundation: data model from spec §5.1; auth (phone OTP + Google); user/mentor profiles;
seed 20 mentors, services, availability, reviews.
PHASE 2 — Discovery: /mentors browse with search + rich filters (price, rating, availability,
seniority, company, tags) + curated rails + AI matchmaker endpoint.
PHASE 3 — Booking funnel: mentor profile → service → timezone-aware 7-day/30-min slot generation
from availability → phone-verified checkout → Razorpay payment with GST breakdown → confirmation.
PHASE 4 — Delivery: LiveKit room per booking, reminders (email+SMS), calendar sync, post-session
AI summary + action items, review flow (verified purchase).
PHASE 5 — Mentor ops: dashboard (bookings, reviews, calendar editor, services CRUD with
one-on-one/LTM/package types + public toggle), analytics, payouts (connect bank via gateway,
available/pending/lifetime, request payout, transaction history).
PHASE 6 — AI Companion: 24/7 mock interviews, resume review, roadmap gen, session prep/recap
(Claude + RAG over mentor materials & mentee goals).
PHASE 7 — Admin: mentor vetting, moderation, disputes, refunds (implement policy from spec §6),
audit logs, RBAC.

RULES: TypeScript strict; never store raw card/bank data (tokenize via gateway); server-side
authz on every mutation; accessible (WCAG AA) and SEO-friendly SSR profile pages; original UI —
do not copy any third party's logo, copy, testimonials, or mentor data. Ask me before each phase.
Start with PHASE 1 and show me the schema + migrations first.
```

---

## 11. Build Checklist
- [ ] Data model + migrations + seed (no empty states)
- [ ] Phone OTP + SSO auth
- [ ] Mentor profile + focus areas + Star badge logic (vetting)
- [ ] Services CRUD (1:1 / LTM / Package, price, duration, public toggle)
- [ ] Availability editor (timezone + weekly ranges + buffers)
- [ ] Slot generation engine (rolling 7-day, duration-aware, booked-slot removal)
- [ ] Browse/search + filters + curated rails + AI matchmaker
- [ ] Booking funnel + GST breakdown + payment
- [ ] Native video + recording + AI summary
- [ ] Reviews (verified purchase) + mentor replies
- [ ] Payouts (connect bank, balances, request, history) + escrow release
- [ ] Refund/cancel/reschedule/no-show automation (policy §6)
- [ ] Mentor analytics dashboard
- [ ] AI Companion (mock interview, resume, roadmap, prep/recap)
- [ ] Admin console (vetting, moderation, disputes, RBAC, audit logs)
- [ ] PWA + i18n + multi-currency + calendar sync
- [ ] SEO/SSR profiles + accessibility pass

---
_Compiled from a structured walkthrough of the public product surface for building an original competing platform. Replace all brand assets, copy, and data with your own._
