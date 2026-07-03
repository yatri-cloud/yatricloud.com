# Certification Path Explorer (`/paths`)

"Where should I start?" answered as a product: pick a career goal, get a staged certification journey built **live from the catalog**, with links into the store, dumps, and training at every step.

## User flow
1. `/paths` → hero + goal pills: **Cloud Engineer · DevOps Engineer · Data & AI · Cloud Security**.
2. Picking a goal shows its tagline plus social proof: "N Yatris on our Wall of Fame already hold these certifications" (live count from the `certifications` table by provider).
3. A vertical numbered timeline with three stages — **Start here → Level up → Go pro** — each listing up to 6 matching certifications (logo, label, exam-code pill) and three links per cert: *Practice questions* (`/examdumps`), *Voucher at 50% off* (`/yatristore`), *Training* (`/training`). Overflow shows "And N more at this level in our catalog."
4. Closing CTA: free guidance (contact) or the Wall of Fame.

## How the staging works (the clever part)
The `provider_certifications.level` column is **empty in production**, so stages are derived from **label keywords**:
- Start here → `/practitioner|fundamentals|foundational|foundations|essentials|kcna|cloud digital leader/i`
- Level up → `/associate|administrator/i`
- Go pro → `/professional|expert|specialty|speciality|architect/i`

Each goal is a config object (`GOALS` in the page): provider allow-list + optional topic regex (e.g. DevOps requires `/kubernetes|terraform|github|devops|sysops/i`) applied before the level split. **New catalog rows slot into the journey automatically** — nothing hardcodes a certification. If the `level` column is ever populated, prefer it over the regexes.

## Code map
| Piece | File |
|---|---|
| Page (config + derivation + UI) | `src/pages/CertificationPaths.tsx` |
| Catalog fetch | `getCertificationOptions()` in `src/lib/training-api.ts` (active rows, provider+sort order, never throws) |
| Logos | `getCertificationLogoUrl(provider, theme)` — **keys are lowercase slugs** (`aws`, `azure`) |
| Social proof | one `certifications.select("provider")` counted client-side (provider values are uppercase in that table — lowercased for matching) |
| Route / SEO / discovery | `src/App.tsx` (`/paths`), `public/sitemap.xml`, `nav_links` row (`footer_explore`, "Certification Paths") |

## Extending
- New goal: add a `GOALS` entry (id, label, tagline, providers, optional topic regex). Stages reuse `LEVEL_STAGES`.
- Tune a stage: adjust its regex — check against the live labels first (`select label from provider_certifications where provider_slug='…'`).
- `STAGE_CAP = 6` keeps Oracle's 179 rows from flooding the Data & AI goal.

## How to test
Open `/paths`, switch all four goals — each stage should populate sensibly (AWS/Azure/GCP fundamentals in "Start here", Associates in "Level up"). Empty stages show the "jump to the next stage" note rather than a gap.
