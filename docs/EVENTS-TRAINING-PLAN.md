# Events and Training — Production and Features Plan

> Focus (user, 2026-07-03): bring Events and Training to production grade, add the common
> necessary features plus unique differentiators, then full end to end live testing (manual + auto).
> Standing rules: NO ids in URLs (use slugs), NO raw database values in the UI, simple warm copy with
> no dashes in sentences, minimal icons and none beside titles. Razorpay Route commission is ON HOLD.

## Data reality (live, 2026-07-03)
- Events: 4 rows, all archived, all free, all past or test. All have slugs. 0 published, 0 upcoming.
- Registrations, submissions, feedback: 0.
- Training: fully empty (0 trainings, enrollments, modules, lessons, trainer applications).
- Payments for events and training already verify server side (HMAC via /api/razorpay/verify). Good.
- Events store rich data (speakers, sponsors, tickets) JSON packed into the description column (a hack).

## Batch 1 — Foundation: slug URLs and no ids in the UI (SHIPS FIRST)
- Events: route /events/:slug (was :id); every event link uses slug; EventDetail resolves by slug then
  id fallback so old links still work; "other events" and admin links use slug.
- Training: route /training/:slug and /training/:slug/dashboard; Training.tsx, TrainingDetail,
  StudentTrainingDashboard, MyTrainings use slug; resolve by slug then id fallback.
- Sweep: no raw id or uuid or database value rendered to users anywhere in events/training pages.
- App.tsx owns all route changes (single owner to avoid conflicts).

## CRITICAL (audit found, now top priority): PAID PAYMENTS BROKEN
- Event + training PAID registration/enrollment NEVER records: initiateRazorpayPayment builds checkout with NO order_id, so verify always 400s. Only free works. Also payment_id (razorpay pay_xxx string) written to uuid FK = type error; verify.ts had no event/training branch.
- FIX (in progress): order-based flow + verify branches, mirror mentorship. Migration 020 added amount/currency/payment_status/order_id to registrations+enrollments, invoices table, site_settings.currencies (8).
- NEW (user, 2026-07-03): DIRECT international multi-currency checkout on the site (store+events+training) — user picks currency, pays directly; INVOICE emailed (domestic + international) on every payment. Built into the same unified payment layer (currency.ts convert from INR via site_settings rates, CurrencySelect, verify.ts generates+emails invoice for all kinds).

## Batch 2 — Events production features
Common necessary:
- Capacity and seats left; Sold out state; waitlist join when full (new event_waitlist table).
- Registration confirmation email with the registration code; Add to calendar (reuse the calendar
  helpers) on My Events and in the email; event reminders via the existing cron (day before, start soon).
- Share buttons on the event page (reuse the mentor profile share pattern).
- Filters on the events list: upcoming vs past, online vs offline, by certification track.
Unique (cloud cert community):
- Certification track tag on events; browse events by AWS, Azure, GCP, Kubernetes, DevOps.
- Post event: recording link and a simple certificate of attendance for checked in attendees.

## Batch 3 — Training production features
Common necessary:
- Lesson progress tracking: mark a lesson complete, resume where you left off (new lesson_progress
  table); course progress bar in the student dashboard.
- Certificate of completion when all lessons are done.
- Enrollment confirmation email; live session reminders and add to calendar.
- Downloadable resources per lesson; training reviews and ratings (reuse reviews pattern).
Unique:
- Each training maps to a certification and exam code; "prepares you for X" badge; filter by provider.
- Cohort or live schedule with meeting links.

## Batch 4 — Admin and ops
- Admin can fully manage events and trainings, see registrations and enrollments, mark attendance and
  completion, and export CSV (reuse the CSV pattern). Waitlist and certificate management.

## Batch 5 — End to end live testing (manual + auto)
- Seed minimal real data, run the full flows against production: browse, register or enroll, pay in
  test mode, dashboard, progress, certificate, admin manage, then clean up. RLS block matrix for the
  new tables. Automated checks where cheap.

## Execution
Proven flow per batch: migration (if needed) applied via psql and RLS verified with the anon key,
then scoped parallel agents with disjoint file lists, tsc and build gate, commit and push. Reuse the
mentorship building blocks: calendar helpers, reminder cron, share, CSV export, server verified payment.
