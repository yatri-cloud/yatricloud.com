#!/usr/bin/env node
/**
 * Oracle catalog auto-fetch. Oracle server-renders its certification names in
 * the page HTML, so a plain fetch is more reliable than a headless browser.
 * NON-DESTRUCTIVE: adds current certs that aren't in the catalog yet; never
 * prunes (the marketing page omits still-valid legacy exams — Java, MySQL,
 * WebLogic, Solaris, EBS…). Safe to run monthly.
 *   node scripts/refresh-oracle.mjs [--apply]   (default: dry-run/report)
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const APPLY = process.argv.includes('--apply');
const env = Object.fromEntries(readFileSync('.env','utf8').split('\n').filter(l=>l.includes('=')&&!l.trim().startsWith('#')).map(l=>[l.slice(0,l.indexOf('=')).trim(),l.slice(l.indexOf('=')+1).trim()]));
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth:{persistSession:false} });

const html = await (await fetch('https://www.oracle.com/in/education/certification/',{headers:{'User-Agent':'Mozilla/5.0'}})).text();
const raw = html.replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&#39;/g,"'");
const matches = raw.match(/(?:Oracle|MySQL|Java)[A-Za-z0-9 :/&.,'-]{5,90}?\b(?:Associate|Professional|Specialist|Master|Expert)\b/g) || [];
const clean = [...new Set(matches.map(s=>s.replace(/\s+/g,' ').trim()))]
  .filter(n => !/course and professional/i.test(n) && n.length<100
    && !/\.\s/.test(n)                                              // drop sentence fragments
    && !/^Oracle Certified (Foundations )?(Associate|Professional|Specialist|Master)$/i.test(n)  // drop generic tier labels
    && /\d{4}|Cloud|Infrastructure|Database|Java|MySQL|APEX|Analytics|Vector|Redwood|Autonomous|GoldenGate|WebLogic|Primavera|Hyperion|Solaris|Linux|Utilities|Communications|Siebel|JD Edwards|Field Service|Agent Studio|Data Platform|Guided Learning|Fusion|Procurement|Manufacturing|Inventory|Maintenance|Warehouse|Transportation/.test(n)); // must name a real product

const norm = s => s.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const existing = (await db.from('provider_certifications').select('label').eq('provider_slug','oracle')).data || [];
const haveNorm = new Set(existing.map(r=>norm(r.label)));
const fresh = clean.filter(n => !haveNorm.has(norm(n)));

const slug = n => n.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80);
const level = n => /\bmaster\b/i.test(n)?'expert' : /\bexpert\b/i.test(n)?'expert' : /\bprofessional\b/i.test(n)?'professional' : /\bspecialist\b/i.test(n)?'specialty' : /foundations?\b/i.test(n)?'foundational' : 'associate';

console.log(`Oracle page: ${clean.length} current certs · catalog: ${existing.length} · NEW: ${fresh.length}`);
fresh.forEach(n=>console.log('   +', n));
if (APPLY && fresh.length){
  const base = 500;
  const rows = fresh.map((n,i)=>({ provider_slug:'oracle', value:slug(n), label:n, level:level(n), sort_order:base+i, active:true, url:'https://education.oracle.com/certification' }));
  const seen=new Set(); const dedup=rows.filter(r=>seen.has(r.value)?false:(seen.add(r.value),true));
  const { error } = await db.from('provider_certifications').upsert(dedup,{onConflict:'provider_slug,value'});
  console.log(error ? '⚠ '+error.message : `✓ added ${dedup.length} Oracle certs (non-destructive)`);
} else if(!APPLY){ console.log('(dry-run — pass --apply to add the NEW ones)'); }
