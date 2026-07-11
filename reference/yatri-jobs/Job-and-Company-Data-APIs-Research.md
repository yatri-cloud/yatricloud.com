# Job Listings & Company Data: APIs, Scrapers, and Databases (Free + Open Source Focus)

Researched July 2026. This covers every practical route to get job postings and company data: official free APIs, public no-auth feeds from ATS platforms, open-source scraper libraries, marketplace scrapers (Apify), and downloadable open datasets. India-specific options are called out since that's a likely use case.

---

## 1. Free / freemium job listing APIs

These are official APIs with a genuine free tier. Best starting point if you want structured, legal, stable data without scraping.

| API | Free tier | Coverage | Notes |
|---|---|---|---|
| **Adzuna API** (developer.adzuna.com) | Free, ~25 req/min, 250 req/day | 12 countries including **India**, UK, US, Germany, France, Australia, Canada, Brazil, Poland, Austria, South Africa, NZ | Best general-purpose free jobs API. Returns salary stats too. Needs free `app_id` + `app_key`. |
| **Jooble API** | Free (request key via jooble.org/api/about) | Global, aggregates many boards | Simple REST POST endpoint, returns title/company/location/link/salary. |
| **Arbeitnow Job Board API** | Completely free, **no API key needed** | Mostly Europe/remote, pulls from ATS systems | Great for quick prototyping, zero signup friction. Also listed on RapidAPI. |
| **Remotive API** | Free, no key | Remote jobs only | Simple JSON endpoint, filter by category/search. |
| **RemoteOK API** | Free, no key | Remote jobs only | `remoteok.com/api` returns JSON array directly. |
| **JSearch** (via OpenWeb Ninja or RapidAPI) | Free tier, no credit card | Aggregates Google for Jobs, Indeed, LinkedIn, Glassdoor results | This is currently the closest thing to a "LinkedIn/Indeed API" since it re-serves Google for Jobs data legally. Paid tiers for higher volume. |
| **Careerjet API** | Free (affiliate-style, needs approval) | Global, strong in India too | Slightly bureaucratic to get approved but solid coverage. |
| **The Muse API** | Free, no key required for public endpoint | US-focused, company + culture content | Good if you also want "company profile" style content, not just listings. |
| **USAJobs API** | Free, needs API key + registered email | US federal government jobs only | Extremely clean, official, well-documented. Three endpoints: Search, Historic JOAs, Announcement Text. |
| **Reed API** (reed.co.uk/developers) | Free, needs API key, HTTP Basic Auth | UK only | Salary data in GBP, well-documented. |

**Practical starting stack if you want zero cost and zero signup delay:** Arbeitnow + Remotive + RemoteOK give you real, live data in one afternoon with no approval wait. Add Adzuna next since it actually covers India directly.

---

## 2. Public ATS job board feeds (no scraping needed, these are real public APIs)

This is the part most people miss. A huge share of company career pages are just a themed wrapper around one of a handful of Applicant Tracking Systems (ATS), and most of these expose a public, unauthenticated JSON endpoint per company. If you know (or can guess) the company's "board token," you can pull their live job list directly, no scraping, no key.

| ATS | Public endpoint pattern | Auth needed | Notes |
|---|---|---|---|
| **Greenhouse** | `GET https://api.greenhouse.io/v1/boards/{board_token}/jobs?content=true` | None | `board_token` is usually the company's slug (e.g. `airbnb`, `stripe`). No filtering on this endpoint, but you get full job content. Full docs: developers.greenhouse.io/job-board.html |
| **Lever** | `GET https://api.lever.co/v0/postings/{company}?mode=json` | None | Supports query params: `team`, `department`, `location`, `commitment`, `skip`, `limit`. Returns clean JSON with `applyUrl`, `hostedUrl`, categories. |
| **Ashby** | `GET https://api.ashbyhq.com/posting-api/job-board/{company}` | None | Newer ATS, growing fast among startups, same public-board pattern. |
| **SmartRecruiters** | `GET https://api.smartrecruiters.com/v1/companies/{company}/postings` | None | Public postings API, same idea. |
| **Workday** | Company-specific CXS endpoint, pattern varies (`{tenant}.wd5.myworkdayjobs.com/wday/cxs/{tenant}/{site}/jobs`) | None, but undocumented/unofficial | Big enterprises (banks, IT services companies common in India like Infosys/TCS/Wipro/Cognizant/HCL often run Workday) use this. Structure is consistent but not officially published, so treat as semi-stable, not a guaranteed contract. |
| **Recruitee, BambooHR, Personio, Teamtait** | Similar public board JSON per company | None | Smaller but same overall pattern: guess/confirm the company's board slug, hit a predictable REST URL. |

**How to use this practically:** build a list of target companies, for each one figure out which ATS they use (usually visible in the URL of their public "Careers" page, e.g. `boards.greenhouse.io/company` or `jobs.lever.co/company`), then hit the matching endpoint above. This gives you the most accurate, freshest, most legally clean data of any method on this list, since it's literally the same public data the company already publishes with no login wall.

There's also a good comparison write-up here: [6 ATS Platforms with Public Job Posting APIs](https://cavuno.com/blog/ats-platforms-public-job-posting-apis).

---

## 3. Open-source scraping libraries (when there's no clean API)

For LinkedIn, Indeed, Glassdoor, and Google for Jobs, there is no official free API, so the open-source community has built scraper libraries instead.

### JobSpy (the main one to know)
- Repo: [speedyapply/JobSpy](https://github.com/speedyapply/JobSpy), installable via PyPI as `python-jobspy`
- Scrapes LinkedIn, Indeed, Glassdoor, Google (for Jobs), ZipRecruiter, and a few others, concurrently, in one call
- Returns structured `JobPost` objects: title, company, URL, location (country/city/state), remote flag, description, job type, salary (interval + amount), date posted, and sometimes emails
- **Known limits (important):** Indeed is the most reliable and has no real rate limiting. Glassdoor supports most countries but needs a `country_indeed` parameter. ZipRecruiter is US/Canada only. LinkedIn is the most restrictive, usually rate-limits around page 10 from a single IP, so proxies are basically required for any real LinkedIn volume. All boards cap out around 1000 jobs per search.
- There's also a TypeScript port, `ts-jobspy`, if you're not in a Python stack.

This is the single best free, self-hosted option if you specifically need LinkedIn/Indeed/Glassdoor data and don't want to pay for a scraping service.

---

## 4. Marketplace scrapers (Apify) — paid-per-use but zero setup

If you don't want to run and maintain scraper code yourself (proxies, IP bans, anti-bot changes), Apify's marketplace has ready-made "Actors" you can call via API, paid per result (often fractions of a cent to a few cents per record), with a small free monthly credit to start.

Relevant actors found:
- **Naukri.com scrapers** (multiple, since Naukri is India's #1 job board): `memo23/naukri-scraper` (covers both Naukri India and NaukriGulf/UAE), `bovi/naukri-jobs-scraper`, `makework36/naukri-scraper` (30+ structured fields including salary parsed to INR/USD, skills, experience, education), `easyapi/naukri-jobs-scraper`
- **LinkedIn / Indeed / Glassdoor combined scrapers** and a **Workday + Greenhouse + Lever combined scraper** (`moving_beacon-owner1/workday-greenhouse-lever-job-scraper`)
- **Greenhouse, Lever & Ashby combined** (`bovi/greenhouse-lever-ashby-job-scraper`)
- **USAJobs scraper** with no API key required (`logiover/usajobs-scraper`, `curative_blanket/usajobs-federal-jobs-feed`)
- **Adzuna scraper** (`thirdwatch/adzuna-jobs-scraper`) if you want Adzuna data without registering for their API directly

Since this session has Apify tools connected (`apify-mcp`), I can actually search the live Apify store and call one of these actors directly for you if you want a working pull of, say, Naukri or LinkedIn listings, just say which one and what to search for.

**Caveat worth flagging honestly:** scraping LinkedIn, Indeed, Glassdoor, and Naukri sits in a legal gray zone. These actors only touch what's publicly visible with no login, which is the safer end of that gray zone, but you should still check each site's Terms of Service before doing this at real scale or commercially, especially for LinkedIn, which is the most litigious about this historically.

---

## 5. Company data APIs (registration info, size, industry, etc.)

| Source | Free? | What it gives you | Notes |
|---|---|---|---|
| **OpenCorporates API** | Free tier with generous limits for non-commercial/open-data use | 200M+ companies globally, official registration data, jurisdiction, status, officers | Best free source for "does this company legally exist and where." Commercial/bulk use needs a paid plan. |
| **UK Companies House API** | Completely free | Full UK company registry: filings, officers, accounts, status | One of the best government open-data APIs in the world, no catches. |
| **SEC EDGAR (US)** | Completely free | All US public company filings (10-K, 10-Q, S-1, etc.) by name or CIK | Only covers publicly-traded/SEC-registered entities, but unlimited and free. |
| **US Secretary of State registries** | Free, per-state | Entity status, registered agent, filing history | No unified API, varies state by state, but always free for lookups. |
| **Crunchbase API** | **No longer free as of 2025/2026** | Startup funding, founders, industries | Heads up if you were assuming a free tier still exists, it doesn't anymore. Cheapest plan is now $49/month (Basic), $99/month for full API (Pro). |
| **People Data Labs (PDL)** | Free plan: 100 person/company lookups per month + 25 IP lookups | Company + person enrichment | Good practical free alternative to Crunchbase for small-scale lookups. Data refreshes monthly, so it can lag reality a bit. |
| **Apollo.io** | Free tier available, strongest in this price band | 275M contacts across 73M companies, plus outreach/CRM features | Good if you also want contact/email data alongside company data, not just firmographics. |
| **Clearbit / ZoomInfo / Hunter.io** | Paid (Hunter has a small free email-finder quota) | Enrichment, verified emails | Mentioning for completeness, these are the well-known paid options if free sources aren't detailed enough. |

---

## 6. Open datasets (no API calls needed, just download and use)

If you don't need live/real-time data and a periodic snapshot is fine, these are free downloadable datasets:

- **Hugging Face**: `xanderios/linkedin-job-postings`, `lukebarousse/data_jobs`, `jacob-hugging-face/job-descriptions`, `gpriday/job-titles` (built from US Dept of Labor O*NET data), `azrai99/job-dataset` (JobStreet postings)
- **Kaggle**: `moyukhbiswas/job-postings-dataset`, plus a well-known fraudulent-vs-real job postings dataset (`fake_job_postings_balanced_en/va`) if you're building any kind of scam-job detector
- **O*NET Web Services** (services.onetcenter.org): completely free (registration + attribution required), this is the official US Department of Labor occupational database: job titles, tasks, skills, required education, outlook, mapped to standardized occupation codes. Extremely useful as a taxonomy/skills backbone even outside the US.
- **BLS (Bureau of Labor Statistics) Public Data API**: free, v2 needs registration (email + org name) for higher limits, v1 needs no registration at all. Gives wages, employment projections, and industry employment share at national/state/local level (US only).

---

## 7. If you're focused on India specifically

- **Adzuna** directly supports India (`country=in`) with a genuine free API, no scraping needed, this should be your first stop.
- **Naukri.com** is India's largest job board but has no official public API, so the practical route is one of the Apify Naukri scraper actors listed in section 4 (several exist, prices vary, some as low as $0.60 per 1,000 results).
- Big Indian IT services companies (Infosys, TCS, Wipro, HCLTech, Cognizant, Tech Mahindra) and many MNC India offices commonly run their careers pages on **Workday** or **SmartRecruiters**, so the public ATS feed pattern in section 2 works well for company-by-company pulls once you identify their board.
- JSearch (section 1) also surfaces Indeed India and Google for Jobs India results through one API call, worth testing since it may cover more Indian listings than Adzuna alone.

---

## 8. Suggested architecture if you're building an actual job + company database

1. **Seed with open/free APIs first**: Adzuna (India + 11 other countries) + Arbeitnow + Remotive/RemoteOK (remote roles) + JSearch free tier. This alone gets you a legally clean, continuously-updating base with zero scraping risk.
2. **Layer in target companies via their ATS feed directly** (section 2) for any specific employers you care about, this is free, stable, and the highest-quality source per company.
3. **Add JobSpy (self-hosted, free) or Apify actors (paid-per-result) only for the gaps**, mainly LinkedIn/Naukri/Glassdoor, where no clean API exists.
4. **Enrich company records** with OpenCorporates (registration/legitimacy) and, if budget allows, People Data Labs or Apollo (firmographics/size/industry) since Crunchbase's free option is gone.
5. **Deduplicate on company name + domain**, since the same job often appears on 3-4 sources at once (this is the single biggest practical headache in this kind of pipeline, budget real time for it).
6. Store everything in a normal relational database (Postgres is the standard choice), one `companies` table and one `job_postings` table with a foreign key, plus a `source` column on postings so you always know which API/scraper a record came from, this matters a lot for debugging and for respecting each source's terms.

---

## Sources

- [Job Board API — Arbeitnow](https://www.arbeitnow.com/blog/job-board-api)
- [Adzuna API](https://developer.adzuna.com/)
- [Adzuna Job Search MCP (12 countries incl. India)](https://github.com/folathecoder/adzuna-job-search-mcp)
- [JSearch API — OpenWeb Ninja](https://www.openwebninja.com/api/jsearch)
- [JobSpy — GitHub](https://github.com/speedyapply/JobSpy)
- [python-jobspy — PyPI](https://pypi.org/project/python-jobspy/)
- [Greenhouse Job Board API docs](https://developers.greenhouse.io/job-board.html)
- [6 ATS Platforms with Public Job Posting APIs](https://cavuno.com/blog/ats-platforms-public-job-posting-apis)
- [Lever Job Board API reference](https://parse.bot/marketplace/673e428d-cced-419e-afa1-f2aeba7a03dc/jobs-lever-co-api)
- [OpenCorporates API](https://api.opencorporates.com/)
- [Naukri Scraper — Apify](https://apify.com/makework36/naukri-scraper)
- [Naukri Jobs Scraper (public-data-only) — Apify](https://apify.com/bovi/naukri-jobs-scraper)
- [USAJOBS Developer API reference](https://developer.usajobs.gov/api-reference/)
- [O*NET Web Services](https://services.onetcenter.org/)
- [BLS Public Data API](https://www.bls.gov/developers/home.htm)
- [Crunchbase API in 2026: Free Tier Gone](https://dev.to/agenthustler/crunchbase-api-in-2026-free-tier-gone-what-startup-data-hunters-do-now-1177)
- [Hugging Face: linkedin-job-postings dataset](https://huggingface.co/datasets/xanderios/linkedin-job-postings)
- [Kaggle: Job Postings Dataset](https://www.kaggle.com/datasets/moyukhbiswas/job-postings-dataset)
