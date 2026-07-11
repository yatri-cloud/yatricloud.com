# Job Board (/jobs)

Live openings pulled from companies' **official ATS APIs** (Greenhouse +
Lever public board endpoints — documented, ToS-friendly, no scraping).
Phase 1 shipped; phases 2–4 are the agreed roadmap.

## Phase 1 — SHIPPED

- **Migration 043**: `job_companies` (name, ATS slug, source, counters) +
  `job_postings` (title/location/level/department/remote/apply_url/
  description, unique per company+external id). Public read RLS on active
  rows; admin-role write; the sync worker uses the service role.
- **Ingester** `scripts/jobs-sync.mjs` (runs on the owner's Mac, like the
  resume worker): probes BOTH providers per company slug (self-corrects a
  wrong source), strips JD HTML (15KB cap), derives level from the title
  (entry/mid/senior), detects remote, upserts in chunks, deactivates
  postings that disappeared, updates per-company counters. First live run:
  **3,663 jobs across 19 boards** (Stripe 510, Databricks 786, MongoDB 388,
  Palantir 273, Cloudflare 249, Airbnb 210, Postman, CRED, PhonePe, Meesho,
  Groww, …). Schedule later via launchd like the resume worker.
- **/jobs page**: SERVER-side search/filter/pagination (title search,
  location search, company, level, remote/on-site; 20/page) because with
  thousands of rows the client must never download the full set —
  descriptions load only when a job's Details dialog opens (D39/D40 payload
  lesson). Apply links out to the official posting.

## Sources (all server-side in scripts/jobs-sync.mjs — no keys ever reach the browser)

- **Per-company ATS** (public, no key): Greenhouse, Lever, Ashby, SmartRecruiters.
  Add a company in /admin/jobs with its board slug + source.
- **Free aggregator feeds** (no key): Arbeitnow, Remotive, RemoteOK — grouped
  into on-demand `source='aggregator'` company rows (slug `agg-<name>`), upserted
  each run. External id namespaced `<feed>:<id>` so feeds never collide.
- **Adzuna** (India + 11 countries, free key): env-gated on `ADZUNA_APP_ID` /
  `ADZUNA_APP_KEY` in `.env` (server-only, NEVER `VITE_` — those bundle to the
  browser). Skipped silently when unset. Get free keys at developer.adzuna.com.
- Security model: the worker holds every key and uses the Supabase SERVICE ROLE;
  the /jobs page only reads `job_postings` via the anon key + public-read RLS.
  Research + option list: `reference/yatri-jobs/Job-and-Company-Data-APIs-Research.md`.
- Not wired (need scraping / paid / legal review): JSearch, Naukri (Apify),
  JobSpy (LinkedIn/Indeed/Glassdoor). Documented, deliberately deferred.

## Roadmap

- **Phase 1b**: /admin/jobs — companies CRUD (add name+slug, toggle,
  last-sync/js counts), postings toggle. Ashby/SmartRecruiters adapters for
  the seeds that failed (Notion, Rippling, Razorpay, Zepto, Swiggy, Zomato).
  Import from the owner's Google Sheets kits (export as CSV → seed).
- **Phase 2 — match**: upload resume on the board (reuse resume-maker
  storage) → Mac worker has Claude read it → suggested roles/companies →
  matching jobs pre-checked; or fully manual selection. Checklist UI.
- **Phase 3 — batch tailored resumes**: N selected jobs → N one-page
  resumes via the existing resume worker, each tailored to that job's
  stored description; results table with preview/download per job.
- **Phase 4 — outreach**: Claude-drafted email per company (signature from
  the resume), preview each, send one/all VIA GOOGLE OAUTH ONLY (gmail.send
  scope; NEVER passwords), strict daily caps (default ~25/day) so accounts
  are never flagged; published careers emails + an admin-managed referral
  contacts table (no LinkedIn scraping — ToS/privacy).

## Constraints agreed

- Official APIs only; giant MNC portals (Google/Amazon/Microsoft) need
  per-company adapters — evaluate in phase 1b/2.
- No email/LinkedIn scraping. No password collection, ever.
- Gmail send scope requires Google app verification (works for 100 test
  users pre-verification).
