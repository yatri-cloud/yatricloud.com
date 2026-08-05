#!/usr/bin/env node
/**
 * Yatri Cloud — apply migration 082 (footer "Legal" column compliance links)
 * to the live Supabase nav_links table. Mirrors
 * supabase/migrations/082_footer_legal_links.sql via the service-role client.
 * Idempotent: safe to re-run.
 *   Usage: node scripts/apply-footer-legal.mjs        (reads .env)
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// ---------- env (no hardcoded secrets) ----------
const env = Object.fromEntries(
  readFileSync('.env', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);
const URL_ = env.SUPABASE_URL, SRK = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !SRK) { console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env'); process.exit(1); }
const db = createClient(URL_, SRK, { auth: { persistSession: false } });

// Canonical footer_legal set — keep in sync with migration 082.
const LINKS = [
  { label: 'Privacy Policy',          href: '/privacy-policy',          sort: 1 },
  { label: 'Terms and Conditions',    href: '/terms-and-conditions',    sort: 2 },
  { label: 'Cancellation and Refund', href: '/cancellation-and-refund', sort: 3 },
  { label: 'Shipping and Exchange',   href: '/shipping-and-exchange',   sort: 4 },
  { label: 'Contact Us',              href: '/contact-us',              sort: 5 },
  { label: 'Reviews',                 href: '/reviews',                 sort: 6 },
];
const canonicalHrefs = LINKS.map(l => l.href);

// ---------- 1) Upsert by href (match existing → update; else insert) ----------
for (const { label, href, sort } of LINKS) {
  const { data, error } = await db.from('nav_links')
    .update({ label, sort_order: sort, active: true })
    .eq('location', 'footer_legal').eq('href', href).select('id');
  if (error) throw new Error(`update failed for ${href}: ${error.message}`);
  if (!data || data.length === 0) {
    const { error: insErr } = await db.from('nav_links')
      .insert({ location: 'footer_legal', label, href, sort_order: sort, active: true });
    if (insErr) throw new Error(`insert failed for ${href}: ${insErr.message}`);
  }
}

// ---------- 2) Prune stale footer_legal rows ----------
const { data: existing, error: listErr } = await db.from('nav_links')
  .select('id, href').eq('location', 'footer_legal');
if (listErr) throw new Error(`list failed: ${listErr.message}`);
const staleIds = (existing ?? [])
  .filter(r => !canonicalHrefs.includes(r.href))
  .map(r => r.id);
if (staleIds.length > 0) {
  const { error: delErr } = await db.from('nav_links').delete().in('id', staleIds);
  if (delErr) throw new Error(`prune failed: ${delErr.message}`);
}

// ---------- 3) Verify what's now live ----------
const { data, error: readErr } = await db.from('nav_links')
  .select('label, href, sort_order, active').eq('location', 'footer_legal').order('sort_order');
if (readErr) throw new Error(`verify failed: ${readErr.message}`);

console.log('footer_legal now in production:');
for (const r of data) console.log(`  ${r.sort_order}  ${String(r.label).padEnd(26)} ${r.href}  active=${r.active}`);
