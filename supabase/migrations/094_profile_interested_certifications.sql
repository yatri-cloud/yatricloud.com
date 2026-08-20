-- Migration 094: Add interested_certifications column to profiles
alter table public.profiles
  add column if not exists interested_certifications text[] default '{}';

comment on column public.profiles.interested_certifications is 'Array of certification providers or exam names the user is interested in.';
