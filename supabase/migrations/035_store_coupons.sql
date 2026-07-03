-- 035_store_coupons.sql
-- Coupons learn the store: 'store' joins the applies_to scopes so admins can
-- create store-only codes. The cart validates with p_scope='store', which
-- also matches 'all' coupons via validate_coupon's existing logic.

alter table coupons drop constraint if exists coupons_applies_to_check;
alter table coupons add constraint coupons_applies_to_check
  check (applies_to in ('all', 'training', 'event', 'store'));
