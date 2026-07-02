# NEW-SESSION-PROMPT.md

> Paste the block below at the start of any new Claude Code session for the Yatri Cloud redesign.

---

You are continuing the **Yatri Cloud** platform build (UI redesign + Supabase backend). Before doing anything, read these in the repo:
`docs/SESSION-GUIDE.md` (incl. §5b backend rules), `DESIGN.md` (esp. §10 Section Creative Catalog), `docs/SYSTEM-DESIGN.md` (backend), `MEMORY.md`, and `docs/product-requirements.md`. Also load the persistent memory for this project.

**Backend state:** Supabase project `yatricloud.com` (lprejdcudtkuxjwghesv, ap-south-1 Mumbai) is LIVE with 22 RLS-secured tables, 5 storage buckets, and all legacy data imported (users/certs/reviews/courses/products/dumps/forms/events). Credentials in git-ignored `.env` only — never hardcode, never paste secrets in chat. Schema changes = new migration in `supabase/migrations/` via psql. Forms wired so far: contact, partners consultations, footer newsletter. Remaining: swap read paths (reviews/udemy/products/dumps/certs/events) from Sheets→Supabase behind `VITE_USE_SUPABASE`, auth swap, payments Edge Functions, frontend↔DB column audit.

**STATUS (as of 2026-07-02):** Homepage/foundation + the **entire `/admin` console** are redesigned (collapsible sidebar, blue-tinted header bands, editorial `StatsCard`, numbered form section-headers, solid delete-button hovers). Greeting = **home page only**. Hero has **no offer pill**. ⚠️ **The work is UNCOMMITTED and the tree keeps getting reverted externally** (the Hero pill returned 6× last session). **DO THIS FIRST:** run `git status`, confirm the Hero `HeroSection.tsx` has no "Women's Day"/`Gift` pill, then **commit on a branch** before making changes. See MEMORY.md D18–D23 for details. Remaining surfaces: learning dashboards, trainer/*, account, misc/legal (list at end of persistent progress file).

Follow these hard rules:
- **DESIGN ONLY** — change look/feel/motion, never routing, auth, API, data fetching, hooks, handlers, props, exports, hrefs, or element `id`s. If a visual goal needs a logic change, stop and ask.
- **Palette frozen** — keep blue `#007CFF` and all existing `src/index.css` tokens; no new hues; blue scale is Tailwind `brand-*` (never `blue-*`).
- **Single light theme** — no dark/light toggle. Contrast via section bands: white · black · blue · light-blue. Professional, low saturation.
- **No duplicate UI** — every section/page gets a DISTINCT layout + signature motion. Check `DESIGN.md` §10 and don't reuse a spent pattern; never the generic icon+title+description card grid.
- **Motion** = Framer Motion, transform/opacity only, `useReducedMotion`-guarded.
- **Icons** = Lucide only; brand/tech logos = local SVGs in `public/logos/` via `LogoMarquee` (`@/components/TechLogos`).
- **Accessibility** = 44px targets, visible focus, alt text, aria-labels, AA contrast.

Workflow: read each component fully before restyling; preserve all logic verbatim; for multi-file work use parallel subagents with a strict design-only contract + a unique creative brief per section. After each change: `npm run build` must stay green, sweep for off-palette classes, and **update `DESIGN.md` + `MEMORY.md` + the persistent memory progress file**.

Today I want you to: **<DESCRIBE THE TASK — e.g., "redesign the Events + Store pages" or "build the Training dashboard">**. First give me a short plan (which surface, which creative pattern per section from a fresh angle), then implement.

---
