-- STAGING ONLY. Orders + payments remain canonical. Never reintroduce transactions.
-- Apply after Phase D/E/F and seller authority. Existing orders keep legacy fees.
begin;
create schema if not exists private;

-- Permissive storage policies are ORed together; the old catch-all bypassed
-- every narrower upload rule. A restrictive rule protects delivery objects
-- even if another permissive policy is introduced later.
drop policy if exists "Allow authenticated uploads 18sed9p_0" on storage.objects;
create policy "delivery objects are server only" on storage.objects as restrictive
  for all to anon,authenticated using(bucket_id<>'order-deliveries')
  with check(bucket_id<>'order-deliveries');
create policy "seller owns verification upload" on storage.objects for insert to authenticated
  with check(bucket_id='verification-docs' and split_part(name,'/',1)=(select auth.uid())::text);
create policy "seller owns verification document" on storage.objects for select to authenticated
  using(bucket_id='verification-docs' and split_part(name,'/',1)=(select auth.uid())::text);

alter table public.gigs add column repo_url text;
alter table public.gigs add column preview_commit_sha text;
alter table public.gigs add column listing_review_status text not null default 'pending'
  check (listing_review_status in ('pending','approved','changes_requested'));
alter table public.gigs add column listing_review_notes text;
alter table public.gigs add column sold_order_id uuid references public.orders(id);
alter table public.gigs add constraint gigs_preview_commit_valid check
  (preview_commit_sha is null or preview_commit_sha ~ '^[0-9a-f]{40}$');

create function private.guard_listing_review() returns trigger
language plpgsql set search_path='' as $$
begin
  if current_user not in ('service_role','postgres','supabase_admin') then
    if tg_op='INSERT' then
      new.listing_review_status := 'pending'; new.status := 'draft';
      new.listing_review_notes := null; new.is_sold := false; new.sold_order_id := null;
    else
      if new.listing_review_status is distinct from old.listing_review_status or
        new.listing_review_notes is distinct from old.listing_review_notes or
        new.is_sold is distinct from old.is_sold or new.sold_order_id is distinct from old.sold_order_id then
        raise exception 'Listing approval and exclusivity are server controlled' using errcode='42501';
      end if;
      if new.title is distinct from old.title or new.description is distinct from old.description or
        new.price_ngn is distinct from old.price_ngn or new.repo_url is distinct from old.repo_url or
        new.preview_commit_sha is distinct from old.preview_commit_sha or new.demo_links is distinct from old.demo_links or
        new.gallery_image_paths is distinct from old.gallery_image_paths or new.demo_video_path is distinct from old.demo_video_path or
        new.is_exclusive is distinct from old.is_exclusive then
        if old.is_sold then raise exception 'Sold exclusive listing cannot be changed'; end if;
        new.listing_review_status := 'pending'; new.status := 'draft';
      elsif new.status='active' and old.listing_review_status <> 'approved' then
        raise exception 'Admin approval required' using errcode='42501';
      end if;
    end if;
  end if;
  return new;
end $$;
revoke all on function private.guard_listing_review() from public,anon,authenticated;
create trigger gigs_listing_review before insert or update on public.gigs
  for each row execute function private.guard_listing_review();
create policy "approved listings only" on public.gigs as restrictive for select to anon,authenticated
using (listing_review_status='approved' or exists(select 1 from public.seller_profiles s
  where s.id=gigs.seller_id and s.user_id=(select auth.uid())));

create table public.order_fee_snapshots (
  order_id uuid primary key references public.orders(id),
  price_kobo bigint not null check(price_kobo>0),
  buyer_fee_kobo bigint not null check(buyer_fee_kobo>=0),
  flat_fee_usd_cents integer not null default 100 check(flat_fee_usd_cents=100),
  fx_rate_ngn_per_usd numeric(14,6) not null check(fx_rate_ngn_per_usd>0),
  fx_quoted_at timestamptz not null, fx_source text not null,
  flat_fee_kobo bigint not null check(flat_fee_kobo>0),
  buyer_vat_kobo bigint not null check(buyer_vat_kobo>=0),
  buyer_total_kobo bigint not null check(buyer_total_kobo=price_kobo+buyer_fee_kobo+flat_fee_kobo+buyer_vat_kobo),
  commission_kobo bigint not null check(commission_kobo>=0),
  seller_vat_kobo bigint not null check(seller_vat_kobo>=0),
  seller_payout_kobo bigint not null check(seller_payout_kobo=price_kobo-commission_kobo-seller_vat_kobo and seller_payout_kobo>=0),
  fee_version text not null default 'proposal-2026-10-v1', created_at timestamptz not null default now()
);
alter table public.order_fee_snapshots enable row level security;
revoke all on public.order_fee_snapshots from public,anon,authenticated;
grant select,insert on public.order_fee_snapshots to service_role;

-- Separate immutable accounting events from mutable workflow state.
create table public.escrow_ledger (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id),
  event_key text not null unique, kind text not null,
  amount_kobo bigint not null check(amount_kobo>=0), provider_reference text,
  details jsonb not null default '{}', created_at timestamptz not null default now()
);
alter table public.escrow_ledger enable row level security;
revoke all on public.escrow_ledger from public,anon,authenticated;
grant select,insert on public.escrow_ledger to service_role;
create function private.reject_accounting_mutation() returns trigger language plpgsql set search_path='' as $$
begin raise exception 'Accounting records are append-only'; end $$;
revoke all on function private.reject_accounting_mutation() from public,anon,authenticated;
create trigger immutable_fee_snapshot before update or delete on public.order_fee_snapshots
  for each row execute function private.reject_accounting_mutation();
create trigger immutable_ledger before update or delete on public.escrow_ledger
  for each row execute function private.reject_accounting_mutation();

create table public.escrow_operations (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id),
  kind text not null check(kind in ('payout','refund')),
  amount_kobo bigint not null check(amount_kobo>0),
  reference text not null unique, provider_id text, recipient_code text,
  status text not null default 'pending' check(status in ('pending','processing','submitted','succeeded','failed','uncertain')),
  attempts integer not null default 0, lease_until timestamptz, last_error text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(order_id,kind)
);
alter table public.escrow_operations enable row level security;
revoke all on public.escrow_operations from public,anon,authenticated;
grant select,insert,update on public.escrow_operations to service_role;
create index escrow_operations_queue on public.escrow_operations(status,created_at);
create table public.seller_payout_accounts (
  seller_id uuid primary key references public.seller_profiles(id),
  recipient_code text not null check(recipient_code ~ '^RCP_[a-zA-Z0-9]+$'),
  verified_by uuid not null references auth.users(id), verified_at timestamptz not null default now()
);
alter table public.seller_payout_accounts enable row level security;
revoke all on public.seller_payout_accounts from public,anon,authenticated;
grant select,insert,update on public.seller_payout_accounts to service_role;

alter table public.orders add column reservation_expires_at timestamptz;
alter table public.deliveries add column package_sha256 text check(package_sha256 ~ '^[0-9a-f]{64}$');
alter table public.deliveries add column package_size bigint check(package_size>0 and package_size<=10485760);
alter table public.deliveries add column package_content_type text;
alter table public.deliveries add column seller_due_at timestamptz;
alter table public.deliveries add column submitted_at timestamptz;
alter table public.deliveries add column admin_due_at timestamptz;
alter table public.deliveries add column accepted_at timestamptz;
alter table public.deliveries add column access_revoked_at timestamptz;
alter table public.disputes add column ground text check(ground in ('not_as_described','broken_core_features','missing_core_features','repo_mismatch'));
alter table public.disputes add column seller_response text;
alter table public.disputes add column seller_response_due_at timestamptz;
alter table public.disputes add column seller_responded_at timestamptz;
alter table public.disputes add column principal_refund_kobo bigint;
alter table public.disputes add column buyer_refund_kobo bigint;
alter table public.disputes add column seller_release_kobo bigint;
alter table public.disputes add column upheld boolean;
create table public.delivery_downloads (
  id uuid primary key default gen_random_uuid(), delivery_id uuid not null references public.deliveries(id),
  actor_id uuid not null references auth.users(id), package_sha256 text not null,
  created_at timestamptz not null default now()
);
alter table public.delivery_downloads enable row level security;
revoke all on public.delivery_downloads from public,anon,authenticated;
grant select,insert on public.delivery_downloads to service_role;
-- Never expose payment references or buyer totals to sellers through base-table joins.
revoke select on public.payments,public.disputes from public,anon,authenticated;
revoke insert,update,delete,truncate,references,trigger on public.orders,public.payments,public.deliveries,public.disputes,public.transactions from public,anon,authenticated;
revoke select on public.deliveries from public,anon,authenticated;

-- The live trigger previously overwrote the application deadline with 24h.
create or replace function public.set_dispute_window() returns trigger language plpgsql set search_path='' as $$
begin
  if new.status='delivered' and old.status is distinct from 'delivered' then
    new.delivered_at:=now(); new.dispute_window_closes_at:=now()+interval '72 hours';
  end if;
  return new;
end $$;
revoke all on function public.set_dispute_window() from public,anon,authenticated;

create function public.calculate_transaction_fees(p_price_kobo bigint, p_fx_rate numeric)
returns table(price_kobo bigint,buyer_fee_kobo bigint,flat_fee_kobo bigint,buyer_vat_kobo bigint,
  buyer_total_kobo bigint,commission_kobo bigint,seller_vat_kobo bigint,seller_payout_kobo bigint)
language plpgsql immutable security invoker set search_path='' as $$
declare bf bigint; ff bigint; bv bigint; sc bigint; sv bigint;
begin
  if p_price_kobo is null or p_price_kobo<=0 or p_price_kobo>100000000000 or
    p_fx_rate is null or p_fx_rate<=0 or p_fx_rate>100000 then raise exception 'Invalid fee inputs'; end if;
  bf := round(p_price_kobo::numeric*0.03); ff := round(p_fx_rate*100);
  bv := round((bf+ff)::numeric*0.075); sc := round(p_price_kobo::numeric*0.10); sv := round(sc::numeric*0.075);
  return query select p_price_kobo,bf,ff,bv,p_price_kobo+bf+ff+bv,sc,sv,p_price_kobo-sc-sv;
end $$;
revoke all on function public.calculate_transaction_fees(bigint,numeric) from public,anon,authenticated;
grant execute on function public.calculate_transaction_fees(bigint,numeric) to service_role;

create function public.create_escrow_order(p_buyer_uid uuid,p_gig_id uuid,p_key uuid,
  p_fx_rate numeric,p_fx_quoted_at timestamptz,p_fx_source text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare product public.gigs%rowtype; saved public.orders%rowtype; fees record;
begin
  if p_buyer_uid is null or p_key is null or p_fx_quoted_at is null or p_fx_quoted_at<now()-interval '24 hours'
    or p_fx_quoted_at>now()+interval '5 minutes' or length(coalesce(p_fx_source,'')) not between 3 and 200 then
    raise exception 'A fresh server FX quote is required'; end if;
  select * into product from public.gigs where id=p_gig_id for update;
  if not found then raise exception 'Product unavailable'; end if;
  select * into saved from public.orders where buyer_id=p_buyer_uid and idempotency_key=p_key;
  if found then
    if saved.gig_id<>p_gig_id then raise exception 'Idempotency key belongs to another product'; end if;
    if saved.status='pending_payment' and saved.reservation_expires_at<=now() then raise exception 'Checkout expired; start a new order'; end if;
    return jsonb_build_object('order',to_jsonb(saved)-'buyer_id'-'seller_id','fees',
      (select to_jsonb(f)-'order_id' from public.order_fee_snapshots f where order_id=saved.id),'reused',true);
  end if;
  if product.status<>'active' or product.listing_review_status<>'approved' or product.is_sold or
    not exists(select 1 from public.seller_profiles where id=product.seller_id and verification_status='approved' and user_id<>p_buyer_uid) then
    raise exception 'Product is unavailable or cannot be bought by this account'; end if;
  if product.is_exclusive and exists(select 1 from public.orders where gig_id=p_gig_id and
    (status in ('in_escrow','delivered','approved','disputed') or (status='pending_payment' and reservation_expires_at>now())) and not exists(select 1 from public.escrow_operations e where e.order_id=public.orders.id and e.kind='refund')) then
    raise exception 'Exclusive product is reserved'; end if;
  select * into fees from public.calculate_transaction_fees(product.price_ngn::bigint*100,p_fx_rate);
  insert into public.orders(buyer_id,seller_id,gig_id,amount,status,idempotency_key,reservation_expires_at)
    values(p_buyer_uid,product.seller_id,product.id,product.price_ngn,'pending_payment',p_key,now()+interval '30 minutes') returning * into saved;
  insert into public.order_fee_snapshots(order_id,price_kobo,buyer_fee_kobo,fx_rate_ngn_per_usd,fx_quoted_at,fx_source,
    flat_fee_kobo,buyer_vat_kobo,buyer_total_kobo,commission_kobo,seller_vat_kobo,seller_payout_kobo)
    values(saved.id,fees.price_kobo,fees.buyer_fee_kobo,p_fx_rate,p_fx_quoted_at,p_fx_source,fees.flat_fee_kobo,
      fees.buyer_vat_kobo,fees.buyer_total_kobo,fees.commission_kobo,fees.seller_vat_kobo,fees.seller_payout_kobo);
  return jsonb_build_object('order',to_jsonb(saved)-'buyer_id'-'seller_id','fees',
    (select to_jsonb(f)-'order_id' from public.order_fee_snapshots f where order_id=saved.id),'reused',false);
end $$;

alter function public.record_paystack_payment(text,bigint,text) rename to record_paystack_payment_legacy;
create function public.claim_exclusive_gig(p_gig_id uuid,p_order_id uuid) returns boolean
language plpgsql security invoker set search_path='' as $$
declare claimed integer;
begin
  update public.gigs set is_sold=true,sold_order_id=p_order_id where id=p_gig_id and is_exclusive and not is_sold
    and exists(select 1 from public.orders where id=p_order_id and gig_id=p_gig_id and status='in_escrow');
  get diagnostics claimed=row_count; return claimed=1;
end $$;
revoke all on function public.claim_exclusive_gig(uuid,uuid) from public,anon,authenticated;
grant execute on function public.claim_exclusive_gig(uuid,uuid) to service_role;
create function public.record_paystack_payment(p_reference text,p_amount_kobo bigint,p_currency text)
returns text language plpgsql security invoker set search_path='' as $$
declare target public.orders%rowtype; fees public.order_fee_snapshots%rowtype; product public.gigs%rowtype; seller_uid uuid;
begin
  if p_reference is null or p_reference !~ '^mm_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise exception 'Invalid reference'; end if;
  select * into target from public.orders where id=substring(p_reference from 4)::uuid;
  select * into fees from public.order_fee_snapshots where order_id=target.id;
  if not found then return public.record_paystack_payment_legacy(p_reference,p_amount_kobo,p_currency); end if;
  select * into product from public.gigs where id=target.gig_id for update;
  select * into target from public.orders where id=target.id for update;
  if p_currency is distinct from 'NGN' or p_amount_kobo is distinct from fees.buyer_total_kobo then raise exception 'Payment amount mismatch'; end if;
  if exists(select 1 from public.payments where order_id=target.id and paystack_reference=p_reference) then return 'duplicate'; end if;
  if target.status<>'pending_payment' then raise exception 'Order is not awaiting payment'; end if;
  insert into public.payments(order_id,paystack_reference,amount,platform_fee,escrow_status,payout_status)
    values(target.id,p_reference,p_amount_kobo::numeric/100,(fees.buyer_fee_kobo+fees.flat_fee_kobo+fees.commission_kobo)::numeric/100,'held','pending');
  insert into public.escrow_ledger(order_id,event_key,kind,amount_kobo,provider_reference)
    values(target.id,'payment:'||target.id,'payment_received',p_amount_kobo,p_reference);
  update public.orders set status='in_escrow',updated_at=now() where id=target.id;
  -- A late charge cannot take another buyer's exclusive allocation. Refund it.
  if product.is_exclusive and (product.is_sold or exists(select 1 from public.orders where gig_id=target.gig_id and id<>target.id and
    (status in ('in_escrow','delivered','approved','disputed') or (status='pending_payment' and reservation_expires_at>now())) and not exists(select 1 from public.escrow_operations e where e.order_id=public.orders.id and e.kind='refund'))) then
    insert into public.escrow_operations(order_id,kind,amount_kobo,reference)
      values(target.id,'refund',fees.buyer_total_kobo,'mm_refund_'||target.id);
    return 'refund_pending';
  end if;
  if product.is_exclusive and not public.claim_exclusive_gig(product.id,target.id) then raise exception 'Exclusive allocation failed'; end if;
  select user_id into seller_uid from public.seller_profiles where id=target.seller_id;
  insert into public.deliveries(order_id,gig_id,buyer_id,seller_id,status,seller_due_at)
    values(target.id,target.gig_id,target.buyer_id,seller_uid,'pending_upload',now()+interval '48 hours');
  return 'recorded';
end $$;

create function public.submit_checked_order_delivery(p_order_id uuid,p_seller_uid uuid,p_storage_path text,
  p_sha256 text,p_size bigint,p_content_type text)
returns uuid language plpgsql security invoker set search_path='' as $$
declare target public.orders%rowtype; saved public.deliveries%rowtype; seller_uid uuid;
begin
  select * into target from public.orders where id=p_order_id for update;
  select user_id into seller_uid from public.seller_profiles where id=target.seller_id;
  if seller_uid is distinct from p_seller_uid then raise exception 'Seller required' using errcode='42501'; end if;
  if target.status<>'in_escrow' or not exists(select 1 from public.payments where order_id=target.id and escrow_status='held')
    or exists(select 1 from public.escrow_operations where order_id=target.id) then raise exception 'Order not awaiting delivery'; end if;
  if p_sha256 is null or p_sha256 !~ '^[0-9a-f]{64}$' or p_size is null or p_size not between 1 and 10485760 or
    p_storage_path is null or p_storage_path !~ ('^'||p_order_id::text||'/[0-9a-f-]{36}[.](zip|pdf|png|jpg|txt)$') or
    p_content_type not in ('application/zip','application/pdf','image/png','image/jpeg','text/plain') then raise exception 'Invalid package metadata'; end if;
  if exists(select 1 from public.gigs where id=target.gig_id and repo_url is not null) and p_content_type<>'application/zip' then
    raise exception 'Repository products require a working-tree ZIP'; end if;
  select * into saved from public.deliveries where order_id=target.id for update;
  if found then
    if saved.status not in ('pending_upload','needs_seller_edit') or saved.seller_due_at<=now() then raise exception 'Submission closed'; end if;
    update public.deliveries set storage_path=p_storage_path,package_sha256=p_sha256,package_size=p_size,package_content_type=p_content_type,
      status='pending_review',submitted_at=now(),admin_due_at=now()+interval '24 hours',review_notes=null,reviewed_at=null,updated_at=now() where id=saved.id;
  else
    insert into public.deliveries(order_id,gig_id,buyer_id,seller_id,storage_path,package_sha256,package_size,package_content_type,status,submitted_at,admin_due_at)
      values(target.id,target.gig_id,target.buyer_id,seller_uid,p_storage_path,p_sha256,p_size,p_content_type,'pending_review',now(),now()+interval '24 hours') returning * into saved;
  end if;
  return saved.id;
end $$;

create or replace function public.review_order_delivery(p_delivery_id uuid,p_admin_uid uuid,p_approve boolean,p_notes text)
returns text language plpgsql security invoker set search_path='' as $$
declare target public.deliveries%rowtype; oid uuid;
begin
  if not exists(select 1 from public.profiles where id=p_admin_uid and role='admin') then raise exception 'Admin required' using errcode='42501'; end if;
  if p_approve is null or length(trim(coalesce(p_notes,''))) not between 5 and 2000 then raise exception 'Record review findings (5-2000 characters)'; end if;
  select order_id into oid from public.deliveries where id=p_delivery_id;
  perform 1 from public.orders where id=oid and status='in_escrow' for update;
  if not found then raise exception 'Order not in escrow'; end if;
  select * into target from public.deliveries where id=p_delivery_id for update;
  if target.status<>'pending_review' or target.package_sha256 is null then raise exception 'Validated package required'; end if;
  update public.deliveries set status=case when p_approve then 'delivered'::public.delivery_status else 'needs_seller_edit'::public.delivery_status end,
    admin_reviewer_id=p_admin_uid,review_notes=trim(p_notes),reviewed_at=now(),updated_at=now(),
    delivered_at=case when p_approve then now() end, dispute_window_closes_at=case when p_approve then now()+interval '72 hours' end,
    seller_due_at=case when not p_approve then now()+interval '48 hours' else seller_due_at end where id=target.id;
  if p_approve then update public.orders set status='delivered',updated_at=now() where id=oid; end if;
  insert into public.admin_audit_log(actor_id,action,target_type,target_id,details) values(p_admin_uid,
    case when p_approve then 'delivery_approved' else 'delivery_rejected' end,'delivery',target.id,
    jsonb_build_object('notes',p_notes,'sha256',target.package_sha256,'repo_parity','manual admin attestation'));
  return case when p_approve then 'delivered' else 'needs_seller_edit' end;
end $$;

create function private.queue_payout(p_order_id uuid,p_amount bigint) returns void language plpgsql set search_path='' as $$
begin
  if p_amount>0 then insert into public.escrow_operations(order_id,kind,amount_kobo,reference)
    values(p_order_id,'payout',p_amount,'mm_payout_'||p_order_id) on conflict(order_id,kind) do nothing; end if;
end $$;
create or replace function public.accept_order_delivery(p_order_id uuid,p_buyer_uid uuid)
returns text language plpgsql security invoker set search_path='' as $$
declare target public.orders%rowtype; fees public.order_fee_snapshots%rowtype;
begin
  select * into target from public.orders where id=p_order_id for update;
  if not found or target.buyer_id is distinct from p_buyer_uid then raise exception 'Buyer required' using errcode='42501'; end if;
  if target.status='approved' then return 'approved'; end if;
  if target.status<>'delivered' or not exists(select 1 from public.deliveries where order_id=target.id and status='delivered' and access_revoked_at is null)
    then raise exception 'Admin approved delivery required'; end if;
  update public.orders set status='approved',updated_at=now() where id=target.id;
  update public.deliveries set accepted_at=now() where order_id=target.id;
  select * into fees from public.order_fee_snapshots where order_id=target.id;
  if found then perform private.queue_payout(target.id,fees.seller_payout_kobo); end if;
  return 'approved';
end $$;

create function public.open_escrow_dispute(p_order_id uuid,p_buyer_uid uuid,p_ground text,p_reason text)
returns uuid language plpgsql security invoker set search_path='' as $$
declare target public.orders%rowtype; did uuid;
begin
  select * into target from public.orders where id=p_order_id for update;
  if not found or target.buyer_id is distinct from p_buyer_uid then raise exception 'Buyer required' using errcode='42501'; end if;
  if target.status not in ('in_escrow','delivered') or exists(select 1 from public.escrow_operations where order_id=target.id) then raise exception 'Dispute window closed'; end if;
  if target.status='delivered' and exists(select 1 from public.deliveries where order_id=target.id and dispute_window_closes_at<=now()) then raise exception 'Dispute window closed'; end if;
  if p_ground is null or p_ground not in ('not_as_described','broken_core_features','missing_core_features','repo_mismatch') or
    length(trim(coalesce(p_reason,''))) not between 10 and 2000 then raise exception 'Valid ground and evidence required'; end if;
  insert into public.disputes(order_id,raised_by,reason,ground,seller_response_due_at)
    values(target.id,p_buyer_uid,trim(p_reason),p_ground,now()+interval '24 hours') returning id into did;
  update public.orders set status='disputed',updated_at=now() where id=target.id;
  return did;
end $$;
create function public.respond_escrow_dispute(p_dispute_id uuid,p_seller_uid uuid,p_response text)
returns void language plpgsql security invoker set search_path='' as $$
declare target public.disputes%rowtype;
begin
  select * into target from public.disputes where id=p_dispute_id for update;
  if not exists(select 1 from public.orders o join public.seller_profiles s on s.id=o.seller_id where o.id=target.order_id and s.user_id=p_seller_uid)
    then raise exception 'Seller required' using errcode='42501'; end if;
  if target.status<>'open' or target.seller_response_due_at<=now() or target.seller_responded_at is not null or
    length(trim(coalesce(p_response,''))) not between 10 and 2000 then raise exception 'Response closed or invalid'; end if;
  update public.disputes set seller_response=trim(p_response),seller_responded_at=now() where id=target.id;
end $$;

create function public.resolve_escrow_dispute(p_dispute_id uuid,p_admin_uid uuid,p_principal_refund_kobo bigint,p_notes text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare d public.disputes%rowtype; o public.orders%rowtype; f public.order_fee_snapshots%rowtype; refund bigint; payout bigint; oid uuid;
begin
  if not exists(select 1 from public.profiles where id=p_admin_uid and role='admin') then raise exception 'Admin required' using errcode='42501'; end if;
  select order_id into oid from public.disputes where id=p_dispute_id;
  select * into o from public.orders where id=oid for update;
  select * into d from public.disputes where id=p_dispute_id for update;
  select * into f from public.order_fee_snapshots where order_id=oid;
  if not found or d.status<>'open' or o.status<>'disputed' then raise exception 'Open v2 dispute required'; end if;
  if d.seller_response_due_at>now() and d.seller_responded_at is null then raise exception 'Seller still has time to respond'; end if;
  if p_principal_refund_kobo is null or p_principal_refund_kobo<0 or p_principal_refund_kobo>f.price_kobo or
    length(trim(coalesce(p_notes,''))) not between 10 and 2000 then raise exception 'Invalid resolution'; end if;
  -- Refund principal plus the same proportion of buyer charges/VAT. A full
  -- refund includes every buyer charge; the platform absorbs gateway costs.
  refund := round(f.buyer_total_kobo::numeric*p_principal_refund_kobo/f.price_kobo);
  payout := f.seller_payout_kobo-round(f.seller_payout_kobo::numeric*p_principal_refund_kobo/f.price_kobo);
  update public.disputes set status=case when refund>0 then 'resolved_buyer' else 'resolved_seller' end,
    resolution_notes=p_notes,resolved_at=now(),principal_refund_kobo=p_principal_refund_kobo,
    buyer_refund_kobo=refund,seller_release_kobo=payout,upheld=(refund>0) where id=d.id;
  -- Full refunds revoke future platform downloads before refund submission.
  if p_principal_refund_kobo=f.price_kobo then update public.deliveries set access_revoked_at=now() where order_id=oid; end if;
  if refund>0 then insert into public.escrow_operations(order_id,kind,amount_kobo,reference)
    values(oid,'refund',refund,'mm_refund_'||oid); end if;
  perform private.queue_payout(oid,payout);
  if refund=0 then update public.orders set status='approved',updated_at=now() where id=oid; end if;
  insert into public.admin_audit_log(actor_id,action,target_type,target_id,details) values(p_admin_uid,'dispute_resolved','dispute',d.id,
    jsonb_build_object('principal_refund_kobo',p_principal_refund_kobo,'buyer_refund_kobo',refund,'seller_release_kobo',payout,'notes',p_notes));
  return jsonb_build_object('buyer_refund_kobo',refund,'seller_release_kobo',payout);
end $$;

create function public.process_escrow_deadlines() returns jsonb language plpgsql security invoker set search_path='' as $$
declare o public.orders%rowtype; d public.deliveries%rowtype; f public.order_fee_snapshots%rowtype; accepted integer:=0; refunds integer:=0;
begin
  for o in select ord.* from public.orders ord join public.order_fee_snapshots snap on snap.order_id=ord.id
    where exists(select 1 from public.deliveries due where due.order_id=ord.id and
      ((ord.status='delivered' and due.dispute_window_closes_at<=now()) or
       (ord.status='in_escrow' and due.status in ('pending_upload','needs_seller_edit') and due.seller_due_at<=now())))
    order by ord.created_at limit 100 for update of ord skip locked loop
    select * into d from public.deliveries where order_id=o.id;
    select * into f from public.order_fee_snapshots where order_id=o.id;
    if o.status='delivered' and d.dispute_window_closes_at<=now() then
      perform public.accept_order_delivery(o.id,o.buyer_id); accepted:=accepted+1;
    elsif o.status='in_escrow' and d.status in ('pending_upload','needs_seller_edit') and d.seller_due_at<=now() then
      update public.deliveries set status='expired',access_revoked_at=now(),updated_at=now() where id=d.id;
      insert into public.escrow_operations(order_id,kind,amount_kobo,reference)
        values(o.id,'refund',f.buyer_total_kobo,'mm_refund_'||o.id) on conflict(order_id,kind) do nothing;
      insert into public.escrow_ledger(order_id,event_key,kind,amount_kobo) values(o.id,'seller_timeout:'||o.id,'seller_submission_timeout',0) on conflict(event_key) do nothing;
      refunds:=refunds+1;
    end if;
  end loop;
  return jsonb_build_object('accepted',accepted,'refunds_queued',refunds);
end $$;

create function public.claim_escrow_operation() returns setof public.escrow_operations
language plpgsql security invoker set search_path='' as $$
declare job public.escrow_operations%rowtype;
begin
  -- A crashed refund POST is never retried blindly (provider has no guaranteed
  -- refund idempotency key). An operator must reconcile an uncertain outcome.
  update public.escrow_operations set status='uncertain',last_error='Worker lease expired; reconcile provider',updated_at=now()
    where status='processing' and lease_until<now();
  select * into job from public.escrow_operations e where e.status='pending'
    and (e.kind='refund' or (exists(select 1 from public.orders o join public.seller_payout_accounts a on a.seller_id=o.seller_id where o.id=e.order_id) and not exists(select 1 from public.escrow_operations r where r.order_id=e.order_id and r.kind='refund' and r.status<>'succeeded')))
    order by e.created_at limit 1 for update skip locked;
  if not found then return; end if;
  update public.escrow_operations set status='processing',attempts=attempts+1,lease_until=now()+interval '5 minutes',updated_at=now(),
    recipient_code=coalesce(recipient_code,(select a.recipient_code from public.orders o join public.seller_payout_accounts a on a.seller_id=o.seller_id where o.id=job.order_id))
    where id=job.id returning * into job;
  return next job;
end $$;

create function public.finish_escrow_operation(p_id uuid,p_status text,p_provider_id text,p_error text)
returns void language plpgsql security invoker set search_path='' as $$
declare job public.escrow_operations%rowtype; f public.order_fee_snapshots%rowtype; o public.orders%rowtype; oid uuid;
begin
  select order_id into oid from public.escrow_operations where id=p_id;
  select * into o from public.orders where id=oid for update;
  select * into job from public.escrow_operations where id=p_id for update;
  if not found then raise exception 'Operation not found'; end if;
  if job.status='succeeded' then return; end if;
  if job.status not in ('processing','submitted','uncertain') or p_status not in ('submitted','succeeded','failed','uncertain') then raise exception 'Invalid operation transition'; end if;
  if p_status in ('submitted','succeeded') and length(coalesce(p_provider_id,''))=0 then raise exception 'Provider confirmation required'; end if;
  update public.escrow_operations set status=p_status,provider_id=coalesce(p_provider_id,provider_id),last_error=left(p_error,500),updated_at=now() where id=p_id;
  if p_status='succeeded' then
    insert into public.escrow_ledger(order_id,event_key,kind,amount_kobo,provider_reference)
      values(job.order_id,job.kind||':'||job.id,job.kind||'_confirmed',job.amount_kobo,p_provider_id) on conflict(event_key) do nothing;
    select * into f from public.order_fee_snapshots where order_id=job.order_id;
    if job.kind='payout' then
      update public.payments set escrow_status='released',payout_status='paid',updated_at=now() where order_id=job.order_id;
      update public.orders set status='approved',updated_at=now() where id=job.order_id;
    elsif job.amount_kobo=f.buyer_total_kobo then
      update public.deliveries set access_revoked_at=coalesce(access_revoked_at,now()) where order_id=job.order_id;
      update public.payments set escrow_status='refunded',updated_at=now() where order_id=job.order_id;
      update public.orders set status='refunded',updated_at=now() where id=job.order_id;
      -- No automatic relisting: downloaded code cannot be remotely erased.
      -- The admin must assess licensing/repo leakage before resale.
    end if;
  end if;
end $$;

-- Admin review signals: these views remain server-only.
create view public.seller_review_signals with (security_invoker=true) as
select o.seller_id,count(*) filter(where d.upheld and d.resolved_at>now()-interval '90 days')::integer upheld_disputes_90d
from public.orders o join public.disputes d on d.order_id=o.id group by o.seller_id;
revoke all on public.seller_review_signals from public,anon,authenticated;
grant select on public.seller_review_signals to service_role;


-- Admin decisions and their evidence commit atomically.
create function public.admin_escrow_setting(p_admin_uid uuid,p_action text,p_id uuid,p_value text,p_notes text)
returns void language plpgsql security invoker set search_path='' as $$
begin
  if not exists(select 1 from public.profiles where id=p_admin_uid and role='admin') then raise exception 'Admin required' using errcode='42501'; end if;
  if p_action in ('seller','listing') and length(trim(coalesce(p_notes,''))) not between 5 and 2000 then raise exception 'Review evidence required'; end if;
  if p_action='seller' and p_value in ('approved','rejected') then
    update public.seller_profiles set verification_status=p_value::public.verification_status where id=p_id;
  elsif p_action='listing' and p_value in ('approved','changes_requested') then
    if p_value='approved' and exists(select 1 from public.gigs where id=p_id and repo_url is not null and preview_commit_sha is null) then raise exception 'Pin the preview commit first'; end if;
    update public.gigs set listing_review_status=p_value,listing_review_notes=p_notes,
      status=case when p_value='approved' then 'active' else 'draft' end where id=p_id and not is_sold;
  elsif p_action='recipient' and p_value ~ '^RCP_[a-zA-Z0-9]+$' then
    insert into public.seller_payout_accounts(seller_id,recipient_code,verified_by) values(p_id,p_value,p_admin_uid)
      on conflict(seller_id) do update set recipient_code=excluded.recipient_code,verified_by=excluded.verified_by,verified_at=now();
  elsif p_action='email' and p_value ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+[.][A-Za-z]{2,}$' and length(p_value)<=254 then
    insert into public.platform_settings(key,value) values('admin_notification_email',p_value)
      on conflict(key) do update set value=excluded.value;
  else raise exception 'Invalid admin decision'; end if;
  if not found then raise exception 'Target unavailable'; end if;
  insert into public.admin_audit_log(actor_id,action,target_type,target_id,details)
    values(p_admin_uid,'escrow_'||p_action||'_updated',p_action,coalesce(p_id,p_admin_uid),jsonb_build_object('value',p_value,'notes',p_notes));
end $$;
revoke all on function public.admin_escrow_setting(uuid,text,uuid,text,text) from public,anon,authenticated;
grant execute on function public.admin_escrow_setting(uuid,text,uuid,text,text) to service_role;

-- Narrow privileged lookup: auth.sessions is outside the exposed schema.
create function public.admin_session_active(p_uid uuid,p_session_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from auth.sessions s join public.profiles p on p.id=s.user_id
    where s.id=p_session_id and s.user_id=p_uid and p.role='admin'
      and (s.not_after is null or s.not_after>now()));
$$;
revoke all on function public.admin_session_active(uuid,uuid) from public,anon,authenticated;
grant execute on function public.admin_session_active(uuid,uuid) to service_role;

-- Preserve the live email column and avoid using editable metadata for roles.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  insert into public.users(id,email,full_name,phone,state) values(new.id,new.email,
    left(coalesce(new.raw_user_meta_data->>'full_name',new.email),200),
    left(new.raw_user_meta_data->>'phone',50),left(new.raw_user_meta_data->>'state',100))
    on conflict(id) do nothing;
  return new;
end $$;
revoke all on function public.handle_new_user() from public,anon,authenticated;

alter table public.gigs add constraint repo_url_github_only check(repo_url is null or repo_url ~ '^https://github[.]com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$');
-- Browser sellers may submit provenance, never approval or sold state.
grant insert(repo_url,preview_commit_sha),update(repo_url,preview_commit_sha) on public.gigs to authenticated;

-- Old bypasses must not advance a validated lifecycle.
revoke all on function public.submit_order_delivery(uuid,uuid,text),public.raise_order_dispute(uuid,uuid,text)
  from public,anon,authenticated,service_role;
revoke all on function public.record_paystack_payment_legacy(text,bigint,text) from public,anon,authenticated;
do $$ declare fn record; begin
  for fn in select p.oid::regprocedure sig from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in ('create_escrow_order','record_paystack_payment','submit_checked_order_delivery',
      'review_order_delivery','accept_order_delivery','open_escrow_dispute','respond_escrow_dispute','resolve_escrow_dispute',
      'process_escrow_deadlines','claim_escrow_operation','finish_escrow_operation') loop
    execute format('revoke all on function %s from public,anon,authenticated',fn.sig);
    execute format('grant execute on function %s to service_role',fn.sig);
  end loop;
end $$;
revoke all on function private.queue_payout(uuid,bigint) from public,anon,authenticated;
grant usage on schema private to service_role;
grant execute on function private.queue_payout(uuid,bigint) to service_role;
commit;
