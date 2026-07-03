# HTTP QUERY Method (RFC 10008)

The site implements the HTTP **QUERY** method — RFC 10008, Proposed Standard, June 2026: a **safe, idempotent, cacheable GET-with-a-request-body** — where its semantics genuinely apply.

## Where it applies (and deliberately where not)
| Surface | Method | Why |
|---|---|---|
| `api/razorpay/admin` → `invoices.list`, `payments.list` | **QUERY** (POST fallback) | Safe, idempotent reads that carry a request body (action + params + admin token). Exactly QUERY's purpose — and per the RFC's security guidance, bodies are less likely to be logged than URLs, so the token/params stay out of logs. |
| `api/razorpay/admin` → `invoices.create/cancel`, `payments.refund` | POST only | Mutations. QUERY promises safety; the server **rejects** these over QUERY (405) so the promise holds. |
| `api/razorpay/create-order`, `api/razorpay/verify`, `api/send-email` | POST only | State-changing. QUERY would be semantically wrong. |
| supabase-js / PostgREST calls | unchanged | Methods are library-controlled; PostgREST QUERY support doesn't exist to target. |

## Server behavior (`api/razorpay/admin.ts`)
- Accepts `QUERY` for the read actions; `Allow: POST, QUERY, OPTIONS`.
- Advertises support per spec: `Accept-Query: "application/json"` (Structured Field) on every response, including a `204` OPTIONS.
- RFC-conformant errors: `415` when QUERY content isn't `application/json`; `405` (with `Allow: POST`) when a mutation action arrives over QUERY — checked **before** auth so it's a cheap, side-effect-free reject.

## Client behavior (`src/lib/razorpay-admin.ts`)
- List actions send `method: "QUERY"`; everything else stays POST.
- **Learned fallback**: on a method-level failure only (fetch TypeError, `405/501/415`, or a `400 Missing action…` meaning the body never reached the handler through some middlebox), the client marks QUERY broken for the session and retries the same request over POST. Auth/action errors propagate normally — they prove the method worked. Behavior can never regress.
- Same-origin calls → the RFC's CORS-preflight note doesn't bite (no preflight needed beyond the norm).

## Verified in production (2026-07-03)
- `OPTIONS` → `204` with `accept-query: "application/json"` and `allow: POST, QUERY, OPTIONS`.
- `QUERY invoices.list` with an invalid token → **our handler's** `401 {"ok":false,"message":"Please sign in again."}` — from both curl and a real browser `fetch()` — proving Vercel's platform routes the QUERY method and parses its JSON body end to end.
- Note for testers: repeated unauthenticated hits with fake tokens trip **Vercel's security checkpoint** (403 challenge HTML) — that's the WAF doing its job, not a QUERY issue; the first requests of each burst passed cleanly. Real authenticated admin sessions are unaffected, and the client fallback covers any environment that ever blocks the method.

## Honest expectations
The win today is semantic correctness, tokens/params out of URL logs, and standardized retry/caching semantics that CDNs and proxies can start honoring as RFC 10008 adoption spreads. It is not a measurable latency change on its own — the site's real performance lever remains the JS bundle (~3 MB, code-splitting candidate).

## Extending
New read-only body-carrying endpoint? Accept QUERY next to POST, add the action to `QUERY_SAFE_ACTIONS` (server) and `QUERY_ACTIONS` (client), and keep the fallback pattern. Never accept QUERY for anything that writes.
