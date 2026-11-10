-- READ ONLY. Not executed.
-- Not verified against vhfskuabgsudbaiqotth. Never run on uwigyojtiudefnwjezhm.
-- See demo-cleanup-plan.md. These selects do not prove a row is disposable.
-- There is no DELETE and no TRUNCATE in this file.
-- Re-applying scripts/seed-isolated-db.sql is not a rollback.

select 'gigs' as item, id, title, status, price_ngn, seller_id
from public.gigs
where id in (
  '44444444-4444-4444-8444-444444444401',
  '44444444-4444-4444-8444-444444444402'
);

select 'seller_profiles' as item, id, user_id, display_name, verification_status
from public.seller_profiles
where id in (
  '33333333-3333-4333-8333-333333333301',
  '33333333-3333-4333-8333-333333333302'
);

select 'wishlist' as item, user_id, gig_id
from public.gig_wishlists
where user_id = '11111111-1111-4111-8111-111111111101'
  and gig_id = '44444444-4444-4444-8444-444444444401';

-- Presence only. Do not delete these accounts from this plan.
select 'public.users seed ids present' as item, count(*) as n
from public.users
where id in (
  '11111111-1111-4111-8111-111111111101',
  '11111111-1111-4111-8111-111111111102',
  '22222222-2222-4222-8222-222222222201',
  '22222222-2222-4222-8222-222222222202'
);
