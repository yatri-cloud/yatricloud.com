# Global Search (⌘K Command Palette)

One keystroke searches the whole platform: certifications, trainings, events, exam dumps, store products, and key pages — grouped results with full keyboard navigation.

## User flow
1. **⌘K / Ctrl+K** anywhere, or the Search button in the desktop navbar (icon + "Search" + `⌘K` kbd hint).
2. Type → cmdk fuzzy-filters across all groups simultaneously: **Pages · Trainings · Events · Exam dumps · Store · Certifications**. Each row shows a label plus a hint (price, provider, exam code, city…).
3. Enter/click navigates: trainings/events to their detail pages, dumps/store to their catalogs, certifications to `/paths`, pages directly.

## Behavior & performance
- The index loads **once per session, on first open** (module-level cache) — five parallel fetches, each individually `.catch(() => [])` so one failing source never breaks the palette. Before the load resolves, the static Pages group is already searchable.
- **Private (unlisted) items never appear**: trainings filtered by `visibility !== 'private'`, events by `visibility !== 'private' && status !== 'draft'`. Keep this in sync with the visibility feature.
- Matching uses each item's `value={label + hint + group}` so searching "AWS" hits certifications, dumps, and products alike.

## Code map
| Piece | File |
|---|---|
| Component (trigger + dialog + keyboard + index) | `src/components/GlobalSearch.tsx` |
| Mounted in | `src/components/Navbar.tsx` (desktop actions area) |
| Primitives | `src/components/ui/command.tsx` (shadcn/cmdk — was installed but unused before this feature) |
| Sources | `getCertificationOptions`, `listPublishedTrainings` (training-api) · `getAllEvents` (events-store) · `fetchExamDumps` · `fetchStoreProducts` |

## Extending
Add a source: fetch in `loadEntries()`, map to `SearchEntry { group, label, hint, to }`, and append the group name to `GROUP_ORDER`. Static destinations go straight into the `PAGES` array.

## Known limits
- Session cache means items added mid-session appear after a reload — acceptable for catalog-paced content.
- Mobile has no trigger button yet (palette still opens via keyboard on tablets); adding a trigger to the mobile menu is a small follow-up.

## How to test
Press ⌘K on the homepage → type "aws" → results across several groups → arrow to a training → Enter navigates. Create a private training and confirm it never shows up.
