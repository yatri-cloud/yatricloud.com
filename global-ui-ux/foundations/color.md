# Color

The single highest-leverage system in a UI. Get color right and everything looks intentional.

## The anatomy of a good palette

You need far fewer colors than you think. A complete, professional palette is:

1. **One dominant brand hue** — used for primary actions, links, active states. This *is* the brand.
2. **A neutral ramp** — background, surfaces, borders, text. 90% of the pixels are neutrals.
3. **At most one accent** — optional, for a secondary highlight. Many great palettes skip it.
4. **Semantic status colors** — success (green), warning (amber), danger (red), info (blue).

That's it. Resist adding a fifth saturated color; restraint reads as craft.

## Semantic tokens, not raw colors

Never write `color: #2563eb` in a component. Define **semantic roles** and reference those:

```
--background      the page canvas
--foreground      primary text on the canvas
--card            a raised surface
--card-foreground text on that surface
--primary         brand color for CTAs/links/active
--primary-foreground  text ON primary (usually white/near-white)
--muted           quiet fill
--muted-foreground    secondary/caption text
--border          hairline dividers and outlines
--ring            focus ring color
--destructive / --success / --warning   status
```

Now re-theming = editing these values in one place. The component code never changes. (Full
starter in [`../tokens/tokens.css`](../tokens/tokens.css).)

## Building a neutral ramp with tonal unity

Random grays look muddy. Two reliable methods:

- **Single-hue ramp**: pick a slightly-tinted gray (e.g. cool `220° 15% L`) and step lightness:
  `98 96 90 64 45 25 9` %. Every neutral shares one hue → they belong together.
- **Opacity-driven** (premium/editorial): define *one* ink color (near-black) and derive every gray
  as that ink at reduced alpha — `3% 4% 40% 60% 82%`. All grays are literally the same hue.

## Dark mode is a second theme, not an inversion

Do **not** just flip lightness. Dark mode has its own rules:

- **Desaturate.** Saturated colors vibrate painfully on dark backgrounds. Lower saturation, raise lightness.
- **Never pure black or pure white.** Canvas ~`8–12% L`, text ~`90–98% L`. Pure black + pure white = harsh, and elevation becomes impossible to show.
- **Elevation via lighter surfaces**, not just shadows — a raised card is a *lighter* gray than the canvas (shadows barely read on dark).
- **Re-check every contrast pair** independently. A blue that passes on white often fails on near-black, and vice-versa.

A common trap: a saturated brand blue that's a perfect fill under white text in light mode is often
too dark for white text but too bright for dark text in dark mode. The fix is usually a *lighter,
less saturated* variant in dark mode — sometimes paired with dark text instead of white.

## Contrast — the hard gate (WCAG)

| Content | Minimum ratio |
|---|---|
| Body text (< 24px, or < 19px bold) | **4.5:1** (AA) / 7:1 (AAA) |
| Large text (≥ 24px, or ≥ 19px bold) | **3:1** |
| UI components, icons, focus indicators, graph data | **3:1** |

Verify in light and dark separately. Tools: browser DevTools contrast checker, the Stark/Polypane
plugins, or the helper below.

### Contrast helper (drop into any Node script)

```js
// Relative luminance + WCAG contrast ratio for two [r,g,b] colors (0–255).
function luminance([r, g, b]) {
  const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05); // ≥4.5 AA body, ≥3 large/UI
}
// HSL→RGB so you can test tokens directly:
function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)].map(v => Math.round(v * 255));
}
// e.g. white on a candidate brand blue:
// contrast([255,255,255], hslToRgb(210,100,44)) → 4.78 ✓
```

Practical shortcut for "white text on a saturated hue": you usually need the fill around **40–46%
lightness** to clear 4.5:1 with white. Lighter fills need *dark* text instead.

## Color meaning (don't fight convention)

- **Green** = success/go/positive. **Red** = error/danger/destructive. **Amber/Yellow** = warning/caution.
  **Blue** = info/neutral/trust. Users read these instantly — don't invert them.
- Never use red/green as the *only* differentiator (colorblindness) — pair with icon or text.
- Reserve your brand hue for interactive/brand moments so it keeps its signal. If everything is
  blue, nothing is.

## Gradients & effects (use sparingly)

- Subtle same-hue or adjacent-hue gradients add depth; rainbow gradients scream amateur.
- Keep gradient contrast in check — text over a gradient must pass contrast at the *worst* point.
- One "hero" gradient wash per page is plenty.

## Quick process to pick a palette

1. Choose the **brand hue** from the product's personality (see the hue guide below).
2. Generate a **tint/shade ramp** of that hue (50→900) — tools: Radix Colors, Tailwind palette, `uicolors.app`, Leonardo.
3. Build the **neutral ramp** (single-hue or opacity method).
4. Pick **status colors** (a standard green/amber/red/blue set).
5. Assign **semantic tokens** for light, then design **dark** independently.
6. Verify every text/UI pair against the contrast table.

### Hue → personality cheat sheet

| Hue | Reads as | Common in |
|---|---|---|
| Blue | trust, calm, competence | SaaS, fintech, healthcare, enterprise |
| Green | growth, health, money, go | finance, wellness, sustainability |
| Purple | creative, premium, imaginative | design tools, crypto, luxury |
| Red/Orange | energy, urgency, appetite | food, entertainment, sales, deals |
| Teal/Cyan | modern, fresh, techy | dashboards, developer tools |
| Warm neutral (cream/charcoal) | human, editorial, premium | brands, portfolios, content |
| Near-black + one accent | bold, confident, focused | agencies, statements, modern SaaS |
