# Public / Private Visibility (Events & Trainings)

Any event or training can be **Private (unlisted)**: hidden from the public `/events` and `/training` listings, but fully working through its direct link — registrations and enrollments run exactly as normal. Used for invite-only cohorts, corporate batches, and pre-announcement sales.

## How private links work (the design)
- A private item stays `status = 'published'` in the DB, so **RLS is deliberately unchanged** — the existing anon read policies (published rows are readable) are exactly what an unlisted link needs. Do **not** "fix" this by adding visibility to RLS; that breaks the shared link for logged-out visitors.
- Visibility is enforced **only in the listing layer** (see Code map). Detail pages, registration, payment, reminders, certificates: untouched.
- **The URL never reveals privacy** (production pattern, like YouTube unlisted):
  - The word "private" is stripped from the slug even if the admin puts it in the name.
  - Private slugs end in a random 12-char token: `kubernetes-deep-dive-3742d59f7e66` — unguessable, not enumerable.
  - An already-private item **keeps its slug across edits** (links you shared keep working).
  - Switching **public → private regenerates the slug** — the old URL was public knowledge, so it must not remain the private one. (Private → public keeps the slug; harmless.)
- Private detail pages send `noindex` via the SEO component.

## Admin flow
- **Events** — `/createevent`, step 1: a Public / "Private (unlisted)" two-card toggle under the event name. Preloaded correctly in edit mode.
- **Trainings** — `TrainingManager` Identity tab: the same toggle in a "Visibility" panel above "Prepares you for".
- **Admin lists** (`AdminEvents`, `AdminTrainingList`): private items show a 🔒 **Private** badge next to the name, and the row actions include **"Copy private link"** (copies the shareable URL, with a toast explaining it).

## Data model — `supabase/migrations/029_training_event_visibility.sql` (applied live)
`visibility text not null default 'public' check (visibility in ('public','private'))` added to both `events` and `trainings`. Column comments document the semantics. No backfill was needed (tables were empty at the time).

## Code map
| Piece | File |
|---|---|
| Migration | `supabase/migrations/029_training_event_visibility.sql` |
| Event type + mappers | `src/lib/events-store.ts` (`Event.visibility`), `src/lib/events-api.ts` (`eventToRow` / `rowToEvent`) |
| Training type + mappers | `src/lib/training-api.ts` (`Course.visibility`, `TrainingInput.visibility`, `inputToRow`, `rowToCourse`, `getTrainingForEdit`) |
| Listing filters | `src/pages/Events.tsx` → `filterEvents` drops `visibility === 'private'`; `src/pages/Training.tsx` → filters after `listPublishedTrainings()` |
| Private slug generation | trainings: `unlistedToken()` + `privateSlugBase()` in `createTraining` / `updateTraining` (update fetches current visibility to detect the public→private switch); events: `constructEventObject` in `src/pages/CreateEvent.tsx` (keeps `existingPrivateSlug` state) |
| Admin toggles | `src/pages/CreateEvent.tsx`, `src/components/admin/training/TrainingManager.tsx` |
| Badges + copy link | `src/pages/admin/AdminEvents.tsx`, `src/pages/admin/AdminTrainingList.tsx` |
| noindex | `src/pages/EventDetail.tsx`, `src/pages/TrainingDetail.tsx` |

## Critical gotcha
`listPublishedTrainings()` is **intentionally NOT visibility-filtered** — `TrainingDetail.tsx` resolves a training by finding it in that list, so filtering there would break every private link. The filter lives in `Training.tsx` (the listing page) only. Global search (`GlobalSearch.tsx`) also excludes private items explicitly.

## Verified live
As an anonymous client: fetch by private slug → row returned; the listing query (`status in published,archived` + `visibility=public`) → private slug absent. Runtime link check passed on production.

## How to test
Create a training, set Private, publish → it must not appear on `/training`, in search (⌘K), or in sitemap-driven pages → open "Copy private link" in a private/incognito window → the page loads and enrollment works. Edit the training (change the name) → the link must stay the same. Flip it to Public then back to Private → the link must change.
