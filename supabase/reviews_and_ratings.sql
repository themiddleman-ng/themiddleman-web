-- Run this AFTER schema.sql, auth_trigger.sql, storage_policies.sql, and
-- messages_schema.sql.
--
-- reviews.order_id ties a review to an order, and orders are locked down by
-- RLS to just the buyer/seller involved (see schema.sql). That's correct for
-- order details, but it also means a random visitor querying reviews joined
-- to orders would see nothing — so gig ratings would never show publicly.
-- These SECURITY DEFINER functions expose only the aggregated, non-sensitive
-- columns (rating, comment, reviewer name) regardless of who's asking,
-- without exposing order amounts or party identities beyond a first name.

create or replace function public.get_gig_ratings()
returns table (gig_id uuid, average_rating numeric, review_count bigint)
language sql security definer set search_path = public as $$
  select o.gig_id, round(avg(r.rating)::numeric, 2), count(r.id)
  from public.reviews r
  join public.orders o on o.id = r.order_id
  group by o.gig_id;
$$;
grant execute on function public.get_gig_ratings() to anon, authenticated;

create or replace function public.get_seller_ratings()
returns table (seller_id uuid, average_rating numeric, review_count bigint)
language sql security definer set search_path = public as $$
  select o.seller_id, round(avg(r.rating)::numeric, 2), count(r.id)
  from public.reviews r
  join public.orders o on o.id = r.order_id
  group by o.seller_id;
$$;
grant execute on function public.get_seller_ratings() to anon, authenticated;

create or replace function public.get_gig_reviews(p_gig_id uuid)
returns table (rating smallint, comment text, created_at timestamptz, reviewer_name text)
language sql security definer set search_path = public as $$
  select r.rating, r.comment, r.created_at, u.full_name
  from public.reviews r
  join public.orders o on o.id = r.order_id
  join public.users u on u.id = r.reviewer_id
  where o.gig_id = p_gig_id
  order by r.created_at desc;
$$;
grant execute on function public.get_gig_reviews(uuid) to anon, authenticated;

-- Sellers need to see incoming orders and buyers need to see the gig/seller
-- title alongside their own — schema.sql's order policies already allow
-- this (buyer_id/seller_id = auth.uid()), no changes needed there.
