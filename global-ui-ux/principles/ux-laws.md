# UX Laws — the psychology behind the choices

The named principles that explain *why* good UI works. Cite these when justifying a decision.

## Perception & attention

- **Hick's Law** — decision time grows with the number of choices. Fewer options = faster action.
  Split complex flows into steps; use progressive disclosure; don't show 20 menu items at once.
- **Miller's Law** — people hold ~7 (±2) items in working memory. Chunk content: group nav into
  sections, format phone/card numbers in blocks, keep lists digestible.
- **Law of Proximity (Gestalt)** — things placed close together are perceived as related. Spacing
  groups content more reliably than boxes or lines.
- **Law of Similarity (Gestalt)** — similar-looking elements are perceived as the same kind. Keep
  all buttons looking like buttons; don't make a link look like a button unless it acts like one.
- **Law of Common Region** — a shared background/border groups elements. This is what a "card" is.
- **Von Restorff (Isolation) Effect** — the item that differs is remembered. This is why you have
  *one* primary button — its uniqueness is what makes it the obvious next step.

## Interaction & motor

- **Fitts's Law** — time to hit a target depends on its size and distance. Big targets, placed
  near where the cursor/thumb already is. Primary actions should be large; destructive actions
  small and far from the happy path. Minimum touch target **44×44px**.
- **Doherty Threshold** — keep system response under **400ms** or attention drifts. Use optimistic
  UI, skeletons, and instant feedback to stay under it (or feel like you do).
- **Postel's Law (robustness)** — be liberal in what you accept, strict in what you output. Accept
  phone numbers with or without spaces; format them consistently on display.

## Memory & expectation

- **Jakob's Law** — users spend most of their time on *other* sites, so they expect yours to work
  like those. Put the logo top-left (home link), search top-right, cart in the corner, primary nav
  across the top. Innovate on value, not on where the back button lives.
- **Peak–End Rule** — people judge an experience by its most intense moment and its end. Polish the
  key moment (checkout success, first "aha") and the exit (a graceful empty state, a warm
  confirmation) more than the average screen.
- **Zeigarnik Effect** — unfinished tasks nag at memory. Progress bars, step indicators, and
  "3 of 5 complete" states pull people forward.
- **Aesthetic–Usability Effect** — people perceive attractive interfaces as more usable and forgive
  minor issues. Craft buys goodwill. (It does not *replace* usability — it buys margin.)

## Content & flow

- **Serial Position Effect** — people remember the first and last items best. Put the most
  important nav/menu items at the ends, not the middle.
- **Tesler's Law (conservation of complexity)** — every system has irreducible complexity; the only
  question is who absorbs it. Absorb it in the design (smart defaults, good copy) so the user
  doesn't have to.
- **Occam's Razor** — the simplest solution that works is usually right. Before adding a feature or
  a control, ask what you can remove instead.

## How to apply in practice

- Too many choices on a screen? → Hick's + Miller's: chunk, hide, or split into steps.
- Users miss the primary action? → Von Restorff + Fitts's: make it bigger, bolder, and the only one.
- Flow feels slow? → Doherty: add optimistic UI and skeletons; cut steps.
- "It works but feels off"? → Jakob's: you probably broke a convention users expected.
- Long form abandoned? → Zeigarnik + progressive disclosure: show progress, reveal fields in stages.
