begin;

create table if not exists public.gig_wishlists (
  user_id uuid not null references auth.users (id) on delete cascade,
  gig_id uuid not null references public.gigs (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, gig_id)
);

create index if not exists gig_wishlists_gig_id_idx on public.gig_wishlists (gig_id);

alter table public.gig_wishlists enable row level security;

drop policy if exists "Users manage own gig wishlists" on public.gig_wishlists;
create policy "Users manage own gig wishlists" on public.gig_wishlists
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke all on public.gig_wishlists from public, anon;
grant select, insert, delete on public.gig_wishlists to authenticated;
grant all on public.gig_wishlists to service_role;

commit;
