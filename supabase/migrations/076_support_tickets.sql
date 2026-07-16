-- 076: support ticket system — tickets + threaded messages, both ends.
--
--   * Yatris (signed in) open tickets at /support, reply in a thread, and can
--     close their own ticket. A reply on a resolved ticket reopens it.
--   * Admins work the /admin/tickets queue: reply, internal notes, priority,
--     status. Every touch stamps last_activity_at for SLA-style sorting.
--   * Ticket numbers are sequential and human-friendly: TKT-00042.
--
-- Status model: open (waiting on support) → pending (waiting on the Yatri)
-- → resolved (fix delivered) → closed (finished; auto-close sweeps resolved
-- tickets after 7 quiet days via /api/cron/support-auto-close).

create sequence if not exists support_ticket_seq;

create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text unique not null
    default 'TKT-' || lpad(nextval('support_ticket_seq')::text, 5, '0'),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  email text not null,
  category text not null default 'other',
  subject text not null,
  priority text not null default 'normal'
    check (priority in ('low','normal','high','urgent')),
  status text not null default 'open'
    check (status in ('open','pending','resolved','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  resolved_at timestamptz,
  closed_at timestamptz
);
create index if not exists idx_support_tickets_user on support_tickets (user_id, created_at desc);
create index if not exists idx_support_tickets_queue on support_tickets (status, last_activity_at desc);

drop trigger if exists trg_support_tickets_updated on support_tickets;
create trigger trg_support_tickets_updated before update on support_tickets
  for each row execute function set_updated_at();

create table if not exists support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references support_tickets(id) on delete cascade,
  sender text not null check (sender in ('user','admin')),
  author_id uuid references profiles(id),
  body text not null,
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_support_messages_ticket on support_messages (ticket_id, created_at);

alter table support_tickets enable row level security;
alter table support_messages enable row level security;

-- Tickets: owners and admins.
drop policy if exists "ticket_read" on support_tickets;
create policy "ticket_read" on support_tickets for select
  using (user_id = auth.uid() or is_admin());

drop policy if exists "ticket_insert_own" on support_tickets;
create policy "ticket_insert_own" on support_tickets for insert to authenticated
  with check (user_id = auth.uid());

-- Owners may update their own ticket (the app uses this to reopen on reply
-- and to close "solved" tickets); admins manage everything.
drop policy if exists "ticket_update" on support_tickets;
create policy "ticket_update" on support_tickets for update
  using (user_id = auth.uid() or is_admin());

drop policy if exists "ticket_delete_admin" on support_tickets;
create policy "ticket_delete_admin" on support_tickets for delete
  using (is_admin());

-- Messages: thread participants; internal notes stay admin-only.
drop policy if exists "tmsg_read" on support_messages;
create policy "tmsg_read" on support_messages for select
  using (
    is_admin()
    or (
      not is_internal
      and exists (
        select 1 from support_tickets t
        where t.id = support_messages.ticket_id and t.user_id = auth.uid()
      )
    )
  );

drop policy if exists "tmsg_insert" on support_messages;
create policy "tmsg_insert" on support_messages for insert to authenticated
  with check (
    (sender = 'admin' and is_internal in (true, false) and is_admin())
    or (
      sender = 'user'
      and is_internal = false
      and author_id = auth.uid()
      and exists (
        select 1 from support_tickets t
        where t.id = support_messages.ticket_id and t.user_id = auth.uid()
      )
    )
  );

drop policy if exists "tmsg_delete_admin" on support_messages;
create policy "tmsg_delete_admin" on support_messages for delete
  using (is_admin());

-- Seeds: ticket categories (admin-editable at /admin/site → Dropdown Options)
-- and a footer link so Yatris can find support.
insert into option_lists (list, value, label, sort_order) values
  ('support_category', 'account',  'Account & sign in', 1),
  ('support_category', 'payments', 'Payments & refunds', 2),
  ('support_category', 'events',   'Events', 3),
  ('support_category', 'training', 'Training & courses', 4),
  ('support_category', 'store',    'Store & vouchers', 5),
  ('support_category', 'technical','Something is broken', 6),
  ('support_category', 'other',    'Something else', 7)
on conflict (list, value) do nothing;

insert into nav_links (location, label, href, sort_order)
select 'footer_quick', 'Support', '/support', 90
where not exists (
  select 1 from nav_links where href = '/support' and location = 'footer_quick'
);
