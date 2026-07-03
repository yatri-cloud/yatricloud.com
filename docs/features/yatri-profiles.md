# Public Yatri Profiles (`/yatri/:slug`)

Every certified Yatri on the Wall of Fame gets a shareable public profile — a viral loop built from data the platform already has.

## User flow
1. `/achievements` → open any person's modal → **"View full profile"** → `/yatri/their-name`.
2. The profile shows: photo (or initial avatar), name, country flag + name, LinkedIn button, an **"Nx Certified Yatri"** badge, and certifications **grouped by provider** (logo + count chip, then each cert with exam code and date).
3. **Share this profile** — `navigator.share` with clipboard fallback ("{Name} holds N cloud certifications on Yatri Cloud" + URL).
4. Closing CTA — "Your name belongs here too" → `/paths` and back to the wall.

## Slug scheme
`yatriSlug(fullName)` = kebab-cased name (`"Nensi Ravaliya"` → `nensi-ravaliya`). The profile filters `fetchCertifications()` to entries whose name-slug matches. The Achievements modal builds its link with the identical transform — **keep the two in sync** (the canonical helper is exported from the profile page).

Known limit: two people with the exact same name would merge into one profile. Acceptable at current scale; the fix (persisted per-person slug with a uniquifier) needs a people table.

## Data & SEO
- Same public data as the wall: the `certifications` table via `fetchCertifications()` (`src/lib/google-sheets.ts` — Supabase-backed despite the legacy filename).
- Indexed intentionally (it's public showcase data); OG image = the Yatri's photo; not-found renders a friendly page with `noindex`.

## Code map
| Piece | File |
|---|---|
| Page | `src/pages/YatriProfile.tsx` (includes exported `yatriSlug`) |
| Route | `src/App.tsx` → `/yatri/:slug` |
| Entry link | `src/pages/Achievements.tsx` (person modal, next to LinkedIn) |
| Flags / logos | `src/lib/country-flag.ts`, `src/lib/certification-logos.ts` (lowercase slug keys) |

## How to test
Open a person on `/achievements` → View full profile → groups match the modal → Share copies a working link → open it logged-out (public) → a nonsense slug shows "Yatri not found".
