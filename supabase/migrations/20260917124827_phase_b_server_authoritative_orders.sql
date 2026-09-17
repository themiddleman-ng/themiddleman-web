-- Order creation is now owned by the authenticated server endpoint.
-- The key makes retries return the original order rather than creating a second one.
do $$
begin
  if exists (select 1 from public.orders) then
    raise exception 'Phase B order-authority migration requires an empty public.orders table';
  end if;
end
$$;

alter table public.orders add column idempotency_key uuid;
alter table public.orders alter column idempotency_key set not null;
alter table public.orders
  add constraint orders_buyer_id_idempotency_key_key
  unique (buyer_id, idempotency_key);

drop policy if exists "buyers create orders" on public.orders;
revoke insert on table public.orders from anon, authenticated;
