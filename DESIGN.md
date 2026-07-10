# DESIGN.md — Yatri Cloud Design System

> **Visual identity, design rules, and UI direction. Claude reads this before any UI work.**
> Craft standard: [Lovable](reference/moodboards/DESIGN-lovable.md)-grade discipline, applied to Yatri Cloud's **blue** identity.
> Governance: [UI/UX Pro Max](.claude/skills/ui-ux-pro-max/SKILL.md) rules (accessibility, touch, performance).
>
> **Hard constraint for this redesign: DESIGN ONLY.** Change how it *looks, feels, and moves* — never routing, auth, API calls, state, props, or business logic. See [docs/design-decisions.md](docs/design-decisions.md).

---

> **⚑ SINGLE THEME (updated 2026-07-02).** The light/dark **toggle was removed** — the site ships **ONE fixed professional theme**: white canvas, near-black ink, blue accent. Contrast now comes entirely from per-section **background bands** (white · black · blue · light-blue — see §5b), not a theme switch. The `.dark` tokens in §2.2 are retained for reference but are **inactive**. `ThemeProvider`/`useTheme` still exist (locked to `light`) so consumers keep working. Palette is otherwise unchanged and frozen.

## 0. North Star

Yatri Cloud is a **cloud-certification platform** (AWS · Azure · GCP · DevOps · Kubernetes · Terraform) — 50K+ learners, 4.8★. *(Brand name is "Yatri Cloud"; the repo folder name is incidental.)* The redesign should feel like a **confident, modern cloud-SaaS product**: calm monochrome canvas, one decisive blue, editorial spacing, and motion that *explains* rather than decorates.

We borrow Lovable's **craft principles** — opacity-driven neutrals, tactile inset depth, border-based containment, tight display typography, generous whitespace — but we keep **our blue accent and a true light/dark system** (white canvas ↔ near-black canvas). We do **not** adopt Lovable's cream palette or its Camera Plain typeface.

**Inspiration board:** [awwwards.com](https://awwwards.com) · [motionsites.ai](https://motionsites.ai) · [21st.dev](https://21st.dev) · [getdesign.md](https://getdesign.md) · [aitmpl.com](https://aitmpl.com)

---

## 1. Visual Theme & Atmosphere

The system sits on a **monochrome canvas with a single, decisive blue** (`#007CFF` / `hsl(210 100% 50%)`). Light mode is pure-white paper; dark mode is near-black (`hsl(0 0% 4%)`) — both first-class, designed **together**, never one inferred from the other.

Depth is **shallow and honest**: containment comes from hairline borders against the canvas, not floating drop-shadows. The one signature elevation is a **tactile inset** on primary buttons and a **soft blue glow** reserved for hero/focus moments. Grays are **opacity-derived from the foreground ink**, giving the whole surface one tonal family instead of a bag of arbitrary hexes.

**Key characteristics**
- Monochrome canvas + one blue accent — restraint is the brand.
- Single fixed light theme (`#ffffff` canvas); depth/contrast via section bands, not a toggle.
- Opacity-driven neutrals: all grays derive from `--foreground` at set alphas.
- Border-first containment (`--border` hairline), shadows used sparingly.
- Signature blue glow (`--glow-blue`) for hero and focus — never on every card.
- Inter Tight, tight tracking at display sizes for editorial confidence.
- Radius system anchored at `--radius: 0.75rem`; full-pill for chips/toggles.
- Framer Motion for entrances/state; every motion respects `prefers-reduced-motion`.

---

## 2. Color Palette & Roles

> **⚑ COLORS ARE FROZEN.** Per the user: keep the **existing blue (main logo color) and the existing palette unchanged.** The tables below are the **current** `src/index.css` values, reproduced verbatim — we do **not** repaint them. Blue stays `hsl(210 100% 50%)` (`#007CFF`), no second accent is introduced. The redesign changes **layout, type, spacing, depth, structure, and motion — never the colors.** Any contrast tweak is *optional and requires the user's OK first* (see §2.6).
>
> **⚑ AA EXCEPTION (2026-07-04, user-approved via "PageSpeed 100% in all").** White on `#0080FF` is 3.79:1 — a hard WCAG-AA failure Lighthouse flags. Interactive tokens therefore moved: **light** `--primary`/`--accent` → `210 100% 44%` (4.78:1 with white); **dark** flips to the standard accessible pair — `--primary` `210 100% 62%` with near-black `--primary-foreground` `214 60% 10%` (6.4:1 fills, 7.1:1 links), plus dark overrides `--blue-600: 210 100% 68%` (hover), `--blue-50/100` as deep navy washes. Light `--muted-foreground` → `0 0% 38%` (45% failed on band tints). **Brand identity is untouched:** `--blue-500`, `--band-blue`, logos and gradients stay `#007CFF`.

All values are **HSL triplets** consumed as `hsl(var(--token))`, matching the existing `src/index.css`. **Preserve every existing token name and value** — the 49 shadcn/ui primitives depend on them. New tokens (blue scale, shadows, motion, bands) are additive and only affect *new* usages, never existing colors.

### 2.1 Semantic tokens — LIGHT (`:root`)

| Token | Value (HSL) | Role |
|---|---|---|
| `--background` | `0 0% 100%` | Page canvas (white) |
| `--foreground` | `0 0% 9%` | Primary ink |
| `--card` | `0 0% 98%` | Card / raised surface |
| `--card-foreground` | `0 0% 9%` | Text on cards |
| `--popover` | `0 0% 100%` | Menus, popovers (↑ to pure white for lift) |
| `--popover-foreground` | `0 0% 9%` | Text in popovers |
| `--primary` | `210 100% 50%` | **Blue** — CTAs, links, active |
| `--primary-foreground` | `0 0% 100%` | Text on blue |
| `--secondary` | `0 0% 96%` | Quiet surfaces, secondary buttons |
| `--secondary-foreground` | `0 0% 9%` | Text on secondary |
| `--muted` | `0 0% 96%` | Muted fills |
| `--muted-foreground` | `0 0% 45%` | Captions, meta |
| `--accent` | `210 100% 50%` | Accent = blue |
| `--accent-foreground` | `0 0% 100%` | Text on accent |
| `--destructive` | `0 84.2% 60.2%` | Danger |
| `--destructive-foreground` | `0 0% 98%` | Text on danger |
| `--border` | `0 0% 90%` | Hairline dividers, card edges |
| `--input` | `0 0% 90%` | Input borders |
| `--ring` | `210 100% 50%` | Focus ring (blue) |
| `--radius` | `0.75rem` | Base corner radius |

*(All light values above are the current `src/index.css` values, unchanged.)*

### 2.2 Semantic tokens — DARK (`.dark`)

| Token | Value (HSL) | Role |
|---|---|---|
| `--background` | `0 0% 4%` | Page canvas (near-black) |
| `--foreground` | `0 0% 98%` | Primary ink |
| `--card` | `0 0% 7%` | Card surface (one step up from canvas) |
| `--card-foreground` | `0 0% 98%` | Text on cards |
| `--popover` | `0 0% 9%` | Menus (lift above cards) |
| `--popover-foreground` | `0 0% 98%` | Text in popovers |
| `--primary` | `210 100% 50%` | **Blue** (same hue both themes) |
| `--primary-foreground` | `0 0% 100%` | Text on blue |
| `--secondary` | `0 0% 12%` | Quiet surfaces |
| `--secondary-foreground` | `0 0% 98%` | Text on secondary |
| `--muted` | `0 0% 15%` | Muted fills |
| `--muted-foreground` | `0 0% 60%` | Captions, meta |
| `--accent` | `210 100% 50%` | Accent = blue |
| `--destructive` | `0 62.8% 30.6%` | Danger |
| `--border` | `0 0% 18%` | Hairline dividers |
| `--input` | `0 0% 18%` | Input borders |
| `--ring` | `210 100% 50%` | Focus ring |

*(All dark values above are the current `src/index.css` values, unchanged.)* Test each theme independently — never infer dark from light.

### 2.3 Blue accent scale (NEW — additive, optional)

Your **existing blue is unchanged**. This is an *optional* tonal ramp of the **same hue (210)** so new hover/pressed/tint states can have depth — it never overrides `--primary` or recolors anything that exists today. Skip it entirely if you prefer the single flat blue.

```
--blue-50:  210 100% 97%
--blue-100: 210 100% 93%
--blue-200: 210 100% 85%
--blue-300: 210 100% 74%
--blue-400: 210 100% 62%
--blue-500: 210 100% 50%   /* = --primary */
--blue-600: 210 100% 44%
--blue-700: 212 100% 38%
--blue-800: 214 95%  30%
--blue-900: 216 90%  22%
```

Use `--blue-50/100` for hover tints & badges, `--blue-600/700` for pressed/active, `--blue-500` for the canonical accent.

### 2.4 Existing brand tokens (preserve)

```
--gradient-blue: linear-gradient(135deg, hsl(210 100% 50%), hsl(200 100% 55%));
--gradient-dark: linear-gradient(180deg, hsl(0 0% 98%), hsl(0 0% 95%));   /* dark: (4%)→(8%) */
--glow-blue:  0 0 60px hsl(210 100% 50% / 0.2);   /* dark: /0.3 */
--glow-soft:  0 0 40px hsl(210 100% 50% / 0.1);   /* dark: /0.15 */
```

### 2.5 Semantic status (NEW — additive)

```
--success: 152 60% 42%   /* light */   |  152 55% 48% /* dark */
--warning:  38 92% 50%   /* light */   |   38 92% 55% /* dark */
--info:     = --primary (blue)
```
Always pair status color with an **icon or text label** — never color alone (`color-not-only`).

### 2.6 Optional contrast tweaks (needs user approval — OFF by default)
The palette ships **unchanged**. If, during QA, a caption or danger state fails WCAG AA, these are the *only* nudges we'd propose — and only with the user's explicit OK:
- light `--muted-foreground` `45% → 40%`; dark `60% → 62%`
- dark `--destructive` lightness `30.6% → ~45%`

Until approved, **do not apply these** — keep the existing values verbatim.

---

## 3. Typography

**Family:** `Inter Tight` (body) + `Bricolage Grotesque` (display). **Self-hosted since 2026-07-04** via `@fontsource-variable/*` imported in `main.tsx` — family names are `'Inter Tight Variable'` / `'Bricolage Grotesque Variable'` (see `tailwind.config.ts` + `--font-display`). The old render-blocking Google Fonts `@import`s are gone; do not re-add them.

**Principle:** hierarchy through **size + tracking + weight discipline**, not weight sprawl. Body/UI at **400–500**; headings at **600–700**; `800/900` reserved for a single hero numeral or stat.

| Role | Size | Weight | Line-height | Letter-spacing |
|---|---|---|---|---|
| Display / Hero | 60px (3.75rem) → clamp | 700 | 1.05 | -0.02em |
| H1 / Section | 40px (2.5rem) | 700 | 1.1 | -0.02em |
| H2 | 32px (2rem) | 600 | 1.15 | -0.015em |
| H3 | 24px (1.5rem) | 600 | 1.2 | -0.01em |
| Card title | 20px (1.25rem) | 600 | 1.25 | normal |
| Body large | 18px (1.125rem) | 400 | 1.5 | normal |
| Body | 16px (1rem) | 400 | 1.6 | normal |
| Button / Label | 14–16px | 500 | 1.4 | normal |
| Caption / Meta | 13–14px | 400–500 | 1.45 | normal |

**Rules**
- Body base **16px** (mobile too — avoids iOS auto-zoom).
- Fluid display: `clamp(2rem, 6vw, 3.75rem)` for hero headings.
- Tighten tracking as size grows; **never** loosen tracking on body.
- Numbers in tables/stats/prices: `font-variant-numeric: tabular-nums`.
- Line length 60–75ch desktop, 35–60ch mobile.

---

## 4. Component Styling

### Buttons
- **Primary (blue):** `bg hsl(var(--primary))`, `text hsl(var(--primary-foreground))`, radius `calc(var(--radius) - 2px)` (~10px), padding `10px 18px`, weight 500. **Signature inset:** `inset 0 0.5px 0 hsl(0 0% 100% / .25), inset 0 0 0 0.5px hsl(0 0% 0% / .2), 0 1px 2px hsl(0 0% 0% / .08)`. Hover → `--blue-600`; active → `--blue-700` + `scale(.98)`; focus-visible → `--ring` + `--glow-soft`.
- **Secondary / Ghost:** transparent or `--secondary`, `1px solid hsl(var(--border))`, text `--foreground`. Hover → `--blue-50` tint (light) / `--secondary` lift (dark).
- **Destructive:** `--destructive` bg, always paired with confirm dialog for irreversible actions.
- Min hit area **44×44px**; add `touch-action: manipulation`.

### Cards & containers
- Surface `hsl(var(--card))`, `1px solid hsl(var(--border))`, radius `var(--radius)` (12px), **no default drop-shadow**.
- Hover (interactive cards only): border → `--blue-200` (light) / `--border` lighten (dark) + `translateY(-2px)` + `--shadow-card`. Motion ≤200ms.
- Featured/hero cards may use `--glow-soft`; ordinary cards stay flat.

### Inputs & forms
- `bg --background`, `1px solid hsl(var(--input))`, radius `calc(var(--radius) - 2px)`, height ≥44px.
- Focus: `2px` ring `hsl(var(--ring))` + subtle `--glow-soft`. Never remove focus ring.
- **Visible label** above every field (not placeholder-only). Error text **below** the field, `role="alert"`, `--destructive` + icon. Validate on blur.

### Navigation (Navbar)
- Fixed, `z-50`. At top: transparent/canvas. On scroll: `backdrop-blur` glass — `bg hsl(var(--background) / .72)` + `1px solid hsl(var(--border))`.
- Links `--muted-foreground` → `--foreground` on hover; **active route** gets `--primary` + weight 500 indicator (`nav-state-active`).
- Right cluster: theme toggle, auth menu, primary CTA (blue). Mobile: hamburger → full-height sheet, ≥44px targets, respects safe-area.

### Depth & elevation scale (NEW tokens)
```
--shadow-inset:    inset 0 0.5px 0 hsl(0 0% 100% / .25), inset 0 0 0 0.5px hsl(0 0% 0% / .2), 0 1px 2px hsl(0 0% 0% / .08);
--shadow-card:     0 4px 16px hsl(0 0% 0% / .06);   /* dark: /.4 */
--shadow-elevated: 0 12px 32px hsl(0 0% 0% / .10);  /* dark: /.5 — modals, popovers */
--shadow-focus:    0 0 0 3px hsl(var(--ring) / .35);
```
| Level | Treatment | Use |
|---|---|---|
| 0 Flat | canvas, no shadow | Page, most content |
| 1 Bordered | `1px solid --border` | Cards, inputs, dividers |
| 2 Inset | `--shadow-inset` | Primary buttons |
| 3 Card | `--shadow-card` | Hovered interactive cards |
| 4 Elevated | `--shadow-elevated` | Modals, dropdowns, sheets |
| Glow | `--glow-blue` / `--glow-soft` | Hero, focus moments only |

Modals/sheets: scrim `hsl(0 0% 0% / .5)` (both themes) so foreground stays legible.

---

## 5. Layout Principles

- **Spacing:** 4/8px system → `4 8 12 16 24 32 48 64 96 128 160`. Tight inside cards (12–24px), lavish between sections (**80–160px** desktop, 48–64px mobile) for editorial rhythm.
- **Container:** max content ~**1200px** (existing `2xl: 1400px` container preserved), centered, adaptive gutters (16px mobile → 32px+ desktop).
- **Grid:** hero single-column centered; feature/curriculum sections 2–3 col → collapse to 1; introduce **asymmetry and bento arrangements** for visual interest instead of endless equal stacks.
- **Radius scale:** `6px` micro · `10px` (`--radius`-2) buttons/inputs · `12px` (`--radius`) cards · `16px` large containers · `9999px` chips/toggles/avatars.
- **Z-index scale:** `0 · 10 (sticky) · 20 (dropdown) · 40 (overlay) · 50 (navbar) · 100 (modal) · 1000 (toast)`.

---

## 5b. Section Rhythm, Contrast Banding & Learning Psychology

> **Clarification from the user:** "light/dark" is **not only** the theme toggle. Within a *single* theme we deliberately **alternate section backgrounds** — some sections on the light/white surface, some on the deep/near-black surface — the way Lovable and top awwwards landing pages create rhythm. Some pages lean brighter, some darker, chosen by the section's job and by **education-platform psychology**. Make it feel intentional, not random.

### Two-surface banding (within one theme)
Define paired surfaces so every section can sit on either band and stay on-brand in **both** themes:

Backgrounds may be **white, near-black, a light-blue tint, OR the logo blue itself** — used like white/black bands (per the user). Blue is the *only* hue allowed as a background wash; no other colored bands.

```
/* LIGHT theme */                            /* DARK theme */
--band-base:  0 0% 100%    (white)           --band-base:  0 0% 4%     (near-black)
--band-alt:   0 0% 9%      (near-black)        --band-alt:   0 0% 100%   (white/very-light)
--band-tint:  210 100% 97% (light-blue wash)   --band-tint:  214 60% 8%  (deep blue-black wash)
--band-blue:  210 100% 50% (logo blue, white text) — same in both themes (feature band)
```
- **Base band** = the theme's normal canvas (most content, reading-heavy sections).
- **Alt band** = the *inverted* surface (black↔white) — sparingly, for **emphasis**: hero, key CTA, stats/social-proof. Text/tokens flip to stay AA-legible.
- **Tint band** = a faint **light-blue** wash to *group* a related cluster (e.g., curriculum) without full inversion.
- **Blue band** = the **saturated logo blue** as a full-bleed feature background with white text — reserved for the single highest-intent moment on a page (e.g., voucher/offer promo, "join the community" CTA). Use at most **once per page**; the inset-shadow buttons flip to white-on-blue ghost/solid variants.
- **Transitions between bands** are seamless — generous whitespace or a soft gradient seam, **never** a hard rule line. Keep at most **2–3 band switches** per page so contrast stays meaningful, and don't place a blue band directly adjacent to a tint band (they blur together).

**Homepage band map (recommended rhythm):**
`Hero (alt/dramatic)` → `Certification flow (base)` → `Voucher promo (tint or alt)` → `Curriculum (base)` → `Exam dumps (base)` → `Trust/testimonials (alt)` → `Reviews (base)` → `Instructors (base)` → `FAQ (base)` → `Community CTA (alt)` → `Footer (deep)`.

### Education-platform psychology (why the bands land where they do)
- **Trust & credibility first** — learners commit time/money to certs. Lead with calm base surfaces, real numbers (50K+, 4.8★) on a confident **alt** band, and generous whitespace = "serious, safe, professional."
- **Focus for reading** — study/curriculum/exam-dump/guide content stays on the **base** band with high text contrast and long-form measure (60–75ch). No visual noise where people are learning.
- **Motivation & momentum** — progress dashboards, achievements, and CTAs use blue + subtle glow and micro-wins (badges, streaks, checkmarks). Motion celebrates completion (`success-feedback`), never distracts mid-task.
- **Reduce cognitive load** — one primary action per screen; progressive disclosure in forms (trainer/event creation); skeletons over spinners so waiting feels shorter.
- **Emphasis via inversion** — the eye rests on base bands and *snaps* to alt bands; reserve inversion for the 2–3 things you most want remembered (offer, proof, join).
- **Page-level tone** — marketing pages (Index, Events, Store) can be more dramatic (more alt/tint banding, richer motion); **work surfaces** (dashboards, editors, admin) stay predominantly base-band, dense, and quiet so the tool disappears and the task leads.

**Contrast rules for bands:** every band flips its foreground/border tokens together (`token-driven-theming`); verify AA on *each* band in *both* themes; interaction states must stay distinguishable on the inverted surface too.

---

## 6. Motion & Animation

Motion is a **first-class deliverable** here (awwwards / motionsites energy) — but it must always *mean* something. Framer Motion is already installed; use it.

**Tokens**
```
--dur-fast: 150ms   --dur-base: 220ms   --dur-slow: 360ms
--ease-out: cubic-bezier(0.16, 1, 0.3, 1)      /* entrances */
--ease-in:  cubic-bezier(0.4, 0, 1, 1)          /* exits (≈65% of enter dur) */
--ease-spring: use Framer `type:"spring", stiffness:300, damping:30`
```

**Patterns**
- **Entrances:** fade + 12–20px rise, `--ease-out`, `--dur-base`. Stagger lists/grids 30–50ms/item.
- **Scroll reveal:** reuse existing `ScrollReveal.tsx`; one-shot, subtle, never blocks reading.
- **Hover/press:** scale `0.98–1.02` on tappable cards/buttons; restore on release.
- **State/layout:** animate expand/collapse/modal with `--ease-out`; modals scale+fade **from trigger**; nav forward = left/up, back = right/down.
- **Hero:** slow blue-glow drift + gradient wash; keep GPU-only (`transform`/`opacity`).
- **Marquee/Countdown:** keep, but pause on hover / honor reduced-motion.

**Rules (non-negotiable)**
- Animate **`transform` + `opacity` only** — never width/height/top/left (`layout-shift-avoid`).
- Max **1–2 key animated elements per view**; motion conveys cause→effect.
- **Every** animation wrapped by `prefers-reduced-motion: reduce` → reduce/disable.
- Animations interruptible; never block input.

---

## 7. Do's & Don'ts

**Do**
- Keep the canvas monochrome and let **one blue** carry emphasis.
- Design light & dark **together**; verify contrast in each independently.
- Derive grays from `--foreground` alpha for tonal unity.
- Use borders for containment; reserve glow for hero/focus.
- Keep the inset shadow on primary buttons — it's the tactile signature.
- Respect existing token names so shadcn primitives theme globally.

**Don't**
- Don't introduce a second saturated accent (blue is the identity).
- Don't drop drop-shadows on every card — borders contain, glow accents.
- Don't remove focus rings or rely on hover-only interaction.
- Don't animate layout properties or ship motion without reduced-motion.
- Don't touch routing, auth, API, state, or props — **design only**.
- Don't ship text under 16px body or gray-on-gray below 4.5:1.

---

## 8. Responsive

| Breakpoint | Width | Key changes |
|---|---|---|
| Mobile | <640px | single column, 16px gutter, 48–64px section gaps, hamburger sheet |
| sm/Tablet | 640–1024px | 2-col grids begin, 24px gutter |
| lg/Desktop | 1024–1280px | full multi-col, sidebar layouts (admin/trainer) |
| 2xl | 1280–1400px | max content width, 32px+ gutters, generous margins |

- Mobile-first; no horizontal scroll; `min-h-dvh` over `100vh`.
- Hero headline `clamp()` scales 60→40→32px with tracking easing toward normal.
- Fixed navbar reserves top padding on content; respect safe-area insets.
- Test 375px + landscape, reduced-motion, and largest dynamic text before delivery.

---

## 9. Quick Reference (agent prompt guide)

- **Canvas:** `hsl(var(--background))` — white (light) / near-black (dark). Never hardcode `#fff`/`#000`.
- **Accent:** blue `hsl(var(--primary))` = `#007CFF`. Hover `--blue-600`, active `--blue-700`.
- **Ink:** `--foreground`; **meta:** `--muted-foreground`; **edges:** `--border`.
- **Primary button:** blue bg + `--shadow-inset` + `--ring` focus + `--glow-soft`.
- **Card:** `--card` bg + `1px --border`, radius `--radius`, no shadow (hover → `--shadow-card`).
- **Motion:** `--dur-base` + `--ease-out`, transform/opacity only, reduced-motion guard.
- **Type:** Inter Tight; hero `clamp(2rem,6vw,3.75rem)` weight 700 tracking `-0.02em`; body 16px/1.6.
- **Every screen:** exactly one primary CTA; visible labels; 44px targets; AA contrast both themes.

> Before delivering any UI: run the **UI/UX Pro Max Pre-Delivery Checklist** (§ Accessibility, Interaction, Light/Dark, Layout) in [.claude/skills/ui-ux-pro-max/SKILL.md](.claude/skills/ui-ux-pro-max/SKILL.md).

---

## 10. Section Creative Catalog (NO DUPLICATE UI)

> **Prime creative rule:** every section/page gets a **distinct layout + signature motion** tied to its content. **Never** reuse the generic "icon + title + description card grid." Before building anything new, read this catalog and pick a pattern **not already used**, or invent a fresh one. Reuse the shared *primitives* (below), not the *layouts*.

### Homepage — established treatments (do not re-duplicate)
| Section | Signature layout + motion |
|---|---|
| Navbar | Glass-on-scroll, animated active-route underline, display wordmark, logo micro-motion |
| Hero | Kinetic **word-reveal** headline, **count-up** stats, giant cert **outline marquee**, blue glow |
| CertificationFlow | **Credential cards** for eligible exams (exam-code pills, level tags, AWS logo) → **drawn SVG-path** journey timeline (sequential nodes) → benefit **flip cards** |
| VoucherPromo | **Coupon ticket** — dashed perforation, side notches, barcode stub, shimmer sweep (saturated blue band) |
| Curriculum | Provider **logo marquee** + **bento** featured tile (first spans 2 cols) |
| LatestExamDumps | **Exam-paper deck** — ruled paper, rubber-stamp discount, per-card tilt→straighten |
| Trust | **Count-up** stat band + **opposing badge marquees** + asymmetric split panel |
| HomeReviews | **3-column vertical infinite** testimonial wall (opposite speeds, fade mask) |
| Instructor | Editorial lead + **parallax portrait** + avatar filmstrip + hover bios |
| FAQ | **Sticky-split** (sticky left heading+CTA) + rotating `+`→`×` accordion |
| Community | **Light-blue band** — kinetic statement + dotted grid + breathing glow + **Yatri Cloud logo drawn in members**: dotted cloud outline (3 lobes + flat base, computed arcs in a 200×170 box) with the cheering-Yatri figure (V arms + twin legs + head dot) inside, member avatars evenly spaced along the cloud line — NO outer circle/globe. **Signature choreography (scroll-triggered, once):** the cloud outline DRAWS itself (2.2s linear pathLength) → each avatar pops in (spring) exactly as the stroke reaches its spot (delay = 0.11 + i·0.22) → figure strokes draw in (arms→legs) → head dot springs in and emits looping radar pings → idle life: dots flow around the outline (seamless dashoffset loop, cycle = dash period 5.6) + a glowing 2-layer comet orbits the outline forever (SVG animateMotion inside a fade-in motion.g) + **the figure is ALIVE**: gradient strokes (blue-300→primary), the whole figure hops (y loop) while both arms wave outward around their shoulder junctions AND both legs kick outward around the hip (mirrored ±8° jumping-jack, `transform-box: fill-box` + framer `originX/originY` — NOT style transformOrigin, framer overwrites it), and 4 energy sparks continuously rise up the legs and burst out along the arms (animateMotion + SMIL opacity pulse). Figure gradient MUST be `gradientUnits="userSpaceOnUse"` — bounding-box gradients collapse on zero-width vertical lines (the legs vanished). All reduced-motion guarded (static dotted logo shown). + checkmark benefits + logo marquees |
| Footer | **Light finale** — soft-blue aurora, dotted texture, blue seam, multi-column links, and a **blue-statement block**: the tagline "Focus on learning, not the price tag." over a giant **width-fitted** soft-blue "Yatri Cloud" wordmark backdrop (white bg, no black). Wordmark uses `text-[12.5vw] w-full` so it never clips. |

**Reusable "blue-statement" pattern:** a headline sitting over a large soft-blue watermark/word backdrop on white — user likes this blue-on-white look; OK to reuse in other sections for more blue presence (they want mostly white with blue moments). Always fit big display text with `w-full text-[≤13vw] whitespace-nowrap` so it doesn't clip.

### Admin / dashboard — established treatments (do not re-duplicate; reuse these)
| Surface | Signature layout + rules |
|---|---|
| Admin shell (`AdminLayout`) | Collapsible **icon-rail ↔ full sidebar** (persist `localStorage`), mobile off-canvas slider (hamburger + scrim), **ONE** collapse toggle in the **solid** top header, route breadcrumb "Admin › {page}", "View site" link, profile chip, subtle `from-brand-50/40` canvas wash |
| Admin page header | **Blue-tinted header band**: `rounded-3xl border border-brand-100 bg-gradient-to-br from-primary/[0.08] via-brand-50/50 to-card p-6 md:p-8` + blurred glow blobs + eyebrow (`uppercase tracking-wider text-primary` w/ dot) + `font-display` title + primary action on the right; **stat cards moved inside** so white tiles pop on the tint |
| `StatsCard` | **Editorial** metric tile — big `font-display` number + large **faint watermark icon** (colored via the `color` prop) + colored accent bar. **Never** the "colored icon box in the corner" (reads AI-generated) |
| Standalone form header (e.g. CreateEvent) | **Sticky solid action toolbar** (`sticky top-0 z-30`, back + compact title + primary actions) that is visually distinct from the page, over a tinted page-header band (eyebrow + big title + step progress) |
| Admin form sections | **Numbered section headers** — badge `1/2/3…` + title + one-line helper + bottom divider, so long forms read like daily-task steps |
| Segmented tabs | Pill segmented control w/ **live counts** (`bg-primary text-primary-foreground shadow-inset-btn` active) instead of a plain underline |

**Interaction rule (avoids a recurring bug):** shadcn `ghost`/`outline` Buttons force **white** hover text — a light `hover:bg-brand-50`/`hover:bg-destructive/10` alone = invisible text. Always pair with `hover:text-primary` (blue controls); **delete / "remove" buttons go SOLID on hover** `hover:bg-destructive hover:text-destructive-foreground` (dark red + white, clearly visible).

**Patterns already spent** (avoid repeating on new pages unless genuinely the best fit): plain equal card grid, 3 identical steps, static testimonial grid, centered-hero-with-two-buttons. Prefer fresh angles: horizontal-scroll rails, sticky-pinned scrollytelling, bento asymmetry, split editorial, ticket/receipt/paper metaphors, orbit/cluster, timeline/path-draw, number count-ups, marquee walls, masking/wipe reveals.

### Shared primitives (REUSE these, not the layouts)
- **Bands:** `.band-tint` (light-blue), `.band-blue` (saturated blue, white text), `.band-invert`, permanent dark `bg-[#0a0a0a]`/`#050505`. `.glass-nav`.
- **Type:** `.font-display` (Bricolage Grotesque) for headings; `gradient-text` accent; Inter Tight body.
- **Depth/motion:** `shadow-inset-btn`, `shadow-card/elevated/glow-*`, `--ease-out`, `animate-shimmer`, `animate-marquee`/`-slow`, vertical `wall-up`/`wall-down` keyframes.
- **Logos:** `LogoMarquee` from `@/components/TechLogos` (white chips, brand SVGs in `public/logos/`) — use for any provider/tech logo strip.
- **Motion helpers:** count-up (`useInView`+`animate`, reduced-motion → final value); SVG path-draw (`motion.path pathLength`); all wrapped for `useReducedMotion()`.

### List search, filter, sort & pagination (REUSE this pattern on every list)
Every browsable list — admin, public, or personal dashboard — gets a text search, a sort control, **and** pagination. One convention, applied everywhere (admin CRUD tables, catalogs like Store/Exam Dumps/Reviews, and personal lists like My Receipts/Certificates/Trainings/Events/Bookings).
- **Search control:** shadcn `Input` with a leading Lucide `Search` glyph — `relative` wrapper, icon `absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground`, input `pl-9` (`h-9`/`h-10`/`min-h-[44px]` per surface density). Place it in the list header/filter row; when other filters exist (status/provider/category), the search sits **alongside or above** them and combines with AND.
- **Filtering:** case-insensitive substring — `const q = search.trim().toLowerCase()` then `.filter(...)` over the item's human-readable fields (name/title + secondary identifiers like slug, code, email, provider). Wrap in `useMemo` when the list is non-trivial; a plain const is fine for short lists. Empty query → return the list unchanged.
- **Sort control:** a shadcn `Select` sitting **next to the search box** (same row) — `SelectValue` shows the current choice; label it `aria-label="Sort <things>"`. The **first option is the list's natural/existing order** (`"featured"`/`"newest"`/`"default"`) so nothing changes until the user picks a sort. Apply the comparator to a **copy** (`[...list].sort(...)`) inside the same `useMemo`/derivation as the filter — never mutate state or the source array. Add the sort value to the memo deps.
- **Sort options by data type:** products → Featured · Price low→high · Price high→low · Name A–Z (`title.localeCompare`). Dated records → Newest · Oldest (`new Date(x).getTime()`). Reviews → Newest · Highest rated · Lowest rated. Grouped/curated lists → keep the curated default, add Name A–Z and a domain count. Pick 2–4 that fit the fields; don't invent options the data can't support.
- **Index-stable lists:** where rows are edited/reordered by array index (e.g. Providers, Mentors), **do not** map over the filtered array — keep mapping the full array and hide non-matches in place (`if (!filtered.includes(item)) return null;`) so index-based handlers stay correct. These lists are **skipped for sort** entirely: AdminMentors has manual move-up/down `sort_order` management and AdminProviders has index-based inline edit — a client sort would fight both.
- **Empty state:** always distinguish "no data yet" from "no matches" — show a short "No X match your search." message (not the onboarding empty state) when the source list is non-empty but the filtered result is empty. Only render the search/sort controls when there's data.
- **Pagination:** every list also pages via the shared **`ListPager`** (`@/components/ui/list-pager`) — pass `page` / `pageCount` / `onPageChange`; it renders Prev · "Page X of Y" · Next and **returns null on a single page** (so short lists show no control). The caller owns the page state and slices its already-filtered/sorted array: `const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE)); const currentPage = Math.min(page, pageCount); const paged = list.slice((currentPage-1)*PAGE_SIZE, currentPage*PAGE_SIZE);` — render `paged`, pass `currentPage` (clamped) to the pager. **Reset to page 1** whenever search/sort/filters change via `useEffect(() => setPage(1), [search, sort, ...filters])` (add the active-tab and any per-tab keys too). Page sizes by density: grids 9, review/service lists 12, admin tables 10–15, personal lists 9–10, tight lists 8. Place the pager as the last child of the list container (or right after a `<Table>`), inside the same "has results" branch. Multiple lists on one page (e.g. AdminTrainers applications + trainers) each get their own page state, reset effect, and pager.
- **Skipped for pagination:** same index/order-sensitive lists as sort — AdminMentors, AdminProviders — plus AdminSubmissions (three independent tabs, low per-event counts) and the Achievements wall (bespoke provider-grouped layout). Note any skip in the progress log.
- **Design-only:** search, sort, and pagination are view concerns — never change fetching, routing, mutations, or RLS. They filter/reorder/slice already-loaded client state.

### Icons & logos
- **UI icons: Lucide only** (`lucide-react`) — the single, chosen set (it's #12 on the reference list below; clean, universally recognizable, tree-shakeable, already powering shadcn/ui). **Never mix sets.** Use contextual, meaningful icons; no decorative `Sparkles`/✨/✦; no emoji-as-icons (greeting 👋 / rare 🎉 excepted).
- **Icon presentation (consistency rule):** don't drop stark, bare, brightly-colored glyphs into the UI (e.g. a lone bright-red trash). Delete/destructive controls = **muted by default, destructive color only on hover** (`text-muted-foreground hover:bg-destructive/10 hover:text-destructive`) inside a proper `size="icon"` button with an `aria-label`. Match stroke width/size across a view; size via a small scale (`h-4 w-4` inline, `h-5 w-5` standalone).
- **Brand/tech logos:** local SVGs in `public/logos/` (AWS, Azure, GoogleCloud, Kubernetes, Terraform, Docker, Ansible, Python, Linux, GitHub, + Industry-Leaders set). Add more via Devicon → `public/logos/`. Show logos over text in marquees where recognizable.
- **Reference — 21 free icon sets** (from the user's article; we deliberately stay on **Lucide**, but these are the vetted alternatives if a global swap is ever wanted — pick ONE, never mix): Untitled UI (untitledui.com/icons) · Feather (feathericons.com) · Majesticons (majesticons.com) · Unicons/IconScout (iconscout.com/unicons) · Heroicons 1.0 (v1.heroicons.com) · Heroicons 2.0 (heroicons.com) · Iconoir (iconoir.com) · Iconizer (iconizer.io) · css.gg (css.gg) · Phosphor (phosphoricons.com) · Radix (radix-ui.com/icons) · **Lucide (lucide.dev) ← chosen** · Tabler (tabler.io/icons) · Ionicons (ionic.io/ionicons) · Remix Icon (remixicon.com) · Flowbite (flowbite.com/icons) · Eva (akveo.github.io/eva-icons) · Atlas (atlasicons.vectopus.com) · MingCute (mingcute.com) · Tetrisly (tetrisly.gumroad.com/l/icons) · Doodle (khushmeen.com/icons.html).

## 11. Theme (current)
**Single fixed light theme** — no toggle (removed). **Mostly WHITE + BLUE, no black bands** (user: black bg under blue buttons looked bad). Band palette: **white (most sections) · light-blue tint (Trust, Reviews, Community) · one saturated blue feature band (Voucher)**. Footer is **white with a giant soft-blue "Yatri Cloud" wordmark**. Keep the existing blue (`#007CFF`) frozen; low saturation, professional. Blue buttons live on white/tint (never on black).

## 12. Working agreement (every turn)
After **each** change, update: this **DESIGN.md** (if a new pattern/token/section), root **MEMORY.md** (decisions), and the persistent memory progress file — so new sessions inherit context. See [docs/SESSION-GUIDE.md](docs/SESSION-GUIDE.md).
