-- Apply Phase B first. No table replacement, no payment release, no anonymity changes.
do $$ begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public'
    and table_name = 'orders' and column_name = 'idempotency_key') then
    raise exception 'Apply Phase B server-authoritative orders first';
  end if;
end $$;

-- One successful payment per order. Existing duplicates cause a safe failure.
create unique index payments_one_per_order on public.payments (order_id);
revoke insert, update, delete on public.payments from public, anon, authenticated;

-- Narrow payment-authority guard, not a replacement for Phase D lifecycle rules.
create schema if not exists private;
create function private.guard_order_payment_authority()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if current_user not in ('service_role', 'postgres', 'supabase_admin') then
    if tg_op = 'INSERT' then
      raise exception 'Orders must be created by the server' using errcode = '42501';
    end if;
    if new.id is distinct from old.id or new.buyer_id is distinct from old.buyer_id
      or new.seller_id is distinct from old.seller_id or new.gig_id is distinct from old.gig_id
      or new.amount is distinct from old.amount or new.idempotency_key is distinct from old.idempotency_key
      or (new.status is distinct from old.status and
        (old.status = 'pending_payment' or new.status in ('pending_payment', 'in_escrow'))) then
      raise exception 'Payment fields are server controlled' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
revoke all on function private.guard_order_payment_authority() from public, anon, authenticated;
create trigger orders_payment_authority before insert or update on public.orders
for each row execute function private.guard_order_payment_authority();

-- SECURITY INVOKER: only the server role may call this transaction.
-- The reference itself binds the signed charge to its order; browser orderId is never used.
create function public.record_paystack_payment(p_reference text, p_amount_kobo bigint, p_currency text)
returns text language plpgsql security invoker set search_path = '' as $$
declare
  target public.orders%rowtype;
  existing public.payments%rowtype;
begin
  if p_reference is null or p_reference !~ '^mm_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    or p_currency is distinct from 'NGN' or p_amount_kobo is null or p_amount_kobo <= 0 then
    raise exception 'Invalid payment';
  end if;
  select * into target from public.orders where id = substring(p_reference from 4)::uuid for update;
  if not found then raise exception 'Unknown order'; end if;
  if target.amount * 100 <> p_amount_kobo then raise exception 'Payment amount mismatch'; end if;
  select * into existing from public.payments where order_id = target.id;
  if found then
    if existing.paystack_reference = p_reference and existing.amount = target.amount then
      return 'duplicate'; -- Never regress a delivered/refunded order on a late retry.
    end if;
    raise exception 'Order already has a different payment';
  end if;
  if target.status <> 'pending_payment' then raise exception 'Order is not awaiting payment'; end if;
  insert into public.payments (order_id, paystack_reference, amount, escrow_status, payout_status)
    values (target.id, p_reference, target.amount, 'held', 'pending');
  update public.orders set status = 'in_escrow', updated_at = now() where id = target.id;
  return 'recorded';
end $$;
revoke all on function public.record_paystack_payment(text, bigint, text) from public, anon, authenticated;
grant execute on function public.record_paystack_payment(text, bigint, text) to service_role;
