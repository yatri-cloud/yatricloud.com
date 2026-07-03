-- 036_product_alerts.sql
-- Price-drop alerts for store products. A Yatri (or guest) watches a product;
-- the daily cron (api/cron/event-training-reminders.ts, section 4) compares
-- the price they saw with today's price and emails them once per drop.
--
-- Emails are PII: the table has NO public read policy — anyone may insert a
-- watch, only the service role (cron) reads and updates.

create table if not exists product_alerts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  product_id uuid not null references products(id) on delete cascade,
  -- The price (INR) at the moment they subscribed / were last notified.
  last_price_inr numeric(10,2) not null,
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (email, product_id)
);
create index if not exists idx_product_alerts_product on product_alerts (product_id);

alter table product_alerts enable row level security;

drop policy if exists "product_alerts_insert_any" on product_alerts;
create policy "product_alerts_insert_any" on product_alerts for insert with check (true);
-- No select/update/delete policies: service role only.
