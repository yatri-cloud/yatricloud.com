#!/usr/bin/env node
/**
 * Yatri Cloud — apply migration 051 (Azure + GitHub certs from the Microsoft
 * poster) to the live Supabase catalog. Parses the checked-in migration SQL as
 * the single source of truth, then does the equivalent delete + insert via the
 * service-role client (the migration is pure DML on provider_certifications).
 * Idempotent: safe to re-run.
 *   Usage: node scripts/apply-poster-certs.mjs        (reads .env)
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

// ---------- parse the migration's INSERT tuples (no label contains a quote) ----------
const sql = readFileSync('supabase/migrations/051_azure_github_poster_certs.sql', 'utf8');
const rowRe = /\(\s*'(azure|github)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*(\d+)\s*\)/g;
const rows = [];
let m;
while ((m = rowRe.exec(sql)) !== null) {
  rows.push({ provider_slug: m[1], value: m[2], label: m[3], exam_code: m[4], level: m[5], sort_order: Number(m[6]) });
}
const azure = rows.filter(r => r.provider_slug === 'azure');
const github = rows.filter(r => r.provider_slug === 'github');
console.log(`Parsed ${rows.length} rows (azure ${azure.length}, github ${github.length}).`);
if (azure.length !== 50 || github.length !== 6) {
  console.error('Unexpected row counts — aborting so the live catalog is not left partial.');
  process.exit(1);
}

// ---------- upsert (preserves ids for surviving certs) ----------
const ins = await db.from('provider_certifications')
  .upsert(rows, { onConflict: 'provider_slug,value' });
if (ins.error) { console.error('upsert failed:', ins.error.message); process.exit(1); }
console.log(`✓ upserted ${rows.length} certifications (azure ${azure.length}, github ${github.length})`);

// ---------- prune retired certs no longer on the poster ----------
for (const [slug, keep] of [['azure', azure], ['github', github]]) {
  const keepValues = keep.map(r => r.value);
  const prune = await db.from('provider_certifications')
    .delete().eq('provider_slug', slug).not('value', 'in', `(${keepValues.join(',')})`);
  if (prune.error) { console.error(`prune ${slug} failed:`, prune.error.message); process.exit(1); }
}
console.log('✓ pruned retired azure + github certifications');

// ---------- verify ----------
const { count: aCount } = await db.from('provider_certifications').select('*', { count: 'exact', head: true }).eq('provider_slug', 'azure');
const { count: gCount } = await db.from('provider_certifications').select('*', { count: 'exact', head: true }).eq('provider_slug', 'github');
console.log(`Live counts → azure: ${aCount}, github: ${gCount}`);
console.log('Done.');
