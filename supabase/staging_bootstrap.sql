-- Empty staging bootstrap derived from the live schema on 2026-10-02.

-- SCHEMA AND BUCKET CONFIG ONLY. Contains no users, orders, files or payment data.

-- Apply only to a new empty Supabase project. Production uses its existing migrations.

begin;

set local search_path=public,extensions;

create schema if not exists private;

grant usage on schema private to authenticated,service_role;

create type public."delivery_status" as enum ('pending_upload','pending_review','needs_seller_edit','ready','delivered','expired');

create type public."dispute_status" as enum ('open','under_review','resolved_buyer','resolved_seller','closed');

create type public."gig_category" as enum ('development','design','marketing','writing','ai_assisted');

create type public."order_status" as enum ('pending_payment','in_escrow','delivered','approved','disputed','refunded');

create type public."payment_status" as enum ('initiated','successful','failed','refunded');

create type public."transaction_status" as enum ('pending','paid','released','refunded','failed');

create type public."user_role" as enum ('buyer','seller','admin');

create type public."verification_status" as enum ('draft','pending','approved','rejected');

create table public."early_access" (
  "id" uuid default gen_random_uuid() not null,
  "full_name" text not null,
  "email" text not null,
  "phone" text,
  "created_at" timestamp with time zone default timezone('utc'::text, now()),
  "role" text default 'Buyer'::text
);

create table public."team_applications" (
  "id" uuid default gen_random_uuid() not null,
  "full_name" text not null,
  "email" text not null,
  "role" text not null,
  "message" text,
  "portfolio_url" text,
  "created_at" timestamp with time zone default timezone('utc'::text, now())
);

create table public."profiles" (
  "id" uuid not null,
  "role" user_role default 'buyer'::user_role not null,
  "display_name" text,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);

create table public."payments" (
  "id" uuid default gen_random_uuid() not null,
  "order_id" uuid not null,
  "paystack_reference" text not null,
  "amount" numeric(12,2) not null,
  "platform_fee" numeric(12,2) default 0 not null,
  "escrow_status" text default 'held'::text not null,
  "payout_status" text default 'pending'::text not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);

create table public."orders" (
  "id" uuid default gen_random_uuid() not null,
  "gig_id" uuid not null,
  "buyer_id" uuid not null,
  "seller_id" uuid not null,
  "amount" numeric(12,2) not null,
  "status" order_status default 'pending_payment'::order_status not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "idempotency_key" uuid not null
);

create table public."reviews" (
  "id" uuid default gen_random_uuid() not null,
  "order_id" uuid not null,
  "reviewer_id" uuid not null,
  "rating" integer not null,
  "comment" text,
  "created_at" timestamp with time zone default now() not null
);

create table public."conversations" (
  "id" uuid default gen_random_uuid() not null,
  "buyer_id" uuid not null,
  "seller_id" uuid not null,
  "gig_id" uuid,
  "created_at" timestamp with time zone default now() not null,
  "buyer_last_read_at" timestamp with time zone,
  "seller_last_read_at" timestamp with time zone
);

create table public."messages" (
  "id" uuid default gen_random_uuid() not null,
  "conversation_id" uuid not null,
  "sender_id" uuid not null,
  "body" text not null,
  "created_at" timestamp with time zone default now() not null
);

create table public."disputes" (
  "id" uuid default gen_random_uuid() not null,
  "order_id" uuid not null,
  "raised_by" uuid not null,
  "reason" text not null,
  "status" text default 'open'::text not null,
  "resolution_notes" text,
  "created_at" timestamp with time zone default now() not null,
  "resolved_at" timestamp with time zone
);

create table public."seller_profiles" (
  "id" uuid default gen_random_uuid() not null,
  "user_id" uuid not null,
  "bio" text,
  "skills" text[] default '{}'::text[],
  "portfolio_links" text[] default '{}'::text[],
  "id_document_url" text,
  "verification_status" text default 'pending'::text not null,
  "rating_avg" numeric(3,2) default 0,
  "total_orders_completed" integer default 0,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "display_name" text not null,
  "gig_categories" text[] default '{}'::text[] not null,
  "linkedin_url" text,
  "years_experience" text,
  "id_document_type" text
);

create table public."site_visits" (
  "id" uuid default gen_random_uuid() not null,
  "page" text default '/'::text not null,
  "referrer" text,
  "user_agent" text,
  "country" text,
  "visited_at" timestamp with time zone default timezone('utc'::text, now())
);

create table public."users" (
  "id" uuid not null,
  "full_name" text,
  "email" text not null,
  "phone" text,
  "is_buyer" boolean default true not null,
  "is_seller" boolean default false not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "state" text
);

create table public."gigs" (
  "id" uuid default gen_random_uuid() not null,
  "seller_id" uuid not null,
  "title" text not null,
  "description" text not null,
  "category" gig_category not null,
  "price_ngn" integer not null,
  "delivery_days" integer default 7 not null,
  "experience_tier" text default 'beginner'::text not null,
  "is_ai_assisted" boolean default false,
  "status" text default 'active'::text not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "is_exclusive" boolean default false not null,
  "is_sold" boolean default false not null,
  "gallery_image_paths" text[] default '{}'::text[] not null,
  "demo_video_path" text,
  "demo_links" text[] default '{}'::text[] not null
);

create table public."admin_audit_log" (
  "id" uuid default gen_random_uuid() not null,
  "actor_id" uuid not null,
  "action" text not null,
  "target_type" text not null,
  "target_id" uuid not null,
  "details" jsonb default '{}'::jsonb not null,
  "created_at" timestamp with time zone default now() not null
);

create table public."gig_reports" (
  "id" uuid default gen_random_uuid() not null,
  "gig_id" uuid not null,
  "reported_by" uuid not null,
  "reason" text not null,
  "details" text,
  "status" text default 'open'::text not null,
  "created_at" timestamp with time zone default now() not null,
  "reviewed_at" timestamp with time zone,
  "review_notes" text
);

create table public."email_notifications" (
  "id" uuid default gen_random_uuid() not null,
  "order_id" uuid not null,
  "event" text not null,
  "recipient_role" text not null,
  "recipient_email" text not null,
  "status" text default 'pending'::text not null,
  "provider_message_id" text,
  "attempts" integer default 0 not null,
  "last_error" text,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "sent_at" timestamp with time zone
);

create table public."platform_settings" (
  "key" text not null,
  "value" text not null,
  "updated_at" timestamp with time zone default now() not null
);

create table public."deliveries" (
  "id" uuid default gen_random_uuid() not null,
  "gig_id" uuid not null,
  "buyer_id" uuid not null,
  "seller_id" uuid not null,
  "transaction_id" uuid,
  "status" delivery_status default 'pending_upload'::delivery_status not null,
  "storage_path" text,
  "signed_url" text,
  "signed_url_expires_at" timestamp with time zone,
  "admin_reviewer_id" uuid,
  "review_notes" text,
  "reviewed_at" timestamp with time zone,
  "delivered_at" timestamp with time zone,
  "dispute_window_closes_at" timestamp with time zone,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "order_id" uuid not null
);

create table public."transactions" (
  "id" uuid default gen_random_uuid() not null,
  "gig_id" uuid not null,
  "buyer_id" uuid not null,
  "seller_id" uuid not null,
  "provider" text not null,
  "provider_reference" text,
  "listed_price_kobo" bigint not null,
  "final_price_kobo" bigint not null,
  "commission_rate" numeric(5,4) default 0.10 not null,
  "commission_kobo" bigint not null,
  "flat_fee_kobo" bigint default 150000 not null,
  "vat_rate" numeric(5,4) default 0.075 not null,
  "vat_kobo" bigint not null,
  "seller_payout_kobo" bigint not null,
  "status" transaction_status default 'pending'::transaction_status not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "paid_at" timestamp with time zone,
  "released_at" timestamp with time zone
);

alter table early_access add constraint "early_access_pkey" PRIMARY KEY (id);

alter table early_access add constraint "early_access_email_key" UNIQUE (email);

alter table team_applications add constraint "team_applications_pkey" PRIMARY KEY (id);

alter table site_visits add constraint "site_visits_pkey" PRIMARY KEY (id);

alter table users add constraint "users_pkey" PRIMARY KEY (id);

alter table users add constraint "users_email_key" UNIQUE (email);

alter table seller_profiles add constraint "seller_profiles_verification_status_check" CHECK ((verification_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])));

alter table seller_profiles add constraint "seller_profiles_pkey" PRIMARY KEY (id);

alter table seller_profiles add constraint "seller_profiles_user_id_key" UNIQUE (user_id);

alter table gigs add constraint "gigs_experience_tier_check" CHECK ((experience_tier = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'expert'::text])));

alter table gigs add constraint "gigs_pkey" PRIMARY KEY (id);

alter table orders add constraint "orders_pkey" PRIMARY KEY (id);

alter table payments add constraint "payments_escrow_status_check" CHECK ((escrow_status = ANY (ARRAY['held'::text, 'released'::text, 'refunded'::text])));

alter table payments add constraint "payments_payout_status_check" CHECK ((payout_status = ANY (ARRAY['pending'::text, 'paid'::text, 'failed'::text])));

alter table payments add constraint "payments_pkey" PRIMARY KEY (id);

alter table payments add constraint "payments_paystack_reference_key" UNIQUE (paystack_reference);

alter table reviews add constraint "reviews_rating_check" CHECK (((rating >= 1) AND (rating <= 5)));

alter table reviews add constraint "reviews_pkey" PRIMARY KEY (id);

alter table reviews add constraint "reviews_order_id_key" UNIQUE (order_id);

alter table disputes add constraint "disputes_status_check" CHECK ((status = ANY (ARRAY['open'::text, 'investigating'::text, 'resolved'::text])));

alter table disputes add constraint "disputes_pkey" PRIMARY KEY (id);

alter table conversations add constraint "conversations_pkey" PRIMARY KEY (id);

alter table conversations add constraint "conversations_buyer_id_seller_id_gig_id_key" UNIQUE (buyer_id, seller_id, gig_id);

alter table messages add constraint "messages_body_check" CHECK ((char_length(TRIM(BOTH FROM body)) > 0));

alter table messages add constraint "messages_no_contact_sharing" CHECK (((body !~* '(https?://|www\.)\S+'::text) AND (body !~* '\b[a-z0-9-]+\.(com|net|org|ng|io|co|me|link)\b'::text) AND (body !~* '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}'::text) AND (body !~* '(\+?\d[\d\s-]{7,}\d)'::text)));

alter table messages add constraint "messages_pkey" PRIMARY KEY (id);

alter table gigs add constraint "gigs_price_ngn_check" CHECK ((price_ngn > 0));

alter table gigs add constraint "gigs_status_check" CHECK ((status = ANY (ARRAY['pending_review'::text, 'active'::text, 'paused'::text, 'deleted'::text])));

alter table gig_reports add constraint "gig_reports_pkey" PRIMARY KEY (id);

alter table deliveries add constraint "deliveries_pkey" PRIMARY KEY (id);

alter table transactions add constraint "transactions_pkey" PRIMARY KEY (id);

alter table transactions add constraint "transactions_provider_reference_key" UNIQUE (provider_reference);

alter table profiles add constraint "profiles_pkey" PRIMARY KEY (id);

alter table orders add constraint "orders_buyer_id_idempotency_key_key" UNIQUE (buyer_id, idempotency_key);

alter table deliveries add constraint "deliveries_order_id_key" UNIQUE (order_id);

alter table admin_audit_log add constraint "admin_audit_log_pkey" PRIMARY KEY (id);

alter table gigs add constraint "gigs_gallery_count" CHECK ((cardinality(gallery_image_paths) <= 4));

alter table gigs add constraint "gigs_demo_links_count" CHECK ((cardinality(demo_links) <= 3));

alter table email_notifications add constraint "email_notifications_event_check" CHECK ((event = 'payment_settled'::text));

alter table email_notifications add constraint "email_notifications_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'sending'::text, 'sent'::text, 'failed'::text])));

alter table email_notifications add constraint "email_notifications_attempts_check" CHECK ((attempts >= 0));

alter table email_notifications add constraint "email_notifications_pkey" PRIMARY KEY (id);

alter table email_notifications add constraint "email_notifications_order_id_event_recipient_role_key" UNIQUE (order_id, event, recipient_role);

alter table email_notifications add constraint "email_notifications_recipient_role_check" CHECK ((recipient_role = ANY (ARRAY['buyer'::text, 'seller'::text, 'admin'::text])));

alter table platform_settings add constraint "platform_settings_pkey" PRIMARY KEY (key);

alter table users add constraint "users_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table seller_profiles add constraint "seller_profiles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

alter table reviews add constraint "reviews_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

alter table reviews add constraint "reviews_reviewer_id_fkey" FOREIGN KEY (reviewer_id) REFERENCES users(id);

alter table gigs add constraint "gigs_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES seller_profiles(id) ON DELETE CASCADE;

alter table orders add constraint "orders_gig_id_fkey" FOREIGN KEY (gig_id) REFERENCES gigs(id);

alter table orders add constraint "orders_buyer_id_fkey" FOREIGN KEY (buyer_id) REFERENCES users(id);

alter table orders add constraint "orders_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES seller_profiles(id);

alter table payments add constraint "payments_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

alter table disputes add constraint "disputes_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

alter table disputes add constraint "disputes_raised_by_fkey" FOREIGN KEY (raised_by) REFERENCES users(id);

alter table conversations add constraint "conversations_buyer_id_fkey" FOREIGN KEY (buyer_id) REFERENCES users(id);

alter table conversations add constraint "conversations_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES seller_profiles(user_id);

alter table conversations add constraint "conversations_gig_id_fkey" FOREIGN KEY (gig_id) REFERENCES gigs(id);

alter table messages add constraint "messages_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

alter table messages add constraint "messages_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES users(id);

alter table admin_audit_log add constraint "admin_audit_log_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES auth.users(id);

alter table gig_reports add constraint "gig_reports_gig_id_fkey" FOREIGN KEY (gig_id) REFERENCES gigs(id) ON DELETE CASCADE;

alter table gig_reports add constraint "gig_reports_reported_by_fkey" FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE CASCADE;

alter table deliveries add constraint "deliveries_gig_id_fkey" FOREIGN KEY (gig_id) REFERENCES gigs(id) ON DELETE CASCADE;

alter table deliveries add constraint "deliveries_buyer_id_fkey" FOREIGN KEY (buyer_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table deliveries add constraint "deliveries_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table deliveries add constraint "deliveries_admin_reviewer_id_fkey" FOREIGN KEY (admin_reviewer_id) REFERENCES auth.users(id);

alter table transactions add constraint "transactions_gig_id_fkey" FOREIGN KEY (gig_id) REFERENCES gigs(id) ON DELETE RESTRICT;

alter table transactions add constraint "transactions_buyer_id_fkey" FOREIGN KEY (buyer_id) REFERENCES auth.users(id) ON DELETE RESTRICT;

alter table transactions add constraint "transactions_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE RESTRICT;

alter table deliveries add constraint "deliveries_transaction_id_fkey" FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL;

alter table profiles add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table deliveries add constraint "deliveries_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT;

alter table email_notifications add constraint "email_notifications_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.users (id, email, full_name, phone, state)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'state'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    state = EXCLUDED.state;
  RETURN new;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_dispute_window()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  if new.status = 'delivered' and old.status is distinct from 'delivered' then
    new.delivered_at = now();
    new.dispute_window_closes_at = now() + interval '24 hours';
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.claim_exclusive_gig(p_gig_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_claimed integer;
begin
  update public.gigs set is_sold = true
  where id = p_gig_id and is_exclusive = true and is_sold = false;
  get diagnostics v_claimed = row_count;
  return v_claimed > 0;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_transaction_timestamps()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  if new.status = 'paid' and old.status is distinct from 'paid' then
    new.paid_at = now();
  end if;

  if new.status = 'released' and old.status is distinct from 'released' then
    new.released_at = now();
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_gig_ratings()
 RETURNS TABLE(gig_id uuid, average_rating numeric, review_count bigint)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT o.gig_id, round(avg(r.rating)::numeric, 2), count(r.id)
  FROM public.reviews r
  JOIN public.orders o ON o.id = r.order_id
  GROUP BY o.gig_id;
$function$
;

CREATE OR REPLACE FUNCTION public.get_seller_ratings()
 RETURNS TABLE(seller_id uuid, average_rating numeric, review_count bigint)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT o.seller_id, round(avg(r.rating)::numeric, 2), count(r.id)
  FROM public.reviews r
  JOIN public.orders o ON o.id = r.order_id
  GROUP BY o.seller_id;
$function$
;

CREATE OR REPLACE FUNCTION public.mark_conversation_read(p_conversation_id uuid, p_role text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_role is null or p_role not in ('buyer', 'seller') then
    raise exception 'Invalid conversation role' using errcode = '22023';
  end if;
  if p_role = 'buyer' then
    update public.conversations set buyer_last_read_at = now()
    where id = p_conversation_id and buyer_id = auth.uid();
  else
    update public.conversations set seller_last_read_at = now()
    where id = p_conversation_id and seller_id = auth.uid();
  end if;
  if not found then
    raise exception 'Conversation unavailable' using errcode = '42501';
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin(p_uid uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1
    from public.profiles
    where id = p_uid
      and role = 'admin'::public.user_role
  );
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  insert into public.profiles (
    id,
    role,
    display_name
  )
  values (
    new.id,
    'buyer'::public.user_role,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.email
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_transaction_fees(p_final_price_kobo bigint, p_commission_rate numeric DEFAULT 0.10, p_flat_fee_kobo bigint DEFAULT 150000, p_vat_rate numeric DEFAULT 0.075)
 RETURNS TABLE(commission_kobo bigint, flat_fee_kobo bigint, vat_kobo bigint, seller_payout_kobo bigint)
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
declare
  v_commission bigint;
  v_vat bigint;
  v_payout bigint;
begin
  v_commission := round(p_final_price_kobo * p_commission_rate);
  v_vat := round((v_commission + p_flat_fee_kobo) * p_vat_rate);
  v_payout := p_final_price_kobo - v_commission - p_flat_fee_kobo - v_vat;

  return query select v_commission, p_flat_fee_kobo, v_vat, v_payout;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_unread_conversation_count(p_user_id uuid, p_role text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_count integer;
begin
  if auth.uid() is null or p_user_id is distinct from auth.uid() then
    raise exception 'Access denied' using errcode = '42501';
  end if;
  if p_role is null or p_role not in ('buyer', 'seller') then
    raise exception 'Invalid conversation role' using errcode = '22023';
  end if;
  select count(distinct c.id)::integer into v_count
  from public.conversations c join public.messages m on m.conversation_id = c.id
  where m.sender_id <> auth.uid()
    and (
      (p_role = 'buyer' and c.buyer_id = auth.uid()
       and (c.buyer_last_read_at is null or m.created_at > c.buyer_last_read_at))
      or
      (p_role = 'seller' and c.seller_id = auth.uid()
       and (c.seller_last_read_at is null or m.created_at > c.seller_last_read_at))
    );
  return coalesce(v_count, 0);
end;
$function$
;

CREATE OR REPLACE FUNCTION private.prevent_order_self_purchase()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION private.guard_order_payment_authority()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
end $function$
;

CREATE OR REPLACE FUNCTION public.record_paystack_payment(p_reference text, p_amount_kobo bigint, p_currency text)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
end $function$
;

CREATE OR REPLACE FUNCTION public.submit_order_delivery(p_order_id uuid, p_seller_uid uuid, p_storage_path text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
end $function$
;

CREATE OR REPLACE FUNCTION public.review_order_delivery(p_delivery_id uuid, p_admin_uid uuid, p_approve boolean, p_notes text)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
end $function$
;

CREATE OR REPLACE FUNCTION public.accept_order_delivery(p_order_id uuid, p_buyer_uid uuid)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
end $function$
;

CREATE OR REPLACE FUNCTION public.raise_order_dispute(p_order_id uuid, p_buyer_uid uuid, p_reason text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
end $function$
;

CREATE OR REPLACE FUNCTION private.owns_payment_as_seller(p_order_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists(select 1 from public.orders o
    join public.seller_profiles s on s.id = o.seller_id
    where o.id = p_order_id and s.user_id = (select auth.uid()));
$function$
;

CREATE OR REPLACE FUNCTION public.get_gig_reviews(p_gig_id uuid)
 RETURNS TABLE(rating smallint, comment text, created_at timestamp with time zone, reviewer_name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select r.rating::smallint, r.comment, r.created_at,
    'Verified buyer'::text from public.reviews r
  join public.orders o on o.id = r.order_id
  where o.gig_id = p_gig_id and o.status in ('approved','delivered')
  order by r.created_at desc limit 100;
$function$
;

create view public."seller_delivery_view" with (security_invoker=true) as  SELECT id,
    gig_id,
    seller_id,
    status,
    storage_path,
    review_notes,
    reviewed_at,
    delivered_at,
    dispute_window_closes_at,
    created_at,
    updated_at
   FROM deliveries
  WHERE seller_id = auth.uid();

create view public."seller_transaction_view" with (security_invoker=true) as  SELECT id,
    gig_id,
    seller_id,
    provider,
    final_price_kobo,
    commission_kobo,
    flat_fee_kobo,
    vat_kobo,
    seller_payout_kobo,
    status,
    created_at,
    paid_at,
    released_at
   FROM transactions
  WHERE seller_id = auth.uid();

CREATE INDEX idx_messages_conversation_created ON public.messages USING btree (conversation_id, created_at);

CREATE INDEX idx_messages_conversation_id ON public.messages USING btree (conversation_id, created_at);

CREATE INDEX idx_orders_status ON public.orders USING btree (status);

CREATE INDEX idx_orders_buyer ON public.orders USING btree (buyer_id);

CREATE INDEX idx_orders_seller ON public.orders USING btree (seller_id);

CREATE INDEX idx_payments_order ON public.payments USING btree (order_id);

CREATE INDEX idx_seller_profiles_status ON public.seller_profiles USING btree (verification_status);

CREATE INDEX idx_gigs_seller ON public.gigs USING btree (seller_id);

CREATE INDEX idx_gigs_tier ON public.gigs USING btree (experience_tier);

CREATE UNIQUE INDEX payments_one_per_order ON public.payments USING btree (order_id);

CREATE UNIQUE INDEX disputes_one_open_per_order ON public.disputes USING btree (order_id) WHERE (status = 'open'::text);

CREATE INDEX admin_audit_log_created_idx ON public.admin_audit_log USING btree (created_at DESC);

CREATE INDEX idx_gigs_category ON public.gigs USING btree (category);

CREATE INDEX email_notifications_order_event_idx ON public.email_notifications USING btree (order_id, event);

CREATE INDEX idx_deliveries_buyer_id ON public.deliveries USING btree (buyer_id);

CREATE INDEX idx_deliveries_seller_id ON public.deliveries USING btree (seller_id);

CREATE INDEX idx_deliveries_gig_id ON public.deliveries USING btree (gig_id);

CREATE INDEX idx_deliveries_status ON public.deliveries USING btree (status);

CREATE INDEX idx_transactions_buyer_id ON public.transactions USING btree (buyer_id);

CREATE INDEX idx_transactions_seller_id ON public.transactions USING btree (seller_id);

CREATE INDEX idx_transactions_gig_id ON public.transactions USING btree (gig_id);

CREATE INDEX idx_transactions_status ON public.transactions USING btree (status);

CREATE INDEX idx_transactions_provider_reference ON public.transactions USING btree (provider_reference);

CREATE TRIGGER orders_payment_authority BEFORE INSERT OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION private.guard_order_payment_authority();

CREATE TRIGGER profiles_touch_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER on_auth_user_created_role AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user_role();

CREATE TRIGGER deliveries_touch_updated_at BEFORE UPDATE ON public.deliveries FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER deliveries_set_dispute_window BEFORE UPDATE ON public.deliveries FOR EACH ROW EXECUTE FUNCTION set_dispute_window();

CREATE TRIGGER transactions_touch_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER transactions_set_timestamps BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION set_transaction_timestamps();

CREATE TRIGGER orders_prevent_self_purchase BEFORE INSERT OR UPDATE OF buyer_id, seller_id ON public.orders FOR EACH ROW EXECUTE FUNCTION private.prevent_order_self_purchase();

alter table public."early_access" enable row level security;

revoke all on public."early_access" from public,anon,authenticated;

grant insert on public."early_access" to anon;

grant select on public."early_access" to anon;

grant update on public."early_access" to anon;

grant delete on public."early_access" to anon;

grant truncate on public."early_access" to anon;

grant references on public."early_access" to anon;

grant trigger on public."early_access" to anon;

grant insert on public."early_access" to authenticated;

grant select on public."early_access" to authenticated;

grant update on public."early_access" to authenticated;

grant delete on public."early_access" to authenticated;

grant truncate on public."early_access" to authenticated;

grant references on public."early_access" to authenticated;

grant trigger on public."early_access" to authenticated;

grant insert on public."early_access" to service_role;

grant select on public."early_access" to service_role;

grant update on public."early_access" to service_role;

grant delete on public."early_access" to service_role;

grant truncate on public."early_access" to service_role;

grant references on public."early_access" to service_role;

grant trigger on public."early_access" to service_role;

alter table public."team_applications" enable row level security;

revoke all on public."team_applications" from public,anon,authenticated;

grant insert on public."team_applications" to anon;

grant select on public."team_applications" to anon;

grant update on public."team_applications" to anon;

grant delete on public."team_applications" to anon;

grant truncate on public."team_applications" to anon;

grant references on public."team_applications" to anon;

grant trigger on public."team_applications" to anon;

grant insert on public."team_applications" to authenticated;

grant select on public."team_applications" to authenticated;

grant update on public."team_applications" to authenticated;

grant delete on public."team_applications" to authenticated;

grant truncate on public."team_applications" to authenticated;

grant references on public."team_applications" to authenticated;

grant trigger on public."team_applications" to authenticated;

grant insert on public."team_applications" to service_role;

grant select on public."team_applications" to service_role;

grant update on public."team_applications" to service_role;

grant delete on public."team_applications" to service_role;

grant truncate on public."team_applications" to service_role;

grant references on public."team_applications" to service_role;

grant trigger on public."team_applications" to service_role;

alter table public."profiles" enable row level security;

revoke all on public."profiles" from public,anon,authenticated;

grant select on public."profiles" to anon;

grant select on public."profiles" to authenticated;

grant insert on public."profiles" to service_role;

grant select on public."profiles" to service_role;

grant update on public."profiles" to service_role;

grant delete on public."profiles" to service_role;

grant truncate on public."profiles" to service_role;

grant references on public."profiles" to service_role;

grant trigger on public."profiles" to service_role;

grant update ("display_name") on public."profiles" to authenticated;

alter table public."payments" enable row level security;

revoke all on public."payments" from public,anon,authenticated;

grant select on public."payments" to anon;

grant truncate on public."payments" to anon;

grant references on public."payments" to anon;

grant trigger on public."payments" to anon;

grant select on public."payments" to authenticated;

grant truncate on public."payments" to authenticated;

grant references on public."payments" to authenticated;

grant trigger on public."payments" to authenticated;

grant insert on public."payments" to service_role;

grant select on public."payments" to service_role;

grant update on public."payments" to service_role;

grant delete on public."payments" to service_role;

grant truncate on public."payments" to service_role;

grant references on public."payments" to service_role;

grant trigger on public."payments" to service_role;

alter table public."orders" enable row level security;

revoke all on public."orders" from public,anon,authenticated;

grant select on public."orders" to anon;

grant delete on public."orders" to anon;

grant truncate on public."orders" to anon;

grant references on public."orders" to anon;

grant trigger on public."orders" to anon;

grant select on public."orders" to authenticated;

grant delete on public."orders" to authenticated;

grant truncate on public."orders" to authenticated;

grant references on public."orders" to authenticated;

grant trigger on public."orders" to authenticated;

grant insert on public."orders" to service_role;

grant select on public."orders" to service_role;

grant update on public."orders" to service_role;

grant delete on public."orders" to service_role;

grant truncate on public."orders" to service_role;

grant references on public."orders" to service_role;

grant trigger on public."orders" to service_role;

alter table public."reviews" enable row level security;

revoke all on public."reviews" from public,anon,authenticated;

grant insert on public."reviews" to anon;

grant select on public."reviews" to anon;

grant update on public."reviews" to anon;

grant delete on public."reviews" to anon;

grant truncate on public."reviews" to anon;

grant references on public."reviews" to anon;

grant trigger on public."reviews" to anon;

grant insert on public."reviews" to authenticated;

grant select on public."reviews" to authenticated;

grant update on public."reviews" to authenticated;

grant delete on public."reviews" to authenticated;

grant truncate on public."reviews" to authenticated;

grant references on public."reviews" to authenticated;

grant trigger on public."reviews" to authenticated;

grant insert on public."reviews" to service_role;

grant select on public."reviews" to service_role;

grant update on public."reviews" to service_role;

grant delete on public."reviews" to service_role;

grant truncate on public."reviews" to service_role;

grant references on public."reviews" to service_role;

grant trigger on public."reviews" to service_role;

alter table public."conversations" enable row level security;

revoke all on public."conversations" from public,anon,authenticated;

grant truncate on public."conversations" to anon;

grant references on public."conversations" to anon;

grant trigger on public."conversations" to anon;

grant truncate on public."conversations" to authenticated;

grant references on public."conversations" to authenticated;

grant trigger on public."conversations" to authenticated;

grant insert on public."conversations" to service_role;

grant select on public."conversations" to service_role;

grant update on public."conversations" to service_role;

grant delete on public."conversations" to service_role;

grant truncate on public."conversations" to service_role;

grant references on public."conversations" to service_role;

grant trigger on public."conversations" to service_role;

alter table public."messages" enable row level security;

revoke all on public."messages" from public,anon,authenticated;

grant truncate on public."messages" to anon;

grant references on public."messages" to anon;

grant trigger on public."messages" to anon;

grant truncate on public."messages" to authenticated;

grant references on public."messages" to authenticated;

grant trigger on public."messages" to authenticated;

grant insert on public."messages" to service_role;

grant select on public."messages" to service_role;

grant update on public."messages" to service_role;

grant delete on public."messages" to service_role;

grant truncate on public."messages" to service_role;

grant references on public."messages" to service_role;

grant trigger on public."messages" to service_role;

alter table public."disputes" enable row level security;

revoke all on public."disputes" from public,anon,authenticated;

grant select on public."disputes" to anon;

grant update on public."disputes" to anon;

grant delete on public."disputes" to anon;

grant truncate on public."disputes" to anon;

grant references on public."disputes" to anon;

grant trigger on public."disputes" to anon;

grant select on public."disputes" to authenticated;

grant update on public."disputes" to authenticated;

grant delete on public."disputes" to authenticated;

grant truncate on public."disputes" to authenticated;

grant references on public."disputes" to authenticated;

grant trigger on public."disputes" to authenticated;

grant insert on public."disputes" to service_role;

grant select on public."disputes" to service_role;

grant update on public."disputes" to service_role;

grant delete on public."disputes" to service_role;

grant truncate on public."disputes" to service_role;

grant references on public."disputes" to service_role;

grant trigger on public."disputes" to service_role;

alter table public."seller_profiles" enable row level security;

revoke all on public."seller_profiles" from public,anon,authenticated;

grant select on public."seller_profiles" to anon;

grant select on public."seller_profiles" to authenticated;

grant insert on public."seller_profiles" to service_role;

grant select on public."seller_profiles" to service_role;

grant update on public."seller_profiles" to service_role;

grant delete on public."seller_profiles" to service_role;

grant truncate on public."seller_profiles" to service_role;

grant references on public."seller_profiles" to service_role;

grant trigger on public."seller_profiles" to service_role;

grant select ("id") on public."seller_profiles" to anon;

grant select ("id") on public."seller_profiles" to authenticated;

grant select ("user_id") on public."seller_profiles" to anon;

grant insert ("user_id") on public."seller_profiles" to authenticated;

grant select ("user_id") on public."seller_profiles" to authenticated;

grant select ("bio") on public."seller_profiles" to anon;

grant insert ("bio") on public."seller_profiles" to authenticated;

grant select ("bio") on public."seller_profiles" to authenticated;

grant update ("bio") on public."seller_profiles" to authenticated;

grant select ("skills") on public."seller_profiles" to anon;

grant insert ("skills") on public."seller_profiles" to authenticated;

grant select ("skills") on public."seller_profiles" to authenticated;

grant update ("skills") on public."seller_profiles" to authenticated;

grant select ("portfolio_links") on public."seller_profiles" to anon;

grant insert ("portfolio_links") on public."seller_profiles" to authenticated;

grant select ("portfolio_links") on public."seller_profiles" to authenticated;

grant update ("portfolio_links") on public."seller_profiles" to authenticated;

grant insert ("id_document_url") on public."seller_profiles" to authenticated;

grant update ("id_document_url") on public."seller_profiles" to authenticated;

grant select ("verification_status") on public."seller_profiles" to anon;

grant select ("verification_status") on public."seller_profiles" to authenticated;

grant select ("rating_avg") on public."seller_profiles" to anon;

grant select ("rating_avg") on public."seller_profiles" to authenticated;

grant select ("total_orders_completed") on public."seller_profiles" to anon;

grant select ("total_orders_completed") on public."seller_profiles" to authenticated;

grant select ("created_at") on public."seller_profiles" to anon;

grant select ("created_at") on public."seller_profiles" to authenticated;

grant select ("updated_at") on public."seller_profiles" to anon;

grant select ("updated_at") on public."seller_profiles" to authenticated;

grant select ("display_name") on public."seller_profiles" to anon;

grant insert ("display_name") on public."seller_profiles" to authenticated;

grant select ("display_name") on public."seller_profiles" to authenticated;

grant update ("display_name") on public."seller_profiles" to authenticated;

grant select ("gig_categories") on public."seller_profiles" to anon;

grant insert ("gig_categories") on public."seller_profiles" to authenticated;

grant select ("gig_categories") on public."seller_profiles" to authenticated;

grant update ("gig_categories") on public."seller_profiles" to authenticated;

grant select ("linkedin_url") on public."seller_profiles" to anon;

grant insert ("linkedin_url") on public."seller_profiles" to authenticated;

grant select ("linkedin_url") on public."seller_profiles" to authenticated;

grant update ("linkedin_url") on public."seller_profiles" to authenticated;

grant select ("years_experience") on public."seller_profiles" to anon;

grant insert ("years_experience") on public."seller_profiles" to authenticated;

grant select ("years_experience") on public."seller_profiles" to authenticated;

grant update ("years_experience") on public."seller_profiles" to authenticated;

grant insert ("id_document_type") on public."seller_profiles" to authenticated;

grant update ("id_document_type") on public."seller_profiles" to authenticated;

alter table public."site_visits" enable row level security;

revoke all on public."site_visits" from public,anon,authenticated;

grant insert on public."site_visits" to anon;

grant select on public."site_visits" to anon;

grant update on public."site_visits" to anon;

grant delete on public."site_visits" to anon;

grant truncate on public."site_visits" to anon;

grant references on public."site_visits" to anon;

grant trigger on public."site_visits" to anon;

grant insert on public."site_visits" to authenticated;

grant select on public."site_visits" to authenticated;

grant update on public."site_visits" to authenticated;

grant delete on public."site_visits" to authenticated;

grant truncate on public."site_visits" to authenticated;

grant references on public."site_visits" to authenticated;

grant trigger on public."site_visits" to authenticated;

grant insert on public."site_visits" to service_role;

grant select on public."site_visits" to service_role;

grant update on public."site_visits" to service_role;

grant delete on public."site_visits" to service_role;

grant truncate on public."site_visits" to service_role;

grant references on public."site_visits" to service_role;

grant trigger on public."site_visits" to service_role;

alter table public."users" enable row level security;

revoke all on public."users" from public,anon,authenticated;

grant insert on public."users" to anon;

grant select on public."users" to anon;

grant update on public."users" to anon;

grant delete on public."users" to anon;

grant truncate on public."users" to anon;

grant references on public."users" to anon;

grant trigger on public."users" to anon;

grant insert on public."users" to authenticated;

grant select on public."users" to authenticated;

grant update on public."users" to authenticated;

grant delete on public."users" to authenticated;

grant truncate on public."users" to authenticated;

grant references on public."users" to authenticated;

grant trigger on public."users" to authenticated;

grant insert on public."users" to service_role;

grant select on public."users" to service_role;

grant update on public."users" to service_role;

grant delete on public."users" to service_role;

grant truncate on public."users" to service_role;

grant references on public."users" to service_role;

grant trigger on public."users" to service_role;

alter table public."gigs" enable row level security;

revoke all on public."gigs" from public,anon,authenticated;

grant insert on public."gigs" to anon;

grant select on public."gigs" to anon;

grant update on public."gigs" to anon;

grant delete on public."gigs" to anon;

grant truncate on public."gigs" to anon;

grant references on public."gigs" to anon;

grant trigger on public."gigs" to anon;

grant insert on public."gigs" to authenticated;

grant select on public."gigs" to authenticated;

grant update on public."gigs" to authenticated;

grant delete on public."gigs" to authenticated;

grant truncate on public."gigs" to authenticated;

grant references on public."gigs" to authenticated;

grant trigger on public."gigs" to authenticated;

grant insert on public."gigs" to service_role;

grant select on public."gigs" to service_role;

grant update on public."gigs" to service_role;

grant delete on public."gigs" to service_role;

grant truncate on public."gigs" to service_role;

grant references on public."gigs" to service_role;

grant trigger on public."gigs" to service_role;

alter table public."admin_audit_log" enable row level security;

revoke all on public."admin_audit_log" from public,anon,authenticated;

grant insert on public."admin_audit_log" to service_role;

grant select on public."admin_audit_log" to service_role;

grant update on public."admin_audit_log" to service_role;

grant delete on public."admin_audit_log" to service_role;

grant truncate on public."admin_audit_log" to service_role;

grant references on public."admin_audit_log" to service_role;

grant trigger on public."admin_audit_log" to service_role;

alter table public."gig_reports" enable row level security;

revoke all on public."gig_reports" from public,anon,authenticated;

grant insert on public."gig_reports" to anon;

grant select on public."gig_reports" to anon;

grant update on public."gig_reports" to anon;

grant delete on public."gig_reports" to anon;

grant truncate on public."gig_reports" to anon;

grant references on public."gig_reports" to anon;

grant trigger on public."gig_reports" to anon;

grant insert on public."gig_reports" to authenticated;

grant select on public."gig_reports" to authenticated;

grant update on public."gig_reports" to authenticated;

grant delete on public."gig_reports" to authenticated;

grant truncate on public."gig_reports" to authenticated;

grant references on public."gig_reports" to authenticated;

grant trigger on public."gig_reports" to authenticated;

grant insert on public."gig_reports" to service_role;

grant select on public."gig_reports" to service_role;

grant update on public."gig_reports" to service_role;

grant delete on public."gig_reports" to service_role;

grant truncate on public."gig_reports" to service_role;

grant references on public."gig_reports" to service_role;

grant trigger on public."gig_reports" to service_role;

alter table public."email_notifications" enable row level security;

revoke all on public."email_notifications" from public,anon,authenticated;

grant insert on public."email_notifications" to service_role;

grant select on public."email_notifications" to service_role;

grant update on public."email_notifications" to service_role;

grant delete on public."email_notifications" to service_role;

grant truncate on public."email_notifications" to service_role;

grant references on public."email_notifications" to service_role;

grant trigger on public."email_notifications" to service_role;

alter table public."platform_settings" enable row level security;

revoke all on public."platform_settings" from public,anon,authenticated;

grant insert on public."platform_settings" to service_role;

grant select on public."platform_settings" to service_role;

grant update on public."platform_settings" to service_role;

grant delete on public."platform_settings" to service_role;

grant truncate on public."platform_settings" to service_role;

grant references on public."platform_settings" to service_role;

grant trigger on public."platform_settings" to service_role;

alter table public."deliveries" enable row level security;

revoke all on public."deliveries" from public,anon,authenticated;

grant select on public."deliveries" to anon;

grant truncate on public."deliveries" to anon;

grant references on public."deliveries" to anon;

grant trigger on public."deliveries" to anon;

grant select on public."deliveries" to authenticated;

grant truncate on public."deliveries" to authenticated;

grant references on public."deliveries" to authenticated;

grant trigger on public."deliveries" to authenticated;

grant insert on public."deliveries" to service_role;

grant select on public."deliveries" to service_role;

grant update on public."deliveries" to service_role;

grant delete on public."deliveries" to service_role;

grant truncate on public."deliveries" to service_role;

grant references on public."deliveries" to service_role;

grant trigger on public."deliveries" to service_role;

alter table public."transactions" enable row level security;

revoke all on public."transactions" from public,anon,authenticated;

grant truncate on public."transactions" to anon;

grant references on public."transactions" to anon;

grant trigger on public."transactions" to anon;

grant truncate on public."transactions" to authenticated;

grant references on public."transactions" to authenticated;

grant trigger on public."transactions" to authenticated;

grant insert on public."transactions" to service_role;

grant select on public."transactions" to service_role;

grant update on public."transactions" to service_role;

grant delete on public."transactions" to service_role;

grant truncate on public."transactions" to service_role;

grant references on public."transactions" to service_role;

grant trigger on public."transactions" to service_role;

revoke all on function handle_new_user() from public,anon,authenticated;

grant execute on function handle_new_user() to service_role;

revoke all on function set_dispute_window() from public,anon,authenticated;

grant execute on function set_dispute_window() to public;

grant execute on function set_dispute_window() to anon;

grant execute on function set_dispute_window() to authenticated;

grant execute on function set_dispute_window() to service_role;

revoke all on function claim_exclusive_gig(uuid) from public,anon,authenticated;

grant execute on function claim_exclusive_gig(uuid) to service_role;

revoke all on function set_transaction_timestamps() from public,anon,authenticated;

grant execute on function set_transaction_timestamps() to public;

grant execute on function set_transaction_timestamps() to anon;

grant execute on function set_transaction_timestamps() to authenticated;

grant execute on function set_transaction_timestamps() to service_role;

revoke all on function get_gig_ratings() from public,anon,authenticated;

grant execute on function get_gig_ratings() to public;

grant execute on function get_gig_ratings() to anon;

grant execute on function get_gig_ratings() to authenticated;

grant execute on function get_gig_ratings() to service_role;

revoke all on function get_seller_ratings() from public,anon,authenticated;

grant execute on function get_seller_ratings() to public;

grant execute on function get_seller_ratings() to anon;

grant execute on function get_seller_ratings() to authenticated;

grant execute on function get_seller_ratings() to service_role;

revoke all on function mark_conversation_read(uuid,text) from public,anon,authenticated;

grant execute on function mark_conversation_read(uuid,text) to authenticated;

grant execute on function mark_conversation_read(uuid,text) to service_role;

revoke all on function touch_updated_at() from public,anon,authenticated;

grant execute on function touch_updated_at() to public;

grant execute on function touch_updated_at() to anon;

grant execute on function touch_updated_at() to authenticated;

grant execute on function touch_updated_at() to service_role;

revoke all on function is_admin(uuid) from public,anon,authenticated;

grant execute on function is_admin(uuid) to authenticated;

grant execute on function is_admin(uuid) to service_role;

revoke all on function handle_new_user_role() from public,anon,authenticated;

grant execute on function handle_new_user_role() to service_role;

revoke all on function calculate_transaction_fees(bigint,numeric,bigint,numeric) from public,anon,authenticated;

grant execute on function calculate_transaction_fees(bigint,numeric,bigint,numeric) to public;

grant execute on function calculate_transaction_fees(bigint,numeric,bigint,numeric) to anon;

grant execute on function calculate_transaction_fees(bigint,numeric,bigint,numeric) to authenticated;

grant execute on function calculate_transaction_fees(bigint,numeric,bigint,numeric) to service_role;

revoke all on function get_unread_conversation_count(uuid,text) from public,anon,authenticated;

grant execute on function get_unread_conversation_count(uuid,text) to authenticated;

grant execute on function get_unread_conversation_count(uuid,text) to service_role;

revoke all on function private.prevent_order_self_purchase() from public,anon,authenticated;

revoke all on function private.guard_order_payment_authority() from public,anon,authenticated;

revoke all on function record_paystack_payment(text,bigint,text) from public,anon,authenticated;

grant execute on function record_paystack_payment(text,bigint,text) to service_role;

revoke all on function submit_order_delivery(uuid,uuid,text) from public,anon,authenticated;

grant execute on function submit_order_delivery(uuid,uuid,text) to service_role;

revoke all on function review_order_delivery(uuid,uuid,boolean,text) from public,anon,authenticated;

grant execute on function review_order_delivery(uuid,uuid,boolean,text) to service_role;

revoke all on function accept_order_delivery(uuid,uuid) from public,anon,authenticated;

grant execute on function accept_order_delivery(uuid,uuid) to service_role;

revoke all on function raise_order_dispute(uuid,uuid,text) from public,anon,authenticated;

grant execute on function raise_order_dispute(uuid,uuid,text) to service_role;

revoke all on function private.owns_payment_as_seller(uuid) from public,anon,authenticated;

grant execute on function private.owns_payment_as_seller(uuid) to authenticated;

revoke all on function get_gig_reviews(uuid) from public,anon,authenticated;

grant execute on function get_gig_reviews(uuid) to public;

grant execute on function get_gig_reviews(uuid) to anon;

grant execute on function get_gig_reviews(uuid) to authenticated;

grant execute on function get_gig_reviews(uuid) to service_role;

revoke all on public."seller_delivery_view" from public,anon,authenticated;

grant insert on public."seller_delivery_view" to service_role;

grant select on public."seller_delivery_view" to service_role;

grant update on public."seller_delivery_view" to service_role;

grant delete on public."seller_delivery_view" to service_role;

grant truncate on public."seller_delivery_view" to service_role;

grant references on public."seller_delivery_view" to service_role;

grant trigger on public."seller_delivery_view" to service_role;

revoke all on public."seller_transaction_view" from public,anon,authenticated;

grant insert on public."seller_transaction_view" to service_role;

grant select on public."seller_transaction_view" to service_role;

grant update on public."seller_transaction_view" to service_role;

grant delete on public."seller_transaction_view" to service_role;

grant truncate on public."seller_transaction_view" to service_role;

grant references on public."seller_transaction_view" to service_role;

grant trigger on public."seller_transaction_view" to service_role;

create policy "Allow public insert on early_access" on "public"."early_access" as permissive for insert to anon with check (true);

create policy "Allow public insert on team_applications" on "public"."team_applications" as permissive for insert to anon with check (true);

create policy "Allow public insert on site_visits" on "public"."site_visits" as permissive for insert to anon with check (true);

create policy "Allow authenticated uploads 18sed9p_0" on "storage"."objects" as permissive for insert to authenticated with check (true);

create policy "Allow authenticated read on early_access" on "public"."early_access" as permissive for select to authenticated using (true);

create policy "Allow authenticated read on team_applications" on "public"."team_applications" as permissive for select to authenticated using (true);

create policy "Allow authenticated read on site_visits" on "public"."site_visits" as permissive for select to authenticated using (true);

create policy "users manage their own row" on "public"."users" as permissive for all to public using ((auth.uid() = id)) with check ((auth.uid() = id));

create policy "public can read seller profiles" on "public"."seller_profiles" as permissive for select to public using (true);

create policy "sellers manage their own profile" on "public"."seller_profiles" as permissive for insert to public with check ((auth.uid() = user_id));

create policy "sellers update their own profile" on "public"."seller_profiles" as permissive for update to public using ((auth.uid() = user_id)) with check ((auth.uid() = user_id));

create policy "order parties view disputes" on "public"."disputes" as permissive for select to public using ((EXISTS ( SELECT 1
   FROM orders o
  WHERE ((o.id = disputes.order_id) AND ((auth.uid() = o.buyer_id) OR (auth.uid() = o.seller_id))))));

create policy "participants view their conversations" on "public"."conversations" as permissive for select to public using (((auth.uid() = buyer_id) OR (auth.uid() = seller_id)));

create policy "participants start conversations" on "public"."conversations" as permissive for insert to public with check (((auth.uid() = buyer_id) OR (auth.uid() = seller_id)));

create policy "participants view their messages" on "public"."messages" as permissive for select to public using ((EXISTS ( SELECT 1
   FROM conversations c
  WHERE ((c.id = messages.conversation_id) AND ((auth.uid() = c.buyer_id) OR (auth.uid() = c.seller_id))))));

create policy "participants send messages" on "public"."messages" as permissive for insert to public with check (((auth.uid() = sender_id) AND (EXISTS ( SELECT 1
   FROM conversations c
  WHERE ((c.id = messages.conversation_id) AND ((auth.uid() = c.buyer_id) OR (auth.uid() = c.seller_id)))))));

create policy "public can read active gigs" on "public"."gigs" as permissive for select to public using (((status = 'active'::text) OR (seller_id IN ( SELECT seller_profiles.id
   FROM seller_profiles
  WHERE (seller_profiles.user_id = auth.uid())))));

create policy "sellers delete their own gigs" on "public"."gigs" as permissive for delete to public using ((seller_id IN ( SELECT seller_profiles.id
   FROM seller_profiles
  WHERE (seller_profiles.user_id = auth.uid()))));

create policy "users create gig reports" on "public"."gig_reports" as permissive for insert to public with check ((auth.uid() = reported_by));

create policy "users view their own gig reports" on "public"."gig_reports" as permissive for select to public using ((auth.uid() = reported_by));

create policy "Users can update own last-read timestamp" on "public"."conversations" as permissive for update to public using (((auth.uid() = buyer_id) OR (auth.uid() = seller_id))) with check (((auth.uid() = buyer_id) OR (auth.uid() = seller_id)));

create policy "profiles_select_all" on "public"."profiles" as permissive for select to public using (true);

create policy "profiles_update_own_non_role_fields" on "public"."profiles" as permissive for update to public using ((auth.uid() = id)) with check ((auth.uid() = id));

create policy "buyers view their own orders" on "public"."orders" as permissive for select to authenticated using ((( SELECT auth.uid() AS uid) = buyer_id));

create policy "buyers view their own deliveries" on "public"."deliveries" as permissive for select to authenticated using ((( SELECT auth.uid() AS uid) = buyer_id));

create policy "buyers and sellers view own payments" on "public"."payments" as permissive for select to authenticated using (((EXISTS ( SELECT 1
   FROM orders o
  WHERE ((o.id = payments.order_id) AND (o.buyer_id = ( SELECT auth.uid() AS uid))))) OR private.owns_payment_as_seller(order_id)));

create policy "buyer reads own reviews" on "public"."reviews" as permissive for select to authenticated using ((( SELECT auth.uid() AS uid) = reviewer_id));

create policy "seller removes own gig media" on "storage"."objects" as permissive for delete to authenticated using (((bucket_id = 'gig-media'::text) AND (split_part(name, '/'::text, 1) = (( SELECT auth.uid() AS uid))::text) AND (split_part(name, '/'::text, 2) = 'gigs'::text)));

create policy "approved sellers insert their own gigs" on "public"."gigs" as permissive for insert to authenticated with check ((EXISTS ( SELECT 1
   FROM seller_profiles seller
  WHERE ((seller.id = gigs.seller_id) AND (seller.user_id = ( SELECT auth.uid() AS uid)) AND (seller.verification_status = 'approved'::text)))));

create policy "approved sellers update their own gigs" on "public"."gigs" as permissive for update to authenticated using ((EXISTS ( SELECT 1
   FROM seller_profiles seller
  WHERE ((seller.id = gigs.seller_id) AND (seller.user_id = ( SELECT auth.uid() AS uid)) AND (seller.verification_status = 'approved'::text))))) with check ((EXISTS ( SELECT 1
   FROM seller_profiles seller
  WHERE ((seller.id = gigs.seller_id) AND (seller.user_id = ( SELECT auth.uid() AS uid)) AND (seller.verification_status = 'approved'::text)))));

create policy "approved seller uploads own gig media" on "storage"."objects" as permissive for insert to authenticated with check (((bucket_id = 'gig-media'::text) AND (split_part(name, '/'::text, 1) = (( SELECT auth.uid() AS uid))::text) AND (split_part(name, '/'::text, 2) = 'gigs'::text) AND (EXISTS ( SELECT 1
   FROM seller_profiles seller
  WHERE ((seller.user_id = ( SELECT auth.uid() AS uid)) AND (seller.verification_status = 'approved'::text))))));

create policy "buyers review approved orders" on "public"."reviews" as permissive for insert to authenticated with check (((reviewer_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM orders orders
  WHERE ((orders.id = reviews.order_id) AND (orders.buyer_id = ( SELECT auth.uid() AS uid)) AND (orders.status = 'approved'::order_status))))));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('order-deliveries','order-deliveries',false,10485760,array['application/pdf','application/zip','image/png','image/jpeg','text/plain']) on conflict(id) do nothing;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('gig-media','gig-media',true,20971520,array['image/jpeg','image/png','image/webp','video/mp4','video/webm']) on conflict(id) do nothing;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('verification-docs','verification-docs',false,10485760,array['application/pdf','image/jpeg','image/png','image/webp']) on conflict(id) do nothing;

commit;

