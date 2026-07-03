-- 032_coupons.sql
-- Discount coupons for training and event checkouts.
--
-- The table has NO public read policy: checkout validates through the
-- validate_coupon() SECURITY DEFINER function, so codes cannot be enumerated
-- through the REST API. Redemption counting requires a signed-in user (both
-- checkouts already require sign-in).

create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  percent_off int not null check (percent_off between 1 and 100),
  applies_to text not null default 'all' check (applies_to in ('all', 'training', 'event')),
  max_uses int check (max_uses > 0),
  used_count int not null default 0,
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table coupons enable row level security;

drop policy if exists "coupons_admin_all" on coupons;
create policy "coupons_admin_all" on coupons for all
  using (is_admin()) with check (is_admin());

-- Checkout validation: returns the discount when the code is live, in scope,
-- unexpired, and under its usage cap — otherwise no rows.
create or replace function validate_coupon(p_code text, p_scope text default 'all')
returns table (percent_off int)
language sql security definer set search_path = public stable
as $$
  select c.percent_off
  from coupons c
  where upper(c.code) = upper(trim(p_code))
    and c.active
    and (c.applies_to = 'all' or c.applies_to = p_scope)
    and (c.expires_at is null or c.expires_at > now())
    and (c.max_uses is null or c.used_count < c.max_uses);
$$;

-- Called once after a successful paid checkout.
create or replace function redeem_coupon(p_code text)
returns void
language sql security definer set search_path = public
as $$
  update coupons
  set used_count = used_count + 1
  where upper(code) = upper(trim(p_code))
    and active
    and (max_uses is null or used_count < max_uses);
$$;

revoke all on function validate_coupon(text, text) from public;
revoke all on function redeem_coupon(text) from public;
grant execute on function validate_coupon(text, text) to anon, authenticated;
grant execute on function redeem_coupon(text) to authenticated;

-- Supabase default privileges grant EXECUTE on new public functions to anon
-- directly (not via PUBLIC), so the explicit revoke below is required — the
-- earlier "revoke from public" alone still let anon redeem.
revoke execute on function redeem_coupon(text) from anon;
