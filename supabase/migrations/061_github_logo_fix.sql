-- ============================================================
-- Yatri Cloud — 061_github_logo_fix.sql (record)
-- The GitHub provider logo (cdn.simpleicons.org, set in 052) was blocked in
-- some browsers (ad-blocker / network), showing a broken image. Switch to the
-- Wikimedia Octicons GitHub mark — same domain as the working Kubernetes /
-- HashiCorp logos, verified to load. Applied to live via service-role update.
-- ============================================================
update cert_providers
  set logo_url = 'https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg',
      logo_light_url = 'https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg',
      updated_at = now()
  where slug = 'github';
