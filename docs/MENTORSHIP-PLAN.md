# Mentorship Platform (Topmate style) — Execution Plan

> Source of truth for the /mentorship build. Primary spec: reference/mentorship-platform-clone-blueprint.md.
> Style: brand-* blue only, light theme, NO icons beside titles, near zero icons, no emojis, NO "-" dashes in copy.
> Out of scope Phase 1: payouts/ledger, PPP, discount codes, calendar sync, webhooks, analytics warehouse.

## 1. Schema — supabase/migrations/015_mentorship.sql (012 style: triggers + is_admin() RLS + idempotent seeds)

### mentors (separate table; optional user_id links a login for self service)
id uuid pk · user_id uuid unique refs profiles on delete set null · slug text unique · name · headline default ''
· bio default '' · photo_url · linkedin_url · expertise text[] default '{}' · languages text[] default '{English, Hindi}'
· timezone default 'Asia/Kolkata' · notice_hours int default 12 · booking_window_days int default 30 · buffer_min int default 15
· avg_rating numeric(3,2) default 0 (trigger maintained) · review_count int default 0 · is_featured bool · sort_order int
· status content_status_t default 'published' · created_at/updated_at
RLS: select (status='published' or is_admin() or user_id=auth.uid()); admin all; mentor self UPDATE own row only.

### mentor_private
mentor_id pk refs mentors cascade · contact_email not null. RLS: admin + owner mentor only (no public read).

### mentorship_services
id · mentor_id refs mentors cascade · slug (unique per mentor) · type check in ('call','package','digital','webinar')
· title · short_description · description · price numeric >= 0 · compare_at_price (> price or null) · currency 'INR'
· duration_min (null for digital) · sessions_count default 1 · webinar_start_at · capacity · cta_label default 'Book Now'
· badge ('Popular'|'Best Seller'|null) · cover_url · questions jsonb default '[]' ([{label, required, type:'text'}])
· sort_order · status default 'published' · timestamps
RLS: select published/admin/owner; admin all; owner-mentor all (mentor_id in (select id from mentors where user_id=auth.uid())).

### mentorship_service_secrets
service_id pk refs services cascade · delivery_url · meeting_link
RLS select: admin, owner mentor, OR buyer with confirmed/completed booking of that service. Write: admin + owner.

### mentor_availability (weekly rules; slots computed client side, no slots table)
id · mentor_id refs cascade · weekday 0..6 (0=Sunday) · start_time · end_time (> start) · active · updated_at
RLS: public select using (true); write admin + owner mentor.

### mentorship_bookings
id · service_id refs services · mentor_id (denormalized) · user_id NOT NULL refs profiles (booking requires login)
· customer_name · customer_email · customer_phone · answers jsonb '[]' · slot_start/slot_end timestamptz (null digital)
· buyer_timezone default 'Asia/Kolkata' · amount >= 0 · currency 'INR'
· status check in ('pending','confirmed','completed','cancelled','refunded') default 'pending'
· order_id refs orders · payment_id refs payments · meeting_link · admin_notes · timestamps
Indexes: UNIQUE (mentor_id, slot_start) where status in ('pending','confirmed','completed') and slot_start is not null
· (user_id, created_at desc) · (mentor_id, slot_start)
RLS: select own/admin/owner-mentor. insert authed: with check (user_id=auth.uid() and (status='pending' or (status='confirmed' and amount=0))).
update user: pending → cancelled only. update mentor-owner: status/meeting_link on own. admin all.
ONLY /api/razorpay/verify (service role) flips paid pending → confirmed. Slot computation ignores pendings older than 30 min.

### mentor_reviews (existing reviews table untouched)
id · mentor_id refs cascade · service_id refs set null · booking_id unique refs bookings (non null = Verified badge)
· user_id refs profiles · name · rating 1..5 · review · is_public default true · created_at
RLS: select public/own/admin; insert authed own; admin all. Trigger refresh_mentor_rating() recomputes mentors.avg_rating/review_count.

### Alterations + seeds
- orders.kind check → add 'mentorship'.
- nav_links: add Mentorship to navbar (+ footer_explore) idempotently.
- Seeds (where not exists mentors): Yatharth Chauhan (yatharth-chauhan) + Nensi Ravaliya (nensi-ravaliya) — name/photo/linkedin from team_members fallbacks in src/lib/site-content.ts. Per mentor 4 services: 1 on 1 Career Guidance Call (call 30min ₹499, compare ₹999, badge Popular) · Resume and LinkedIn Review (call 45min ₹799) · Interview Prep Package (package 3 sessions ₹1999, compare ₹2999) · Cloud Career Roadmap (digital ₹299). Availability: Mon to Fri 18:00 to 21:00, Sat 10:00 to 13:00 IST. mentor_private with admin email. 2 to 3 public seed reviews per mentor (guard: use an admin profile id, skip if none).

## 2. Serverless — api/razorpay/verify.ts (additive)
Accept optional booking_id. After HMAC verify + payment insert: PATCH booking to confirmed with payment_id/order_id (service role); fire and forget mentor notification via /api/send-email using mentor_private.contact_email. Buyer confirmation email sent client side (existing pattern).

## 3. Public routes (reuse Navbar/Footer/SEO/LoginModal)
- /mentorship → src/pages/mentorship/MentorshipDirectory.tsx (hero, type filter tabs, mentor cards: photo/headline/rating/from price, featured first)
- /mentorship/:mentorSlug → MentorProfile.tsx (header, rating, type tabs, ServiceCards with slash pricing + badge pill, reviews, About)
- /mentorship/:mentorSlug/:serviceSlug → MentorServiceDetail.tsx (description, date strip + time slots for call/package, intake questions, checkout summary, pay)
- /mentorship/bookings → MyMentorshipBookings.tsx (auth gated; cancel pending; meeting links; leave review after completed; digital delivery link via secrets RLS)

Booking flow (paid): slot → LoginModal if needed → prefilled invitee form → insert orders (kind mentorship) → insert booking pending (23505 = slot just taken) → createRazorpayOrder → checkout → verify with booking_id → confirmation + buyer email → /mentorship/bookings. Free: insert confirmed directly.

Shared: src/lib/mentorship.ts (types + fetchers) · src/lib/mentorship-slots.ts (PURE generateSlots(rules, existingBookings, durationMin, bufferMin, noticeHours, windowDays, now) — UTC slots from IST rules, rendered in visitor timezone, unit testable) · src/components/mentorship/{MentorCard,ServiceCard,SlotPicker,MentorReviews}.tsx.
Also add Mentorship to nav fallback list in src/lib/site-content.ts.

## 4. Admin — new "Mentorship" menuGroup in AdminLayout (between Training and Other Tools); AdminCertCatalog design system
- /admin/mentorship/mentors → AdminMentors.tsx (CRUD, publish/draft, featured/sort, link login by email lookup, contact_email, availability dialog, notice/window/buffer)
- /admin/mentorship/services → AdminMentorshipServices.tsx (CRUD all mentors, filters, price/compare, badge, CTA, questions editor, secrets)
- /admin/mentorship/bookings → AdminMentorshipBookings.tsx (filters, status transitions, meeting link, answers/payment ids, resend email)
- /admin/mentorship/reviews → AdminMentorReviews.tsx (moderate is_public, delete)

## 5. Mentor self service — /mentor/dashboard → src/pages/mentor/MentorDashboard.tsx
Gate: signed in user with mentors row (user_id = auth.uid()); else friendly not a mentor screen. Tabs: Services (edit own) · Availability (rules + scheduling settings) · Bookings (upcoming/completed, meeting link, mark completed). TrainerDashboard page pattern. No payouts Phase 1.

## 6. SEO
- /mentorship: "Mentorship · Book 1:1 Sessions with Cloud Experts | Yatri Cloud" + ItemList of Person jsonLd.
- Profile: "{Name} · Cloud Mentorship Sessions | Yatri Cloud" + Person (sameAs linkedin) + AggregateRating (when review_count > 0) + hasOfferCatalog Offers.
- Service: Service jsonLd (provider Person, Offer InStock) + BreadcrumbList. /mentorship/bookings: noindex.
- sitemap.xml: /mentorship 0.9, both mentor profiles 0.8, 8 service URLs 0.7 (comment: new mentors need manual sitemap entries).

## 7. Testing
Automated: tsc + vite build gates; unit tests for mentorship-slots.ts (notice cutoff, buffer, window end, booked exclusion, expired pending, timezone boundary) — plain node test script, no new deps.
RLS matrix: anon (published reads only, no secrets/bookings, writes rejected) · user A (own pending insert only, cannot confirm paid, cannot read B) · mentor (own rows only) · admin (all).
Manual E2E: browse → profile → slots correct IST → login gate → Razorpay test pay → verify → confirmed + emails · double booking race graceful · cancel pending · verified review updates rating · 4 admin pages CRUD · mentor dashboard · jsonLd spot check · sitemap valid.

## 8. Execution batches
Batch 0: author + apply migration 015, verify seeds/RLS.
Batch 1 parallel (disjoint):
- Agent A public (10 files + api/razorpay/verify.ts edit): libs, 4 components, 4 public pages.
- Agent B admin (6): 4 admin pages + AdminLayout menu + App.tsx (SOLE owner of App.tsx — all public+admin+mentor routes).
- Agent C portal + SEO (4): MentorDashboard, slot test file, site-content nav fallback, sitemap.xml.
Batch 2: integrate — build, fix type drift (types live in Agent A's mentorship.ts; B/C import), run tests + RLS matrix, smoke booking, commit + push.
