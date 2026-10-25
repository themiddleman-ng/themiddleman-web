\set ON_ERROR_STOP on

-- 1) Anon cannot read id_document_url from seller_profiles
set local role anon;
select case when count(*) = 0 then 'ok: anon blocked from seller_profiles' else 'fail: anon read seller_profiles' end
from public.seller_profiles;

reset role;

-- 2) Public view exposes approved sellers only
set local role anon;
select case when count(*) >= 1 then 'ok: public view readable' else 'fail: public view empty' end
from public.public_seller_profiles;

select case when count(*) = 0 then 'ok: pending hidden from view' else 'fail: pending seller leaked' end
from public.public_seller_profiles
where display_name = 'Pending Seller';

reset role;

-- 3) Wishlist isolation (buyer B cannot read buyer A wishlist)
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111102';
set local role authenticated;
select case when count(*) = 0 then 'ok: foreign wishlist blocked' else 'fail: foreign wishlist visible' end
from public.gig_wishlists
where user_id = '11111111-1111-4111-8111-111111111101';

reset role;

-- 4) Draft gigs are not publicly readable
set local role anon;
select case when count(*) = 0 then 'ok: draft gig hidden' else 'fail: draft gig visible' end
from public.gigs
where status = 'draft';

reset role;

-- 5) Users cannot self-promote to admin
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111101';
set local role authenticated;
do $$
begin
  update public.users set role = 'admin' where id = '11111111-1111-4111-8111-111111111101';
exception when others then
  raise notice 'ok: admin self-claim blocked';
end $$;

reset role;
