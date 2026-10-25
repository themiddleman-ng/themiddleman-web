begin;

-- Remove every public/anon path to seller_profiles (including column grants from phase E).
drop policy if exists "public can read seller profiles" on public.seller_profiles;
drop policy if exists "anon reads approved seller profiles" on public.seller_profiles;
drop policy if exists "authenticated reads approved or own seller profile" on public.seller_profiles;

revoke all on table public.seller_profiles from public, anon, authenticated;

grant insert (user_id, display_name, bio, skills, portfolio_links, linkedin_url,
  years_experience, gig_categories, id_document_type, id_document_url)
  on public.seller_profiles to authenticated;
grant update (display_name, bio, skills, portfolio_links, linkedin_url,
  years_experience, gig_categories, id_document_type, id_document_url)
  on public.seller_profiles to authenticated;
grant select on public.seller_profiles to authenticated;

drop policy if exists "authenticated reads own seller profile" on public.seller_profiles;
create policy "authenticated reads own seller profile" on public.seller_profiles
  for select to authenticated
  using (user_id = (select auth.uid()));

drop view if exists public.public_seller_profiles;

create view public.public_seller_profiles
with (security_invoker = false) as
  select
    sp.id,
    sp.display_name,
    sp.bio,
    sp.rating_avg,
    sp.total_orders_completed,
    sp.created_at
  from public.seller_profiles sp
  where sp.verification_status = 'approved';

comment on view public.public_seller_profiles is
  'Directory-safe seller fields for approved sellers only (no ID docs, bank, or contact fields).';

revoke all on public.public_seller_profiles from public;
grant select on public.public_seller_profiles to anon, authenticated;

-- Marketplace cards need a verified label without exposing sensitive seller_profiles columns.
drop view if exists public.public_seller_profile_cards;
create view public.public_seller_profile_cards
with (security_invoker = false) as
  select
    sp.id,
    sp.display_name,
    'approved'::text as verification_status
  from public.seller_profiles sp
  where sp.verification_status = 'approved';

revoke all on public.public_seller_profile_cards from public;
grant select on public.public_seller_profile_cards to anon, authenticated;

commit;
