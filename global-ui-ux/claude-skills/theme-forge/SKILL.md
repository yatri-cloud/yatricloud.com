---
name: theme-forge
description: "Generate a complete, accessible design theme from a one-line brief. Produces semantic design tokens for light AND dark mode (background, foreground, primary, muted, border, ring, status colors), a brand hue ramp, radius, shadow and motion tokens — all WCAG-contrast-verified. Use when the user wants a new theme, new color scheme, new brand palette, re-skin, re-theme, dark mode, or is starting a new project/app/site and needs a color+type system. Outputs values that drop straight into a CSS-variable token file (shadcn/ui-compatible HSL triplets) and a Tailwind config. Actions: create theme, generate palette, pick colors, design tokens, re-brand, re-color, add dark mode, choose a color scheme."
---

# Theme Forge — generate a complete, accessible theme

Turn a one-line brief ("a calm fintech dashboard", "warm editorial portfolio", "bold food-delivery
app") into a full, contrast-verified token set for light and dark mode.

## When to use
- User wants a new theme, color scheme, palette, or brand look.
- Starting a new project and needs the color+type foundation.
- Re-theming / re-skinning an existing app.
- Adding or fixing dark mode.

## The method (follow in order)

### 1. Read the brief → derive personality
Extract product type + 2–3 personality adjectives. Map personality to a **brand hue**:

| Feel | Hue (H) |
|---|---|
| trust, calm, competent (SaaS, fintech, health) | 210 (blue) |
| fresh, modern, techy (dashboards, dev tools) | 175 (teal) |
| growth, money, wellness | 150 (green) |
| creative, premium, imaginative | 270 (purple) |
| energetic, urgent, appetite (food, deals) | 25 (orange) |
| human, editorial, premium | warm-neutral (near-black ink + cream bg, no saturated brand) |

### 2. Choose the fill lightness for AA contrast
The brand color used as a button fill under **white text** must clear **4.5:1**. That means a fill
lightness around **40–46%** for most hues (brighter hues like yellow/teal go lower). Verify with the
contrast helper below before committing. If you want a *light* fill, put **dark** text on it instead.

### 3. Emit the SEED values
Output these first — they're the only values a human needs to tweak:
```
--brand-h, --brand-s, --brand-l, --neutral-h, --radius
```
Match `--neutral-h` to the brand temperature (cool brand → cool gray, warm brand → warm gray) so
neutrals feel related.

### 4. Emit LIGHT semantic tokens
`--background --foreground --card --primary --primary-foreground --secondary --muted
--muted-foreground --accent --border --input --ring --success --warning --destructive`
Rules: `foreground` is a near-black tinted with `--neutral-h`; `muted-foreground` ~40% L (clears
4.5:1 on white); `border` ~90% L.

### 5. Emit DARK semantic tokens (a separate design)
Do **not** invert. Instead:
- `background` ~7–12% L (never pure black); `foreground` ~96% L (never pure white).
- Elevation via lighter surfaces: `card` a few % lighter than `background`.
- Brand: use a **lighter fill (~62% L)** with **dark text on it** — a saturated fill under white text
  usually fails on near-black. Re-verify both pairs.
- Override faint tints (`brand-50/100`) to deep versions so they aren't near-white.

### 6. Verify every pair, then report
Run the checks in the checklist and state the measured ratios. Never claim AA without the number.

## Contrast helper (use this — don't guess)
```js
function luminance([r,g,b]){const f=v=>{v/=255;return v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4};return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)}
function contrast(a,b){const[hi,lo]=[luminance(a),luminance(b)].sort((x,y)=>y-x);return (hi+0.05)/(lo+0.05)}
function hslToRgb(h,s,l){s/=100;l/=100;const k=n=>(n+h/30)%12,a=s*Math.min(l,1-l),f=n=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));return [f(0),f(8),f(4)].map(v=>Math.round(v*255))}
// contrast(hslToRgb(0,0,100), hslToRgb(210,100,44)) → 4.78 ✓  (white on brand-blue fill)
```

## Output format
Produce a ready-to-paste block matching `global-ui-ux/tokens/tokens.css` — the SEED block, the LIGHT
`:root` block, and the `.dark` block — plus a one-line note of the verified contrast ratios for:
primary/primary-foreground, foreground/background, muted-foreground/background, and primary-as-link
/background (both themes). Then suggest a font pairing from `global-ui-ux/foundations/typography.md`
matching the personality.

## Verification checklist (must pass before delivering)
- [ ] primary fill vs its foreground text ≥ 4.5:1 — light AND dark
- [ ] foreground vs background ≥ 4.5:1 — light AND dark
- [ ] muted-foreground vs background ≥ 4.5:1 — light AND dark
- [ ] primary-as-text (link) vs background ≥ 4.5:1 — light AND dark
- [ ] hover step (brand-600) still passes with its text
- [ ] dark faint tints (brand-50/100) are deep, not near-white
- [ ] status colors (success/warning/destructive) pass ≥ 3:1 for their use

## Worked example — "calm fintech dashboard, trustworthy and precise"
```
--brand-h: 214; --brand-s: 90%; --brand-l: 44%; --neutral-h: 220; --radius: 0.625rem;
```
Verify: contrast(white, hslToRgb(214,90,44)) = **5.59 ✓**. Neutral 220 = cool gray to match. Pair
with Inter Tight (display) + Inter (body). Dark: primary → 214 90% 64% with dark text (214 40% 12%).
Then emit the full light + dark blocks and report the four ratios.
```

**Contrast is hue-dependent — always compute, never eyeball.** Blue/purple clear 4.5:1 with white
around 44% L; teal/green/yellow are much brighter and need ~30% L or lower (or dark text instead).
Running the helper is not optional.

Keep it disciplined: one brand hue, neutrals + at most one accent, status colors standard. Restraint
is the craft.
