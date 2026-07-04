# Craft Checklist — the pre-ship quality gate

Run this before you call any UI "done." It's the difference between "works" and "professional."
Grouped by priority — the CRITICAL block is non-negotiable.

## CRITICAL (never ship without)

### Accessibility
- [ ] Body text contrast ≥ **4.5:1**; large text (≥24px or ≥19px bold) and UI/icons ≥ **3:1** — verified in **both** light and dark independently.
- [ ] Every interactive element is keyboard-reachable and has a **visible focus ring** (never `outline: none` with no replacement).
- [ ] Tab order matches visual order. Headings go h1→h2→h3 with no skipped levels.
- [ ] Icon-only buttons have an `aria-label`. Meaningful images have `alt`; decorative ones have `alt=""` or `aria-hidden`.
- [ ] Information is never conveyed by color alone (add an icon, label, or pattern).
- [ ] Form inputs have real `<label>`s (not placeholder-only). Errors are announced (`role="alert"`/`aria-live`).

### Interaction
- [ ] Touch targets ≥ **44×44px**, with ≥ 8px between them.
- [ ] Every tappable element gives feedback within ~100ms (hover/press state).
- [ ] Async actions show loading state and disable the trigger; success and error are both handled.
- [ ] Nothing relies on hover alone (breaks on touch).

### Layout stability
- [ ] Images/embeds have `width`/`height` or `aspect-ratio` — no layout shift (CLS < 0.1).
- [ ] Async content reserves its space (skeletons), so the page doesn't jump when it arrives.
- [ ] No horizontal scroll at 375px. `viewport` meta present; zoom not disabled.

## HIGH

### Visual consistency
- [ ] Colors come from **semantic tokens**, not raw hex in components.
- [ ] One icon family, consistent stroke width and sizing. **No emoji as structural icons.**
- [ ] Spacing follows the 4/8px rhythm everywhere — no stray `13px`.
- [ ] One consistent radius scale; one consistent elevation/shadow scale.
- [ ] Exactly one primary CTA per view; secondary/tertiary actions are visually subordinate.

### States (the ones everyone forgets)
- [ ] **Empty** state: helpful message + a next action, not a blank area.
- [ ] **Loading** state: skeleton/shimmer for anything over ~300ms, not a bare spinner on a blank page.
- [ ] **Error** state: says what went wrong *and* how to recover (retry/edit/help).
- [ ] **Overflow**: long names, big numbers, and many items don't break the layout (truncate with tooltip, wrap, or paginate).
- [ ] **Disabled** state: reduced emphasis + `disabled` attribute + cursor change.

### Typography
- [ ] Body ≥ 16px on mobile (prevents iOS auto-zoom). Line-height 1.5–1.75 for body.
- [ ] Line length 45–75 characters (use `max-width`, not full-bleed paragraphs).
- [ ] Tabular figures for numbers in columns, prices, and timers (prevents width jitter).

## MEDIUM

### Motion
- [ ] Micro-interactions 150–300ms; animate `transform`/`opacity` only (never width/height/top/left).
- [ ] `ease-out` for entrances, `ease-in` for exits; exits ~60–70% the duration of entrances.
- [ ] Everything respects `prefers-reduced-motion`.
- [ ] At most 1–2 animated elements per view; motion is meaningful, not decorative.

### Responsive
- [ ] Tested at 375px, ~768px, and ≥1280px. Landscape doesn't break.
- [ ] Fixed headers/bars reserve safe padding so content isn't hidden behind them.
- [ ] Container has a sensible `max-width` on large screens (content doesn't stretch edge to edge).

## The 60-second smoke test

If you only have a minute, do these five:
1. **Tab through the page** — can you reach and see focus on everything?
2. **Shrink to 375px** — anything overflow or overlap?
3. **Toggle dark mode** — is anything invisible or low-contrast?
4. **Empty the data** — does it degrade gracefully or show a blank void?
5. **Squint at it** — is the one most important thing still obvious?
