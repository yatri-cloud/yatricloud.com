# Yatri Cloud — Documentation Index

Everything in `docs/`, organized. Start with the root [CLAUDE.md](../CLAUDE.md) and [DESIGN.md](../DESIGN.md) if you're new.

## 🚦 Working on the project? Read these first
| Doc | What it is |
|---|---|
| [SESSION-GUIDE.md](SESSION-GUIDE.md) | How to work on this codebase: hard rules, workflow, backend rules (§5b) |
| [NEW-SESSION-PROMPT.md](NEW-SESSION-PROMPT.md) | Paste-ready kickoff prompt for a fresh session |
| [../DESIGN.md](../DESIGN.md) | The design system — tokens, components, §10 section catalog + list conventions |
| [VOICE.md](VOICE.md) | Brand voice: "Yatris", warm simple English, no dashes-in-sentences, no AI-sparkle |
| [design-decisions.md](design-decisions.md) | Why the design choices were made + design-only guardrails |

## 🧭 Product & architecture
| Doc | What it is |
|---|---|
| [brief.md](brief.md) | Product goal, audience, scope |
| [product-requirements.md](product-requirements.md) | Pages, flows, redesign scope per surface |
| [SYSTEM-DESIGN.md](SYSTEM-DESIGN.md) | The Supabase backend design: 22+ tables, RLS philosophy, storage, migration plan |
| [DYNAMIC-CONTENT-AUDIT.md](DYNAMIC-CONTENT-AUDIT.md) | The everything-admin-managed checklist (complete) |

## ✨ Features — [features/](features/README.md)
Per-feature end-to-end docs: flows, data model, security, code map, gotchas, testing. See the [feature index](features/README.md) — quizzes, coupons, certificate sharing, `/paths`, ⌘K search, private links, urgency, Yatri profiles, study planner, inquiries inbox, payments/receipts, and the site-wide list conventions.

## 📋 Subsystem plans
| Doc | What it is |
|---|---|
| [EVENTS-TRAINING-PLAN.md](EVENTS-TRAINING-PLAN.md) | Events + Training production plan |
| [MENTORSHIP-PLAN.md](MENTORSHIP-PLAN.md) | The /mentorship platform (Topmate-style) plan |
| [PAYMENTS-COMMISSION.md](PAYMENTS-COMMISSION.md) | Payments + mentor commission design (Route commission on hold) |

## 🛠 Operations
| Folder | What it is |
|---|---|
| [deployment/](deployment/) | Deploy guides (production = Vercel project `yatricloud.com`, deploys from the `origin` GitHub repo) |
| [vercel/](vercel/) | Vercel-specific notes. ⚠️ Hobby plan = 12 serverless-function cap — extend the `api/razorpay/admin.ts` gateway instead of adding functions |
| [setup/](setup/) | Environment / project setup |
| [quick-start/](quick-start/) | Quick-start guides |
| [guides/](guides/) | General how-tos |
| [canva/](canva/) | Canva celebration-card API setup (optional; template id via `VITE_CANVA_TEMPLATE_ID`) |
| [general/](general/) | Miscellaneous notes |

## 🗄 Legacy (historical — the platform migrated to Supabase in July 2026)
These document the **retired** Google Apps Script / Sheets backend and are kept for history only. Nothing in `src/` uses them.
| Folder | Was about |
|---|---|
| [google-sheets/](google-sheets/) | The old Sheets-as-database backend |
| [cors-fixes/](cors-fixes/) | CORS workarounds for Apps Script webhooks |
| [yatri-ai/](yatri-ai/) | The removed Ollama/YatriAI experiment |
| [yatri-store/](yatri-store/) | Early store docs (store now runs on Supabase `products`) |

## Conventions
- Schema changes: numbered `supabase/migrations/*.sql` only — applied to production via psql, committed with the feature.
- Credentials: git-ignored `.env` only; never hardcoded, never pasted in chat.
- Before any commit: `npx tsc --noEmit` + `npm run build` + the undefined-JSX static check.
- After meaningful changes update `DESIGN.md`, root `MEMORY.md`, and the relevant doc here.
