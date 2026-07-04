# Accessibility Checklist

Accessibility is not a feature you add at the end — it's a property of doing the basics right. It
also overlaps almost entirely with "good UX for everyone." WCAG 2.1 **AA** is the standard to hit.

## The POUR framework
WCAG groups everything under four principles — content must be **P**erceivable, **O**perable,
**U**nderstandable, **R**obust. The checklist below maps to these.

## Perceivable

### Contrast (the most-failed check)
- [ ] Body text ≥ **4.5:1**; large text (≥24px, or ≥19px bold) ≥ **3:1**.
- [ ] UI components, icons, focus rings, chart data ≥ **3:1** against adjacent colors.
- [ ] Verified in **light and dark independently** (a pass in one is not a pass in the other).
- [ ] Never convey meaning by **color alone** — pair with icon, text, or pattern (colorblind users,
  ~8% of men).

### Text alternatives
- [ ] Meaningful images have descriptive `alt`. Decorative images have `alt=""` or `aria-hidden="true"`.
- [ ] Icon-only buttons/links have `aria-label` (or visually-hidden text).
- [ ] Complex images/charts have a text summary or data-table alternative.

### Structure
- [ ] Headings are sequential (`h1 → h2 → h3`), no skipped levels, one `h1` per page.
- [ ] Landmarks used: `<header> <nav> <main> <footer>` (or ARIA roles) so screen readers can jump.
- [ ] Reading order in the DOM matches the visual order.

## Operable

### Keyboard
- [ ] **Everything** interactive is reachable and operable by keyboard alone (Tab/Shift-Tab/Enter/Space/Esc/arrows).
- [ ] **Visible focus indicator** on every focusable element — never `outline: none` without a
  replacement ring. `:focus-visible` for the ring.
- [ ] Tab order follows visual order (don't fight it with `tabindex` > 0).
- [ ] No keyboard traps. Modals trap focus *intentionally* and release it (Esc + return focus to trigger).
- [ ] Skip-to-content link as the first focusable element on content-heavy pages.

### Targets & timing
- [ ] Touch targets ≥ **44×44px** (WCAG 2.5.5 / Apple) with ≥ 8px spacing.
- [ ] No essential action relies on hover or a complex gesture alone — provide a visible control.
- [ ] Auto-dismissing content (toasts, carousels) can be paused/extended; nothing critical vanishes
  before it can be read.

### Motion
- [ ] `prefers-reduced-motion` is respected — animations reduce or disable, content stays usable.
- [ ] No content flashes more than 3×/second (seizure risk).
- [ ] Parallax/auto-play motion is subtle and stoppable.

## Understandable

- [ ] Form fields have visible `<label>`s (not placeholder-only).
- [ ] Errors state the **cause and the fix** ("Password needs 8+ characters", not "Invalid").
- [ ] Errors are programmatically associated (`aria-describedby`) and announced (`role="alert"` /
  `aria-live`).
- [ ] Required fields and input formats are indicated before submission.
- [ ] Language is set (`<html lang="en">`). Consistent, predictable navigation across pages.
- [ ] Nothing changes context unexpectedly on focus or input (no auto-submitting on select).

## Robust

- [ ] Semantic HTML first: real `<button>`, `<a>`, `<input>`, `<nav>` — not `<div onClick>`.
- [ ] ARIA only to fill gaps native HTML can't (`aria-expanded`, `aria-current`, `aria-selected`,
  `role="dialog"`). **No ARIA is better than wrong ARIA.**
- [ ] Custom widgets (tabs, comboboxes, menus) follow the **ARIA Authoring Practices** keyboard model.
- [ ] Dynamic updates announced via live regions where appropriate.
- [ ] State (selected, disabled, expanded, checked) is exposed to assistive tech, not just visual.

## Fast manual test (5 minutes, no tools)
1. **Unplug the mouse.** Tab through the whole page. Can you reach and see focus on everything? Can
   you operate every control and escape every modal?
2. **Zoom to 200%** (browser zoom). Does the layout reflow without loss of content or horizontal scroll?
3. **Toggle dark mode.** Is anything invisible or low-contrast?
4. **Turn on reduced-motion** (OS setting). Is anything broken or still flying around?
5. **Run an automated pass** — axe DevTools, Lighthouse Accessibility, or WAVE — to catch the rest.
   (Automated tools catch ~30–40%; the manual keyboard pass catches the rest.)

## Screen-reader spot check (optional but revealing)
Turn on VoiceOver (macOS: ⌘F5) or NVDA (Windows) and navigate one core flow. If the buttons announce
as "button" with no name, or the form fields have no labels, or the reading order is scrambled — fix
those first. It's the fastest way to feel what's broken.
