-- ============================================================
-- Yatri Cloud — 080_training_audit_log.sql
-- Transparency / anti-cheat for the trainer course pipeline.
--
-- Every meaningful change to a training (create, submit, edit, price change,
-- approve, reject, delete) is written to `training_audit_log` so an admin can
-- see exactly who did what and when. Combined with the existing review gate
-- (trainers can only ever leave rows in 'draft'; publishing is admin-only) this
-- gives a verifiable paper trail — no silent edits, no self-publishing, and
-- price changes can be audited for integrity.
-- ============================================================

-- The audit trail. Kept lightweight and append-only (no UPDATE/DELETE policy)
-- so history cannot be rewritten by a client.
create table if not exists public.training_audit_log (
  id          uuid primary key default gen_random_uuid(),
  -- SET NULL (not cascade) so a deleted course keeps its audit history: the
  -- row survives with training_id nulled once the course is gone.
  training_id uuid references public.trainings(id) on delete set null,
  actor_id    uuid references public.profiles(id) on delete set null,
  actor_role  text not null default 'admin'
              check (actor_role in ('admin', 'trainer', 'system')),
  action      text not null, -- created | updated | submitted | approved | rejected | deleted | price_changed
  field       text,          -- column changed, e.g. price_inr, status, review_status, course_title
  old_value   text,
  new_value   text,
  note        text,
  created_at  timestamptz not null default now()
);

create index if not exists training_audit_log_training_idx
  on public.training_audit_log (training_id, created_at desc);
create index if not exists training_audit_log_actor_idx
  on public.training_audit_log (actor_id, created_at desc);

-- RLS: admins own the trail; trainers may append + read logs for their own
-- courses only. No update/delete policy means the history is immutable.
alter table public.training_audit_log enable row level security;

drop policy if exists "training_audit_admin_all" on public.training_audit_log;
create policy "training_audit_admin_all"
  on public.training_audit_log for all to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "training_audit_trainer_read" on public.training_audit_log;
create policy "training_audit_trainer_read"
  on public.training_audit_log for select to authenticated
  using (
    exists (
      select 1 from public.trainings t
      where t.id = training_id and t.trainer_id = auth.uid()
    )
  );

drop policy if exists "training_audit_trainer_insert" on public.training_audit_log;
create policy "training_audit_trainer_insert"
  on public.training_audit_log for insert to authenticated
  with check (
    actor_role = 'trainer'
    and exists (
      select 1 from public.trainings t
      where t.id = training_id and t.trainer_id = auth.uid()
    )
  );
