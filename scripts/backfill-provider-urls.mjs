import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env','utf8').split('\n').filter(l=>l.includes('=')&&!l.trim().startsWith('#')).map(l=>[l.slice(0,l.indexOf('=')).trim(),l.slice(l.indexOf('=')+1).trim()]));
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth:{persistSession:false} });
// Official certification hub per provider.
const URLS = {
  aws:'https://aws.amazon.com/certification/',
  azure:'https://learn.microsoft.com/en-us/credentials/',
  gcp:'https://cloud.google.com/learn/certification',
  github:'https://resources.github.com/learn/certifications/',
  oracle:'https://education.oracle.com/certification',
  salesforce:'https://trailheadacademy.salesforce.com/all-offerings',
  servicenow:'https://www.servicenow.com/services/training-and-certification.html',
  openai:'https://academy.openai.com/',
  hashicorp:'https://www.hashicorp.com/certification',
  kubernetes:'https://kubernetes.io/training/',
  linux:'https://training.linuxfoundation.org/certification/',
  comptia:'https://www.comptia.org/certifications',
  cisco:'https://www.cisco.com/site/us/en/learn/training-certifications/certifications/index.html',
  isc2:'https://www.isc2.org/certifications',
  ibm:'https://www.ibm.com/training/credentials',
  alibaba:'https://www.alibabacloud.com/en/certification',
  cncf:'https://www.cncf.io/training/certification/',
  nvidia:'https://www.nvidia.com/en-in/learn/certification/',
  terraform:'https://www.hashicorp.com/certification/terraform-associate',
  docker:'https://www.docker.com/',
};
async function ok(url){ try { const r = await fetch(url,{redirect:'follow',headers:{'User-Agent':'Mozilla/5.0'}}); return r.status===200; } catch { return false; } }
const entries = Object.entries(URLS);
const good=[], bad=[];
for(let i=0;i<entries.length;i+=6){
  const batch=entries.slice(i,i+6);
  const res=await Promise.all(batch.map(async ([slug,url])=>({slug,url,good:await ok(url)})));
  for(const r of res)(r.good?good:bad).push(r);
}
for(const {slug,url} of good){ const {error}=await db.from('cert_providers').update({url}).eq('slug',slug); if(error) console.log('err',slug,error.message); }
console.log('✓ set main url for', good.length, 'providers:', good.map(g=>g.slug).join(', '));
if(bad.length){ console.log('⚠ non-200 (left blank):'); bad.forEach(b=>console.log('   ',b.slug,'→',b.url)); }
