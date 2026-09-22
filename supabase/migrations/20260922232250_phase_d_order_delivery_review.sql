-- Fulfilment is tied to the paid order; do not create a second transaction.
do $$ begin
  if exists (select 1 from public.deliveries) or exists (select 1 from public.transactions) then
    raise exception 'Reconcile existing deliveries and transactions before Phase D';
  end if;
  if to_regprocedure('public.record_paystack_payment(text,bigint,text)') is null then
    raise exception 'Apply Phase C before Phase D';
  end if;
end $$;

alter table public.deliveries add column order_id uuid not null references public.orders(id) on delete restrict;
alter table public.deliveries add constraint deliveries_order_id_key unique (order_id);

create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id),
  action text not null,
  target_type text not null,
  target_id uuid not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index admin_audit_log_created_idx on public.admin_audit_log (created_at desc);
alter table public.admin_audit_log enable row level security;
revoke all on public.admin_audit_log from public, anon, authenticated;
grant select, insert on public.admin_audit_log to service_role;

-- All state changes happen through server-only functions. This also removes the
-- old browser-side ability to approve an order or mark a payment as released.
revoke update on public.orders from public, anon, authenticated;
revoke insert, update, delete on public.deliveries from public, anon, authenticated;

create function public.submit_order_delivery(p_order_id uuid, p_seller_uid uuid, p_storage_path text)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  target public.orders%rowtype;
  saved public.deliveries%rowtype;
  seller_uid uuid;
begin
  if p_storage_path is null or length(p_storage_path) > 500
     or p_storage_path !~ ('^' || p_order_id::text || '/[0-9a-f-]{36}[.][a-z0-9]{2,8}$') then
    raise exception 'Invalid private delivery path';
  end if;
  select * into target from public.orders where id = p_order_id for update;
  if not found or target.status <> 'in_escrow' then
    raise exception 'Order is not awaiting delivery';
  end if;
  select user_id into seller_uid from public.seller_profiles where id = target.seller_id;
  if seller_uid is distinct from p_seller_uid then
    raise exception 'Seller does not own this order' using errcode = '42501';
  end if;
  if not exists (select 1 from public.payments where order_id = target.id and escrow_status = 'held') then
    raise exception 'Payment is not held';
  end if;
  select * into saved from public.deliveries where order_id = target.id for update;
  if found then
    if saved.status <> 'needs_seller_edit' then raise exception 'Delivery is already submitted'; end if;
    update public.deliveries set storage_path = p_storage_path, status = 'pending_review',
      updated_at = now(), review_notes = null, reviewed_at = null
      where id = saved.id returning id into saved.id;
  else
    insert into public.deliveries(order_id, gig_id, buyer_id, seller_id, storage_path, status)
      values (target.id, target.gig_id, target.buyer_id, seller_uid, p_storage_path, 'pending_review')
      returning id into saved.id;
  end if;
  return saved.id;
end $$;
revoke all on function public.submit_order_delivery(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.submit_order_delivery(uuid,uuid,text) to service_role;

create function public.review_order_delivery(p_delivery_id uuid, p_admin_uid uuid, p_approve boolean, p_notes text)
returns text language plpgsql security invoker set search_path = '' as $$
declare
  target public.deliveries%rowtype;
begin
  if not exists (select 1 from public.profiles where id = p_admin_uid and role = 'admin') then
    raise exception 'Admin required' using errcode = '42501';
  end if;
  if length(coalesce(p_notes, '')) > 2000 or (not p_approve and length(trim(coalesce(p_notes, ''))) < 5) then
    raise exception 'Review notes are required for rejection (5-2000 characters)';
  end if;
  select * into target from public.deliveries where id = p_delivery_id for update;
  if not found or target.status <> 'pending_review' then raise exception 'Delivery is not pending review'; end if;
  if not exists (select 1 from public.orders where id = target.order_id and status = 'in_escrow') then
    raise exception 'Order is not in escrow';
  end if;
  update public.deliveries set status = case when p_approve then 'delivered'::public.delivery_status
      else 'needs_seller_edit'::public.delivery_status end,
    admin_reviewer_id = p_admin_uid, review_notes = nullif(trim(p_notes), ''),
    reviewed_at = now(), delivered_at = case when p_approve then now() else null end,
    updated_at = now() where id = target.id;
  if p_approve then
    update public.orders set status = 'delivered', updated_at = now() where id = target.order_id;
  end if;
  insert into public.admin_audit_log(actor_id, action, target_type, target_id, details)
    values(p_admin_uid, case when p_approve then 'delivery_approved' else 'delivery_rejected' end,
      'delivery', target.id, jsonb_build_object('order_id',target.order_id,'notes',p_notes));
  return case when p_approve then 'delivered' else 'needs_seller_edit' end;
end $$;
revoke all on function public.review_order_delivery(uuid,uuid,boolean,text) from public, anon, authenticated;
grant execute on function public.review_order_delivery(uuid,uuid,boolean,text) to service_role;

-- Buyer acceptance does not claim that a Paystack payout has happened.
create function public.accept_order_delivery(p_order_id uuid, p_buyer_uid uuid)
returns text language plpgsql security invoker set search_path = '' as $$
declare
  target public.orders%rowtype;
begin
  select * into target from public.orders where id = p_order_id for update;
  if not found or target.buyer_id is distinct from p_buyer_uid then
    raise exception 'Buyer does not own this order' using errcode = '42501';
  end if;
  if target.status <> 'delivered' or not exists
      (select 1 from public.deliveries where order_id = p_order_id and status = 'delivered') then
    raise exception 'Delivery has not been approved by an admin';
  end if;
  update public.orders set status = 'approved', updated_at = now() where id = p_order_id;
  return 'approved';
end $$;
revoke all on function public.accept_order_delivery(uuid,uuid) from public, anon, authenticated;
grant execute on function public.accept_order_delivery(uuid,uuid) to service_role;

create unique index disputes_one_open_per_order on public.disputes (order_id) where status = 'open';
create function public.raise_order_dispute(p_order_id uuid, p_buyer_uid uuid, p_reason text)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  target public.orders%rowtype;
  dispute_id uuid;
begin
  if length(trim(coalesce(p_reason, ''))) < 10 or length(p_reason) > 2000 then
    raise exception 'Reason must be 10-2000 characters';
  end if;
  select * into target from public.orders where id = p_order_id for update;
  if not found or target.buyer_id is distinct from p_buyer_uid then
    raise exception 'Buyer does not own this order' using errcode = '42501';
  end if;
  if target.status not in ('in_escrow', 'delivered') then
    raise exception 'Order cannot be disputed in this state';
  end if;
  insert into public.disputes(order_id, raised_by, reason)
    values (p_order_id, p_buyer_uid, trim(p_reason)) returning id into dispute_id;
  update public.orders set status = 'disputed', updated_at = now() where id = p_order_id;
  return dispute_id;
end $$;
revoke all on function public.raise_order_dispute(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.raise_order_dispute(uuid,uuid,text) to service_role;

-- A private bucket: only short-lived signed links issued after a server-side
-- authorization check can upload or download a buyer's deliverable.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('order-deliveries','order-deliveries',false,10485760,
  array['application/pdf','application/zip','image/png','image/jpeg','text/plain'])
on conflict (id) do nothing;
