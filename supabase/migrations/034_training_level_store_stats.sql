-- 034_training_level_store_stats.sql
-- Dynamic-content sweep, part 2 (public pages):
-- 1. trainings.level — the admin/trainer form always had a Level field but the
--    column never existed, so every course showed a hardcoded "All Levels".
-- 2. site_stats.store_discount — the store's "up to 50% OFF" marketing claim
--    becomes admin-editable instead of hardcoded copy.

alter table trainings
  add column if not exists level text;

insert into site_stats (key, value, label, sort_order, active)
select 'store_discount', '50%', 'Store voucher discount', 70, true
where not exists (select 1 from site_stats where key = 'store_discount');
