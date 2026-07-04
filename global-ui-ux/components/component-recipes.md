# Component Recipes

Copy-paste patterns for the components every app needs, plus the interaction states everyone forgets.
Markup is Tailwind + the semantic tokens from `../tokens/`. Framework-agnostic — the classes are the
point.

## Interaction states (apply to EVERYTHING interactive)

Every interactive element needs all of these designed, not just the default:

| State | What it must do |
|---|---|
| **Default** | The resting look. |
| **Hover** | Visible change within ~100ms (bg, border, or elevation). Desktop only — never the *only* affordance. |
| **Focus-visible** | A clear ring for keyboard users: `focus-visible:ring-2 ring-ring ring-offset-2`. Never remove without replacing. |
| **Active/Pressed** | Immediate feedback: slight `scale-[0.97]` or darker bg. |
| **Disabled** | `opacity-50 cursor-not-allowed`, `disabled` attribute, no hover, not focusable. |
| **Loading** | Spinner/label swap, disabled during the async op. |

## Buttons

```html
<!-- Primary: one per view -->
<button class="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-lg
               bg-primary text-primary-foreground font-semibold shadow-sm
               transition-colors duration-base hover:bg-brand-600
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
               disabled:opacity-50 disabled:pointer-events-none">
  Get started
</button>

<!-- Secondary: outline, quieter -->
<button class="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-lg
               border border-border bg-background text-foreground font-semibold
               transition-colors hover:border-primary/50 hover:text-primary
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
  Learn more
</button>

<!-- Tertiary / ghost -->
<button class="inline-flex items-center gap-2 min-h-[44px] px-3 rounded-lg
               text-muted-foreground font-medium hover:bg-muted hover:text-foreground transition-colors">
  Cancel
</button>

<!-- Destructive: semantic danger color, separated from primary flow -->
<button class="… bg-destructive text-destructive-foreground hover:opacity-90">Delete</button>
```

Rules: min 44px tall, exactly one primary per view, icon-only buttons need `aria-label`, show a
spinner + disable during async, put the label text (not just an icon) on important actions.

## Inputs & forms

```html
<div class="space-y-1.5">
  <label for="email" class="block text-sm font-medium text-foreground">Email</label>
  <input id="email" type="email" autocomplete="email" required
         class="w-full min-h-[44px] px-3 rounded-lg bg-background text-foreground
                border border-input placeholder:text-muted-foreground
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary
                aria-[invalid=true]:border-destructive"
         aria-describedby="email-error" />
  <p id="email-error" role="alert" class="text-sm text-destructive">Enter a valid email address.</p>
</div>
```

Form rules:
- **Real `<label>`** per field (linked with `for`/`id`) — placeholders are not labels.
- **Semantic `type`** (email/tel/number/url) → correct mobile keyboard. **`autocomplete`** so
  browsers autofill.
- **Errors below the field**, in words that say the cause *and* the fix — announced via
  `role="alert"`/`aria-live`. On submit, focus the first invalid field.
- **Validate on blur**, not on every keystroke.
- **Required** marked clearly. **Helper text** persistent (not placeholder-only) for complex fields.
- Input height ≥ 44px; body font ≥ 16px (prevents iOS zoom).
- Password fields get a show/hide toggle. Long forms auto-save drafts.

## Cards

```html
<article class="rounded-lg border border-border bg-card text-card-foreground p-6
                transition-shadow hover:shadow-md">
  <h3 class="font-display text-lg font-semibold">Title</h3>
  <p class="mt-2 text-sm text-muted-foreground">Supporting copy that explains the thing.</p>
  <div class="mt-4">…actions or content…</div>
</article>
```

Pick **border OR shadow** as the resting containment, not both. Consistent radius + padding across
all cards. Whole-card link? Make the *card* the anchor (or use a stretched-link pattern) so the
entire target is clickable (Fitts's Law).

## Navigation (top bar)

```html
<nav class="fixed inset-x-0 top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
  <div class="container flex h-16 items-center justify-between gap-4">
    <a href="/" class="flex items-center gap-2 font-display font-bold">Logo</a>       <!-- home, top-left -->
    <div class="hidden md:flex items-center gap-6">…links…</div>                       <!-- primary nav -->
    <div class="flex items-center gap-2">…search / CTA / account…</div>
    <button class="md:hidden" aria-label="Open menu" aria-expanded="false">☰</button>  <!-- hamburger -->
  </div>
</nav>
```

Rules: logo top-left links home (Jakob's Law). Current page is visually marked (`aria-current`,
color/weight). Fixed nav → add top padding to page content. Hamburger has `aria-label` +
`aria-expanded`. Keep placement identical across all pages.

## Modal / dialog

- Animate **from context** (scale+fade from center, or slide from an edge), 200–300ms.
- **Scrim behind** at 40–60% black so foreground is legible.
- **Focus trap**: focus moves into the modal, `Tab` cycles within it, `Esc` closes, focus returns to
  the trigger on close.
- `role="dialog"` `aria-modal="true"` `aria-labelledby` pointing at the title.
- Clear close affordance (× button + click-scrim + Esc). Confirm before discarding unsaved changes.
- Don't use modals for primary navigation flows.

## Tables & data lists

- Sticky header on scroll; zebra or hairline row separators (low-contrast).
- **Tabular figures** for numeric columns; right-align numbers, left-align text.
- Sortable columns show state with `aria-sort`; sort control is keyboard-reachable.
- Responsive: collapse to stacked cards on mobile, or allow horizontal scroll *within the table's own
  container* (never the page body).
- Always design **empty**, **loading** (skeleton rows), and **error** states.
- 50+ rows → paginate or virtualize.

## Toasts / notifications

- Auto-dismiss in 3–5s (except errors needing action). Don't steal focus.
- `aria-live="polite"` (or `role="alert"` for errors) so screen readers announce them.
- Position consistently (usually bottom or top-right). Stack, don't overlap.
- Offer **undo** for destructive/bulk actions instead of a confirm dialog where possible.

## The four states every data view needs

1. **Empty** — "No X yet" + an action to create the first one. Never a blank void.
2. **Loading** — skeleton matching the final layout (reserves space, no CLS), not a centered spinner.
3. **Error** — what failed + a retry/recover path. Not a raw stack trace.
4. **Populated** — the happy path. Design it *last*, after the other three, so they aren't afterthoughts.
