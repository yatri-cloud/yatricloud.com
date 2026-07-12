import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env','utf8').split('\n').filter(l=>l.includes('=')&&!l.trim().startsWith('#')).map(l=>[l.slice(0,l.indexOf('=')).trim(),l.slice(l.indexOf('=')+1).trim()]));
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth:{persistSession:false} });

const AWS = {
  'cloud-practitioner':'certified-cloud-practitioner','ai-practitioner':'certified-ai-practitioner',
  'solutions-architect-associate':'certified-solutions-architect-associate','developer-associate':'certified-developer-associate',
  'data-engineer-associate':'certified-data-engineer-associate','machine-learning-engineer-associate':'certified-machine-learning-engineer-associate',
  'cloudops-associate':'certified-cloudops-engineer-associate','solutions-architect-professional':'certified-solutions-architect-professional',
  'devops-engineer-professional':'certified-devops-engineer-professional','genai-developer-professional':'certified-generative-ai-developer-professional',
  'advanced-networking-specialty':'certified-advanced-networking-specialty','security-specialty':'certified-security-specialty',
};
const GCP = {
  'cloud-digital-leader':'cloud-digital-leader','generative-ai-leader':'generative-ai-leader','associate-cloud-engineer':'cloud-engineer',
  'google-workspace-administrator':'google-workspace-administrator','data-practitioner':'data-practitioner',
  'professional-cloud-architect':'cloud-architect','professional-cloud-database-engineer':'cloud-database-engineer',
  'professional-cloud-developer':'cloud-developer','professional-data-engineer':'data-engineer',
  'professional-cloud-devops-engineer':'cloud-devops-engineer','professional-cloud-security-engineer':'cloud-security-engineer',
  'professional-cloud-network-engineer':'cloud-network-engineer','professional-machine-learning-engineer':'machine-learning-engineer',
  'professional-security-operations-engineer':'security-operations-engineer',
};
const GITHUB_HUB = 'https://resources.github.com/learn/certifications/';

async function ok(url){ try { const r = await fetch(url,{redirect:'follow',headers:{'User-Agent':'Mozilla/5.0'}}); return r.status===200; } catch { return false; } }

// build candidates
const cand = [];
for (const [slug, rows] of Object.entries({
  azure: (await db.from('provider_certifications').select('id,value,exam_code').eq('provider_slug','azure')).data,
  aws:   (await db.from('provider_certifications').select('id,value,exam_code').eq('provider_slug','aws')).data,
  gcp:   (await db.from('provider_certifications').select('id,value,exam_code').eq('provider_slug','gcp')).data,
  github:(await db.from('provider_certifications').select('id,value,exam_code').eq('provider_slug','github')).data,
})) {
  for (const r of rows) {
    let url = null;
    if (slug==='azure' && r.exam_code) url = `https://learn.microsoft.com/en-us/credentials/certifications/exams/${r.exam_code.toLowerCase()}/`;
    else if (slug==='aws' && AWS[r.value]) url = `https://aws.amazon.com/certification/${AWS[r.value]}/`;
    else if (slug==='gcp' && GCP[r.value]) url = `https://cloud.google.com/learn/certification/${GCP[r.value]}`;
    else if (slug==='github') url = GITHUB_HUB;
    if (url) cand.push({ id:r.id, provider:slug, value:r.value, url });
  }
}
console.log(`candidates: ${cand.length}. verifying…`);

// verify in batches of 10
const verified=[], failed=[];
for (let i=0;i<cand.length;i+=10){
  const batch = cand.slice(i,i+10);
  const res = await Promise.all(batch.map(async c => ({ c, good: await ok(c.url) })));
  for (const {c,good} of res) (good?verified:failed).push(c);
}
// apply verified
for (const c of verified){ const {error}=await db.from('provider_certifications').update({url:c.url}).eq('id',c.id); if(error) console.log('update err',c.value,error.message); }
const byProv = {}; verified.forEach(c=>byProv[c.provider]=(byProv[c.provider]||0)+1);
console.log('✓ backfilled', verified.length, 'urls:', JSON.stringify(byProv));
if (failed.length){ console.log('⚠ skipped (non-200), left blank for manual add:'); failed.forEach(c=>console.log('   ',c.provider,c.value,'→',c.url)); }
