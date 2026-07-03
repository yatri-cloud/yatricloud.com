-- ============================================================
-- Yatri Cloud — 020_payments_multicurrency.sql
-- Unified, verified payments across store, events, training and mentorship,
-- with direct international multi currency checkout and invoices.
--   - event_registrations and training_enrollments gain amount, currency and
--     payment_status so a paid registration is created pending, then confirmed
--     server side by /api/razorpay/verify (mirrors the mentorship booking flow).
--   - invoices records a numbered invoice per successful payment, emailed to
--     the buyer (domestic and international).
--   - site_settings.currencies holds the supported currencies and their
--     conversion rates from INR, editable from admin.
-- Additive and safe: free flows and existing paid store flow keep working.
-- ============================================================

-- ---------- event_registrations: payment fields ----------
alter table event_registrations
  add column if not exists amount numeric(10,2) not null default 0,
  add column if not exists currency text not null default 'INR',
  add column if not exists payment_status text not null default 'paid'
    check (payment_status in ('pending','paid','failed','free')),
  add column if not exists order_id uuid references orders(id);

-- ---------- training_enrollments: payment fields ----------
alter table training_enrollments
  add column if not exists amount numeric(10,2) not null default 0,
  add column if not exists currency text not null default 'INR',
  add column if not exists payment_status text not null default 'paid'
    check (payment_status in ('pending','paid','failed','free')),
  add column if not exists order_id uuid references orders(id);

-- ---------- invoices ----------
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text unique not null,
  kind text not null check (kind in ('store','event','training','mentorship','other')),
  payment_id uuid references payments(id),
  order_id uuid references orders(id),
  buyer_name text,
  buyer_email text not null,
  amount numeric(12,2) not null default 0,
  currency text not null default 'INR',
  items jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index if not exists idx_invoices_email on invoices (buyer_email, created_at desc);

alter table invoices enable row level security;

-- Buyers see their own invoices (matched by their profile email); admins see all.
drop policy if exists "invoices_owner_read" on invoices;
create policy "invoices_owner_read" on invoices for select
  using (
    is_admin()
    or buyer_email = (select email from profiles where id = auth.uid())
  );
-- Only the service role (verify endpoint) writes invoices; no client policy.
drop policy if exists "invoices_admin_write" on invoices;
create policy "invoices_admin_write" on invoices for all
  using (is_admin()) with check (is_admin());

-- A simple per day sequence for human readable invoice numbers (YC-YYYYMMDD-N).
create sequence if not exists invoice_seq;

-- ---------- supported currencies (admin editable) ----------
-- rate = how many of this currency equal 1 INR (INR amount * rate = foreign amount).
-- Seeded with approximate rates; admin updates them in Site settings.
insert into site_settings (key, value) values
  ('currencies', '{
    "base": "INR",
    "list": [
      { "code": "INR", "symbol": "₹", "rate": 1, "label": "Indian Rupee" },
      { "code": "USD", "symbol": "$", "rate": 0.012, "label": "US Dollar" },
      { "code": "EUR", "symbol": "€", "rate": 0.011, "label": "Euro" },
      { "code": "GBP", "symbol": "£", "rate": 0.0095, "label": "British Pound" },
      { "code": "AED", "symbol": "AED ", "rate": 0.044, "label": "UAE Dirham" },
      { "code": "SGD", "symbol": "S$", "rate": 0.016, "label": "Singapore Dollar" },
      { "code": "AUD", "symbol": "A$", "rate": 0.018, "label": "Australian Dollar" },
      { "code": "CAD", "symbol": "C$", "rate": 0.016, "label": "Canadian Dollar" }
    ]
  }')
on conflict (key) do nothing;
