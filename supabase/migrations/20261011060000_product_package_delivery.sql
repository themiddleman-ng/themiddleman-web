begin;

alter table public.product_versions
  add column if not exists access_status text not null default 'available'
    check (access_status in ('available', 'revoked'));

alter table public.notifications
  add column if not exists action_required boolean not null default false;

create unique index if not exists product_versions_one_pending_per_gig
  on public.product_versions (gig_id) where review_status = 'awaiting_review';

create table if not exists public.product_downloads (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_version_id uuid not null references public.product_versions(id) on delete restrict,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  package_sha256 text not null check (package_sha256 ~ '^[a-f0-9]{64}$'),
  downloaded_at timestamptz not null default now()
);

create index if not exists product_downloads_order_idx
  on public.product_downloads (order_id, downloaded_at desc);
create index if not exists product_downloads_version_idx
  on public.product_downloads (product_version_id, downloaded_at desc);

alter table public.product_downloads enable row level security;
revoke all on public.product_downloads from anon, authenticated;
grant select, insert on public.product_downloads to service_role;

-- Product bytes and identity cannot be replaced after an upload. Status changes
-- remain available to the trusted review and takedown paths.
create or replace function public.prevent_product_version_identity_change()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if row(
    new.id, new.gig_id, new.seller_profile_id, new.version_number,
    new.storage_path, new.original_filename, new.content_type, new.file_size,
    new.sha256, new.uploaded_by, new.uploaded_at
  ) is distinct from row(
    old.id, old.gig_id, old.seller_profile_id, old.version_number,
    old.storage_path, old.original_filename, old.content_type, old.file_size,
    old.sha256, old.uploaded_by, old.uploaded_at
  ) then
    raise exception 'Product version identity and package metadata are immutable';
  end if;

  if old.review_status <> 'awaiting_review'
    and new.review_status is distinct from old.review_status then
    raise exception 'Reviewed product versions cannot be resubmitted in place';
  end if;

  if old.access_status = 'revoked' and new.access_status <> 'revoked' then
    raise exception 'Product access revocation cannot be reversed in place';
  end if;

  if old.security_status in ('failed', 'needs_manual_review')
    and new.security_status = 'structural_pass' then
    raise exception 'A failed security status cannot be cleared in place';
  end if;

  return new;
end
$function$;

drop trigger if exists product_version_identity_immutable on public.product_versions;
create trigger product_version_identity_immutable
  before update on public.product_versions
  for each row execute function public.prevent_product_version_identity_change();

-- Sellers cannot publish a product or move the current-version pointer around the
-- review workflow. Only the review RPC sets this transaction-local marker.
create or replace function public.prevent_unreviewed_gig_activation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if tg_op = 'INSERT' then
    if new.current_product_version_id is not null then
      raise exception 'Only the product review workflow can set the current version';
    end if;
  elsif new.current_product_version_id is distinct from old.current_product_version_id
    and current_setting('middleman.product_version_review', true)
      is distinct from new.current_product_version_id::text then
    raise exception 'Only the product review workflow can change the current version';
  end if;

  if tg_op = 'INSERT' and new.status = 'active' then
    if new.current_product_version_id is null or not exists (
      select 1 from public.product_versions version
      where version.id = new.current_product_version_id
        and version.gig_id = new.id
        and version.is_current
        and version.review_status = 'approved'
        and version.security_status = 'structural_pass'
        and version.access_status = 'available'
    ) then
      raise exception 'A product needs an approved available package before publication';
    end if;
  elsif tg_op = 'UPDATE' and new.status = 'active'
    and old.status is distinct from new.status then
    if new.current_product_version_id is null or not exists (
      select 1 from public.product_versions version
      where version.id = new.current_product_version_id
        and version.gig_id = new.id
        and version.is_current
        and version.review_status = 'approved'
        and version.security_status = 'structural_pass'
        and version.access_status = 'available'
    ) then
      raise exception 'A product needs an approved available package before publication';
    end if;
  end if;

  return new;
end
$function$;

drop trigger if exists gigs_require_approved_product_version on public.gigs;
create trigger gigs_require_approved_product_version
  before insert or update of status, current_product_version_id on public.gigs
  for each row execute function public.prevent_unreviewed_gig_activation();

-- Preserve pre-package listings during migration. New products that have an
-- approved current version snapshot it at order creation; legacy listings with
-- no version continue through the existing order-specific delivery workflow.
create or replace function public.capture_order_product_version()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  configured_version uuid;
  current_version uuid;
begin
  if new.product_version_id is null then
    select gig.current_product_version_id
      into configured_version
    from public.gigs gig
    where gig.id = new.gig_id
      and gig.seller_id = new.seller_id
      and gig.status = 'active'
    for share of gig;

    if not found then
      raise exception 'Product is not currently available for purchase';
    end if;

    if configured_version is null then
      return new;
    end if;

    select version.id
      into current_version
    from public.product_versions version
    where version.id = configured_version
      and version.gig_id = new.gig_id
      and version.seller_profile_id = new.seller_id
      and version.review_status = 'approved'
      and version.security_status = 'structural_pass'
      and version.access_status = 'available'
      and version.is_current
    for share;

    if current_version is null then
      raise exception 'This product does not have an available approved package';
    end if;
    new.product_version_id := current_version;
  end if;

  if not exists (
    select 1
    from public.product_versions version
    join public.gigs gig on gig.id = version.gig_id
    where version.id = new.product_version_id
      and version.gig_id = new.gig_id
      and version.seller_profile_id = new.seller_id
      and version.review_status = 'approved'
      and version.security_status = 'structural_pass'
      and version.access_status = 'available'
      and version.is_current
      and gig.current_product_version_id = version.id
      and gig.status = 'active'
  ) then
    raise exception 'Order must snapshot the current approved product version';
  end if;

  return new;
end
$function$;

-- Durable in-app notices are created from the canonical paid-order transition.
create or replace function public.notify_order_paid()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  product_title text;
  seller_user uuid;
  buyer_title text;
  buyer_body text;
  seller_body text;
begin
  if new.status <> 'in_escrow' or old.status is not distinct from new.status then
    return new;
  end if;

  select gig.title, seller.user_id
    into product_title, seller_user
  from public.gigs gig
  join public.seller_profiles seller on seller.id = new.seller_id
  where gig.id = new.gig_id;

  product_title := coalesce(product_title, 'your product');
  if new.product_version_id is not null then
    buyer_title := 'Your product is ready';
    buyer_body := '"' || product_title || '" is ready to download from My Orders.';
    seller_body := '"' || product_title || '" was purchased. The buyer can download the approved product package automatically.';
  else
    buyer_title := 'Payment received';
    buyer_body := 'Your order for "' || product_title || '" is now active.';
    seller_body := '"' || product_title || '" was purchased. Review the order and submit the agreed custom delivery.';
  end if;

  insert into public.marketplace_events (
    event_type, actor_id, gig_id, product_version_id, order_id,
    idempotency_key, properties
  ) values (
    'order.paid', null, new.gig_id, new.product_version_id, new.id,
    'order-paid:' || new.id::text,
    jsonb_build_object('currency', 'NGN', 'amount_ngn', new.amount)
  ) on conflict (idempotency_key) do nothing;

  insert into public.notifications (
    recipient_user_id, source, notification_type, title, body, href,
    event_key, action_required
  ) values (
    new.buyer_id, 'order', 'order_paid_buyer', buyer_title, buyer_body,
    '/orders', 'order-paid-buyer:' || new.id::text, false
  ) on conflict (event_key) do nothing;

  if seller_user is not null then
    insert into public.notifications (
      recipient_user_id, source, notification_type, title, body, href,
      event_key, action_required
    ) values (
      seller_user, 'order', 'order_paid_seller', 'You made a sale', seller_body,
      '/orders', 'order-paid-seller:' || new.id::text,
      new.product_version_id is null
    ) on conflict (event_key) do nothing;
  end if;

  return new;
end
$function$;

drop trigger if exists orders_notify_paid on public.orders;
create trigger orders_notify_paid
  after update of status on public.orders
  for each row execute function public.notify_order_paid();

create or replace function public.notifications_set_action_required()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if new.notification_type in (
    'listing_changes_requested', 'listing_rejected',
    'package_validation_failed', 'admin_message', 'dispute_opened'
  ) then
    new.action_required := true;
  end if;
  return new;
end
$function$;

drop trigger if exists notifications_action_required on public.notifications;
create trigger notifications_action_required
  before insert on public.notifications
  for each row execute function public.notifications_set_action_required();

commit;
