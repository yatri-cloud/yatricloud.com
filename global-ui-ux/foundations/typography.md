# Typography

Type does more hierarchy work than color. A disciplined type system alone can make a plain layout
look designed.

## Pick fonts (one or two, never more)

- **One family** is often enough — a good variable sans (Inter, Inter Tight, Geist, Manrope) covers
  body + UI + headings via weight and size alone.
- **Two families** = a display face for headings + a workhorse for body. Pair by *contrast of role,
  harmony of mood*: e.g. an editorial serif or characterful grotesque for headings + a neutral sans
  for body.
- **Three+ families** almost always looks worse. Don't.

### Safe pairings by personality

| Personality | Heading | Body |
|---|---|---|
| Modern SaaS | Inter Tight / Geist | Inter / system sans |
| Editorial / premium | Bricolage Grotesque, Fraunces, Playfair | Inter, Source Sans |
| Friendly / approachable | Manrope, Nunito | Manrope, Inter |
| Technical / developer | Space Grotesk + JetBrains Mono | IBM Plex Sans |
| Bold / statement | Clash Display, Archivo Expanded | Inter, Satoshi |

Self-host with `@fontsource` (or download woff2) — never leave render-blocking Google Fonts links
on the critical path. Preload the 1–2 weights used above the fold. Always set `font-display: swap`.

## The type scale

Use a consistent modular scale, not arbitrary sizes. A 1.25 (major third) ratio is a safe default:

```
xs   12px   captions, meta, labels
sm   14px   secondary text, compact UI
base 16px   body (never smaller for body on mobile — iOS auto-zooms < 16px)
lg   18px   lead paragraphs
xl   20px   card titles
2xl  24px   sub-headings
3xl  30px   section headings
4xl  36px   page titles
5xl  48px   hero (desktop)
6xl  60px+  display hero
```

Fluid headings scale smoothly across viewports: `clamp(2rem, 5vw, 3.75rem)`.

## Hierarchy through weight, size, spacing — not weight sprawl

- **Two weights** carry most work: 400 (body/UI) + 600–700 (headings). Add 500 for medium labels.
  Avoid using 5 different weights — it muddies the system.
- Bigger + bolder + more space = more important. That's the whole game.
- Reserve the heaviest weight (800/900) for a single hero numeral or stat, if at all.

## Spacing & rhythm (the readability details)

- **Line-height**: body 1.5–1.75; headings tighter 1.0–1.2 (big type needs less leading).
- **Line length (measure)**: 45–75 characters. Constrain with `max-width: 65ch`, never full-bleed paragraphs.
- **Letter-spacing (tracking)**: tighten large display type (`-0.02em` to `-0.04em`) for an
  editorial, confident feel; leave body at normal; slightly *increase* tracking on ALL-CAPS labels
  (`0.05em–0.1em`).
- **Paragraph spacing**: separate paragraphs with space (0.75–1em), not first-line indents, on the web.

## Numbers

Use **tabular / lining figures** (`font-variant-numeric: tabular-nums`) for anything in columns,
tables, prices, timers, or animated counters — otherwise digit widths jitter and layouts wobble.

## Practical defaults you can paste

```css
:root {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Inter Tight", var(--font-sans);
}
body { font-family: var(--font-sans); font-size: 16px; line-height: 1.6; }
h1, h2, h3, .font-display { font-family: var(--font-display); letter-spacing: -0.02em; line-height: 1.1; }
h1 { font-size: clamp(2.25rem, 5vw, 3.75rem); font-weight: 700; }
h2 { font-size: clamp(1.75rem, 3.5vw, 2.5rem);  font-weight: 700; }
h3 { font-size: 1.5rem;  font-weight: 600; }
p  { max-width: 65ch; }
.tabular { font-variant-numeric: tabular-nums; }
```

## Common typography tells (avoid)

- Body text under 16px on mobile.
- Gray-on-gray low-contrast text to look "subtle" (it just fails contrast).
- Full-width paragraphs spanning 120 characters.
- Five font weights and two decorative fonts fighting each other.
- Justified text on the web (creates rivers of whitespace) — left-align.
- Center-aligning long paragraphs (only center short, 1–3 line blocks).
