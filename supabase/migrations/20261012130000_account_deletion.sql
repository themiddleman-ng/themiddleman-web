begin;

alter table public.users
  add column if not exists account_deleted_at timestamptz;

create or replace function private.protect_account_deletion_marker()
returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.account_deleted_at is distinct from old.account_deleted_at
    and current_user not in ('service_role', 'postgres', 'supabase_admin') then
    raise exception 'Account deletion is server controlled' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function private.protect_account_deletion_marker() from public, anon, authenticated;
drop trigger if exists users_protect_account_deletion_marker on public.users;
create trigger users_protect_account_deletion_marker
  before update of account_deleted_at on public.users
  for each row execute function private.protect_account_deletion_marker();

create or replace function private.account_is_active(p_user_id uuid)
returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.users u
    where u.id = p_user_id and u.account_deleted_at is null
  );
$$;
revoke all on function private.account_is_active(uuid) from public, anon;
grant execute on function private.account_is_active(uuid) to authenticated, service_role;

-- Lock the buyer/seller account row as well as the product and order rows so
-- checkout cannot race a deletion request and create a new transaction.
create or replace function private.prevent_orders_for_deleted_accounts()
returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  buyer_deleted_at timestamptz;
  seller_deleted_at timestamptz;
begin
  select u.account_deleted_at into buyer_deleted_at
  from public.users u where u.id = new.buyer_id for share;
  if not found or buyer_deleted_at is not null then
    raise exception 'Buyer account is unavailable' using errcode = '42501';
  end if;

  select u.account_deleted_at into seller_deleted_at
  from public.seller_profiles s
  join public.users u on u.id = s.user_id
  where s.id = new.seller_id
  for share of u;
  if not found or seller_deleted_at is not null then
    raise exception 'Seller account is unavailable' using errcode = '42501';
  end if;

  return new;
end;
$$;
revoke all on function private.prevent_orders_for_deleted_accounts() from public, anon, authenticated;
drop trigger if exists orders_require_active_accounts on public.orders;
create trigger orders_require_active_accounts
  before insert or update of buyer_id, seller_id on public.orders
  for each row execute function private.prevent_orders_for_deleted_accounts();

-- A deleted account cannot use a still-live access token to read its profile,
-- buyer orders, deliveries or payment details while that token expires.
drop policy if exists "users manage their own row" on public.users;
create policy "active users manage their own row" on public.users for all to authenticated
  using ((select auth.uid()) = id and private.account_is_active(id))
  with check ((select auth.uid()) = id and private.account_is_active(id));

drop policy if exists "buyers view their own orders" on public.orders;
create policy "active buyers view their own orders" on public.orders for select to authenticated
  using ((select auth.uid()) = buyer_id and private.account_is_active((select auth.uid())));

drop policy if exists "buyers view their own deliveries" on public.deliveries;
create policy "active buyers view their own deliveries" on public.deliveries for select to authenticated
  using ((select auth.uid()) = buyer_id and private.account_is_active((select auth.uid())));

drop policy if exists "buyer reads own reviews" on public.reviews;
create policy "active buyers read own reviews" on public.reviews for select to authenticated
  using ((select auth.uid()) = reviewer_id and private.account_is_active((select auth.uid())));

drop policy if exists "buyers and sellers view own payments" on public.payments;
create policy "active buyers and sellers view own payments" on public.payments for select to authenticated
  using (private.account_is_active((select auth.uid())) and (
    exists (select 1 from public.orders o where o.id = order_id and o.buyer_id = (select auth.uid()))
    or private.owns_payment_as_seller(order_id)
  ));

-- A Supabase access token can remain valid until its normal expiry after Auth
-- soft deletion. Also stop that token from changing seller profiles/listings,
-- reading private package metadata, or uploading identity documents.
drop policy if exists "sellers manage their own profile" on public.seller_profiles;
create policy "active sellers create their own profile" on public.seller_profiles
  for insert to authenticated with check (
    (select auth.uid()) = user_id and private.account_is_active((select auth.uid()))
  );
drop policy if exists "sellers update their own profile" on public.seller_profiles;
create policy "active sellers update their own profile" on public.seller_profiles
  for update to authenticated
  using ((select auth.uid()) = user_id and private.account_is_active((select auth.uid())))
  with check ((select auth.uid()) = user_id and private.account_is_active((select auth.uid())));

create policy "active accounts manage listings" on public.gigs as restrictive
  for all to authenticated
  using (private.account_is_active((select auth.uid())))
  with check (private.account_is_active((select auth.uid())));

create policy "active accounts read product version metadata" on public.product_versions as restrictive
  for select to authenticated
  using (private.account_is_active((select auth.uid())));

create policy "active accounts use identity document storage" on storage.objects as restrictive
  for all to authenticated
  using (bucket_id <> 'verification-docs' or private.account_is_active((select auth.uid())))
  with check (bucket_id <> 'verification-docs' or private.account_is_active((select auth.uid())));

create or replace function public.prepare_account_deletion(p_user_id uuid)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  seller_profile_id uuid;
begin
  if p_user_id is null then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  perform 1 from public.users u where u.id = p_user_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if exists (select 1 from public.users u where u.id = p_user_id and u.account_deleted_at is not null) then
    return jsonb_build_object('ok', true, 'alreadyPrepared', true);
  end if;

  select s.id into seller_profile_id
  from public.seller_profiles s where s.user_id = p_user_id for update;

  if seller_profile_id is not null then
    perform 1 from public.gigs g where g.seller_id = seller_profile_id for update;
  end if;

  perform 1 from public.orders o
  where o.buyer_id = p_user_id or o.seller_id = seller_profile_id
  for update;

  if exists (
    select 1 from public.orders o
    where (o.buyer_id = p_user_id or o.seller_id = seller_profile_id)
      and o.status::text not in ('approved', 'refunded', 'cancelled', 'failed', 'closed')
  ) then
    return jsonb_build_object('ok', false, 'reason', 'active_orders');
  end if;

  if exists (
    select 1 from public.disputes d
    join public.orders o on o.id = d.order_id
    where (o.buyer_id = p_user_id or o.seller_id = seller_profile_id)
      and d.status::text in ('open', 'under_review')
  ) then
    return jsonb_build_object('ok', false, 'reason', 'active_disputes');
  end if;

  if exists (
    select 1 from public.operational_threads t
    where t.seller_user_id = p_user_id and t.status = 'open'
  ) then
    return jsonb_build_object('ok', false, 'reason', 'open_support_case');
  end if;

  -- Keep product/order references for transaction history and previous buyers,
  -- but take the former creator's listings out of the active marketplace.
  if seller_profile_id is not null then
    update public.gigs set status = 'archived', repo_url = null, preview_commit_sha = null
    where seller_id = seller_profile_id and status in ('active', 'published');

    update public.seller_profiles set
      display_name = 'Deleted creator',
      bio = '',
      skills = '{}',
      portfolio_links = '{}',
      linkedin_url = null,
      years_experience = null,
      gig_categories = '{}',
      id_document_type = null,
      id_document_url = null,
      verification_status = 'draft'
    where id = seller_profile_id;

    delete from public.seller_payout_accounts where seller_id = seller_profile_id;
  end if;

  update public.users set
    full_name = 'Deleted account',
    email = 'deleted+' || replace(p_user_id::text, '-', '') || '@account.invalid',
    phone = null,
    state = null,
    is_buyer = false,
    is_seller = false,
    account_deleted_at = now()
  where id = p_user_id;

  update public.reviews set comment = null where reviewer_id = p_user_id;
  update public.marketplace_events set actor_id = null where actor_id = p_user_id;
  delete from public.notifications where recipient_user_id = p_user_id;
  delete from public.transactional_email_outbox where recipient_user_id = p_user_id;
  delete from public.product_downloads where buyer_id = p_user_id;
  delete from public.conversations where buyer_id = p_user_id or seller_id = p_user_id;
  delete from public.operational_threads where seller_user_id = p_user_id;
  delete from public.user_onboarding_preferences where user_id = p_user_id;
  delete from private.seller_payout_verification_attempts where user_id = p_user_id;

  return jsonb_build_object('ok', true, 'alreadyPrepared', false);
end;
$$;
revoke all on function public.prepare_account_deletion(uuid) from public, anon, authenticated;
grant execute on function public.prepare_account_deletion(uuid) to service_role;

commit;
