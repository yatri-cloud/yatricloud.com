# SESSION-GUIDE.md — read this first every new session

> How Claude should behave when working on the **Yatri Cloud** redesign in a fresh session. Read this + `DESIGN.md` + `MEMORY.md` before touching any UI.

## 1. What this project is
**Yatri Cloud** — a cloud-certification platform (AWS/Azure/GCP/DevOps/K8s/Terraform), 50K+ learners. Vite + React + TS + Tailwind + shadcn/ui + Radix + Framer Motion + React Router (60+ routes) + Express `server.js`, on Vercel. Font: Inter Tight (body) + **Bricolage Grotesque** (display). *("practice-hub" is just the repo folder name — the brand is "Yatri Cloud".)*

## 2. The mission
A **complete visual redesign** to awwwards-tier craft. **Phase 1 (homepage + design system) is DONE.** Remaining: marketing pages, learning/dashboards, forms/modals, trainer portal, admin (order in `docs/product-requirements.md`).

## 3. The rules that never change
1. **DESIGN ONLY.** Change look/feel/motion — never routing, auth, API/`server.js`, data fetching, hooks, handlers, props, exported names, hrefs, or element `id=` attributes. If a visual goal needs a logic change, STOP and ask.
2. **Palette FROZEN.** Keep the existing blue `#007CFF` and all `src/index.css` token values. No new hues. New tokens are additive only. The blue scale is Tailwind **`brand-*`** — NEVER `blue-*` (that's Tailwind's default blue = off-palette).
3. **Single light theme.** No dark/light toggle (removed). Contrast = section **bands**: white · black (`#0a0a0a`/`#050505`) · blue · light-blue. Low saturation, professional.
4. **NO DUPLICATE UI.** Every section/page gets a distinct layout + signature motion. Consult `DESIGN.md` §10 (Section Creative Catalog) and pick a pattern not already used, or invent one. Never the generic icon+title+description card grid.
5. **Motion:** Framer Motion; transform/opacity/pathLength only; always `useReducedMotion()`-guarded; the global reduced-motion CSS guard exists.
6. **Icons = Lucide only.** Brand/tech logos = local SVGs in `public/logos/` via `LogoMarquee` (`@/components/TechLogos`).
7. **Accessibility:** 44px targets, visible focus, alt text, aria-labels, AA contrast.
8. **Voice ([docs/VOICE.md](VOICE.md)):** address the audience as **"Yatris"**; warm, human, trustworthy, emotional-but-honest copy (never generic AI filler). Add the time-based `<YatriGreeting/>` (`@/components/YatriGreeting`) to page headers. Warm empty/loading/error states with a next step.
9. **NO AI-generated `Sparkles` icons** (or ✨/✦ decoration). Icons = **Lucide only**, contextual (empty → `Inbox`/`PackageOpen`/`FileSearch`/`SearchX`/`CalendarX`; achievement → `Award`/`Trophy`/`Medal`). Only the greeting 👋 and rare 🎉 emoji are allowed.

## 4. How to work
- Read `DESIGN.md` (system + §10 catalog), `MEMORY.md` (decisions), and the persistent memory before editing.
- Read a component **fully** before restyling; preserve all logic verbatim.
- For multi-component work, spin up parallel subagents with a strict design-only contract + a UNIQUE creative brief per section (see how phase-1 agents were briefed in the memory progress file).
- After editing: run `npm run build` (must stay green) and sweep for off-palette classes: `grep -rE '(bg|text|border)-(blue|purple|pink|green|amber|red|indigo|teal|cyan)-[0-9]' src/…` (only `brand-*`/tokens allowed; dead data-array `gradient:`/`color:` fields are OK if not rendered).
- Verify visually at the dev server (`npm run dev`) when possible.

## 5. Working agreement — UPDATE DOCS EVERY TURN
After **each** meaningful change, update:
- **`DESIGN.md`** — new tokens, patterns, or a new entry in the §10 catalog.
- **`MEMORY.md`** (repo root) — a dated decision line.
- **Persistent memory** — `~/.claude/projects/<this-project>/memory/yatri-cloud-redesign-progress.md` (+ index in that dir's `MEMORY.md`).
This keeps future sessions from repeating layouts or breaking constraints.

## 5b. BACKEND (Supabase) — rules for the new workstream
The backend migrated from Google Apps Script/Sheets → **Supabase** (project `yatricloud.com`, id `lprejdcudtkuxjwghesv`, **ap-south-1 Mumbai**). Read `docs/SYSTEM-DESIGN.md` before backend work.
1. **No hardcoded credentials — EVER.** All keys live in git-ignored `.env` (template: `.env.example`). Frontend uses ONLY `VITE_SUPABASE_URL` + publishable/anon key; `SUPABASE_SECRET_KEY`/`SERVICE_ROLE_KEY`/`DB_PASSWORD` are server-side only.
2. **RLS is the security boundary** — every table has it. Public content (published events/products/dumps/courses, public reviews/certs) = anon-readable; form tables (contact/consultation/subscribers/course_requests/vouchers/submissions) = public INSERT + admin-only SELECT; payments = service-role writes only. Never weaken a policy to "fix" a bug.
3. **Schema changes = new numbered migration** in `supabase/migrations/` applied via psql (`PGPASSWORD` from .env; host `db.<project>.supabase.co`). Never mutate schema ad-hoc.
4. **Every frontend input must map to a DB column and vice versa** (user directive). Adding a form field → add column via migration. Unused columns → remove via migration. No orphan data either way.
5. **Data import** is idempotent: `scripts/supabase-import.mjs` (re-runnable, natural-key dedupe). Legacy Sheets stay read-only fallback; flag `VITE_USE_SUPABASE` gates the swap.
6. `src/lib/supabase.ts` is the single client. Don't create extra clients.
7. **Never paste secrets in chat**; after major changes remind the user to rotate exposed keys (Supabase secret/service_role + DB password were shared in chat on 2026-07-02 → rotate post-stabilization).
8. Do NOT import `credentials-admin.xlsx` plaintext passwords — admins come via Supabase Auth + `profiles.role='admin'`.

## 6. Key files
- `docs/SYSTEM-DESIGN.md` — backend architecture, schema, RLS model, migration plan
- `supabase/migrations/*.sql` — schema history (apply in order via psql)
- `scripts/supabase-import.mjs` — idempotent data importer
- `src/lib/supabase.ts` — the one Supabase client (+ `USE_SUPABASE` flag)
- `DESIGN.md` — design system + §10 creative catalog (source of truth)
- `MEMORY.md` — decision log (D1…)
- `docs/{brief,product-requirements,design-decisions}.md`
- `src/index.css` + `tailwind.config.ts` — tokens/utilities (additive)
- `src/components/ThemeProvider.tsx` — locked to light
- `src/components/TechLogos.tsx` — `LogoMarquee` + `public/logos/*.svg`
- `.claude/skills/ui-ux-pro-max/SKILL.md` — a11y/UX checklist
- `reference/moodboards/DESIGN-lovable.md` — craft reference
- Inspiration: awwwards.com · motionsites.ai · 21st.dev · getdesign.md · aitmpl.com

## 7. Definition of done (per surface)
Distinct non-duplicate layout · signature reduced-motion-safe motion · frozen palette · Lucide + local logos · AA a11y · `npm run build` green · docs + memory updated.
