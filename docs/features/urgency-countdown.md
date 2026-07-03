# Urgency: Countdowns & Seats Meter

Psychology-driven conversion on the two money pages — a live countdown to the start, and an honest seats meter on capacity-capped events. Copy style follows `docs/VOICE.md`.

## What shows where
- **Event detail** (`/events/:slug`, registration card):
  - **"Starts in"** + segmented `DD : HH : MM : SS` countdown for upcoming events with a real date. Disappears once the event starts (never freezes at zero).
  - **Seats meter** when a capacity is set and seats remain: progress bar of seats taken, "N of Y seats still open" + registered count — switching to **warning color + "Filling fast — only N seats left"** at ≤ 10. Complements the existing sold-out + waitlist flow (full → "Join the waitlist").
- **Training detail** (`/training/:slug`, buy box): **"Batch starts in"** countdown from `startDate` + `startTime` (09:00 fallback), shown only to not-yet-enrolled visitors.

## Why trainings have no seats meter (do not add one client-side)
`training_enrollments` RLS only lets users read **their own** rows — an honest public count is impossible from the client. Events work because `getEventCapacity` already exists server-side of RLS. If training seat counts are ever wanted, add a SECURITY DEFINER counting RPC first.

## Code map
| Piece | File |
|---|---|
| Countdown component | `src/components/CountdownTimer.tsx` — existed but was **orphaned**; now fixed (hides when past/invalid instead of frozen zeros, `aria-live="polite"`) and wired |
| Event wiring | `src/pages/EventDetail.tsx` (countdown + seats meter blocks in the registration card) |
| Training wiring | `src/pages/TrainingDetail.tsx` (buy-box countdown) |
| Capacity data | `getEventCapacity` in `src/lib/events-api.ts` → `{ capacity, registered, seatsLeft, isFull }` |

## Accessibility & motion
- Countdown is text-only updates (`aria-live="polite"`) — no transform animation, so `prefers-reduced-motion` is unaffected.
- The seats bar is a proper `role="progressbar"` with `aria-valuenow/min/max`; its width transition is a CSS transition on width only.

## How to test
Create an event with capacity 20 and a future date → the card shows the countdown + "20 of 20 seats still open" → register test accounts down to ≤10 seats → warning copy + amber bar → fill it → sold-out + waitlist takes over. For trainings: set a future start date → "Batch starts in" ticks; enroll → it disappears.
