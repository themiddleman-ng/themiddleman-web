begin;

-- Public seller pages expose only approved sellers and safe columns (no ID docs, bank, or contact fields).
drop policy if exists "public can read seller profiles" on public.seller_profiles;

create policy "anon reads approved seller profiles" on public.seller_profiles
  for select to anon
  using (verification_status = 'approved');

create policy "authenticated reads approved or own seller profile" on public.seller_profiles
  for select to authenticated
  using (
    verification_status = 'approved'
    or user_id = (select auth.uid())
  );

create or replace view public.public_seller_profiles
with (security_invoker = true) as
  select
    id,
    display_name,
    bio,
    rating_avg,
    total_orders_completed,
    created_at
  from public.seller_profiles
  where verification_status = 'approved';

comment on view public.public_seller_profiles is
  'Directory-safe seller fields for approved sellers only.';

revoke all on public.public_seller_profiles from public;
grant select on public.public_seller_profiles to anon, authenticated;

commit;
