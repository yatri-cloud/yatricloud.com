# SYSTEM-DESIGN.md — Yatri Cloud Backend Migration (Google Apps Script → Supabase)

> **Status:** DRAFT for approval · 2026-07-02
> **Goal:** Replace Google Sheets + Apps Script webhooks with a production-grade, cheap, scalable, secure backend. One database, one storage layer, one auth system — minimum cost, maximum headroom for what's coming (mentorship, 1:1 calls, live sessions, Stripe international payments).

---

## 0. Decision summary (TL;DR)

| Decision | Choice | Why |
|---|---|---|
| Database | **Supabase (Postgres)** | Only option that replaces ALL FOUR current systems at once — Sheets (DB), Apps Script (API), Drive (files), custom tokens (auth) — in one free tier. Neon is DB-only (we'd still need auth+storage elsewhere); Turso is SQLite (no RLS-grade multi-tenant security, weaker relational integrity for payments). |
| Plan | **Free tier → Pro ($25/mo) only when needed** | Current data is a few MB of sheet exports. Free tier = 500MB DB, 1GB storage, 50K auth MAU — years of headroom at current scale. |
| Auth | **Supabase Auth (email+password & Google OAuth)** | Replaces the custom 30-day token in `yatris-users.gs`. Battle-tested JWT + refresh tokens, RLS-integrated, Google sign-in built in. |
| Files | **Supabase Storage buckets** (public: images · private: PDFs w/ signed URLs) | Replaces Google Drive folders. Free 1GB, CDN-served. |
| API | **supabase-js direct from frontend (RLS-protected) + minimal Edge Functions** for privileged ops (payments, email) | Kills ~19 Apps Script webhooks. Fewer moving parts = fewer tokens = cheaper + faster. |
| Email | **Keep Office365 SMTP now** (already configured, free) via Edge Function/`server.js`; move to **Resend** (3k/mo free) if volume/deliverability demands | No new cost, no re-verification churn during migration. |
| Payments | **Razorpay (keep) + payments table designed provider-agnostic** so **Stripe** drops in later with zero schema change | International payments = Stripe later; schema ready day one. |
| Realtime | Available free (Supabase Realtime) — use later for live sessions/notifications | No extra cost. |

**⚠️ One decision needed from you before building — REGION.**
Your project is in **`ap-northeast-1` (Tokyo)**. Your audience is India-heavy → **`ap-south-1` (Mumbai)** would cut latency ~4–8× (roughly 15–30ms vs 100–140ms per query). Region **cannot be changed later** — but recreating the empty project now costs 2 minutes. **Recommendation: recreate in Mumbai before we build.** (If most traffic is global/SEA, Tokyo is acceptable — your call.)

---

## 1. Architecture — before → after

```
BEFORE                                        AFTER
React (Vite)                                  React (Vite)
  → Vercel /api proxies                         → supabase-js (RLS-guarded reads/writes)
  → 19 Apps Script webhooks                     → Supabase Edge Functions (payments, email, admin)
  → Google Sheets (11+ spreadsheets)            → ONE Postgres DB (14 tables)
  → Google Drive folders                        → Supabase Storage (5 buckets)
  → custom token auth (30d, sheet-stored)       → Supabase Auth (JWT + refresh, Google OAuth)
  → O365 SMTP via server.js                     → same SMTP via Edge Function (Resend later)
  → Razorpay via /api/razorpay                  → Razorpay via Edge Function; + Stripe later
Kept as-is: Udemy API proxy · Ollama local AI · Calendly
```

Why this shape is the cheapest AND fastest:
- **No servers to pay for.** Frontend → DB directly under RLS; the handful of privileged operations run on Supabase Edge Functions (500K free invocations/mo).
- **Fewer hops.** Sheets round-trips through Apps Script are 1–3s; direct Postgres reads are ~10–50ms.
- **One bill (currently $0).** Sheets/Drive/AppsScript quota pain disappears.

## 2. Entities → schema (14 tables)

Consolidations vs today:
- **11 provider certification sheets → ONE `certifications` table** with a `provider` column.
- **Event sub-sheets (attendees/speakers/sponsors/feedback/venues) → proper child tables** with FKs.
- **All money in ONE provider-agnostic `payments` + `orders` pair** (Razorpay today, Stripe tomorrow, one query for accounting).

```sql
-- ENUMS
create type provider_t as enum ('AWS','AZURE','GCP','GITHUB','ORACLE','SALESFORCE','SERVICENOW','OPENAI','HASHICORP','KUBERNETES','OTHER');
create type content_status_t as enum ('draft','published','archived','cancelled');
create type payment_status_t as enum ('pending','completed','failed','refunded');
create type payment_provider_t as enum ('razorpay','stripe','free');
create type enrollment_status_t as enum ('enrolled','in_progress','completed','cancelled');
create type registration_status_t as enum ('registered','attended','cancelled');
create type request_status_t as enum ('pending','approved','sent','used','rejected');
create type submission_kind_t as enum ('speaker','sponsor','venue');

-- 1. profiles  (extends Supabase auth.users — auth handles email/password/google)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  email text unique not null,
  full_name text not null,
  linkedin_url text, photo_url text,
  country text, state_province text, city text,
  country_code text, phone_number text,
  role text not null default 'yatri',          -- 'yatri' | 'trainer' | 'admin'
  created_at timestamptz default now(), updated_at timestamptz default now()
);

-- 2. certifications  (replaces 11 sheets)
create table certifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  email text not null,                          -- kept for legacy rows w/o account
  full_name text not null,
  provider provider_t not null,
  certification_name text not null,
  exam_code text,
  certification_date date,
  verified_credential_url text,
  linkedin_url text, photo_url text,
  country text, state_province text, city text, country_code text, phone_number text,
  additional_notes text,
  is_public boolean default true,               -- wall-of-fame visibility
  created_at timestamptz default now()
);
create index on certifications (provider, exam_code);
create index on certifications (email);

-- 3. events
create table events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  event_date timestamptz,
  location text, city text, country text,
  capacity int,
  ticket_type text not null default 'free',     -- 'free' | 'paid'
  price_inr numeric(10,2) default 0,
  image_url text, meet_link text,
  status content_status_t default 'draft',
  created_by uuid references profiles(id),
  created_at timestamptz default now(), updated_at timestamptz default now()
);

-- 4. event_registrations  (payment fields link to payments table)
create table event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  user_id uuid references profiles(id),
  registration_code text unique not null,       -- EVT-XXXX1234
  name text not null, email text not null, phone text,
  city text, state text, country text, linkedin_url text,
  status registration_status_t default 'registered',
  attended_at timestamptz,
  payment_id uuid references payments(id),
  created_at timestamptz default now()
);
create unique index on event_registrations (event_id, email);

-- 5. event_submissions  (speakers / sponsors / venues — one table, kind discriminator)
create table event_submissions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  kind submission_kind_t not null,
  name text not null, email text, phone text,
  organization text, title text, bio text, links jsonb default '{}',
  details jsonb default '{}',                   -- kind-specific fields
  status request_status_t default 'pending',
  created_at timestamptz default now()
);

-- 6. event_feedback
create table event_feedback (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  user_id uuid references profiles(id),
  email text, rating int check (rating between 1 and 5),
  comments text, answers jsonb default '{}',
  created_at timestamptz default now()
);

-- 7. products  (Yatri Store)
create table products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  provider provider_t not null,
  exam_code text, level text,                   -- Associate|Practitioner|Professional|Specialty
  original_price_inr numeric(10,2) not null,
  discounted_price_inr numeric(10,2) not null,
  image_url text, description text,
  status content_status_t default 'published',
  created_at timestamptz default now(), updated_at timestamptz default now()
);

-- 8. exam_dumps
create table exam_dumps (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  provider provider_t not null,
  original_price_inr numeric(10,2), price_inr numeric(10,2) not null,
  image_url text, description text,
  file_path text,                               -- Storage path (private bucket, signed URL)
  status content_status_t default 'published',
  created_at timestamptz default now(), updated_at timestamptz default now()
);

-- 9. orders + 10. payments  (provider-agnostic: Razorpay now, Stripe later)
create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  email text not null,
  kind text not null,                           -- 'store' | 'exam_dump' | 'event' | 'training'
  items jsonb not null,                         -- [{id,title,qty,unit_price_inr}]
  amount numeric(10,2) not null, currency text not null default 'INR',
  status payment_status_t default 'pending',
  created_at timestamptz default now()
);
create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id),
  provider payment_provider_t not null,
  provider_order_id text,                       -- razorpay order_id / stripe payment_intent
  provider_payment_id text,
  amount numeric(10,2) not null, currency text not null default 'INR',
  status payment_status_t default 'pending',
  raw jsonb default '{}',                       -- webhook payload for audit
  created_at timestamptz default now(), verified_at timestamptz
);

-- 11. trainings + 12. training_enrollments
create table trainings (
  id uuid primary key default gen_random_uuid(),
  slug text unique, name text not null, course_title text,
  provider provider_t,
  start_date date, start_time time, end_date date, duration_hours numeric(5,1),
  mode text default 'online',                   -- online|hybrid|offline
  city text,
  trainer_id uuid references profiles(id),
  trainer_name text, trainer_email text,
  max_capacity int, price_inr numeric(10,2) default 0,
  meet_link text, image_url text, description text,
  resources jsonb default '[]',                 -- [{name, path|url, type}] → Storage
  status content_status_t default 'draft',
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table training_enrollments (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references trainings(id) on delete cascade,
  user_id uuid references profiles(id),
  email text not null,
  status enrollment_status_t default 'enrolled',
  payment_id uuid references payments(id),
  enrolled_at timestamptz default now(), completed_at timestamptz,
  unique (training_id, email)
);

-- 13. voucher_requests
create table voucher_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  full_name text not null, email text not null,
  whatsapp text, contact_number text, country text,
  provider provider_t not null,
  exams text[] not null,
  reason text,
  status request_status_t default 'pending',
  created_at timestamptz default now()
);

-- 14. reviews  (+ udemy_courses cache table if we stop proxying Udemy live)
create table reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  name text not null, email text,
  rating int check (rating between 1 and 5),
  review text not null,
  context text default 'general',               -- 'general'|'event:<id>'|'training:<id>'
  photo_url text, is_public boolean default true,
  created_at timestamptz default now()
);
```

**Future-ready (no schema change needed later):** mentorship 1:1/group calls = new `sessions` + `session_bookings` tables reusing `payments`; live streams = `events` with `mode` field; Stripe = new rows in `payments` with `provider='stripe'`.

## 3. Security model (RLS — the core of "browser-safe")

Publishable key in browser is safe **only because** every table gets Row Level Security:

| Table | anon (public) | authenticated | admin/service |
|---|---|---|---|
| profiles | none | read/update **own row** | all |
| certifications | read where `is_public` | insert own; update/delete own | all |
| events / products / exam_dumps / trainings | read where `status='published'` | same | all (write) |
| event_registrations / enrollments / orders / voucher_requests | none | insert; read **own** | all |
| payments | none | read own (via order) | write via Edge Function only (service key) |
| reviews / event_feedback | read where public | insert own | all |

- Admin = `profiles.role='admin'` checked in policies via `auth.uid()` join.
- **Secret key never ships to the browser** — it lives in `.env` (server / Edge Functions only).
- Exam-dump PDFs: **private bucket**, download via short-lived **signed URLs issued only after verified purchase**.
- Payments are **never** written by the client: create-order + verify-webhook run in Edge Functions with the service key; Razorpay signature verification server-side (same as today's `server.js`, but serverless).

## 4. Storage buckets

| Bucket | Access | Contents (migrated from) |
|---|---|---|
| `avatars` | public | user photos |
| `event-media` | public | event images/galleries (Drive event folders) |
| `training-resources` | private (signed) | PDFs/slides/recordings (Drive training folders) |
| `product-images` | public | store + dump cover images |
| `exam-dumps` | private (signed) | paid PDF/ZIP downloads |

Existing external URLs (GitHub raw logos, Udemy CDN) stay as URLs — no need to migrate what already works free.

## 5. Migration plan (safe, reversible)

1. **Schema** — apply SQL above + RLS + buckets. *(Zero risk: empty project.)*
2. **Import** — idempotent scripts read `data/certification.yatricloud.com/*` → upsert into tables. Validate: row counts vs source, FK integrity, spot-check 20 random records per entity. **Sheets stay untouched = instant rollback.**
3. **Auth bridge** — new signups → Supabase Auth. Existing users: import profiles; on first login “set new password” via email link (old sheet password-hashes are not portable — industry-standard reset flow).
4. **Data-layer swap behind flags** — `src/lib/supabase.ts` client; each lib (`yatris-api`, `exam-dumps`, `store-products`, …) keeps its **exact function signatures**, internals switch Sheets→Supabase behind `VITE_USE_SUPABASE=true`. UI untouched. Flip per-module; revert = flip flag.
5. **Privileged ops** — Edge Functions: `create-order`, `verify-payment`, `send-email`, `issue-download-url`.
6. **Test** — automated CRUD per table (script), manual flows (signup/login/google, cert submit, event register free+paid, store checkout, voucher request, training enroll), build green.
7. **Cutover** — flags default true in prod; Apps Script webhooks kept read-only 30 days; then archive.

## 6. Cost analysis

| | Now (Sheets) | Supabase free | Supabase Pro (later) |
|---|---|---|---|
| DB | $0 (quota-limited, slow) | $0 · 500MB | $25/mo · 8GB |
| Storage | $0 Drive (org quota) | $0 · 1GB | 100GB incl. |
| Auth | custom (weak) | $0 · 50K MAU | 100K MAU |
| Functions | Apps Script quotas | 500K/mo | 2M/mo |
| Email | O365 (existing) | keep O365 $0 | Resend free 3k/mo |
| **Total** | $0 & fragile | **$0 & production-grade** | $25/mo at real scale |

Your entire exported dataset is **a few MB** → free tier lasts until real growth. Alternatives ruled out: **Neon** ($0 DB but you'd still need Clerk/Auth0 (≥$25/mo) + S3/R2 + a server for webhooks — more cost, more moving parts); **Turso** (SQLite — no RLS-grade row security, weaker fit for payments/relational integrity). Sources: [free-tier comparison](https://agentdeals.dev/database-free-tier-comparison-2026), [Neon vs Supabase vs Turso](https://www.buildmvpfast.com/blog/neon-vs-supabase-vs-turso-serverless-postgres-mvp-2026), [PkgPulse 2026](https://www.pkgpulse.com/blog/neon-vs-supabase-turso-2026).

## 7. What stays exactly as-is
Udemy instructor API proxy · Ollama local AI chat · Calendly booking · GitHub-hosted brand images · O365 SMTP creds (moved behind Edge Function). Frontend UI: **zero visual changes** — this is a data-layer swap.

## 8. Open items for the user
1. **Region:** recreate project in `ap-south-1` (Mumbai)? (Recommended; 2-minute job **before** we build.)
2. Approve this design → I start Phase 1 (schema + RLS + buckets).
3. After stabilization: rotate the Supabase **secret key** (it appeared in chat) — 1-line `.env` update.
