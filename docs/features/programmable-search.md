# Google Programmable Search Engine (PSE) — job board integration

The board uses Google's PSE to find **LinkedIn profiles for referrals** and
(next phase) **jobs across the web**. Two modes:

- **Widget mode (LIVE, no key, no cost):** the `cse.js` widget embedded on
  `/jobs/referrals`, restricted to `linkedin.com/in/*`. The user searches and
  clicks through to public profiles. This is what ships today.
- **JSON API mode (next phase, needs a key):** the Mac worker calls the
  Custom Search JSON API, so Claude can rank profiles and auto-write notes.

## Current engine

- Name: **LinkedIn Email Finder** · CX **`22c8ca52ab7fa46e6`**
- Restricted to **`*.linkedin.com/in/*`** (profiles only)
- Embedded on `/jobs/referrals` via `<script src="cse.js?cx=…">` + `.gcse-search`

## What to ADD into the Programmable Search Engine (your ask)

### 1. Referral profile search — sites to search (keep + extend)
```
*.linkedin.com/in/*          ← already added (people profiles)
*.linkedin.com/pub/*         ← older profile URLs
```
Search queries that work well (type these in the widget):
```
{role} {company} {city}                  e.g. Cloud Engineer Stripe Bangalore
{company} recruiter                       e.g. PhonePe recruiter
{company} engineering manager {city}
{role} {company} hiring
```

### 2. Job search — a SECOND engine (create a new PSE for jobs)
Make a separate engine (new CX) with these **Sites to search** so a query like
"software engineer jobs India Bangalore" returns real postings:
```
*.linkedin.com/jobs/*
careers.google.com/*
jobs.careers.microsoft.com/*
amazon.jobs/*
*.greenhouse.io/*
*.lever.co/*
*.ashbyhq.com/*
naukri.com/*
*.smartrecruiters.com/*
```
Query templates:
```
{role} jobs {country} {city}
{role} {company} careers
{skill} developer jobs remote india
```
Give me that second CX and I wire a "Search the web for jobs" tab on /jobs.

### 3. Company careers/email search (optional third engine)
```
{company} careers email
{company} campus hiring contact
```

## JSON API upgrade (programmatic — needs a key)

To have the WORKER fetch results and Claude rank + auto-write notes:

1. Google Cloud Console → enable **Custom Search API**.
2. Credentials → **API key** → restrict it to the Custom Search API.
3. Add to `.env` (server-only, NEVER `VITE_`):
   ```
   GOOGLE_CSE_API_KEY=your_key
   GOOGLE_CSE_CX_PEOPLE=22c8ca52ab7fa46e6
   GOOGLE_CSE_CX_JOBS=your_jobs_engine_cx
   ```
4. Free tier: **100 queries/day**, then paid — so the worker caches and caps.
   Endpoint: `GET https://www.googleapis.com/customsearch/v1?key=…&cx=…&q=…`

Then a fresh session builds: referral_searches queue (migration 050 already
has the table) → worker queries the CX → Claude scores each profile against
the resume + JD and writes a tailored connection note + post-accept follow-up
→ `/jobs/referrals` shows ranked people with per-person Generate buttons.

## Constraints

- Widget/JSON both return **public Google results** — legal, not scraping.
- The API key stays server-side; the widget CX is public by design (it only
  searches, and Google rate-limits it).
- No LinkedIn login, no profile scraping, no personal-email harvesting.
