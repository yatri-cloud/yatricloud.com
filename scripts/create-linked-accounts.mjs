#!/usr/bin/env node
/**
 * Yatri Cloud — create Razorpay Route linked accounts for mentors, then store
 * each returned acc_... id on the mentor row so commission splits work.
 *
 * SAFE TO RUN ONLY AFTER Route is enabled on the Razorpay account. Until then
 * Razorpay returns "Route feature not enabled for the merchant" and this script
 * exits without changing anything.
 *
 * What it does, per mentor that has no razorpay_account_id yet:
 *   1. Creates a Route linked account (POST /v2/accounts) using the mentor's
 *      name and their private contact email.
 *   2. Saves the returned account id to mentors.razorpay_account_id.
 *
 * It is idempotent: mentors that already have an account id are skipped, and a
 * mentor is only created once. It does NOT submit bank or KYC details, so each
 * linked account still needs the mentor to complete onboarding (bank account,
 * KYC) before payouts settle. This script only creates the account shell and
 * links it to our mentor row.
 *
 * Usage:
 *   node scripts/create-linked-accounts.mjs            # create for all mentors missing an id
 *   node scripts/create-linked-accounts.mjs --dry-run  # show what would happen, change nothing
 *   node scripts/create-linked-accounts.mjs --slug nensi-ravaliya   # one mentor only
 *
 * Reads .env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RAZORPAY_KEY_ID,
 * RAZORPAY_KEY_SECRET. No secrets are hardcoded.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// ---------- env (no hardcoded secrets) ----------
const env = Object.fromEntries(
  readFileSync('.env', 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);
const SUPABASE_URL = env.SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const RZP_ID = env.RAZORPAY_KEY_ID;
const RZP_SECRET = env.RAZORPAY_KEY_SECRET;
if (!SUPABASE_URL || !SERVICE_KEY) { console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env'); process.exit(1); }
if (!RZP_ID || !RZP_SECRET) { console.error('Missing RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET in .env'); process.exit(1); }

const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const slugIdx = args.indexOf('--slug');
const ONLY_SLUG = slugIdx >= 0 ? args[slugIdx + 1] : null;

const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const rzpAuth = 'Basic ' + Buffer.from(`${RZP_ID}:${RZP_SECRET}`).toString('base64');

// A default registered address is required by the create account API. Adjust in
// the Razorpay dashboard per mentor later; this only seeds the account shell.
const DEFAULT_ADDRESS = {
  street1: 'MG Road',
  street2: 'Bengaluru',
  city: 'Bengaluru',
  state: 'KARNATAKA',
  postal_code: '560001',
  country: 'IN',
};

function digitsPhone(phone) {
  const d = String(phone || '').replace(/\D/g, '').slice(-10);
  return d.length === 10 ? d : '9999999999';
}

async function createLinkedAccount(mentor, contactEmail) {
  const body = {
    email: contactEmail,
    phone: digitsPhone(mentor.phone),
    type: 'route',
    legal_business_name: mentor.name,
    business_type: 'individual',
    contact_name: mentor.name,
    profile: {
      category: 'education',
      subcategory: 'education',
      addresses: { registered: DEFAULT_ADDRESS },
    },
  };
  const res = await fetch('https://api.razorpay.com/v2/accounts', {
    method: 'POST',
    headers: { Authorization: rzpAuth, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data?.error?.description || `HTTP ${res.status}`;
    return { id: null, error: err };
  }
  return { id: data.id || null, error: data.id ? null : 'No account id returned' };
}

async function main() {
  console.log(`Mode: ${DRY ? 'DRY RUN (no changes)' : 'LIVE'}${ONLY_SLUG ? ` | slug=${ONLY_SLUG}` : ''}\n`);

  let query = db.from('mentors').select('id, slug, name, razorpay_account_id');
  if (ONLY_SLUG) query = query.eq('slug', ONLY_SLUG);
  const { data: mentors, error } = await query.order('sort_order', { ascending: true });
  if (error) { console.error('Could not load mentors:', error.message); process.exit(1); }
  if (!mentors?.length) { console.log('No mentors found.'); return; }

  let created = 0, skipped = 0, failed = 0;
  for (const m of mentors) {
    if (m.razorpay_account_id) {
      console.log(`- ${m.slug}: already linked (${m.razorpay_account_id}), skipping`);
      skipped++;
      continue;
    }
    // Private contact email is the mentor's payout/notification email.
    const { data: priv } = await db.from('mentor_private').select('contact_email').eq('mentor_id', m.id).maybeSingle();
    const contactEmail = priv?.contact_email || `mentor+${m.slug}@yatricloud.com`;

    if (DRY) {
      console.log(`- ${m.slug}: WOULD create linked account for ${contactEmail}`);
      continue;
    }

    const { id, error: apiErr } = await createLinkedAccount(m, contactEmail);
    if (!id) {
      console.error(`- ${m.slug}: FAILED — ${apiErr}`);
      if (/route feature not enabled/i.test(apiErr || '')) {
        console.error('\nRoute is not enabled on this Razorpay account yet. Enable Route in the dashboard, then re-run.');
        process.exit(2);
      }
      failed++;
      continue;
    }
    const { error: upErr } = await db.from('mentors').update({ razorpay_account_id: id }).eq('id', m.id);
    if (upErr) { console.error(`- ${m.slug}: linked ${id} but SAVE FAILED — ${upErr.message}`); failed++; continue; }
    console.log(`- ${m.slug}: created and saved ${id}`);
    created++;
  }

  console.log(`\nDone. created=${created} skipped=${skipped} failed=${failed}`);
  if (!DRY && created > 0) {
    console.log('Next: each mentor still completes bank and KYC on their linked account before payouts settle.');
    console.log('Then set RAZORPAY_ROUTE_ENABLED=true and test a booking.');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
