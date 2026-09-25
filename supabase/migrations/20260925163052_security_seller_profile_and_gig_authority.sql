-- Browser users may edit their seller details, but only trusted server roles
-- may approve sellers or set computed trust/rating fields.
revoke insert, update on public.seller_profiles from public, anon, authenticated;
grant insert (user_id, display_name, bio, skills, portfolio_links, linkedin_url,
  years_experience, gig_categories, id_document_type, id_document_url)
  on public.seller_profiles to authenticated;
grant update (display_name, bio, skills, portfolio_links, linkedin_url,
  years_experience, gig_categories, id_document_type, id_document_url)
  on public.seller_profiles to authenticated;

-- A browser-side verification check is not authorization. These policies
-- enforce seller approval even when someone calls the Data API directly.
drop policy if exists "sellers insert their own gigs" on public.gigs;
create policy "approved sellers insert their own gigs" on public.gigs
  for insert to authenticated with check (
    exists (select 1 from public.seller_profiles seller
      where seller.id = gigs.seller_id
        and seller.user_id = (select auth.uid())
        and seller.verification_status = 'approved')
  );
drop policy if exists "sellers update their own gigs" on public.gigs;
create policy "approved sellers update their own gigs" on public.gigs
  for update to authenticated
  using (exists (select 1 from public.seller_profiles seller
    where seller.id = gigs.seller_id
      and seller.user_id = (select auth.uid())
      and seller.verification_status = 'approved'))
  with check (exists (select 1 from public.seller_profiles seller
    where seller.id = gigs.seller_id
      and seller.user_id = (select auth.uid())
      and seller.verification_status = 'approved'));

drop policy if exists "seller uploads own gig media" on storage.objects;
create policy "approved seller uploads own gig media" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'gig-media'
    and split_part(name, '/', 1) = (select auth.uid())::text
    and split_part(name, '/', 2) = 'gigs'
    and exists (select 1 from public.seller_profiles seller
      where seller.user_id = (select auth.uid())
        and seller.verification_status = 'approved')
  );

-- Reviews count only after delivery was accepted by the buyer.
drop policy if exists "buyers leave reviews on their own orders" on public.reviews;
create policy "buyers review approved orders" on public.reviews
  for insert to authenticated with check (
    reviewer_id = (select auth.uid())
    and exists (select 1 from public.orders orders
      where orders.id = reviews.order_id
        and orders.buyer_id = (select auth.uid())
        and orders.status = 'approved')
  );

-- A private document bucket must enforce the same limits as its form.
update storage.buckets set file_size_limit = 10485760,
  allowed_mime_types = array['application/pdf','image/jpeg','image/png','image/webp']
  where id = 'verification-docs';
