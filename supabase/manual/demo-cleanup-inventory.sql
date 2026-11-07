-- Inventory only. Do not run against production.
-- Do not apply the commented deletes until the parent confirms the isolated test project
-- and the scope of demo data. There is no TRUNCATE here.
-- These ids are the only rows this repo's scripts/seed-isolated-db.sql inserts with confidence.
-- Code previews in lib/design-preview/catalog.ts are not database rows. Do not delete app code to "clean" them.

-- Counts. Expect 1 or 0 on a database where that seed was applied. Any other count needs a human look.
select 'auth.users fixture' as item, count(*) as n
from auth.users
where id in (
  '11111111-1111-4111-8111-111111111101',
  '11111111-1111-4111-8111-111111111102',
  '22222222-2222-4222-8222-222222222201',
  '22222222-2222-4222-8222-222222222202'
);

select 'public.users fixture' as item, count(*) as n
from public.users
where id in (
  '11111111-1111-4111-8111-111111111101',
  '11111111-1111-4111-8111-111111111102',
  '22222222-2222-4222-8222-222222222201',
  '22222222-2222-4222-8222-222222222202'
);

select 'seller_profiles fixture' as item, count(*) as n
from public.seller_profiles
where id in (
  '33333333-3333-4333-8333-333333333301',
  '33333333-3333-4333-8333-333333333302'
);

select 'gigs fixture' as item, id, title, status
from public.gigs
where id in (
  '44444444-4444-4444-8444-444444444401',
  '44444444-4444-4444-8444-444444444402'
);

select 'wishlist fixture' as item, count(*) as n
from public.gig_wishlists
where user_id = '11111111-1111-4111-8111-111111111101'
  and gig_id = '44444444-4444-4444-8444-444444444401';

-- Stop here unless a human has confirmed every row above is disposable test data.
-- Rollback for a mistaken delete is to re-apply scripts/seed-isolated-db.sql on that same test database.
-- Do not delete auth accounts that are not in the id list above.
-- Do not delete orders, payments, logs, or admin configuration.

-- begin;
-- delete from public.gig_wishlists
--  where user_id = '11111111-1111-4111-8111-111111111101'
--    and gig_id = '44444444-4444-4444-8444-444444444401';
-- delete from public.gigs
--  where id in (
--    '44444444-4444-4444-8444-444444444401',
--    '44444444-4444-4444-8444-444444444402'
--  );
-- delete from public.seller_profiles
--  where id in (
--    '33333333-3333-4333-8333-333333333301',
--    '33333333-3333-4333-8333-333333333302'
--  );
-- delete from public.users
--  where id in (
--    '11111111-1111-4111-8111-111111111101',
--    '11111111-1111-4111-8111-111111111102',
--    '22222222-2222-4222-8222-222222222201',
--    '22222222-2222-4222-8222-222222222202'
--  );
-- delete from auth.users
--  where id in (
--    '11111111-1111-4111-8111-111111111101',
--    '11111111-1111-4111-8111-111111111102',
--    '22222222-2222-4222-8222-222222222201',
--    '22222222-2222-4222-8222-222222222202'
--  );
-- rollback; -- change to commit only after the counts matched and the parent approved.
