import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';

const buyer = '10000000-0000-4000-8000-000000000001';
const seller = '10000000-0000-4000-8000-000000000002';
const order = '10000000-0000-4000-8000-000000000003';
const sellerProfile = '10000000-0000-4000-8000-000000000004';
const gig = '10000000-0000-4000-8000-000000000005';

test('Phase E: seller cannot query buyer IDs through base tables, views, or reviews', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create function auth.uid() returns uuid language sql stable as
        $$select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid$$;
      create table public.orders(id uuid primary key,gig_id uuid,buyer_id uuid,seller_id uuid,
        status text,amount numeric);
      create table public.seller_profiles(id uuid primary key,user_id uuid,id_document_url text,
        display_name text,bio text,skills text[],portfolio_links text[],verification_status text,
        rating_avg numeric,total_orders_completed integer,created_at timestamptz,updated_at timestamptz,
        gig_categories text[],linkedin_url text,years_experience text);
      create table public.deliveries(id uuid primary key,order_id uuid,buyer_id uuid,seller_id uuid);
      create table public.payments(id uuid primary key,order_id uuid);
      create table public.transactions(id uuid primary key,buyer_id uuid,seller_id uuid);
      create table public.conversations(id uuid primary key,buyer_id uuid,seller_id uuid);
      create table public.messages(id uuid primary key,conversation_id uuid,sender_id uuid);
      create table public.disputes(id uuid primary key,order_id uuid,raised_by uuid);
      create table public.reviews(id uuid primary key,order_id uuid,reviewer_id uuid,rating integer,
        comment text,created_at timestamptz);
      create view public.seller_delivery_view as select * from public.deliveries;
      create view public.seller_transaction_view as select * from public.transactions;
      create function public.get_gig_reviews(uuid) returns table(rating smallint,comment text,
        created_at timestamptz,reviewer_name text) language sql as
        $$select 1::smallint,''::text,now(),'Public name'::text$$;
      grant usage on schema public to anon,authenticated,service_role;
      grant select,insert,update,delete on all tables in schema public to anon,authenticated,service_role;
      alter table public.orders enable row level security;
      alter table public.seller_profiles enable row level security;
      alter table public.deliveries enable row level security;
      alter table public.payments enable row level security;
      alter table public.reviews enable row level security;
      create policy "buyers and sellers view their own orders" on public.orders for select to authenticated
        using(auth.uid()=buyer_id or exists(select 1 from public.seller_profiles
          where id=seller_id and user_id=auth.uid()));
      create policy "buyers and sellers update their own orders" on public.orders for update to authenticated
        using(auth.uid()=buyer_id or exists(select 1 from public.seller_profiles
          where id=seller_id and user_id=auth.uid()));
      create policy "seller profiles visible" on public.seller_profiles for select using(true);
      create policy "sellers_select_own_gig_deliveries" on public.deliveries for select
        using(auth.uid()=seller_id);
      create policy "buyers_select_own_deliveries" on public.deliveries for select
        using(auth.uid()=buyer_id);
      create policy "order parties view payments" on public.payments for select using(true);
      create policy "public can read reviews" on public.reviews for select using(true);
      insert into public.seller_profiles(id,user_id,display_name,id_document_url)
        values ('${sellerProfile}','${seller}','Seller','private-id.png');
      insert into public.orders(id,gig_id,buyer_id,seller_id,status,amount)
        values ('${order}','${gig}','${buyer}','${sellerProfile}','approved',5000);
      insert into public.deliveries(id,order_id,buyer_id,seller_id)
        values (gen_random_uuid(),'${order}','${buyer}','${seller}');
      insert into public.payments(id,order_id) values (gen_random_uuid(),'${order}');
      insert into public.reviews(id,order_id,reviewer_id,rating,comment,created_at)
        values(gen_random_uuid(),'${order}','${buyer}',5,'Good',now());
    `);
    const migration = await readFile(new URL('../supabase/migrations/20260922233036_phase_e_private_buyer_records.sql', import.meta.url), 'utf8');
    await db.exec(migration);
    await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${seller}',false)`);
    assert.equal((await db.query('select count(*)::int n from public.orders')).rows[0].n,0);
    assert.equal((await db.query('select count(*)::int n from public.deliveries')).rows[0].n,0);
    assert.equal((await db.query('select count(*)::int n from public.reviews')).rows[0].n,0);
    assert.equal((await db.query('select count(*)::int n from public.payments')).rows[0].n,1);
    await assert.rejects(db.query('select * from public.transactions'),{code:'42501'});
    await assert.rejects(db.query('select * from public.seller_delivery_view'),{code:'42501'});
    await assert.rejects(db.query('select id_document_url from public.seller_profiles'),{code:'42501'});
    await assert.rejects(db.query('select * from public.conversations'),{code:'42501'});
    await assert.rejects(db.query('select * from public.messages'),{code:'42501'});
    await db.exec(`select set_config('request.jwt.claim.sub','${buyer}',false)`);
    assert.equal((await db.query('select count(*)::int n from public.orders')).rows[0].n,1);
    assert.equal((await db.query('select count(*)::int n from public.deliveries')).rows[0].n,1);
  } finally { await db.close(); }
});
