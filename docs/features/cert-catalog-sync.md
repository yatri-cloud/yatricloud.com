# Certification catalog — sources, sync & maintenance

How the `cert_providers` / `provider_certifications` catalog is kept current.

## Where the data lives
- **DB**: `provider_certifications` (per-exam) + `cert_providers` (per-vendor),
  admin-managed at **/admin/certifications** (`src/pages/admin/AdminCertCatalog.tsx`).
- **Frontend fallback**: `src/lib/cert-catalog.ts` `FALLBACK_PROVIDER_CERTS` —
  must stay byte-in-sync with the DB for AWS/Azure/GCP/GitHub (first paint + offline).
- Rows carry `level` (fundamentals · foundational · associate · professional ·
  expert · specialty · business) which drives the level-grouped admin UI, and an
  optional `url` (official exam page) surfaced as a per-row "open" link.

## Canonical vendor sources
| Provider | Source | Auto-sync? |
|----------|--------|------------|
| Microsoft (azure + github) | [Certification poster PDF](https://arch-center.azureedge.net/Credentials/Certification-Poster_en-us.pdf) (aka.ms/CertificationsPoster) | ✅ automated (text-extractable PDF) |
| AWS | https://aws.amazon.com/certification/ | ⚠️ manual — page is client-rendered |
| GCP | https://cloud.google.com/learn/certification | ⚠️ manual |
| Oracle | https://www.oracle.com/education/certification/ | ✅ `scripts/refresh-oracle.mjs` (names are server-rendered; add-only, never prunes legacy) |
| Salesforce | https://trailheadacademy.salesforce.com/all-offerings | ⚠️ manual |
| NVIDIA | https://www.nvidia.com/learn/certification/ | ⚠️ manual |

"Everything Microsoft" (Dynamics/M365/Power Platform/AI Business) lives under the
single `azure` provider by decision — see the `azure-github-cert-source` memory.

## Monthly auto-sync (`scripts/sync-cert-catalog.mjs`)
Reads the MS poster with `pdftotext` (poppler) and diffs exam codes against the
catalog. **Non-destructive by design:**
- New codes → inserted as **inactive placeholders** (label = code) so they show in
  the admin for naming but never auto-publish.
- Retired codes → **reported only**, never deleted (`study_plans.certification_id`
  is `ON DELETE CASCADE`).
- A dated report is written to `scripts/.sync-reports/`.

The launchd agent runs **`scripts/monthly-cert-sync.mjs`**, an orchestrator that
runs every refresher + URL backfill in order, isolating each step (one vendor
failing never blocks the rest) and writing a combined report to
`scripts/.sync-reports/monthly-<date>.txt`:

1. `sync-cert-catalog.mjs` — Microsoft poster (new/retired MS exams)
2. `refresh-oracle.mjs --apply` — Oracle page fetch (add missing current exams)
3. `refresh-salesforce.mjs` / `refresh-nvidia.mjs` — re-apply curated lists
4. `backfill-provider-urls.mjs` — provider hub links
5. `backfill-cert-urls.mjs` — per-exam URLs (MS/AWS/GCP/GitHub)
6. `backfill-osn-urls.mjs` — per-exam URLs (Oracle/NVIDIA/Salesforce)

```bash
node scripts/monthly-cert-sync.mjs             # run the whole pipeline now
node scripts/sync-cert-catalog.mjs --dry-run   # preview just the MS diff
```

Install the monthly agent (runs 1st of month, 09:00):
```bash
cp scripts/launchd/com.yatricloud.cert-sync.plist ~/Library/LaunchAgents/
# edit REPO_DIR inside the plist first if your checkout path differs
launchctl load  ~/Library/LaunchAgents/com.yatricloud.cert-sync.plist
launchctl start com.yatricloud.cert-sync       # verify once
```

AWS/GCP/Oracle/Salesforce/NVIDIA pages are JavaScript-rendered, so a plain fetch
can't read them reliably; the sync flags them for manual review. To automate
those later, add a headless-browser fetch (Playwright) per provider.

## Applying data changes
- **DML** (insert/update/delete rows): run via a service-role script, e.g.
  `scripts/apply-poster-certs.mjs`. The numbered `supabase/migrations/*.sql` are
  the checked-in record; keep them non-destructive (upsert by `(provider_slug,
  value)` + prune only retired values).
- **DDL** (e.g. migration `054` adds the `url` column): service-role REST can't
  run DDL — apply it in the **Supabase SQL editor** (or `supabase db push`).
  The admin page probes for the `url` column and hides URL editing until it exists.
