# Dynamic-Content & CTA Audit — Master Checklist

> **Goal (user directive, 2026-07-02):** the WHOLE site must be fully dynamic — every content/data item
> (cert names, store, udemy, reviews, events, copy, stats, dropdowns…) manageable from **/admin** via
> Supabase, nothing hardcoded. AND every button/CTA must be clickable + functional end-to-end in production.
> This file is the living checklist. Update it as items ship.

## Status legend
- [ ] todo · [x] done · (dead) = file not rendered anywhere — delete, don't migrate

---

## 0. Cleanup first (zero-risk — dead files that duplicate live content)
- [ ] Delete `src/components/HeroSection.tsx` (legacy; live one is `sections/HeroSection`)
- [ ] Delete `src/components/Header.tsx`
- [ ] Delete `src/components/sections/PartnersMarquee.tsx`, `GraduatesMarquee.tsx`, `PainPointsSection.tsx`, `PricingSection.tsx`, `TestimonialsSection.tsx`, `FinalCTASection.tsx` (none imported by Index)
- [ ] Strip dead arrays from `src/data/courses.ts` (keep `Course` type) and `src/data/store-products.ts` (keep `Product` type + `categories` until store_categories table lands)

## 1. Certification catalog (BIGGEST — ~500 lines duplicated across 7+ files)
Tables: **`cert_providers`** + **`provider_certifications`** (+ optional `industry_leaders` view)
- [ ] `certified-yatris/CertificationForm.tsx:54,68,82-519` — PROVIDER_LOGOS + CERTIFICATION_PROVIDERS + 10 per-provider cert lists w/ exam codes
- [ ] `lib/certification-logos.ts:6` — CERTIFICATION_PROVIDER_LOGOS (12)
- [ ] `lib/training-api.ts:25` — PROVIDERS_DISPLAY (11)
- [ ] `pages/Review.tsx:26` — PROVIDERS (10 + brand hex)
- [ ] `pages/RequestVoucher.tsx:34` — PROVIDERS (11)
- [ ] `pages/Achievements.tsx:162` — _PROVIDER_KEYS (13)
- [ ] `sections/HeroSection.tsx:16` — CERT_TRACKS (6)
- [ ] `sections/IndustryLeadersSection.tsx:11-28` — 16 vendors + exam counts + blurbs + logos
- [ ] One-time import script for the catalog + Admin "Certifications" group (Providers / Catalog)

## 2. Site stats & trust numbers (drifting — values differ per file!)
Table: **`site_stats`** (key, value, label, sort_order)
- [ ] `sections/HeroSection.tsx:86-90` (50K+/4.8/6) · `TrustSection.tsx:45-50` (adds 95%) · `pages/Community.tsx:48-53` (17 communities/24/7) · `pages/Training.tsx:94-99` · `IndustryLeadersSection.tsx:74-78` (400K+)
- [ ] Inline "50,000+ / 4.8★" copy: Events.tsx:223, YatriStore.tsx:89/236/270/315, ExamDumps.tsx:67, Udemy.tsx:255/261, EventDetail.tsx:502, SEO.tsx:14 default desc

## 3. Promotions / offers ("50% OFF" scattered ~15 places)
Tables: **`promotions`** (+ `voucher_perks`)
- [ ] `sections/HeroSection.tsx:93-94,179` headline + CTA · `CertificationFlowSection.tsx:24,158,222,280` · `VoucherPromoSection.tsx:8-33,69-83,150` · `CommunitySection.tsx:286` chips · `YatriStore.tsx:89,236` · `RequestVoucher.tsx:428`

## 4. Dropdown / option lists (business config, duplicated public↔admin)
Tables: **`course_taxonomy`** (kind: tech|category|level), **`creators`**, **`store_categories`**, **`cert_levels`**; events config → `event_categories`, `sponsor_tiers`, `sponsorship_areas`
- [ ] Udemy.tsx:32-55 + admin/UdemyAdmin.tsx:29-44 — CREATORS/TECH_OPTIONS/CATEGORY_OPTIONS (dup)
- [ ] data/store-products.ts:19 + AddProduct.tsx:24,179-185 + admin/AdminAddProduct.tsx:19 — store categories (dup 3×)
- [ ] AddProduct.tsx:31,203-206 + admin/AdminAddProduct.tsx:26 — product levels
- [ ] TrainingDetail.tsx:69,166 — course levels
- [ ] Events.tsx:110 categories · CreateEvent.tsx:294,1319-23 sponsor tiers · SponsorSubmissionForm.tsx:31 areas (post-events-migration)
- Review.tsx:24 RATINGS [1-5] — keep static (fixed scale)

## 5. Marketing content lists (homepage cards/features)
Tables: **`package_benefits`**, **`voucher_perks`**, **`certification_steps`**, **`eligible_exams`**, **`recognitions`**, **`trust_features`**, **`team_members`**, **`partner_offerings`**
- [ ] CertificationFlowSection.tsx:22-53 bonusFeatures · :6-20 eligible AWS exams (+ FAQSection.tsx:22-30 dup) · :55-81 3-step flow (+ HeroSection.tsx:261-277 dup)
- [ ] RecognitionsSection.tsx:8-21 (12 credentials) · TrustSection.tsx:22-43 marquee (5)
- [ ] InstructorSection.tsx:6-19 team (Yatharth, Nensi)
- [ ] Partners.tsx:27-52 OFFERINGS · BecomeTrainer.tsx:230-250,283-298 benefit cards · YatriStore.tsx:279-294 trust cards

## 6. Communities & logos
Tables: **`communities`**, **`tech_logos`**
- [ ] Community.tsx:23,26-46 — CHANNEL_URL + 17 WhatsApp invites
- [ ] Community.tsx:42-54 + CommunitySection globe photos (Unsplash placeholders!)
- [ ] TechLogos.tsx:9-20 (10 logos) · CommunitySection.tsx:13-40 (6 logos+URLs)

## 7. Contact, social, nav, footer, brand
Tables: **`site_settings`** (kv jsonb), **`nav_links`**, **`site_content`** (copy kv)
- [ ] ContactSection.tsx:18-23,45 — email/phone/hours/city
- [ ] Footer.tsx:53-57 social · :29-51 link columns · :125-224 logo/blurb/tagline/credit
- [ ] Navbar.tsx:49-57 navLinks · :74,78,186,303 logo/brand/CTA
- [ ] Calendly URL ×3 (HeroSection:183,311 · CalendlyPopup:41) · GuideView.tsx:165 Discord · Partners.tsx:91 support email · CreateEvent.tsx:151-153 default organizer · razorpay.ts:54,56,197 display name/logo

## 8. Legal, guides, email templates
Tables: **`legal_pages`**, **`guides`**, **`email_templates`**
- [ ] PrivacyPolicy.tsx:24-113 · TermsOfService.tsx:24-109
- [ ] data/guides-content.ts (admin/user guides + sitemaps, used by GuideView)
- [ ] lib/email-templates.ts:6-183 (6 templates + brand colors/logo/social)

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

- [ ] **#1 Homepage provider cards** `sections/IndustryLeadersSection.tsx:92,118` — look clickable (hover-lift + arrow) but NO handler → link each card to its provider track
- [ ] **#2 Footer quick links** `sections/Footer.tsx` handleHashScroll — dead on all non-home routes → `navigate("/" + hash)` fallback
- [ ] **#4 "Share with a friend"** `pages/EventDetail.tsx:593` — no handler → navigator.share + clipboard fallback
- [ ] **#5 "Fetch Address"** `pages/CreateEvent.tsx:831` (handler :180) — setTimeout STUB injects fake "Nexus Mall Koramangala" data → remove or real geocode
- [ ] **#6 "Start Quiz"** `pages/StudentTrainingDashboard.tsx:528` — no handler + quizzes hardcoded `[]` → hide tab until quiz table exists *(training-agent files)*
- [ ] **#7 `/login` redirect** `StudentTrainingDashboard.tsx:56` — route doesn't exist → 404 for logged-out students *(training-agent files)*
- [ ] **#8 `/training/detail/:id`** `StudentTrainingDashboard.tsx:521` — wrong route → `/training/:id` *(training-agent files)*
- [ ] **#9 "Submit for Approval"** `trainer/TrainerCourseEditor.tsx:353` — onClick only flips a spinner flag; real `submitForApproval()` (:246) never called → trainers can NEVER submit *(training-agent files)*
- [ ] **#10 "Yatri AI" admin nav** `components/admin/AdminLayout.tsx:56` — `/admin/ai` route removed → remove nav item
- [ ] **Calendly soft-fail (systemic)** — all "Get Your 50% OFF"/"Book Now"/"Schedule Meet" CTAs guard on `if (window.Calendly)` and silently no-op if the script is blocked; CertificationFlowSection fallback `querySelector("#")` THROWS → add `else window.open('https://calendly.com/yatricloud/40min')` everywhere
- (dead file) PainPointsSection "Learn More" — file unrendered; handled by cleanup deletion
