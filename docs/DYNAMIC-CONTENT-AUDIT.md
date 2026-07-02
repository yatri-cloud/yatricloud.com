# Dynamic-Content & CTA Audit — Master Checklist

> **Goal (user directive, 2026-07-02):** the WHOLE site must be fully dynamic — every content/data item
> (cert names, store, udemy, reviews, events, copy, stats, dropdowns…) manageable from **/admin** via
> Supabase, nothing hardcoded. AND every button/CTA must be clickable + functional end-to-end in production.
> This file is the living checklist. Update it as items ship.

## Status legend
- [ ] todo · [x] done · (dead) = file not rendered anywhere — delete, don't migrate

## Progress log
- **2026-07-02:** Cleanup (step 0) DONE — 8 dead files archived. CTA fixes #1,2,4,5,7,8,9,10 + Calendly fallback SHIPPED (commit 5d93705). Migration **009 applied live**: `site_settings` (contact/social/booking/brand), `site_stats` (6 rows), `promotions` (voucher-offer), `faqs` (7 rows) — all seeded with current live values, RLS verified (anon read ✓, anon write 401 ✓). Frontend wiring + `/admin/site` editor + full SEO overhaul in progress (agents).
- **Standing rules added (docs/VOICE.md §6b/6c):** no "-" dashes in copy, simple English, warm human tone, full SEO on every page.
- **Google Tag Manager GTM-KZ4L6JFK** installed in index.html (head script + body noscript) as part of the SEO pass — covers all pages (SPA). REMINDER (user side): add a History Change trigger in GTM / enable GA4 page changes based on browser history, so SPA route changes count as page views.
- **2026-07-02 (commit fd8ad5f, pushed live):** BATCH 1 SHIPPED. Dynamic wiring done (Hero/Trust/Contact/Footer/FAQ/Community/Training read site_stats/site_settings/promotions/faqs with fallbacks) + NEW `/admin/site` editor (contact, socials, Calendly, stats, promo, FAQs w/ reorder). FULL SEO: unique titles+descriptions all public routes (dash free, simple English), OG/Twitter cards, canonicals, JSON-LD (Organization+WebSite sitewide; Event on EventDetail w/ offers; Course on TrainingDetail; live AggregateRating on Reviews; ItemList on ExamDumps/YatriStore; FAQPage on homepage), robots.txt + sitemap.xml (16 routes), noindex on private pages, domain refs fixed certification.yatricloud.com → yatricloud.com. GTM installed. **TODO next:** real 1200×630 og image (shares currently use the round logo); leftover hardcoded bits (24/7 chip, Free tracks cue, hero subheadline, footer credit); then Batch 2 = cert_providers + provider_certifications catalog.
- **2026-07-02 (final):** Batches 1 to 5 complete. Every planned table is live and wired with fallbacks: site_settings, site_stats, promotions, faqs, cert catalog, homepage marketing tables, communities, nav_links, option_lists, legal_pages, guides, email_templates. SEO and GTM are live. The www domain is aligned. Admin restyle shipped. Dead data stripped from data/courses.ts and data/store-products.ts. Footer credit now reads brand.designed_by. The hero subheadline, the 24/7 chip, and the Free tracks cue stay hardcoded because no table fits them.

---

## 0. Cleanup first (zero-risk — dead files that duplicate live content)
- [x] Delete `src/components/HeroSection.tsx` (legacy; live one is `sections/HeroSection`)
- [x] Delete `src/components/Header.tsx`
- [x] Delete `src/components/sections/PartnersMarquee.tsx`, `GraduatesMarquee.tsx`, `PainPointsSection.tsx`, `PricingSection.tsx`, `TestimonialsSection.tsx`, `FinalCTASection.tsx` (none imported by Index)
- [x] Strip dead arrays from `src/data/courses.ts` (keep `Course` type) and `src/data/store-products.ts` (keep `Product` type + `categories`, still imported by YatriStore)

## 1. Certification catalog (BIGGEST — ~500 lines duplicated across 7+ files)
Tables: **`cert_providers`** + **`provider_certifications`** (+ optional `industry_leaders` view)
- [x] `certified-yatris/CertificationForm.tsx:54,68,82-519` — PROVIDER_LOGOS + CERTIFICATION_PROVIDERS + 10 per-provider cert lists w/ exam codes
- [x] `lib/certification-logos.ts:6` — CERTIFICATION_PROVIDER_LOGOS (12)
- [x] `lib/training-api.ts:25` — PROVIDERS_DISPLAY (11)
- [x] `pages/Review.tsx:26` — PROVIDERS (10 + brand hex)
- [x] `pages/RequestVoucher.tsx:34` — PROVIDERS (11)
- [x] `pages/Achievements.tsx:162` — _PROVIDER_KEYS (13)
- [x] `sections/HeroSection.tsx:16` — CERT_TRACKS (6)
- [x] `sections/IndustryLeadersSection.tsx:11-28` — 16 vendors + exam counts + blurbs + logos
- [x] One-time import script for the catalog + Admin "Certifications" group (Providers / Catalog)

## 2. Site stats & trust numbers (drifting — values differ per file!)
Table: **`site_stats`** (key, value, label, sort_order)
- [x] `sections/HeroSection.tsx:86-90` (50K+/4.8/6) · `TrustSection.tsx:45-50` (adds 95%) · `pages/Community.tsx:48-53` (17 communities/24/7) · `pages/Training.tsx:94-99` · `IndustryLeadersSection.tsx:74-78` (400K+)
- [x] Inline "50,000+ / 4.8★" copy: Events.tsx:223, YatriStore.tsx:89/236/270/315, ExamDumps.tsx:67, Udemy.tsx:255/261, EventDetail.tsx:502, SEO.tsx:14 default desc (remaining literals live inside sentences and SEO copy, accepted as static)

## 3. Promotions / offers ("50% OFF" scattered ~15 places)
Tables: **`promotions`** (+ `voucher_perks`)
- [x] `sections/HeroSection.tsx:93-94,179` headline + CTA · `CertificationFlowSection.tsx:24,158,222,280` · `VoucherPromoSection.tsx:8-33,69-83,150` · `CommunitySection.tsx:286` chips · `YatriStore.tsx:89,236` · `RequestVoucher.tsx:428`

## 4. Dropdown / option lists (business config, duplicated public↔admin)
Tables: **`course_taxonomy`** (kind: tech|category|level), **`creators`**, **`store_categories`**, **`cert_levels`**; events config → `event_categories`, `sponsor_tiers`, `sponsorship_areas`
- [x] Udemy.tsx:32-55 + admin/UdemyAdmin.tsx:29-44 — CREATORS/TECH_OPTIONS/CATEGORY_OPTIONS (dup) → `option_lists`
- [x] data/store-products.ts:19 + AddProduct.tsx:24,179-185 + admin/AdminAddProduct.tsx:19 — store categories → `option_lists` (YatriStore filter chips keep the static list)
- [x] AddProduct.tsx:31,203-206 + admin/AdminAddProduct.tsx:26 — product levels → `option_lists`
- [x] TrainingDetail.tsx:69,166 — course levels (kept static: this is a parsing heuristic, not a dropdown)
- [x] Events.tsx:110 categories · CreateEvent.tsx:294,1319-23 sponsor tiers · SponsorSubmissionForm.tsx:31 areas → `option_lists`
- Review.tsx:24 RATINGS [1-5] — keep static (fixed scale)

## 5. Marketing content lists (homepage cards/features)
Tables: **`package_benefits`**, **`voucher_perks`**, **`certification_steps`**, **`eligible_exams`**, **`recognitions`**, **`trust_features`**, **`team_members`**, **`partner_offerings`**
- [x] CertificationFlowSection.tsx:22-53 bonusFeatures · :6-20 eligible AWS exams (+ FAQSection.tsx:22-30 dup) · :55-81 3-step flow (+ HeroSection.tsx:261-277 dup)
- [x] RecognitionsSection.tsx:8-21 (12 credentials) · TrustSection.tsx:22-43 marquee (5)
- [x] InstructorSection.tsx:6-19 team (Yatharth, Nensi)
- [x] Partners.tsx:27-52 OFFERINGS · BecomeTrainer.tsx:230-250,283-298 benefit cards · YatriStore.tsx:279-294 trust cards

## 6. Communities & logos
Tables: **`communities`**, **`tech_logos`**
- [x] Community.tsx:23,26-46 — CHANNEL_URL + 17 WhatsApp invites → `communities`
- [ ] Community.tsx:42-54 + CommunitySection globe photos (Unsplash placeholders!) — decorative, still static
- [ ] TechLogos.tsx:9-20 (10 logos) · CommunitySection.tsx:13-40 (6 logos+URLs) — decorative, no `tech_logos` table shipped

## 7. Contact, social, nav, footer, brand
Tables: **`site_settings`** (kv jsonb), **`nav_links`**, **`site_content`** (copy kv)
- [x] ContactSection.tsx:18-23,45 — email/phone/hours/city → `site_settings` contact
- [x] Footer.tsx:53-57 social · :29-51 link columns · :125-224 logo/blurb/tagline/credit → `site_settings` + `nav_links` (credit reads brand.designed_by)
- [x] Navbar.tsx:49-57 navLinks · :74,78,186,303 logo/brand/CTA → `nav_links`
- [x] Calendly URL ×3 (HeroSection:183,311 · CalendlyPopup:41) · GuideView.tsx:165 Discord · Partners.tsx:91 support email · CreateEvent.tsx:151-153 default organizer · razorpay.ts:54,56,197 display name/logo (main CTAs read `site_settings` booking; the rest are code level fallbacks and SDK config, accepted as static)

## 8. Legal, guides, email templates
Tables: **`legal_pages`**, **`guides`**, **`email_templates`**
- [x] PrivacyPolicy.tsx:24-113 · TermsOfService.tsx:24-109 → `legal_pages`
- [x] data/guides-content.ts (admin/user guides + sitemaps, used by GuideView) → `guides`
- [x] lib/email-templates.ts:6-183 (6 templates + brand colors/logo/social) → `email_templates`

## 9. Section eyebrows/headings (lower priority, migrate opportunistically → `site_content`)
IndustryLeaders:62-67 · Recognitions:46-51 · Trust · Curriculum:150-156 · LatestExamDumps:39-48 · HomeReviews:135-141 · Contact:61-65 · Community:273-281 · FAQ:59-67 · page heroes (Community/Partners/BecomeTrainer/Events/Training/Udemy/YatriStore/ExamDumps/RequestVoucher/Reviews/Review)

## 10. Geography reference (optional/last)
- [ ] lib/indian-locations.ts (city map incomplete — table would fix data quality) · lib/country-flag.ts

---

## Proposed NEW Supabase tables (minimal)
`site_settings(key pk, value jsonb)` · `site_content(key pk, value, group)` · `site_stats(key, value, label, sort)` ·
`promotions(label, discount_text, cta_label, cta_url, starts_at, ends_at, active)` ·
`cert_providers(slug, label, logo_url, logo_light_url, brand_color, sort, active)` ·
`provider_certifications(provider_slug, value, label, exam_code, level, sort, active)` ·
`faqs(question, answer, list_items[], sort, active)` · `team_members(name, role, image_url, portfolio_url, sort)` ·
`communities(name, url, tagline, logo_url, group, sort, active)` · `package_benefits` · `voucher_perks` ·
`certification_steps` · `recognitions` · `trust_features` · `partner_offerings` · `nav_links(location, label, href, sort)` ·
`tech_logos` · `legal_pages(slug pk, title, body_md)` · `guides(slug pk, title, body_md)` ·
`email_templates(key pk, subject, body_html)` · `course_taxonomy(kind, value, label, sort)` · `creators` ·
`store_categories` · `cert_levels` · `event_categories` · `sponsor_tiers` · `sponsorship_areas`
RLS pattern: public SELECT (active rows), admin-only writes — mirror existing policies.

## Proposed /admin additions (AdminLayout menu)
- **Site / Content:** Homepage & Marketing · Promotions · Team · FAQs · Site Settings · Navigation & Footer · Legal Pages · Email Templates · Guides
- **Certifications:** Providers · Certification Catalog · Tech Logos · Industry Leaders
- **Communities & Partners:** Communities · Partner Offerings
- **Option Lists:** Course Taxonomy · Creators · Store Categories · Cert Levels

## Sequencing
1. Dead-file cleanup → 2. `site_settings`+`site_stats`+`promotions` (kills drift in ~25 files) →
3. cert catalog (`cert_providers`+`provider_certifications`) → 4. homepage marketing tables →
5. communities/logos/nav → 6. taxonomy/option lists → 7. legal/guides/email →
8. events-config tables (post-migration) → 9. geography (optional).

---

## CTA / dead-button audit (complete — 180 files swept)
Store/cart/Razorpay, voucher, udemy, dumps, reviews, partners, certified-yatris, modals, and nearly all admin = **verified wired**. Hard findings:

- [x] **#1 Homepage provider cards** `sections/IndustryLeadersSection.tsx:92,118` — now real `<Link>` to each provider track
- [x] **#2 Footer quick links** `sections/Footer.tsx` handleHashScroll — falls back to `/#hash` navigation on non-home routes
- [x] **#4 "Share with a friend"** `pages/EventDetail.tsx:593` — navigator.share + clipboard fallback wired
- [x] **#5 "Fetch Address"** `pages/CreateEvent.tsx:831` — fake "Nexus Mall Koramangala" stub removed
- [x] **#6 "Start Quiz"** `pages/StudentTrainingDashboard.tsx:528` — dead button removed; quizzes tab shows an honest empty state until a quiz table exists
- [x] **#7 `/login` redirect** `StudentTrainingDashboard.tsx:56` — fixed, no `/login` reference remains
- [x] **#8 `/training/detail/:id`** `StudentTrainingDashboard.tsx:521` — fixed to `/training/:id`
- [x] **#9 "Submit for Approval"** `trainer/TrainerCourseEditor.tsx:353` — onClick now calls the real `submitForApproval()`
- [x] **#10 "Yatri AI" admin nav** `components/admin/AdminLayout.tsx:56` — nav item removed
- [x] **Calendly soft-fail (systemic)** — all booking CTAs now fall back to `window.open('https://calendly.com/yatricloud/40min')` when the script is blocked
- (dead file) PainPointsSection "Learn More" — file unrendered; handled by cleanup deletion
