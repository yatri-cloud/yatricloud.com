import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env','utf8').split('\n').filter(l=>l.includes('=')&&!l.trim().startsWith('#')).map(l=>[l.slice(0,l.indexOf('=')).trim(),l.slice(l.indexOf('=')+1).trim()]));
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth:{persistSession:false} });
const kebab = s => s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
async function ok(url){ try { const r=await fetch(url,{redirect:'follow',headers:{'User-Agent':'Mozilla/5.0'}}); return r.status===200; } catch { return false; } }
const HUB={ oracle:'https://education.oracle.com/certification', nvidia:'https://www.nvidia.com/en-in/learn/certification/' };

async function verifyBackfill(slug, candFn){
  const rows=(await db.from('provider_certifications').select('id,value,label,exam_code').eq('provider_slug',slug)).data;
  let direct=0, hub=0;
  for(let i=0;i<rows.length;i+=12){
    const batch=rows.slice(i,i+12);
    await Promise.all(batch.map(async r=>{
      const cand=candFn(r);
      const url = cand && await ok(cand) ? cand : HUB[slug];
      if(url===cand) direct++; else hub++;
      await db.from('provider_certifications').update({url}).eq('id',r.id);
    }));
  }
  console.log(`${slug}: ${rows.length} rows → ${direct} direct exam page, ${hub} hub fallback`);
}

// Oracle: mylearn per-exam page from the kebab'd label
await verifyBackfill('oracle', r => `https://mylearn.oracle.com/ou/exam/${kebab(r.label)}/`);

// NVIDIA: per-cert page — slug = topic (drop "and") + level word
await verifyBackfill('nvidia', r => {
  const topic = r.label.split(':')[1]?.trim() || r.label;
  const lvl = /Professional/i.test(r.label) ? 'professional' : 'associate';
  const s = kebab(topic.replace(/\band\b/gi,' ')) + '-' + lvl;
  return `https://www.nvidia.com/en-us/learn/certification/${s}/`;
});

// Salesforce: Trailhead credential search pre-filled (always resolves)
const sf=(await db.from('provider_certifications').select('id,label').eq('provider_slug','salesforce')).data;
for(const r of sf){ await db.from('provider_certifications').update({ url:`https://trailhead.salesforce.com/credentials/?searchTerm=${encodeURIComponent(r.label)}` }).eq('id',r.id); }
console.log(`salesforce: ${sf.length} rows → Trailhead credential search`);
