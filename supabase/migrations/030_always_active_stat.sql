-- 030_always_active_stat.sql
-- The last hardcoded stat: the "24/7 Always active" chip on the Community
-- page. Seeding it into site_stats makes every stat on the site admin managed.

insert into site_stats (key, value, label, sort_order, active)
select 'always_active', '24/7', 'Always active', 60, true
where not exists (select 1 from site_stats where key = 'always_active');
