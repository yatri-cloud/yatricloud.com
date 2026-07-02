#!/usr/bin/env node
/**
 * Yatri Cloud — one-shot data import: data/certification.yatricloud.com → Supabase
 * Idempotent: upserts on natural keys; safe to re-run.
 * Usage: node scripts/supabase-import.mjs        (reads .env)
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, basename } from 'path';
import XLSX from 'xlsx';

// ---------- env (no hardcoded secrets) ----------
const env = Object.fromEntries(
  readFileSync('.env', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);
const URL_ = env.SUPABASE_URL, SRK = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !SRK) { console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env'); process.exit(1); }
const db = createClient(URL_, SRK, { auth: { persistSession: false } });

const ROOT = 'data/certification.yatricloud.com';
const report = [];
const ok = (t, n, note = '') => { report.push([t, n, note]); console.log(`✓ ${t}: ${n} ${note}`); };
const warn = (m) => console.log(`⚠ ${m}`);

const sheetRows = (file, name) => {
  const wb = XLSX.readFile(file);
  const pick = name ? [name] : wb.SheetNames;
  return pick.flatMap(n => wb.Sheets[n] ? XLSX.utils.sheet_to_json(wb.Sheets[n], { defval: null }).map(r => ({ ...r, __sheet: n })) : []);
};
const providerEnum = (s) => {
  const x = String(s || '').toUpperCase();
  for (const p of ['AWS', 'AZURE', 'GCP', 'GITHUB', 'ORACLE', 'SALESFORCE', 'SERVICENOW', 'OPENAI', 'HASHICORP', 'KUBERNETES'])
    if (x.includes(p) || (p === 'GCP' && x.includes('GOOGLE'))) return p;
  return 'OTHER';
};
const dt = (v) => {
  if (v == null || v === '') return null;
  if (typeof v === 'number') { // excel serial
    const d = new Date(Math.round((v - 25569) * 86400 * 1000));
    return isNaN(d) ? null : d.toISOString();
  }
  const d = new Date(v);
  return isNaN(d) ? null : d.toISOString();
};
const dateOnly = (v) => { const s = dt(v); return s ? s.slice(0, 10) : null; };
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

async function upsert(table, rows, onConflict) {
  if (!rows.length) return ok(table, 0, '(no rows)');
  const { error, count } = await db.from(table).upsert(rows.map(clean), { onConflict, ignoreDuplicates: false, count: 'exact' });
  if (error) { warn(`${table}: ${error.message}`); report.push([table, 0, 'ERROR ' + error.message.slice(0, 80)]); }
  else ok(table, rows.length, `(upsert on ${onConflict})`);
}

// ============ 1. AUTH USERS + PROFILES (yatris.xlsx [users]) ============
async function importUsers() {
  const rows = sheetRows(join(ROOT, 'yatris/yatris.xlsx'), 'users').filter(r => r['Email']);
  const { data: existing } = await db.auth.admin.listUsers({ perPage: 1000 });
  const have = new Set((existing?.users || []).map(u => u.email?.toLowerCase()));
  let created = 0, updated = 0;
  for (const r of rows) {
    const email = String(r['Email']).trim().toLowerCase();
    if (!email.includes('@')) continue;
    let uid = (existing?.users || []).find(u => u.email?.toLowerCase() === email)?.id;
    if (!have.has(email)) {
      const { data, error } = await db.auth.admin.createUser({
        email, email_confirm: true,
        // random unguessable password — users use "reset password" or Google login
        password: crypto.randomUUID() + 'Aa1!' ,
        user_metadata: { full_name: r['Full Name'] || '', imported_from: 'sheets' },
      });
      if (error) { warn(`auth ${email}: ${error.message}`); continue; }
      uid = data.user.id; created++;
    }
    if (uid) {
      const { error } = await db.from('profiles').update(clean({
        full_name: r['Full Name'] || '',
        linkedin_url: r['LinkedIn URL'], photo_url: r['Photo URL'],
        country: r['Country'], state_province: r['State'], city: r['City'],
        phone_number: r['Phone Number '] ?? r['Phone Number'],
        created_at: dt(r['Created At']) ?? undefined,
      })).eq('id', uid);
      if (!error) updated++;
    }
  }
  ok('auth users', created, `created (+${updated} profiles updated of ${rows.length} rows)`);
}

// ============ 2. CERTIFICATIONS (certified-yatris/*.xlsx, dedup across sheets) ============
async function importCerts() {
  const dir = join(ROOT, 'certified-yatris');
  const seen = new Set(); const out = [];
  for (const f of readdirSync(dir).filter(f => f.endsWith('.xlsx'))) {
    for (const r of sheetRows(join(dir, f))) {
      if (!r['Email'] || !r['Certification Name']) continue;
      const key = [String(r['Email']).toLowerCase(), r['Exam Code'] || '', r['Certification Name']].join('|');
      if (seen.has(key)) continue; seen.add(key);
      out.push({
        email: String(r['Email']).trim().toLowerCase(),
        full_name: r['Full Name'] || '',
        provider: providerEnum(r['Certification Provider'] || f),
        certification_name: r['Certification Name'],
        exam_code: r['Exam Code'] || null,
        certification_date: dateOnly(r['Certification Date']),
        verified_credential_url: r['Verified Credential'],
        linkedin_url: r['LinkedIn URL'], photo_url: r['Photo URL'],
        country: r['Country'], state_province: r['State/Province'], city: r['City'],
        country_code: String(r['Country Code'] ?? '') || null,
        phone_number: String(r['Phone Number'] ?? '') || null,
        additional_notes: r['Additional Notes'],
        created_at: dt(r['Timestamp']) ?? undefined,
      });
    }
  }
  // link to profiles where email matches
  const { data: profs } = await db.from('profiles').select('id,email');
  const byEmail = new Map((profs || []).map(p => [p.email.toLowerCase(), p.id]));
  out.forEach(c => { const id = byEmail.get(c.email); if (id) c.user_id = id; });
  // dedupe-aware insert: delete-free approach — natural key not in schema, so insert only missing
  const { data: have } = await db.from('certifications').select('email,exam_code,certification_name');
  const haveKeys = new Set((have || []).map(h => [h.email, h.exam_code || '', h.certification_name].join('|')));
  const fresh = out.filter(c => !haveKeys.has([c.email, c.exam_code || '', c.certification_name].join('|')));
  if (fresh.length) {
    const { error } = await db.from('certifications').insert(fresh.map(clean));
    if (error) return warn('certifications: ' + error.message);
  }
  ok('certifications', fresh.length, `inserted (${out.length - fresh.length} already present)`);
}

// ============ 3. VOUCHER REQUESTS (per-provider sheets) ============
async function importVouchers() {
  const rows = sheetRows(join(ROOT, 'yatris/Certification Exam Voucher Requests.xlsx'))
    .filter(r => r['Email'] && r.__sheet !== 'Sheet1' && r.__sheet !== 'Master Requests');
  const { data: have } = await db.from('voucher_requests').select('email,created_at');
  const haveKeys = new Set((have || []).map(h => h.email + '|' + h.created_at));
  const out = rows.map(r => ({
    full_name: r['Full Name'] || '', email: String(r['Email']).trim().toLowerCase(),
    whatsapp: String(r['WhatsApp Number'] ?? '') || null,
    country: r['Country'], provider: providerEnum(r.__sheet),
    exams: String(r['Exams'] || '').split(',').map(s => s.trim()).filter(Boolean),
    reason: r['Reason'], created_at: dt(r['Timestamp']) ?? undefined,
  })).filter(v => !haveKeys.has(v.email + '|' + v.created_at));
  if (out.length) {
    const { error } = await db.from('voucher_requests').insert(out.map(clean));
    if (error) return warn('voucher_requests: ' + error.message);
  }
  ok('voucher_requests', out.length, 'inserted');
}

// ============ 4. REVIEWS ============
async function importReviews() {
  const rows = sheetRows(join(ROOT, 'yatris/yatri-certifications-reviews.xlsx'), 'certificates-reviews').filter(r => r['name'] || r['feedback']);
  const { data: have } = await db.from('reviews').select('name,review');
  const haveKeys = new Set((have || []).map(h => h.name + '|' + (h.review || '').slice(0, 40)));
  const out = rows.map(r => ({
    name: r['name'] || 'Yatri', review: r['feedback'] || '',
    rating: Number(r['rating']) || null,
    context: JSON.stringify({ provider: r['provider'], country: r['country'], source: r['source'], linkedin: r['linkedinProfile'] }),
    created_at: dt(r['timestamp']) ?? undefined, is_public: true,
  })).filter(v => v.review && !haveKeys.has(v.name + '|' + v.review.slice(0, 40)));
  if (out.length) {
    const { error } = await db.from('reviews').insert(out.map(clean));
    if (error) return warn('reviews: ' + error.message);
  }
  ok('reviews', out.length, 'inserted');
}

// ============ 5. UDEMY COURSES ============
async function importUdemy() {
  const out = [];
  for (const f of ['udemy-courses/udemy-yatharth-chauhan.xlsx', 'udemy-courses/udemy-nensi-ravaliya.xlsx']) {
    for (const r of sheetRows(join(ROOT, f))) {
      if (!r['Course Title'] || !r['Course Link']) continue;
      out.push({
        title: r['Course Title'], course_url: r['Course Link'], image_url: r['Image Link'],
        creator: r['Creator'], tech: r['Tech'], category: r['Category'],
        created_at: dt(r['Timestamp']) ?? undefined,
      });
    }
  }
  await upsert('udemy_courses', out, 'course_url');
}

// ============ 6. PRODUCTS + EXAM DUMPS (yatristore/add-product.xlsx) ============
async function importStore() {
  const f = join(ROOT, 'yatristore/add-product.xlsx');
  const prows = sheetRows(f, 'add-product').filter(r => r['Title']);
  const { data: haveP } = await db.from('products').select('title');
  const havePT = new Set((haveP || []).map(p => p.title));
  const prods = prows.filter(r => !havePT.has(r['Title'])).map(r => ({
    title: r['Title'], provider: providerEnum(r['Category']),
    exam_code: r['Exam Code'], level: r['Level'],
    original_price_inr: Number(r['Original Price']) || 0,
    discounted_price_inr: Number(r['Discounted Price']) || 0,
    image_url: r['Image'], description: r['Description'],
    status: String(r['Status'] || 'active') === 'active' ? 'published' : 'archived',
    created_at: dt(r['Timestamp']) ?? undefined,
  }));
  if (prods.length) { const { error } = await db.from('products').insert(prods.map(clean)); if (error) warn('products: ' + error.message); }
  ok('products', prods.length, 'inserted');

  const drows = sheetRows(f, 'exam-dumps').filter(r => r['Title']);
  const { data: haveD } = await db.from('exam_dumps').select('title');
  const haveDT = new Set((haveD || []).map(d => d.title));
  const dumps = drows.filter(r => !haveDT.has(r['Title'])).map(r => ({
    title: r['Title'], provider: providerEnum(r['Provider']),
    original_price_inr: Number(r['Original Price']) || null,
    price_inr: Number(r['Price']) || 0,
    image_url: r['Image'], download_url: r['Download URL'], description: r['Description'],
    status: String(r['Status'] || 'active') === 'active' ? 'published' : 'archived',
    created_at: dt(r['Timestamp']) ?? undefined,
  }));
  if (dumps.length) { const { error } = await db.from('exam_dumps').insert(dumps.map(clean)); if (error) warn('exam_dumps: ' + error.message); }
  ok('exam_dumps', dumps.length, 'inserted');
}

// ============ 7. WEB FORM JSONs (previous Supabase exports — keep ids/timestamps) ============
async function importJsons() {
  const map = [
    ['consultation_requests_rows.json', 'consultation_requests'],
    ['contact_messages_rows.json', 'contact_messages'],
    ['subscribers_rows.json', 'subscribers'],
    ['course_requests_rows.json', 'course_requests'],
  ];
  for (const [file, table] of map) {
    const p = join(ROOT, file);
    if (!existsSync(p)) { warn(file + ' missing'); continue; }
    let rows = JSON.parse(readFileSync(p, 'utf8'));
    if (!Array.isArray(rows)) rows = rows.rows || [];
    // normalize status values to enum
    rows = rows.map(r => clean({ ...r, status: r.status ? String(r.status).toLowerCase() : undefined }));
    rows.forEach(r => { if (r.status && !['pending','approved','sent','used','rejected'].includes(r.status)) r.status = 'pending'; });
    await upsert(table, rows, 'id');
  }
}

// ============ 8. EVENTS (from folder names + master sheet best-effort) ============
async function importEvents() {
  const base = join(ROOT, 'events/yatri-events-india/yatri-events-karnataka/yatri-events-bangalore');
  if (!existsSync(base)) return warn('events folder missing');
  const out = [];
  for (const folder of readdirSync(base).filter(f => statSync(join(base, f)).isDirectory())) {
    const m = folder.match(/^(.*) - (\d{4}-\d{2}-\d{2})T(\d{2})_(\d{2})$/);
    const name = m ? m[1] : folder;
    const when = m ? `${m[2]}T${m[3]}:${m[4]}:00+05:30` : null;
    out.push({
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      name, event_date: when, city: 'Bengaluru', country: 'India',
      location: 'Bengaluru', status: 'archived', ticket_type: 'free',
    });
  }
  await upsert('events', out, 'slug');
}

// ============ RUN ============
console.log('── Yatri Cloud import →', URL_);
await importUsers();
await importCerts();
await importVouchers();
await importReviews();
await importUdemy();
await importStore();
await importJsons();
await importEvents();

console.log('\n── FINAL COUNTS ──');
for (const t of ['profiles','certifications','voucher_requests','reviews','udemy_courses','products','exam_dumps','consultation_requests','contact_messages','subscribers','course_requests','events']) {
  const { count } = await db.from(t).select('*', { count: 'exact', head: true });
  console.log(`${t}: ${count}`);
}
