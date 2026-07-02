# Design Decisions — why we chose what we chose

> The reasoning trail. Mirrors [../MEMORY.md](../MEMORY.md) decision IDs; this file explains the *why*.

## The prime directive: DESIGN ONLY
**Decision:** the redesign changes only look/feel/motion. No routing, auth, API, data fetching, state, props, or logic changes.
**Why:** the app is live with 50K+ users and 60+ routes; the user explicitly asked to "change complete UI... don't change anything except design completely." Isolating the diff to styling/markup keeps risk near-zero and makes review trivial.
**How to apply:** edit classNames, tokens, markup structure, and Framer Motion wrappers. Leave event handlers, hooks, query calls, and props untouched. If a visual goal seems to need a logic change, stop and ask.

## D1 — Keep blue, borrow Lovable's craft (not its palette)
**Why:** Lovable's excellence is in *discipline* — opacity-derived neutrals, tactile inset depth, border-first containment, editorial whitespace, tight display type — not in its specific cream/Camera-Plain look. Yatri Cloud's blue `#007CFF` is an established brand asset and reads as trustworthy/technical for cloud certs. So we transplant the craft onto our blue + monochrome canvas.
**How:** follow DESIGN.md tokens; blue is the only saturated accent.

## D2 — Preserve existing token names
**Why:** 49 shadcn/ui primitives read `--primary`, `--card`, `--border`, etc. Renaming would ripple through every component. Keeping names lets us re-theme the whole app by editing `src/index.css` values + adding tokens.
**How:** additive tokens only (blue scale, shadow scale, motion vars, band vars, status colors).

## D3 — Palette is FROZEN (colors unchanged)
**Why:** the user was emphatic — keep the existing **blue (main logo color)** and the whole existing palette; do not repaint any UI colors. The redesign changes layout, type, spacing, depth, structure, and motion only.
**How:** reproduce all `src/index.css` values verbatim; introduce no second accent. Any contrast tweak (light muted `45→40%`, dark muted `60→62%`, dark destructive `30→45%`) is **optional, OFF by default, and requires explicit approval** (DESIGN.md §2.6).

## D4 — "Light/dark" means two things
**Why:** the user clarified it's not just the theme toggle — they want **alternating section bands** (white ↔ near-black ↔ blue-tint) within a single theme, the way Lovable and awwwards landing pages create rhythm, chosen by **education-platform psychology**.
**How:** DESIGN.md §5b defines base/alt/tint bands that flip tokens together; max 2–3 switches per page; inversion reserved for hero/proof/CTA; work surfaces (dashboards/admin) stay quiet base-band; marketing pages more dramatic. Psychology: trust first → calm focus for reading → motivation on CTAs/progress → reduced cognitive load.

## D5 — Motion is a first-class deliverable
**Why:** the user wants "layout animation everything creative" (awwwards/motionsites energy). Framer Motion is already installed.
**How:** purposeful entrances/state/hover; transform/opacity only; staggered reveals; every animation `prefers-reduced-motion` guarded and interruptible. Motion tokens in DESIGN.md §6.

## D6 — Adopt the design-project doc structure
**Why:** the user shared Nick Babich's Claude-Code design-project layout and asked to "set up all in root folder."
**How:** created `CLAUDE.md`, `DESIGN.md`, `MEMORY.md`, `docs/{brief,product-requirements,design-decisions}.md`, `reference/` folders, and staged references under `.claude/skills/` and `reference/moodboards/`.

## Open decisions (need user input)
- **Default theme:** currently dark-by-default — keep, or switch to light-first / system?
- **Rollout order:** proposed design-system → homepage → shell → inner pages → dashboards/admin. Confirm.
- **Hero display font:** keep Inter Tight everywhere, or add one distinctive display face for headings?
