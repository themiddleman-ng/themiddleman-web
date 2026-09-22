do $$ begin
  if not exists(select 1 from information_schema.columns where table_schema='public'
    and table_name='deliveries' and column_name='order_id') then
    raise exception 'Apply Phase D before Phase E';
  end if;
end $$;

-- Sellers use role-specific server responses. No base-table SELECT can reveal
-- the buyer's auth ID, reviewer's ID, or their full name via a join.
drop policy if exists "buyers and sellers view their own orders" on public.orders;
create policy "buyers view their own orders" on public.orders for select to authenticated
  using ((select auth.uid()) = buyer_id);
drop policy if exists "buyers and sellers update their own orders" on public.orders;
drop policy if exists "sellers_select_own_gig_deliveries" on public.deliveries;
drop policy if exists "buyers_select_own_deliveries" on public.deliveries;
create policy "buyers view their own deliveries" on public.deliveries for select to authenticated
  using ((select auth.uid()) = buyer_id);

drop policy if exists "buyers_select_own_transactions" on public.transactions;
drop policy if exists "sellers_select_own_transactions" on public.transactions;
revoke select, insert, update, delete on public.transactions from public, anon, authenticated;

drop policy if exists "order parties view payments" on public.payments;
create schema if not exists private;
create or replace function private.owns_payment_as_seller(p_order_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.orders o
    join public.seller_profiles s on s.id = o.seller_id
    where o.id = p_order_id and s.user_id = (select auth.uid()));
$$;
revoke all on function private.owns_payment_as_seller(uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.owns_payment_as_seller(uuid) to authenticated;
create policy "buyers and sellers view own payments" on public.payments for select to authenticated
  using (exists(select 1 from public.orders o where o.id = order_id
    and o.buyer_id = (select auth.uid()))
    or private.owns_payment_as_seller(order_id));

-- The old views were security-definer and mapped seller_id to the wrong ID
-- domain. They remain inaccessible until a safe server-specific use is needed.
alter view public.seller_delivery_view set (security_invoker = true);
alter view public.seller_transaction_view set (security_invoker = true);
revoke all on public.seller_delivery_view, public.seller_transaction_view from public, anon, authenticated;

-- Conversations and messages contain real buyer user IDs in every row.
-- Client pages now read and write only through authenticated server endpoints
-- that return an alias to sellers and own-message flags instead of IDs.
revoke select, insert, update, delete on public.conversations from public, anon, authenticated;
revoke select, insert, update, delete on public.messages from public, anon, authenticated;

drop policy if exists "order parties raise disputes" on public.disputes;
revoke insert on public.disputes from public, anon, authenticated;

-- Government ID document paths are never part of a public seller profile.
revoke select on public.seller_profiles from public, anon, authenticated;
grant select (id,user_id,display_name,bio,skills,portfolio_links,verification_status,
  rating_avg,total_orders_completed,created_at,updated_at,gig_categories,linkedin_url,years_experience)
  on public.seller_profiles to anon, authenticated;

drop policy if exists "public can read reviews" on public.reviews;
create policy "buyer reads own reviews" on public.reviews for select to authenticated
  using ((select auth.uid()) = reviewer_id);
-- Do not disclose reviewer_id or order_id to marketplace visitors.
create or replace function public.get_gig_reviews(p_gig_id uuid)
returns table(rating smallint, comment text, created_at timestamptz, reviewer_name text)
language sql stable security definer set search_path = '' as $$
  select r.rating::smallint, r.comment, r.created_at,
    'Verified buyer'::text from public.reviews r
  join public.orders o on o.id = r.order_id
  where o.gig_id = p_gig_id and o.status in ('approved','delivered')
  order by r.created_at desc limit 100;
$$;
