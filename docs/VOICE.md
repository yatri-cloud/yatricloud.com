# VOICE.md — Yatri Cloud brand voice & content psychology

> How we write. Read with `DESIGN.md`. Content should feel **human, warm, personal, and trustworthy** — never generic AI filler. Every page's copy + structure follows this.

## 1. Who we talk to — "Yatris"
We call our audience **Yatris** (travellers on a cloud-career journey). Address them directly and warmly.
- Use **"Yatris"** (or "Yatri" singular), **never** "everyone / users / folks / guys".
- Time-aware greeting where a page has a header/hero: **"Good morning, Yatris 👋"** / afternoon / evening — use `<YatriGreeting/>` (`@/components/YatriGreeting`), which reads the visitor's local time. The 👋 waves.
- Second person ("you", "your exam", "your career"), present tense, active voice.

## 2. Emotional spine (why people are here)
Yatris are goal-driven, time-pressured, often anxious about cost and passing. Speak to the feeling, then back it with proof:
- **Aspiration:** the certified, higher-paid, respected version of them ("Get certified. Get hired. Get ahead.").
- **Relief on cost:** 50% OFF = "focus on learning, not the price tag."
- **Confidence:** "pass on your first attempt", "verified", "you're not doing this alone."
- **Belonging:** the Yatris community, Wall of Fame, real people (not stock).

## 3. Trust signals (use real numbers, never invent)
Weave in proof near every claim: **50K+ learners · 4.8★ · 6 cloud tracks · real testimonials · exam dumps that are verified · LinkedIn recommendation · Wall of Fame**. Certified-by-employer angle. Show faces of real Yatris. (Competitor benchmark: platforms lead with pass-rate + review counts + "trusted by N learners" + hands-on.)

## 4. Content structure per page (psychology order)
1. **Personal greeting + promise** (greeting → one-line transformation)
2. **Proof** (numbers / logos / faces) early, to earn the read
3. **What you get** (concrete, scannable — not fluffy adjectives)
4. **How it works** (reduce uncertainty; 3 steps max)
5. **Social proof** (testimonials, faces, community)
6. **One clear CTA** (warm, low-risk: "Start free", "Join the Yatris")
7. **Reassurance** near the CTA (free, no risk, support included)

## 5. Microcopy patterns
- **Empty states:** warm + a next step. e.g. "No dumps here yet, Yatris — fresh verified sets drop often. [Request one]" (NOT a bare "No data").
- **Loading:** "Loading your dumps…" not "Loading…".
- **Buttons:** action + benefit ("Get 50% OFF", "Join the community — it's free").
- **Errors:** human + recovery path ("That didn't load — retry?").
- **Confirmations/success:** celebrate ("You're in, Yatri! 🎉" — sparingly).

## 6. Do / Don't
**Do:** short sentences; specific nouns; one idea per line; warmth + credibility together; real names/faces; India-friendly, globally clear.
**Don't:** generic AI phrasing ("Unlock the power of…", "Elevate your…", "In today's fast-paced world"); walls of adjectives; "everyone/users"; **AI-generated sparkle ✨/✦ icons** as decoration; emojis as structural icons (the greeting 👋 and rare celebration 🎉 are the allowed exceptions).

### 6b. Anti AI-tell rules (user directive, 2026-07-02 — applies to ALL site copy)
- **No "-" dashes inside sentences.** No em dashes, no "cost‑effective" style hyphen chains. Write it as two words or rephrase. ("First attempt confidence", not "first-attempt confidence". "Get certified and get hired", not "Get certified — get hired".) Product names that officially contain a hyphen (SAA-C03 exam codes, T-shirt sizes) are fine.
- **Simple everyday English.** Most Yatris read English as a second language. Prefer "help" over "facilitate", "use" over "leverage", "start" over "commence". If a 12 year old would stumble on a word, pick a simpler one.
- **Personal and emotional first.** Every heading should feel like a friend talking, not a brochure. Lead with the feeling (relief, pride, belonging) and back it with a real number.

## 6c. SEO rules (user directive, 2026-07-02 — every page, always)
Goal: maximum discoverability. Every route ships with:
- Unique **title** (under 60 chars) + **meta description** (under 160 chars) written in searchable words people actually type: "aws certification voucher discount", "free cloud practice tests", "azure exam dumps", "kubernetes certification course".
- **OpenGraph + Twitter card** tags (title, description, image, url) so shares look rich on LinkedIn and WhatsApp.
- **Canonical URL** per page.
- **JSON-LD structured data** where it fits: Organization + WebSite (sitewide), Course (training/udemy), Event (events), Product (store/dumps/vouchers), FAQPage (FAQ section), AggregateRating (reviews).
- `public/robots.txt` + `public/sitemap.xml` kept current when routes change.
- SEO copy follows the same voice rules above: simple, human, no dashes.

## 7. Icons
UI icons = **Lucide only**, contextual and meaningful. Replace decorative `Sparkles` with the right icon (empty search → `FileSearch`/`SearchX`; empty list → `Inbox`/`PackageOpen`; achievement → `Award`/`Trophy`; idea → `Lightbulb`). Brand/tech logos = `LogoMarquee` (local SVGs).

## 8. One-liners to reuse (edit to fit, keep honest)
- "Focus on learning, not the price tag."
- "Get certified. Get hired. Get ahead."
- "You're not studying alone — 50,000+ Yatris are on the journey with you."
- "Verified dumps. Real support. First-attempt confidence."
