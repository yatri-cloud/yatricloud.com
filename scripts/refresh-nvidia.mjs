import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env','utf8').split('\n').filter(l=>l.includes('=')&&!l.trim().startsWith('#')).map(l=>[l.slice(0,l.indexOf('=')).trim(),l.slice(l.indexOf('=')+1).trim()]));
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth:{persistSession:false} });
const HUB = 'https://www.nvidia.com/en-in/learn/certification/';
// Codes confirmed from nvidia.com/learn/certification; names per NVIDIA program.
const CERTS = [
  ['NCA-AIIO','NVIDIA-Certified Associate: AI Infrastructure and Operations','associate'],
  ['NCA-GENL','NVIDIA-Certified Associate: Generative AI LLMs','associate'],
  ['NCA-GENM','NVIDIA-Certified Associate: Generative AI Multimodal','associate'],
  ['NCA-ADS','NVIDIA-Certified Associate: Accelerated Data Science','associate'],
  ['NCP-AII','NVIDIA-Certified Professional: AI Infrastructure','professional'],
  ['NCP-AIO','NVIDIA-Certified Professional: AI Operations','professional'],
  ['NCP-AIN','NVIDIA-Certified Professional: AI Networking','professional'],
  ['NCP-ADS','NVIDIA-Certified Professional: Accelerated Data Science','professional'],
  ['NCP-AAI','NVIDIA-Certified Professional: Agentic AI','professional'],
  ['NCP-GENL','NVIDIA-Certified Professional: Generative AI LLMs','professional'],
  ['NCP-OUSD','NVIDIA-Certified Professional: OpenUSD','professional'],
];
const rows = CERTS.map(([code,label,level],i)=>({ provider_slug:'nvidia', value:code.toLowerCase(), label, exam_code:code, level, sort_order:i+1, active:true, url:HUB }));
const up = await db.from('provider_certifications').upsert(rows,{onConflict:'provider_slug,value'});
if(up.error) throw up.error;
const keep = rows.map(r=>r.value);
const prune = await db.from('provider_certifications').delete().eq('provider_slug','nvidia').not('value','in',`(${keep.join(',')})`);
if(prune.error) throw prune.error;
const { count } = await db.from('provider_certifications').select('*',{count:'exact',head:true}).eq('provider_slug','nvidia');
console.log('NVIDIA now:', count, '(4 associate + 7 professional)');
