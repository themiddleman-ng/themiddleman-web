import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { sameOriginMutation } from '../lib/server/same-origin.mjs';

test('cookie-authenticated mutations require the exact origin', () => {
  const url = 'https://themiddleman.com.ng/api/orders';
  const req = (headers) => new Request(url, { method: 'POST',
    headers: { 'content-type': 'application/json', ...headers } });
  assert.equal(sameOriginMutation(req({ origin: 'https://themiddleman.com.ng', 'sec-fetch-site': 'same-origin' })), true);
  assert.equal(sameOriginMutation(req({ origin: 'https://evil.example' })), false);
  assert.equal(sameOriginMutation(req({ origin: 'null' })), false);
  assert.equal(sameOriginMutation(req({ 'sec-fetch-site': 'cross-site' })), false);
  assert.equal(sameOriginMutation(req({ origin: 'https://themiddleman.com.ng', 'sec-fetch-site': 'cross-site' })), false);
  assert.equal(sameOriginMutation(req({ origin: 'https://themiddleman.com.ng.evil.example' })), false);
  assert.equal(sameOriginMutation(req({ origin: 'https://themiddleman.com.ng', 'content-type': 'text/plain' })), false);
});

test('seller cannot approve self, forge ratings or publish before approval', async () => {
  const db = new PGlite();
  const user = '10000000-0000-4000-8000-000000000001';
  const seller = '20000000-0000-4000-8000-000000000001';
  const gig = '30000000-0000-4000-8000-000000000001';
  const order = '40000000-0000-4000-8000-000000000001';
  try {
    await db.exec(`
      create role authenticated; create role anon; create role service_role bypassrls;
      create schema auth; create schema storage;
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      create table public.seller_profiles(id uuid primary key default gen_random_uuid(),
        user_id uuid unique not null, display_name text not null, bio text, skills text[],
        portfolio_links text[], linkedin_url text, years_experience text,
        gig_categories text[], id_document_type text, id_document_url text,
        verification_status text not null default 'pending', rating_avg numeric default 0,
        total_orders_completed integer default 0);
      create table public.gigs(id uuid primary key, seller_id uuid references seller_profiles(id), status text default 'active');
      create table public.orders(id uuid primary key, buyer_id uuid, status text);
      create table public.reviews(order_id uuid, reviewer_id uuid, rating int);
      create table storage.objects(bucket_id text, name text);
      create table storage.buckets(id text primary key,file_size_limit bigint,allowed_mime_types text[]);
      insert into storage.buckets(id) values ('verification-docs');
      grant usage on schema public, auth, storage to authenticated;
      grant select,insert,update on public.seller_profiles, public.gigs, public.reviews to authenticated;
      grant select on public.orders to authenticated;
      grant insert on storage.objects to authenticated;
      alter table public.seller_profiles enable row level security;
      alter table public.gigs enable row level security;
      alter table public.reviews enable row level security;
      alter table storage.objects enable row level security;
      create policy "public can read seller profiles" on public.seller_profiles for select using (true);
      create policy "sellers manage their own profile" on public.seller_profiles for insert with check(auth.uid()=user_id);
      create policy "sellers update their own profile" on public.seller_profiles for update using(auth.uid()=user_id) with check(auth.uid()=user_id);
      create policy "sellers insert their own gigs" on public.gigs for insert with check(true);
      create policy "sellers update their own gigs" on public.gigs for update using(true) with check(true);
      create policy "buyers leave reviews on their own orders" on public.reviews for insert with check(true);
      create policy "seller uploads own gig media" on storage.objects for insert with check(true);
    `);
    await db.exec(await readFile(new URL('../supabase/migrations/20260925163052_security_seller_profile_and_gig_authority.sql', import.meta.url), 'utf8'));
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${user}';`);
    await assert.rejects(db.query('insert into seller_profiles(user_id,display_name,verification_status) values($1,$2,$3)', [user, 'Seller', 'approved']), { code: '42501' });
    await db.query('insert into seller_profiles(user_id,display_name) values($1,$2)', [user, 'Seller']);
    await assert.rejects(db.query('update seller_profiles set verification_status=$1 where user_id=$2', ['approved', user]), { code: '42501' });
    await assert.rejects(db.query('update seller_profiles set rating_avg=5 where user_id=$1', [user]), { code: '42501' });
    await db.query('update seller_profiles set display_name=$1 where user_id=$2', ['New name', user]);
    await db.query(`insert into seller_profiles(user_id,display_name) values($1,$2)
      on conflict(user_id) do update set display_name=excluded.display_name`, [user, 'Updated from onboarding']);
    await assert.rejects(db.query('insert into gigs(id,seller_id) values($1,$2)', [gig, seller]));
    await assert.rejects(db.query('insert into storage.objects(bucket_id,name) values($1,$2)',
      ['gig-media', `${user}/gigs/unverified.png`]));
    await db.exec('reset role');
    await db.query('update seller_profiles set id=$1,verification_status=$2 where user_id=$3', [seller, 'approved', user]);
    await db.query('insert into orders(id,buyer_id,status) values($1,$2,$3)', [order, user, 'pending_payment']);
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${user}';`);
    await db.query('insert into gigs(id,seller_id) values($1,$2)', [gig, seller]);
    await db.query('insert into storage.objects(bucket_id,name) values($1,$2)',
      ['gig-media', `${user}/gigs/verified.png`]);
    await assert.rejects(db.query('insert into reviews(order_id,reviewer_id,rating) values($1,$2,5)', [order, user]));
    await db.exec('reset role');
    await db.query('update orders set status=$1 where id=$2', ['approved', order]);
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${user}';`);
    await db.query('insert into reviews(order_id,reviewer_id,rating) values($1,$2,5)', [order, user]);
  } finally { await db.close(); }
});
