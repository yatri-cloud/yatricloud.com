-- ============================================================
-- Yatri Cloud — 082_footer_legal_links.sql
-- Add the legal/compliance links our banking partner requires to the
-- footer's "Legal" column. The 012 seed only shipped three rows
-- (Privacy Policy, Terms of Service, Reviews). The live footer reads
-- nav_links directly (see getNavLinks in src/lib/site-content.ts), so
-- Cancellation & Refund, Shipping & Exchange, and Contact Us were
-- missing from the live site — a gap flagged in banking review.
--
-- This brings footer_legal to exactly FALLBACK_NAV_LINKS.footer_legal
-- in src/lib/site-content.ts:
--   Privacy Policy           /privacy-policy
--   Terms and Conditions     /terms-and-conditions
--   Cancellation and Refund  /cancellation-and-refund
--   Shipping and Exchange    /shipping-and-exchange
--   Contact Us               /contact-us
--   Reviews                  /reviews
--
-- The seeded "Terms of Service" (→ /terms-of-service) row is folded into
-- "Terms and Conditions" (→ /terms-and-conditions) so there is exactly
-- one entry; both routes render TermsOfService.tsx in App.tsx.
--
-- NON-DESTRUCTIVE + IDEMPOTENT: upserts by (location, href), then prunes
-- only footer_legal rows whose href is no longer canonical. nav_links has
-- no FK dependents, so re-running is safe.
-- Apply to live: node scripts/apply-footer-legal.mjs   (reads .env)
-- ============================================================

do $$
declare
  v_href  text;
  v_label text;
  v_sort  int;
begin
  -- 1. Upsert the canonical footer_legal links (match by href).
  for v_sort, v_label, v_href in
    values
      (1, 'Privacy Policy',          '/privacy-policy'),
      (2, 'Terms and Conditions',    '/terms-and-conditions'),
      (3, 'Cancellation and Refund', '/cancellation-and-refund'),
      (4, 'Shipping and Exchange',   '/shipping-and-exchange'),
      (5, 'Contact Us',              '/contact-us'),
      (6, 'Reviews',                 '/reviews')
  loop
    update nav_links
       set label = v_label, sort_order = v_sort, active = true
     where location = 'footer_legal' and href = v_href;
    if not found then
      insert into nav_links (location, label, href, sort_order, active)
      values ('footer_legal', v_label, v_href, v_sort, true);
    end if;
  end loop;

  -- 2. Prune any footer_legal rows no longer in the canonical set
  --    (e.g. the old "Terms of Service" → /terms-of-service row).
  delete from nav_links
   where location = 'footer_legal'
     and href not in (
       '/privacy-policy', '/terms-and-conditions', '/cancellation-and-refund',
       '/shipping-and-exchange', '/contact-us', '/reviews'
     );
end $$;
