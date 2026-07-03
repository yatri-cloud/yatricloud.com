# Study Planner (Exam Countdown)

A dashboard widget that turns "someday" into a date: pick a certification and your exam day, get a live days-left countdown with stage-appropriate guidance and one-click links to the right resources. Retention feature — a reason to come back weekly.

## User flow
1. `/dashboard` → **"Exam countdown"** card (below the summary tiles).
2. **Plan an exam** → pick any certification from the full catalog (label + exam code) + a date (past dates rejected; date input is min-clamped to today).
3. Each plan renders: cert label + exam code + long-form date, a big **days-left** number (primary color; **warning color at ≤ 14 days**), a guidance line that changes with distance, and quick links: *Practice questions · Exam voucher · Training* + Remove.
4. Multiple plans allowed (one per certification, enforced by a unique constraint — duplicates get a friendly toast).

## Guidance ladder (`milestoneCopy`)
- **> 45 days** — "Plenty of runway: study a little most days — consistency beats cramming."
- **≤ 45** — "Build depth: finish the course content, then start timed practice tests."
- **≤ 21** — "Crunch time: alternate practice tests with weak-topic review."
- **≤ 7** — "Final week: one full practice test a day, review only what you miss."
- **Day 0** — "Exam day is here. Deep breath — you prepared for this."

## Data model — `supabase/migrations/033_study_plans.sql` (applied live)
`study_plans`: `id`, `user_id` (fk profiles, cascade), `certification_id` (fk provider_certifications, cascade), `exam_date date`, `created_at`, **unique (user_id, certification_id)**. RLS: single owner-only policy for ALL operations (`user_id = auth.uid()` on both `using` and `with check`) — nobody reads anyone else's plans.

## Code map
| Piece | File |
|---|---|
| Widget | `src/components/StudyPlanCard.tsx` (self-contained: load, add, remove, countdown, guidance) |
| Mounted in | `src/pages/YatriDashboard.tsx` (after the summary tiles) |
| Catalog options | `getCertificationOptions()` from `src/lib/training-api.ts` |
| Migration | `supabase/migrations/033_study_plans.sql` |

## Notes
- Days-left uses local midnight of the exam date (`Math.ceil` of the diff) — "1 day left" on the eve, "0" on the day.
- Deleting a certification from the catalog cascades its plans away (fk `on delete cascade`).

## How to test
Signed in on `/dashboard`: add a plan two weeks out → amber count + crunch-time copy; add the same cert again → duplicate toast; Remove works; sign in as another user → their card is empty (RLS).
