# Feature Documentation

One file per shipped feature — what it does, the end-to-end flow, data model & migration, security/RLS, code map, gotchas, and how to test. Written for the next person (or session) touching the feature.

## Learning & catalog
| Feature | Doc | Migration |
|---|---|---|
| Practice quiz engine (author + take + attempts) | [quiz-engine.md](quiz-engine.md) | 031 |
| Certification Path Explorer (`/paths`) | [certification-paths.md](certification-paths.md) | — |
| Study planner with exam countdown (dashboard) | [study-planner.md](study-planner.md) | 033 |

## Growth & sharing
| Feature | Doc | Migration |
|---|---|---|
| Certificate sharing (LinkedIn, PNG, QR, share) | [certificate-sharing.md](certificate-sharing.md) | — |
| Public Yatri profiles (`/yatri/:slug`) | [yatri-profiles.md](yatri-profiles.md) | — |
| Urgency: countdowns + seats meter | [urgency-countdown.md](urgency-countdown.md) | — |

## Commerce
| Feature | Doc | Migration |
|---|---|---|
| Coupon codes at checkout + admin CRUD | [coupons.md](coupons.md) | 032 |
| Payments, receipts & revenue (Razorpay) | [payments-receipts-revenue.md](payments-receipts-revenue.md) | — |

## Platform & UX conventions
| Feature | Doc | Migration |
|---|---|---|
| Global ⌘K search | [global-search.md](global-search.md) | — |
| List search, sort & pagination (site-wide convention) | [list-search-sort-pagination.md](list-search-sort-pagination.md) | — |
| Public/private visibility + unlisted links (events & trainings) | [events-training-visibility.md](events-training-visibility.md) | 029 |
| Admin inquiries inbox (partner + contact forms) | [admin-inquiries.md](admin-inquiries.md) | 004/006 |

## Related planning docs (docs root)
- [SYSTEM-DESIGN.md](../SYSTEM-DESIGN.md) — the full Supabase backend design (tables, RLS philosophy, storage).
- [EVENTS-TRAINING-PLAN.md](../EVENTS-TRAINING-PLAN.md) · [MENTORSHIP-PLAN.md](../MENTORSHIP-PLAN.md) · [PAYMENTS-COMMISSION.md](../PAYMENTS-COMMISSION.md) — subsystem plans.
- [DYNAMIC-CONTENT-AUDIT.md](../DYNAMIC-CONTENT-AUDIT.md) — the everything-admin-managed checklist (closed).

## Conventions every feature follows
- **Migrations**: numbered `supabase/migrations/NNN_name.sql`, applied to production via psql, committed with the feature.
- **RLS is the security boundary** — new tables ship with policies in the same migration; anything readable by anon is deliberate. Watch the Supabase default-privileges gotcha documented in [coupons.md](coupons.md).
- **Gate before commit**: `npx tsc --noEmit` + `npm run build` + the undefined-JSX static check (tsc does NOT catch undefined JSX identifiers — this exact gap once took production down).
- **Lists** follow [list-search-sort-pagination.md](list-search-sort-pagination.md); copy follows `docs/VOICE.md` (no dashes-in-sentences, warm, simple English); design follows `DESIGN.md`.
