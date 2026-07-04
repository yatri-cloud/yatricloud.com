# Theme Recipe — invent a new theme/color in 5 minutes

The whole point of the token system: you re-brand by editing a handful of values, not by touching
components. Here's the exact process.

## The 5-minute re-theme

1. **Open [`tokens.css`](tokens.css)** and find the `SEED` block. It's the only place you edit.

2. **Pick your brand hue** (`--brand-h`). Use the personality guide:

   | Want it to feel… | Hue | Value |
   |---|---|---|
   | Trustworthy, calm (SaaS, fintech) | Blue | `210` |
   | Fresh, techy (dashboards, dev tools) | Teal/Cyan | `175` |
   | Growth, money, health | Green | `150` |
   | Creative, premium | Purple | `270` |
   | Energetic, urgent (deals, food) | Orange | `25` |
   | Bold, warm | Red | `0` |

3. **Set fill lightness** (`--brand-l`). For **white text on the brand button**, keep it **40–46%**
   (that clears WCAG 4.5:1 — verify with the helper in [`../foundations/color.md`](../foundations/color.md)).
   Higher saturation may need slightly lower lightness.

4. **Tune the neutral tint** (`--neutral-h`). Match or complement the brand hue so grays feel
   related, not dead. Cool brand → cool gray (`220`), warm brand → warm gray (`30`).

5. **Set the radius** (`--radius`). `0.5rem` = crisp/modern, `0.75rem` = friendly (default),
   `1rem`+ = soft/rounded, `0.25rem` = sharp/editorial.

6. **Check dark mode.** The `.dark` block already flips the brand to a lighter fill with dark text
   (the accessible pattern). If your hue is unusual, re-verify the two pairs:
   `--primary` vs `--primary-foreground`, and `--primary` (as a link) vs `--background`.

That's it. Every `bg-primary`, `text-muted-foreground`, `border-border`, `shadow-card` in the app
now reflects the new theme. No component edits.

## Worked example — teal SaaS

```css
--brand-h: 175;      /* teal */
--brand-s: 70%;      /* a touch less saturated than blue */
--brand-l: 30%;      /* teal is BRIGHT — must go quite dark for white-text contrast */
--neutral-h: 190;    /* cool gray to match */
--radius: 0.625rem;
```

Verify: `contrast(white, hslToRgb(175,70,30))` → **4.66 ✓** for the button. Note how much darker teal
(30%) has to be than blue (44%) to clear 4.5:1 with white — bright hues (teal, green, yellow) always
need lower lightness than blue/purple. **Always run the number; never eyeball it.** If you'd rather
keep the teal bright, put *dark* text on it instead of white.

## Going beyond the seed (optional depth)

- **Two-tone brand**: add a second hue for `--accent` if the product genuinely needs a secondary
  signal (e.g. blue primary + purple accent). Most don't — one hue is cleaner.
- **Warm-neutral / editorial theme**: instead of a saturated brand, use a near-black ink + a warm
  cream background and derive all grays from the ink at opacity. Set `--background` to a warm cream
  (`40 30% 96%`), `--foreground` to a warm charcoal (`30 8% 12%`), and make `--primary` the charcoal
  itself for a monochrome, premium look (see the Lovable reference in `../references/inspiration.md`).
- **Custom fonts**: change `--font-sans` / `--font-display` in tokens.css and the `fontFamily` in the
  Tailwind config together.

## Sanity checklist after re-theming

- [ ] Primary button: white (or dark) text on the fill passes 4.5:1.
- [ ] Body text (`foreground` on `background`) passes 4.5:1 — light and dark.
- [ ] Muted/caption text (`muted-foreground`) passes 4.5:1 on its backgrounds.
- [ ] Links (`primary` as text on `background`) pass 4.5:1 — in dark mode too.
- [ ] Focus ring is visible against every surface it can appear on.
- [ ] Faint brand tints (`brand-50/100`) aren't near-white in dark mode (the `.dark` overrides handle this).

## Tools for generating ramps & checking contrast

- **Ramps**: Radix Colors, `uicolors.app`, Tailwind's palette generator, Adobe Leonardo (contrast-aware).
- **Contrast**: browser DevTools (inspect → contrast), Stark plugin, `contrast-ratio.com`, or the JS
  helper in `../foundations/color.md`.
- **Whole-palette from one color**: Leonardo (`leonardocolor.io`) generates accessible ramps by
  target contrast — the most rigorous option.
