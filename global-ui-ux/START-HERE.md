# Start Here — new project workflow

The exact order to build a new UI so you never paint yourself into a corner.

## The workflow

### 0. Frame it (5 min)
Answer these before touching code — they decide everything downstream:

- **Product type**: marketing site · SaaS dashboard · e-commerce · portfolio · blog · mobile app · admin panel.
- **Audience & context**: who, on what device, in what mood? (A commuter skimming on a phone ≠ an analyst at a desk.)
- **Personality (3 adjectives)**: e.g. "calm, trustworthy, precise" or "bold, playful, fast". These become your color/type/motion choices.
- **Light, dark, or both?** Decide now; retrofitting dark mode later is painful.

### 1. Choose the design direction
Use [`references/inspiration.md`](references/inspiration.md) to gather 3–5 references, then pick:
- a **style** (minimal, editorial, glassmorphism, brutalist, neumorphic, bento…) — see [`principles/design-principles.md`](principles/design-principles.md)
- a **color direction** — one dominant hue + neutrals, at most one accent. See [`foundations/color.md`](foundations/color.md)
- a **type pairing** — see [`foundations/typography.md`](foundations/typography.md)

### 2. Lay the tokens (do this before any component)
Open [`tokens/theme-recipe.md`](tokens/theme-recipe.md), fill in your seed values, and paste [`tokens/tokens.css`](tokens/tokens.css) + [`tokens/tailwind.config.template.ts`](tokens/tailwind.config.template.ts) into the app. Now every component you build inherits the theme.

### 3. Build the shell, then the primitives
Navbar/footer/layout container first (they frame everything), then the reusable primitives (button, input, card) from [`components/component-recipes.md`](components/component-recipes.md). Get these right and pages assemble themselves.

### 4. Compose pages
Use [`foundations/spacing-layout.md`](foundations/spacing-layout.md) for rhythm and [`principles/ux-laws.md`](principles/ux-laws.md) to keep hierarchy honest. One primary CTA per view.

### 5. Gate before ship
Run [`principles/craft-checklist.md`](principles/craft-checklist.md) and [`accessibility/a11y-checklist.md`](accessibility/a11y-checklist.md). Test at 375px, in dark mode, and with reduced-motion on.

## Paste-ready kickoff prompt for Claude

Copy this into a fresh session (edit the bracketed parts):

```
I'm starting a new UI. Read the global-ui-ux/ folder for our design standard — especially
START-HERE.md, principles/, foundations/, and tokens/. Follow it for everything.

Project: [one-line description]
Type: [marketing site / SaaS dashboard / e-commerce / …]
Audience: [who, on what device]
Personality: [3 adjectives]
Theme: [light only / dark only / both]
Stack: [React+Vite+Tailwind / Next.js / etc.]

Do this in order:
1. Propose a design direction (style, color, type pairing) with 2 options and a recommendation.
2. Once I pick, generate the token layer (tokens.css + tailwind config) following
   tokens/theme-recipe.md — semantic tokens only, light+dark, AA-verified contrast.
3. Build the app shell, then the button/input/card primitives from components/.
4. Then compose pages. Keep to one primary CTA per view.

Before showing me anything, self-check against principles/craft-checklist.md.
```

## The one rule that prevents 90% of rework

**Tokens before components, components before pages.** If you build a page with hardcoded colors and spacing, re-theming means editing every file. If you build on tokens, re-theming is one file and re-skinning is a weekend, not a rewrite.
