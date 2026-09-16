-- The Middleman — core schema
-- Run this in the Supabase SQL editor (Project: uwigyojtiudefnwjezhm)
-- before replacing the mock client. Run auth_trigger.sql right after.

create type public.verification_status as enum ('draft', 'pending', 'approved', 'rejected');
create type public.gig_category as enum ('development', 'design', 'marketing', 'writing', 'ai_assisted');
create type public.order_status as enum ('pending_payment', 'in_escrow', 'delivered', 'approved', 'disputed', 'refunded');
create type public.payment_status as enum ('initiated', 'successful', 'failed', 'refunded');
create type public.dispute_status as enum ('open', 'under_review', 'resolved_buyer', 'resolved_seller', 'closed');

-- ── users ──────────────────────────────────────────────────────────
-- One row per auth.users row, created automatically by the trigger in
-- auth_trigger.sql. Holds the dual buyer/seller role flags.
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  state text,
  is_buyer boolean not null default true,
  is_seller boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── seller_profiles ───────────────────────────────────────────────
create table public.seller_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  display_name text not null,
  bio text not null,
  skills text[] not null default '{}',
  portfolio_links text[] not null default '{}',
  linkedin_url text,
  years_experience text,
  gig_categories text[] not null default '{}',
  id_document_type text,
  id_document_url text,
  verification_status public.verification_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── gigs ───────────────────────────────────────────────────────────
create table public.gigs (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.seller_profiles(user_id) on delete cascade,
  title text not null,
  description text not null,
  category public.gig_category not null,
  price_ngn integer not null check (price_ngn > 0),
  is_ai_assisted boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now()
);

-- ── orders ─────────────────────────────────────────────────────────
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.users(id),
  seller_id uuid not null references public.seller_profiles(user_id),
  gig_id uuid not null references public.gigs(id),
  amount numeric not null check (amount > 0),
  status public.order_status not null default 'pending_payment',
  created_at timestamptz not null default now()
);

-- ── payments ───────────────────────────────────────────────────────
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  amount numeric not null check (amount > 0),
  provider text not null default 'paystack',
  reference text not null unique,
  status public.payment_status not null default 'initiated',
  created_at timestamptz not null default now()
);

-- ── reviews ────────────────────────────────────────────────────────
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  reviewer_id uuid not null references public.users(id),
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

-- ── disputes ───────────────────────────────────────────────────────
create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  raised_by uuid not null references public.users(id),
  reason text not null,
  status public.dispute_status not null default 'open',
  created_at timestamptz not null default now()
);

-- ── RLS ────────────────────────────────────────────────────────────
alter table public.users enable row level security;
alter table public.seller_profiles enable row level security;
alter table public.gigs enable row level security;
alter table public.orders enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;
alter table public.disputes enable row level security;

create policy "users manage their own row" on public.users
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "public can read seller profiles" on public.seller_profiles
  for select using (true);
create policy "sellers manage their own profile" on public.seller_profiles
  for insert with check (auth.uid() = user_id);
create policy "sellers update their own profile" on public.seller_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "public can read published gigs" on public.gigs
  for select using (status = 'published' or auth.uid() = seller_id);
create policy "sellers manage their own gigs" on public.gigs
  for insert with check (auth.uid() = seller_id);
create policy "sellers update their own gigs" on public.gigs
  for update using (auth.uid() = seller_id) with check (auth.uid() = seller_id);
create policy "sellers delete their own gigs" on public.gigs
  for delete using (auth.uid() = seller_id);

create policy "buyers and sellers view their own orders" on public.orders
  for select using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "buyers create orders" on public.orders
  for insert with check (auth.uid() = buyer_id);
create policy "buyers and sellers update their own orders" on public.orders
  for update using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "order parties view payments" on public.payments
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (auth.uid() = o.buyer_id or auth.uid() = o.seller_id)
    )
  );

create policy "public can read reviews" on public.reviews
  for select using (true);
create policy "buyers leave reviews on their own orders" on public.reviews
  for insert with check (
    auth.uid() = reviewer_id
    and exists (select 1 from public.orders o where o.id = order_id and o.buyer_id = auth.uid())
  );

create policy "order parties view disputes" on public.disputes
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (auth.uid() = o.buyer_id or auth.uid() = o.seller_id)
    )
  );
create policy "order parties raise disputes" on public.disputes
  for insert with check (
    auth.uid() = raised_by
    and exists (
      select 1 from public.orders o
      where o.id = order_id and (auth.uid() = o.buyer_id or auth.uid() = o.seller_id)
    )
  );
