# Elevation & Motion

Depth and movement — the two systems that make a UI feel physical and responsive. Both fail the
same way: applied randomly instead of as a scale.

## Elevation (shadows & layering)

Model a single, consistent light source (usually top-down) and a small elevation scale. Every raised
thing picks a level from the scale — never an ad-hoc `box-shadow`.

### A shadow scale you can paste

```css
:root {
  --shadow-sm:  0 1px 2px hsl(0 0% 0% / 0.06);
  --shadow:     0 4px 16px hsl(0 0% 0% / 0.08);          /* resting card */
  --shadow-md:  0 8px 24px hsl(0 0% 0% / 0.10);          /* raised / hover */
  --shadow-lg:  0 16px 40px hsl(0 0% 0% / 0.14);         /* overlay / popover */
  --shadow-xl:  0 24px 60px hsl(0 0% 0% / 0.18);         /* modal / dialog */
}
```

Elevation tiers, conceptually:
- **0 — flat**: the page surface and most content.
- **1 — resting**: cards, sitting just off the surface.
- **2 — raised**: hover state, dropdowns.
- **3 — overlay**: popovers, menus, tooltips.
- **4 — modal**: dialogs and sheets (plus a scrim behind).

### Two philosophies — pick one default
- **Shadow-based**: soft shadows lift elements. Warm, friendly, app-like. Keep shadows *soft and
  large*, never hard and dark.
- **Border-based**: a hairline `1px` border contains elements on a flat surface. Calmer, editorial,
  premium. (Then shadows are reserved only for true overlays like modals.)

Mixing heavy borders *and* heavy shadows on the same card is the amateur tell.

### Dark mode elevation
Shadows barely show on dark backgrounds. Signal elevation with a **lighter surface** instead: the
canvas is `~8% L`, a resting card `~12% L`, a raised surface `~16% L`. A subtle top highlight border
(`inset 0 1px 0 white/8%`) reads as a light catching the top edge.

### The "inset button" trick (tactile depth)
A signature premium detail on solid buttons — a thin white highlight at the top edge + a dark ring +
a soft drop makes the button feel pressed *into* the surface rather than floating:

```css
box-shadow:
  inset 0 0.5px 0 hsl(0 0% 100% / 0.2),
  inset 0 0 0 0.5px hsl(0 0% 0% / 0.2),
  0 1px 2px hsl(0 0% 0% / 0.05);
```

## Motion

Animation exists to communicate: where something came from, that an action registered, that content
is loading. If a motion conveys nothing, remove it.

### Timing & easing

| Kind | Duration | Easing |
|---|---|---|
| Micro (hover, press, toggle) | 100–200ms | `ease-out` |
| Standard (enter, expand, modal) | 200–300ms | `ease-out` entering |
| Complex (page/shared-element) | 300–400ms | spring or custom cubic |
| Exit | ~60–70% of the enter duration | `ease-in` |

- **Never exceed ~500ms** for UI transitions — it feels sluggish.
- **`ease-out` for entrances** (fast start, gentle settle — feels responsive). **`ease-in` for exits**.
- **Exits are faster than entrances.** Things should leave quickly and arrive gracefully.
- A nice editorial easing curve: `cubic-bezier(0.16, 1, 0.3, 1)`.

### Performance — the one hard rule
**Animate only `transform` and `opacity`.** These run on the GPU and don't trigger layout. Animating
`width`, `height`, `top`, `left`, or `margin` causes reflow and jank. Need to move something? Use
`translate`. Need to resize? Use `scale`.

### Meaningful patterns
- **Entrance**: fade + small `translateY` (8–16px). Stagger list items ~30–50ms apart.
- **Press feedback**: subtle `scale(0.97)` on tap, restore on release.
- **Modal/sheet**: animate *from its trigger* (scale+fade or slide) so it has spatial context; fade
  in a scrim behind (40–60% black) so the foreground is legible.
- **Navigation direction**: forward slides in from the right/below, back reverses it — keep direction
  logically consistent.
- **Loading**: skeleton/shimmer for anything over ~300ms, not a spinner on a blank page.
- **Count-ups / progress**: animate the value, but with `tabular-nums` so width doesn't jitter.

### Restraint
Animate **1–2 key elements per view**, not everything at once. A page where every element flies in
from a different direction is exhausting. Motion should feel like one calm, coordinated system —
shared duration and easing tokens across the whole app.

### Accessibility (non-negotiable)
Respect reduced-motion. Wrap or gate every animation:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

In JS/React, read `prefers-reduced-motion` (e.g. framer-motion's `useReducedMotion`) and render the
final state directly instead of animating. Content must be fully usable with motion off.
