import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const UID='43eb8123-6637-4457-89af-6607a58b35f1';
// past event
const { data: ev, error } = await sb.from('events').insert({
  slug:'e2e-past-gallery-test', name:'[E2E] Past Gallery Test Event',
  description:'Automated E2E past event for gallery testing. Safe to delete.',
  event_date:'2026-06-01T10:00:00Z', status:'published', visibility:'public',
  city:'Bengaluru', country:'India', created_by:UID
}).select('id,slug').single();
if(error){console.error('event insert failed', error);process.exit(1);}
console.log('event:', ev.id, ev.slug);
// attended registration for the admin (also lets us test attendee-view path)
await sb.from('event_registrations').insert({ event_id:ev.id, user_id:UID, email:'info@yatricloud.com', registration_code:'E2E-ATT-001', status:'attended', attended_at:new Date().toISOString() }).select('id').single().then(r=>console.log('attended reg:', r.data?.id)).catch(e=>console.log('reg note:', e.message));
console.log('EVENT_ID='+ev.id);
