# Yatri Cloud

**Master IT certifications the affordable way.** AWS · Azure · GCP · DevOps · Kubernetes · Terraform — practice tests, verified exam dumps, training, community events, and 50%-off vouchers. 50K+ Yatris and counting.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Vite + React 18 + TypeScript, Tailwind CSS, shadcn/ui + Radix, Framer Motion |
| Backend | **Supabase** (Postgres + Auth + Storage + RLS) — project `yatricloud.com`, `ap-south-1` Mumbai |
| Payments | Razorpay (Stripe-ready schema) |
| Deploy | Vercel (SPA + `api/` serverless), GitHub `main` auto-deploy |

## Getting started

```bash
npm install
cp .env.example .env      # fill in Supabase keys etc. (never commit .env)
npm run dev               # app on :8080
npm run dev:all           # app + local server.js (Ollama AI chat, email)
npm run build             # production build
```

## Project layout

```
src/
  components/      UI components (sections/, admin/, trainer/, ui/ primitives…)
  pages/           routes (60+), incl. admin/ + trainer/ portals
  lib/             data layer — supabase.ts (client), auth.ts (auth core),
                   yatris-api.ts, exam-dumps.ts, store-products.ts, voucher-api.ts…
  hooks/           use-reviews, use-udemy-sheets, …
supabase/
  migrations/      numbered SQL migrations (source of truth for schema + RLS)
scripts/
  supabase-import.mjs   idempotent legacy-data importer
api/               Vercel serverless (razorpay, send-email, canva)
docs/              SYSTEM-DESIGN.md (backend), SESSION-GUIDE.md, VOICE.md, guides…
archive/           retired legacy code (Apps Script, old proxies) — reference only
```

## Backend in one paragraph

All data lives in **22 RLS-secured Postgres tables** (see `docs/SYSTEM-DESIGN.md`). The browser talks to Supabase directly with the publishable key — Row Level Security is the boundary: published content is public-readable, users own their rows, form tables are insert-only for the public, payments are server-side only. Auth is Supabase Auth (email/password + Google ID-token). Files live in Storage buckets (public images; private PDFs via signed URLs). Schema changes happen **only** via a new numbered file in `supabase/migrations/` applied with psql.

## House rules

- **Secrets:** only in git-ignored `.env` (template: `.env.example`). Never commit, never hardcode, never `VITE_`-prefix a server secret.
- **Design:** read `DESIGN.md` before UI work — frozen blue palette, single light theme, section bands, "Yatris" voice (`docs/VOICE.md`).
- **New sessions:** start with `docs/SESSION-GUIDE.md` + `docs/NEW-SESSION-PROMPT.md`.

© Yatri Cloud · [yatricloud.com](https://yatricloud.com) · Designed by [Uimitra](https://uimitra.com)
