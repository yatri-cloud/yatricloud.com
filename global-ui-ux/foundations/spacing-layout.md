# Spacing & Layout

Consistent spacing is invisible; inconsistent spacing is the loudest amateur tell. Pick a rhythm
and never break it.

## The spacing scale (4/8px system)

All padding, margin, and gaps come from one scale. Base unit **4px**, primarily using multiples of 8:

```
0    0px
1    4px     tight icon/text gaps
2    8px     compact padding, small gaps
3    12px    default inner padding (small)
4    16px    default inner padding, standard gap
6    24px    card padding, comfortable gap
8    32px    section-internal spacing
12   48px    between sub-sections
16   64px    section padding (mobile)
20   80px    section padding (desktop)
24   96px    large section breaks
32   128px+  hero / editorial breathing room
```

Never introduce `13px`, `27px`, `45px`. If something needs an odd value, your scale or your layout
is wrong. Tailwind's default scale already encodes this — use `p-4 gap-6 py-20`, not `p-[13px]`.

## Vertical rhythm

Define tiers by hierarchy and reuse them:
- **Within a component** (label→input, icon→text): 4–12px.
- **Between components** in a group (form fields, list items): 16–24px.
- **Between sub-sections**: 32–48px.
- **Between page sections**: 64px mobile → 80–128px desktop.

Bigger gaps = bigger conceptual breaks. If two sections have the same gap as two paragraphs, the
structure reads flat.

## Whitespace is a feature

- **Proximity groups.** Related items close, unrelated items far. This does more than borders.
- **Generous section padding** makes a design feel premium and calm; cramped padding feels cheap and
  stressful. When in doubt, add space.
- Don't fill every pixel. Empty space directs the eye to what matters.

## The grid & container

- **Max content width**: pick one (`max-w-6xl` ≈ 1152px or `max-w-7xl` ≈ 1280px) and center it.
  Full-bleed text on a 27" monitor is unreadable.
- **Columns**: a 12-column grid flexes to almost any layout. Use CSS grid/flex, not fixed px widths.
- **Gutters** grow with viewport: tighter on mobile (16px), wider on desktop (24–32px).
- **Reading content** (articles, forms) wants a *narrower* column than the container — ~65ch.

## Breakpoints

Design **mobile-first**, then scale up. A systematic set (Tailwind defaults, safe everywhere):

```
sm   640px    large phone / small tablet
md   768px    tablet
lg   1024px   laptop
xl   1280px   desktop
2xl  1536px   large desktop
```

Key transitions:
- Nav: horizontal links → hamburger around `md`.
- Grids: 1 col (mobile) → 2 (`md`) → 3–4 (`lg`).
- Section padding: scales up with each breakpoint.
- Font sizes: hero headings scale via `clamp()` or per-breakpoint.

## Layout rules that prevent bugs

- **No horizontal scroll** at 375px. The most common cause: a fixed-width element or an un-wrapped
  flex row. Test it.
- **`min-h-dvh` over `100vh`** on mobile (mobile browser chrome makes `100vh` too tall).
- **Fixed/sticky bars must reserve space** — add top/bottom padding to content so it isn't hidden
  behind a fixed navbar or bottom bar.
- **A z-index scale**, not random values: `0 / 10 (raised) / 20 (sticky) / 40 (overlay) / 50 (modal)
  / 100 (toast)`. Ad-hoc `z-index: 9999` wars are a symptom of no system.
- **Respect safe areas** on mobile (notch, home indicator): `padding: env(safe-area-inset-*)`.

## Common layout patterns

- **Holy grail app shell**: fixed top nav + optional sidebar + scrollable main + footer.
- **Marketing page**: alternating full-width bands (hero → features → social proof → CTA → footer),
  each an inner centered container. Vary each band's layout so they don't feel repetitive.
- **Dashboard**: sidebar nav + top bar + responsive card/stat grid + data area. Sidebar collapses to
  icons or a drawer on small screens.
- **Bento grid**: modular tiles of varying span in a tight grid — great for feature showcases.

## The alignment discipline

Everything lines up — to the grid and to each other. Left edges of stacked elements share an x. Card
grids have equal heights or a deliberate masonry. Optical centering beats mathematical centering for
icons and asymmetric shapes. Ragged, off-grid layouts read as unfinished even when the viewer can't
name why.
