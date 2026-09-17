-- Applied migration version: 20260917123912.
-- Phase A canonical order lifecycle:
-- pending_payment -> in_escrow -> delivered -> approved
-- disputed and refunded are exceptional terminal paths.
-- The table is intentionally required to be empty for this vocabulary repair;
-- guessing how to translate historical cancelled orders into refunds would be unsafe.
do $$
begin
  if exists (select 1 from public.orders) then
    raise exception 'Phase A status migration requires an empty public.orders table';
  end if;
end
$$;

alter table public.orders alter column status drop default;
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders
  alter column status type public.order_status
  using (
    case status
      when 'pending' then 'pending_payment'
      when 'in_progress' then 'in_escrow'
      when 'completed' then 'approved'
      else status
    end
  )::public.order_status;
alter table public.orders alter column status set default 'pending_payment'::public.order_status;

-- orders.seller_id stores seller_profiles.id, while auth.uid() is a users.id.
-- Resolve the seller profile before comparing those two identity domains.
drop policy if exists "buyers and sellers view their own orders" on public.orders;
create policy "buyers and sellers view their own orders"
  on public.orders
  for select
  to authenticated
  using (
    (select auth.uid()) = buyer_id
    or exists (
      select 1
      from public.seller_profiles as seller
      where seller.id = orders.seller_id
        and seller.user_id = (select auth.uid())
    )
  );

drop policy if exists "buyers and sellers update their own orders" on public.orders;
create policy "buyers and sellers update their own orders"
  on public.orders
  for update
  to authenticated
  using (
    (select auth.uid()) = buyer_id
    or exists (
      select 1
      from public.seller_profiles as seller
      where seller.id = orders.seller_id
        and seller.user_id = (select auth.uid())
    )
  )
  with check (
    (select auth.uid()) = buyer_id
    or exists (
      select 1
      from public.seller_profiles as seller
      where seller.id = orders.seller_id
        and seller.user_id = (select auth.uid())
    )
  );

create schema if not exists private;

create or replace function private.prevent_order_self_purchase()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.seller_profiles as seller
    where seller.id = new.seller_id
      and seller.user_id = new.buyer_id
  ) then
    raise exception 'A seller cannot buy their own product'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function private.prevent_order_self_purchase() from public, anon, authenticated;

drop trigger if exists orders_prevent_self_purchase on public.orders;
create trigger orders_prevent_self_purchase
before insert or update of buyer_id, seller_id on public.orders
for each row execute function private.prevent_order_self_purchase();
