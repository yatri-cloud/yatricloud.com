-- ============================================================
-- Yatri Cloud — 081_admin_users_permissions.sql
-- Admin role & permission management.
--
-- Privileged users remain Supabase Auth users whose `profiles.role` is 'admin'
-- (so the existing is_admin() shell gate + RLS keep working). The GRANULAR role
-- (super_admin / admin / manager / support / auditor) and the per-page
-- permissions live here, in `admin_users`. Custom permissions = an array of
-- admin page paths the user may open; super_admin is shorthand for "all".
--
-- Security model:
--   * SELECT: any is_admin() may read (the role-management UI needs the list).
--   * There is NO client INSERT/UPDATE/DELETE policy here. All mutations run
--     through a server route (api/admin-users) using the service_role key, which
--     authorizes the caller as super_admin/admin. This prevents an admin from
--     editing their own row (e.g. self-promoting to super_admin) via RLS.
-- ============================================================

create table if not exists public.admin_users (
  id          uuid primary key references public.profiles(id) on delete cascade,
  role        text not null default 'admin'
              check (role in ('super_admin','admin','manager','support','auditor')),
  permissions text[] not null default '{}',
  is_active   boolean not null default true,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists admin_users_role_idx on public.admin_users (role);

drop trigger if exists trg_admin_users_updated on public.admin_users;
create trigger trg_admin_users_updated before update on public.admin_users
  for each row execute function set_updated_at();

alter table public.admin_users enable row level security;

-- Reads: any admin. Writes: only the service role via the server route.
drop policy if exists "admin_users_select_admin" on public.admin_users;
create policy "admin_users_select_admin"
  on public.admin_users for select to authenticated
  using (is_admin());
