-- Gig reports for admin review
-- Run this in the Supabase SQL editor after the core schema.

create table if not exists public.gig_reports (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references public.gigs(id) on delete cascade,
  reported_by uuid not null references public.users(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  review_notes text
);

alter table public.gig_reports enable row level security;

create policy "users create gig reports" on public.gig_reports
  for insert with check (auth.uid() = reported_by);

create policy "users view their own gig reports" on public.gig_reports
  for select using (auth.uid() = reported_by);