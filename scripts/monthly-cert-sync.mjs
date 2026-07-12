#!/usr/bin/env node
/**
 * Yatri Cloud — monthly certification-catalog self-update (Mac-worker pattern).
 * Runs every auto-fetch + URL backfill in order. Each step is isolated: a
 * failure is logged and the run continues, so one flaky vendor page can't block
 * the rest. Everything downstream is NON-DESTRUCTIVE (upsert/add-only; new exams
 * land inactive or add-only, retired ones are reported, never auto-deleted).
 *
 * Wired to launchd (1st of month, 09:00) via
 *   scripts/launchd/com.yatricloud.cert-sync.plist
 * Run manually any time:  node scripts/monthly-cert-sync.mjs
 */
import { execFileSync } from 'child_process';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

// [script, args, note]
const STEPS = [
  ['sync-cert-catalog.mjs',      [],          'Microsoft poster (azure + github) — detect new/retired'],
  ['refresh-oracle.mjs',         ['--apply'], 'Oracle — fetch page, add missing current exams'],
  ['refresh-salesforce.mjs',     [],          'Salesforce — re-apply curated Trailhead list'],
  ['refresh-nvidia.mjs',         [],          'NVIDIA — re-apply official program'],
  ['backfill-provider-urls.mjs', [],          'Provider hub links (top up any new provider)'],
  ['backfill-cert-urls.mjs',     [],          'Per-exam URLs: MS/AWS/GCP/GitHub'],
  ['backfill-osn-urls.mjs',      [],          'Per-exam URLs: Oracle/NVIDIA/Salesforce'],
];

const started = new Date().toISOString();
const log = [`Monthly certification-catalog sync — ${started}\n`];
const say = (m) => { console.log(m); log.push(m); };

let okCount = 0, failCount = 0;
for (const [script, args, note] of STEPS) {
  say(`\n──── ${script} ${args.join(' ')} — ${note}`);
  try {
    const out = execFileSync('node', [`scripts/${script}`, ...args], { encoding: 'utf8', stdio: 'pipe' });
    say(out.trim());
    okCount++;
  } catch (e) {
    say(`⚠ FAILED: ${e.message}`);
    if (e.stdout) say(String(e.stdout).trim());
    if (e.stderr) say(String(e.stderr).trim());
    failCount++;
  }
}

say(`\n════ Done — ${okCount} ok, ${failCount} failed. Review /admin/certifications for any new (inactive) or retired exams.`);
try {
  mkdirSync('scripts/.sync-reports', { recursive: true });
  writeFileSync(join('scripts/.sync-reports', `monthly-${started.slice(0, 10)}.txt`), log.join('\n') + '\n');
} catch { /* reporting is best-effort */ }
process.exit(failCount > 0 ? 1 : 0);
