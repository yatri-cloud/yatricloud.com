# Admin Inquiries Inbox (`/admin/inquiries`)

The working inbox for everything the public site sends in: **partner inquiries** (the campus & team forms) and **contact messages**. Before this page, both landed in the database invisibly.

## Flow
1. Admin → Site Content → **Inquiries**. Two tabs with live "N new" count chips:
   - **Partner inquiries** — `consultation_requests`: name, kind chip (Campus / Team / Other), company, mailto-linked email, phone, role, headcount, focus, date, and the message body.
   - **Contact messages** — `contact_messages`: name, subject, email, date, message.
2. Each row has a dot+text status pill — **New** (pending) / **Handled** (approved) / **Closed** (rejected) — and a one-click **Mark handled** ↔ **Reopen** action (optimistic local update).
3. Both tabs follow the standard list convention: search (name/email/company/message), kind + status filters, newest/oldest sort, pagination (10/page).

## Where submissions come from
- Partner forms: `/partners` → dedicated pages `/partners/campus` & `/partners/team` (`src/pages/PartnerApply.tsx`) → plain `.insert()` into `consultation_requests` (kind mapped campus→`college`, team→`corporate`).
- Contact form: `ContactSection` → `contact_messages`.

## Data & security (predates this page — migration 004, fields 006)
- Anyone may **insert** (public forms); only admins may **select/update** (`is_admin()`), on both tables.
- Status uses the shared `request_status_t` enum; this UI maps pending→New, approved→Handled, rejected→Closed.
- ⚠️ Form submit code must use plain `.insert()` **without** `.select()` — PostgREST needs SELECT permission to return the row, and these tables are admin-read-only (a `.select()` chained on insert throws a misleading RLS error for anon).

## Code map
| Piece | File |
|---|---|
| Page | `src/pages/admin/AdminInquiries.tsx` |
| Route / nav | `src/App.tsx` (`/admin/inquiries`), `src/config/admin-nav.ts` (Site Content group, Inbox icon) |
| Schema | `supabase/migrations/004_web_forms.sql`, `006_consultation_fields.sql` |

## How to test
Submit `/partners/campus` logged out → appears under Partner inquiries as **New** with the Campus chip → Mark handled → pill flips and the "new" count drops → Reopen restores it. Same for the contact form.
