import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env','utf8').split('\n').filter(l=>l.includes('=')&&!l.trim().startsWith('#')).map(l=>[l.slice(0,l.indexOf('=')).trim(),l.slice(l.indexOf('=')+1).trim()]));
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth:{persistSession:false} });

// Authoritative Salesforce catalog — trailheadacademy.salesforce.com/all-offerings (Certifications).
const NAMES = [
  "Advanced Field Service Accredited Professional",
  "B2B Commerce for Administrators Accredited Professional",
  "B2B Commerce for Developers Accredited Professional",
  "Communications Cloud Accredited Professional",
  "Consumer Goods Cloud Accredited Professional",
  "Consumer Goods Cloud: Trade Promotion Management Accredited Professional",
  "Contact Center Accredited Professional",
  "CPQ and Billing Consultant Accredited Professional",
  "Energy and Utilities Cloud Accredited Professional",
  "Financial Services Cloud Accredited Professional",
  "Health Cloud Accredited Professional",
  "Heroku Developer Accredited Professional",
  "Loyalty Management Accredited Professional",
  "Manufacturing Cloud Accredited Professional",
  "Marketing Cloud Advanced Cross Channel Accredited Professional",
  "Marketing Cloud Intelligence Accredited Professional",
  "Marketing Cloud Personalization Accredited Professional",
  "Media Cloud Accredited Professional",
  "Net Zero Cloud Accredited Professional",
  "Order Management Administrator Accredited Professional",
  "Order Management Developer Accredited Professional",
  "Process Automation Accredited Professional",
  "Public Sector Solutions Accredited Professional",
  "Salesforce Certified Agentforce Life Sciences Consultant",
  "Salesforce Certified Agentforce Specialist",
  "Salesforce Certified Application Architect",
  "Salesforce Certified B2B Solution Architect",
  "Salesforce Certified B2C Commerce Architect",
  "Salesforce Certified B2C Commerce Cloud Developer",
  "Salesforce Certified B2C Solution Architect",
  "Salesforce Certified Business Analyst",
  "Salesforce Certified CPQ Administrator",
  "Salesforce Certified CRM Analytics and Einstein Discovery Consultant",
  "Salesforce Certified Data 360 Consultant",
  "Salesforce Certified Education Cloud Consultant",
  "Salesforce Certified Experience Cloud Consultant",
  "Salesforce Certified Field Service Consultant",
  "Salesforce Certified Heroku Architect",
  "Salesforce Certified Industries CPQ Developer",
  "Salesforce Certified JavaScript Developer",
  "Salesforce Certified Marketing Cloud Account Engagement Consultant",
  "Salesforce Certified Marketing Cloud Account Engagement Specialist",
  "Salesforce Certified Marketing Cloud Email Specialist",
  "Salesforce Certified Marketing Cloud Engagement Administrator",
  "Salesforce Certified Marketing Cloud Engagement Consultant",
  "Salesforce Certified Marketing Cloud Engagement Developer",
  "Salesforce Certified Marketing Cloud Engagement Foundations",
  "Salesforce Certified MuleSoft Catalyst Consultant",
  "Salesforce Certified MuleSoft Developer",
  "Salesforce Certified MuleSoft Developer II",
  "Salesforce Certified MuleSoft Hyperautomation Developer",
  "Salesforce Certified MuleSoft Integration Foundations",
  "Salesforce Certified MuleSoft Platform Architect",
  "Salesforce Certified MuleSoft Platform Integration Architect",
  "Salesforce Certified Nonprofit Cloud Consultant (NPC)",
  "Salesforce Certified Nonprofit Success Pack Consultant",
  "Salesforce Certified Omnistudio Consultant",
  "Salesforce Certified Omnistudio Developer",
  "Salesforce Certified Platform Administrator",
  "Salesforce Certified Platform Administrator II",
  "Salesforce Certified Platform App Builder",
  "Salesforce Certified Platform Data Architect",
  "Salesforce Certified Platform Developer",
  "Salesforce Certified Platform Developer II",
  "Salesforce Certified Platform Development Lifecycle and Deployment Architect",
  "Salesforce Certified Platform Foundations",
  "Salesforce Certified Platform Identity and Access Management Architect",
  "Salesforce Certified Platform Integration Architect",
  "Salesforce Certified Platform Sharing and Visibility Architect",
  "Salesforce Certified Platform Strategy Designer",
  "Salesforce Certified Platform User Experience Designer",
  "Salesforce Certified Revenue Cloud Consultant",
  "Salesforce Certified Sales Cloud Consultant",
  "Salesforce Certified Sales Foundations",
  "Salesforce Certified Service Cloud Consultant",
  "Salesforce Certified Slack Administrator",
  "Salesforce Certified Slack Consultant",
  "Salesforce Certified Slack Developer",
  "Salesforce Certified System Architect",
  "Salesforce Certified Tableau Architect",
  "Salesforce Certified Tableau Consultant",
  "Salesforce Certified Tableau Data Analyst",
  "Salesforce Certified Tableau Desktop Foundations",
  "Salesforce Certified Tableau Server Administrator",
  "Salesforce Certified Technical Architect - Architect Evaluation",
  "Salesforce Certified Technical Architect - Architect Review Board Exam",
];
const slug = (n) => n.toLowerCase().replace(/^salesforce certified /,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const level = (n) => { const s=n.toLowerCase();
  if(/foundations?\b/.test(s)) return 'foundational';
  if(/architect/.test(s)) return 'expert';
  if(/consultant|accredited professional/.test(s)) return 'professional';
  return 'associate'; };
const rows = NAMES.map((label,i)=>({ provider_slug:'salesforce', value:slug(label), label, exam_code:null, level:level(label), sort_order:i+1, active:true }));
// guard against slug collisions
const seen=new Set(); for(const r of rows){ if(seen.has(r.value)) throw new Error('dup slug '+r.value); seen.add(r.value); }

const up = await db.from('provider_certifications').upsert(rows,{onConflict:'provider_slug,value'});
if(up.error) throw up.error;
const keep = rows.map(r=>r.value);
const prune = await db.from('provider_certifications').delete().eq('provider_slug','salesforce').not('value','in',`(${keep.join(',')})`);
if(prune.error) throw prune.error;
const { count } = await db.from('provider_certifications').select('*',{count:'exact',head:true}).eq('provider_slug','salesforce');
const byLvl={}; rows.forEach(r=>byLvl[r.level]=(byLvl[r.level]||0)+1);
console.log('Salesforce now:', count, '| levels:', JSON.stringify(byLvl));
