begin;

-- Restore seller_profiles access exactly as the migration chain left it before 20261025130000.
-- The forward migration does not create "authenticated reads approved seller profiles".
-- This rollback drops that policy if a previous draft created it, and it does not
-- recreate it. Public reads return to the pre-migration "public can read seller profiles"
-- policy (including the broader column grant to anon). Apply this only to undo 20261025130000.
drop view if exists public.public_seller_profile_cards;
drop view if exists public.public_seller_profiles;

drop policy if exists "authenticated reads approved seller profiles" on public.seller_profiles;
drop policy if exists "authenticated reads own seller profile" on public.seller_profiles;

revoke all on table public.seller_profiles from public, anon, authenticated;

grant insert (user_id, display_name, bio, skills, portfolio_links, linkedin_url,
  years_experience, gig_categories, id_document_type, id_document_url)
  on public.seller_profiles to authenticated;
grant update (display_name, bio, skills, portfolio_links, linkedin_url,
  years_experience, gig_categories, id_document_type, id_document_url)
  on public.seller_profiles to authenticated;
grant select (id, user_id, display_name, bio, skills, portfolio_links, verification_status,
  rating_avg, total_orders_completed, created_at, updated_at, gig_categories, linkedin_url, years_experience)
  on public.seller_profiles to anon, authenticated;

drop policy if exists "public can read seller profiles" on public.seller_profiles;
create policy "public can read seller profiles" on public.seller_profiles
  for select using (true);

-- "active sellers create/update their own profile" policies from 20261012130000 remain unchanged.

commit;
