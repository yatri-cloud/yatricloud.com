# Design Principles — the visual craft

What separates a UI that looks professional from one that looks "almost right." These are the
principles; the numbers live in `foundations/`.

## 1. Hierarchy — the eye must know where to go

Every screen has exactly one thing that matters most. Make it unmistakable with **size, weight,
spacing, and contrast** — in that order. Color is the *weakest* hierarchy tool (and fails for
colorblind users), so never rely on it alone.

- One primary action per view. Secondary actions are quieter (ghost/outline). Tertiary are links.
- A clear type scale (see typography) does most of the hierarchy work for free.
- Whitespace *is* hierarchy: related things sit close, unrelated things sit far apart (proximity).

## 2. Consistency — a system, not a collection of screens

The same thing should look and behave the same everywhere. A "card" has one radius, one shadow,
one padding rhythm across the whole app. Inconsistency reads as "unfinished" even when each screen
is fine in isolation.

- Reuse tokens and components; don't re-invent a button per page.
- One icon family, one stroke width, one corner-radius scale.
- Pick a spacing rhythm (4/8px) and never break it with `13px` or `27px`.

## 3. Restraint — subtract until it breaks, then add one thing back

Most amateur UIs are over-decorated: too many colors, too many shadows, too many font weights,
gradients everywhere. Craft comes from *removal*.

- One dominant hue + neutrals + at most one accent. That's the whole palette.
- Two font weights carry most hierarchy (e.g. 400 body, 600 headings). Three at most.
- Borders **or** shadows for containment — rarely both on the same element.
- If a decorative element doesn't earn its place, delete it.

## 4. Tonal unity — grays that belong together

Random grays (`#888`, `#aaa`, `#ccc`) look muddy. Derive your neutrals from a single hue, or from
your text color at varying opacity. Every gray then feels like part of one family. (This is the
"opacity-driven" trick many premium sites use: all grays are `foreground` at 3–83% alpha.)

## 5. Depth with intention

Shadows should model a consistent light source and a small elevation scale (resting, raised,
overlay, modal). Don't scatter arbitrary `box-shadow` values. Two valid philosophies:

- **Shadow-based depth**: soft, consistent shadows lift cards off the surface.
- **Border-based depth**: hairline borders contain elements on a flat surface (calmer, more editorial).

Pick one as the default; mixing randomly is the tell of an amateur build.

## 6. Alignment & grid — invisible order

Everything lines up to a grid and to each other. Optical alignment beats mathematical alignment
(a triangle "play" icon is nudged right of center to *look* centered). Ragged edges and off-grid
elements register as sloppy even when the viewer can't say why.

## 7. Motion as feedback, not decoration

Animation exists to explain cause and effect — where something came from, that a tap registered,
that content is loading. Decorative motion that conveys nothing is noise. Every animation earns
its place by communicating. (Numbers in `foundations/elevation-motion.md`.)

## 8. Content-first

Design around real content, not lorem ipsum. Real names are long, real prices have decimals, some
users have no avatar, some lists are empty. A design that only works with perfect placeholder data
is not finished. Always design the **empty, loading, error, and overflow** states.

## Style families (pick one, commit)

| Style | Feels like | Use for | Signature moves |
|---|---|---|---|
| **Minimal / Swiss** | calm, precise, trustworthy | SaaS, fintech, docs | generous whitespace, tight type, few colors, grid discipline |
| **Editorial** | confident, human, premium | marketing, portfolio, brands | big display type, negative letter-spacing, warm neutrals, borders over shadows |
| **Glassmorphism** | modern, layered, techy | dashboards, crypto, media | frosted blur surfaces, subtle gradients, translucency (mind contrast) |
| **Neumorphism** | soft, tactile | niche, playful tools | dual inset/outset shadows on one bg color (accessibility-risky — use sparingly) |
| **Brutalist** | bold, raw, memorable | creative, portfolios, statements | hard edges, high contrast, system fonts, visible structure |
| **Bento grid** | organized, scannable | feature showcases, dashboards | modular tiles of varying size in a tight grid |
| **Flat / Material** | familiar, functional | apps, Android, admin | solid fills, elevation via shadow, clear state layers |

**Rule:** one style, applied consistently. Mixing skeuomorphic and flat, or glass and brutalist,
at random is the fastest way to look unprofessional.
