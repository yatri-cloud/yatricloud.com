# CLAUDE.md — Yatri Cloud

> Project brief Claude reads every session. Keep it short; deep detail lives in the linked docs.

## What this is
**Yatri Cloud — Master IT Certifications.** (Brand name: **Yatri Cloud**; the `yatri-practice-hub` folder name is incidental.) A free cloud-certification platform (AWS · Azure · GCP · DevOps · Kubernetes · Terraform): practice tests, study guides, exam dumps, video/Udemy courses, community events, a voucher store, a trainer portal, and an admin dashboard. ~50K+ learners, 4.8★.

**Stack:** Vite + React 18 + TypeScript · React Router v6 (60+ routes) · Tailwind CSS · shadcn/ui + Radix (49 primitives) · Framer Motion · TanStack Query · Express (`server.js`) · deployed on Vercel. Font: **Inter Tight**. Theme: custom `ThemeProvider` (light/dark via `.dark` class + localStorage), **dark by default**.

## Current initiative: COMPLETE UI REDESIGN (design-only)
We are re-skinning the **entire** app to a Lovable-grade craft standard while keeping our **blue** identity and a true **light/dark** system.

**The one rule:** change how it **looks, feels, and moves** — never routing, auth, API calls, data fetching, state, props, or business logic. If a change would alter behavior, stop and flag it. See [docs/design-decisions.md](docs/design-decisions.md).

## New session? Start here
Read **[docs/SESSION-GUIDE.md](docs/SESSION-GUIDE.md)** first — how to behave, the hard rules, and the workflow. A paste-ready kickoff prompt is in **[docs/NEW-SESSION-PROMPT.md](docs/NEW-SESSION-PROMPT.md)**.

**Working agreement:** after *every* meaningful change, update `DESIGN.md` (patterns/tokens/§10 catalog), `MEMORY.md` (decision line), and the persistent memory progress file. **No duplicate UI** — each section/page gets a distinct layout + signature motion (see DESIGN.md §10).

## Read these before UI work
- **[DESIGN.md](DESIGN.md)** — the design system: tokens (light+dark), typography, components, section banding, motion. **Source of truth.**
- **[docs/brief.md](docs/brief.md)** — product goal, audience, scope.
- **[docs/product-requirements.md](docs/product-requirements.md)** — pages, flows, redesign scope per surface.
- **[docs/design-decisions.md](docs/design-decisions.md)** — why choices were made + the design-only guardrails.
- **[docs/VOICE.md](docs/VOICE.md)** — brand voice: audience = "Yatris", time-based greeting, psychology-driven emotional+trustworthy copy, no AI-sparkle icons.
- **[.claude/skills/ui-ux-pro-max/SKILL.md](.claude/skills/ui-ux-pro-max/SKILL.md)** — accessibility/UX rulebook + pre-delivery checklist.
- **[reference/moodboards/DESIGN-lovable.md](reference/moodboards/DESIGN-lovable.md)** — the craft reference we borrow discipline from (not its palette).
- **[MEMORY.md](MEMORY.md)** — long-term decisions & context for this project.

## Working agreements
- **Preserve every existing CSS token name** in `src/index.css` (the 49 shadcn primitives depend on them). New tokens are additive.
- Keep blue = `hsl(210 100% 50%)` (`#007CFF`). No second saturated accent.
- Design light **and** dark together; verify AA contrast in each independently.
- All motion respects `prefers-reduced-motion`; animate transform/opacity only.
- Don't reformat or "clean up" logic files you're only re-skinning — touch styling/markup, leave handlers and data flow intact.
- Inspiration: awwwards.com · motionsites.ai · 21st.dev · getdesign.md · aitmpl.com.

## Commands
- `npm run dev` — Vite dev server · `npm run dev:all` — server + client · `npm run build` · `npm run lint`
