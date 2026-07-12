#!/usr/bin/env node
/**
 * Yatri Cloud — monthly certification-catalog sync.
 *
 * Watches the official vendor sources and surfaces changes into the
 * `provider_certifications` catalog so the admin never has to diff by hand:
 *
 *   • Microsoft (azure + github)  — fully automated. Downloads the official
 *     "Become Certified" poster PDF and reads every exam code with `pdftotext`
 *     (poppler). aka.ms/CertificationsPoster is refreshed ~monthly.
 *   • AWS (aws)                   — best-effort. aws.amazon.com/certification is
 *     client-rendered, so a plain fetch only exposes a couple of exams; the
 *     script flags AWS for manual review rather than guessing.
 *
 * Behaviour (SAFE by design):
 *   • NEW codes (source has, catalog doesn't) → inserted as INACTIVE placeholders
 *     (label = code) so they appear in /admin/certifications for naming, but do
 *     NOT go live on the site until an admin reviews + activates them.
 *   • RETIRED codes (catalog has, source doesn't) → only reported, never deleted
 *     (study_plans.certification_id is ON DELETE CASCADE — deleting could drop
 *     user data). An admin removes them from the UI after confirming.
 *   • Everything is logged to a timestamped report under scripts/.sync-reports/.
 *
 * Usage:  node scripts/sync-cert-catalog.mjs            (reads .env)
 *         node scripts/sync-cert-catalog.mjs --dry-run  (report only, no writes)
 *
 * Install as a monthly launchd agent — see docs/features/cert-catalog-sync.md.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { execFileSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';

const DRY = process.argv.includes('--dry-run');

// ---------- env ----------
const env = Object.fromEntries(
  readFileSync('.env', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);
if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const log = [];
const say = (m) => { console.log(m); log.push(m); };

// Codes that show on the MS poster but are NOT standalone catalog tiles
// (prerequisite references / exams being retired-and-replaced).
const MS_IGNORE = new Set(['AZ-800', 'AZ-801', 'MB-300']);

// ---------- source: Microsoft poster PDF ----------
async function microsoftCodes() {
  const url = 'https://arch-center.azureedge.net/Credentials/Certification-Poster_en-us.pdf';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`poster download failed: ${res.status}`);
  const pdf = join(tmpdir(), `ms-cert-poster-${process.pid}.pdf`);
  writeFileSync(pdf, Buffer.from(await res.arrayBuffer()));
  const text = execFileSync('pdftotext', ['-layout', pdf, '-'], { encoding: 'utf8' });
  const found = new Set((text.match(/\b(AZ|AI|DP|SC|MS|MD|MB|PL|AB|GH)-\d{3}\b/g) || []));
  const azure = [], github = [];
  for (const code of found) {
    if (MS_IGNORE.has(code)) continue;
    (code.startsWith('GH-') ? github : azure).push(code);
  }
  return { azure: azure.sort(), github: github.sort() };
}

// ---------- source: AWS (best-effort, client-rendered page) ----------
async function awsCodes() {
  try {
    const res = await fetch('https://aws.amazon.com/certification/', { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    const names = new Set((html.match(/AWS Certified [A-Za-z0-9 /-]+? - (?:Associate|Professional|Specialty)|AWS Certified (?:Cloud|AI) Practitioner/g) || []));
    return { names: [...names] };
  } catch {
    return { names: [] };
  }
}

// ---------- diff + apply for one provider (by exam_code) ----------
async function syncProvider(slug, sourceCodes) {
  const { data, error } = await db.from('provider_certifications')
    .select('id, value, exam_code').eq('provider_slug', slug);
  if (error) throw error;
  const have = new Map(data.map(r => [(r.exam_code || '').toUpperCase(), r]));
  const source = new Set(sourceCodes.map(c => c.toUpperCase()));

  const added = [...source].filter(c => !have.has(c));
  const retired = [...have.keys()].filter(c => c && !source.has(c));

  say(`\n[${slug}] catalog ${have.size} · source ${source.size} · +${added.length} new · -${retired.length} retired`);
  if (added.length) say(`  NEW (added as inactive, needs naming): ${added.join(', ')}`);
  if (retired.length) say(`  RETIRED (review + remove in admin): ${retired.join(', ')}`);
  if (!added.length && !retired.length) say('  up to date ✓');

  if (!DRY && added.length) {
    const base = data.reduce((m, r) => Math.max(m, 0), 0);
    const rows = added.map((code, i) => ({
      provider_slug: slug,
      value: code.toLowerCase(),
      label: code,             // placeholder — admin renames in the UI
      exam_code: code,
      active: false,           // never auto-publish; admin reviews first
      sort_order: 900 + i,     // park new arrivals at the end
    }));
    const { error: insErr } = await db.from('provider_certifications')
      .upsert(rows, { onConflict: 'provider_slug,value' });
    if (insErr) say(`  ⚠ insert failed: ${insErr.message}`);
    else say(`  ✓ inserted ${rows.length} placeholder row(s)`);
  }
  return { slug, added, retired };
}

// ---------- run ----------
say(`Certification catalog sync${DRY ? ' (dry-run)' : ''} — ${new Date().toISOString()}`);

const results = [];
try {
  const ms = await microsoftCodes();
  results.push(await syncProvider('azure', ms.azure));
  results.push(await syncProvider('github', ms.github));
} catch (e) {
  say(`\n[microsoft] source fetch failed: ${e.message}`);
}

const aws = await awsCodes();
if (aws.names.length >= 8) {
  // Enough of the page rendered server-side to trust it.
  say(`\n[aws] page exposed ${aws.names.length} certs server-side — compare names manually if this grows.`);
} else {
  say(`\n[aws] page is client-rendered (only ${aws.names.length} certs visible in raw HTML). ` +
      `Skipped auto-apply — review aws.amazon.com/certification and edit in /admin/certifications.`);
}

// ---------- report ----------
const changed = results.some(r => r.added.length || r.retired.length);
say(`\nSummary: ${changed ? 'CHANGES found — review /admin/certifications' : 'no changes'}.`);
try {
  const dir = 'scripts/.sync-reports';
  mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  writeFileSync(join(dir, `cert-sync-${stamp}.txt`), log.join('\n') + '\n');
} catch { /* reporting is best-effort */ }
