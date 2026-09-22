import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';

const buyer = '10000000-0000-4000-8000-000000000001';
const seller = '10000000-0000-4000-8000-000000000002';
const admin = '10000000-0000-4000-8000-000000000003';
const order = '10000000-0000-4000-8000-000000000004';
const gig = '10000000-0000-4000-8000-000000000005';
const profile = '10000000-0000-4000-8000-000000000006';
const file = `${order}/10000000-0000-4000-8000-000000000007.pdf`;

test('Phase D: paid order, seller submission, admin review, buyer acceptance and audit', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role authenticated; create role anon; create role service_role bypassrls;
      create schema auth; create table auth.users(id uuid primary key);
      create schema storage;
      create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create type public.delivery_status as enum
        ('pending_upload','pending_review','needs_seller_edit','ready','delivered','expired');
      create type public.order_status as enum
        ('pending_payment','in_escrow','delivered','approved','disputed','refunded');
      create table public.profiles(id uuid primary key references auth.users(id), role text not null);
      create table public.seller_profiles(id uuid primary key, user_id uuid not null references auth.users(id));
      create table public.orders(id uuid primary key, gig_id uuid, buyer_id uuid, seller_id uuid,
        amount numeric, status public.order_status, updated_at timestamptz default now());
      create table public.payments(id uuid primary key default gen_random_uuid(),order_id uuid,
        escrow_status text not null);
      create table public.transactions(id uuid primary key);
      create table public.disputes(id uuid primary key default gen_random_uuid(),order_id uuid,
        raised_by uuid,reason text,status text not null default 'open');
      create table public.deliveries(id uuid primary key default gen_random_uuid(), gig_id uuid not null,
        buyer_id uuid not null,seller_id uuid not null,transaction_id uuid,
        status public.delivery_status default 'pending_upload',storage_path text,review_notes text,
        admin_reviewer_id uuid,reviewed_at timestamptz, delivered_at timestamptz,
        created_at timestamptz default now(),updated_at timestamptz default now());
      create function public.record_paystack_payment(text,bigint,text) returns text language sql as $$select 'recorded'::text$$;
      grant usage on schema public to authenticated,anon,service_role;
      grant all on all tables in schema public to authenticated,anon,service_role;
      insert into auth.users(id) values ('${buyer}'),('${seller}'),('${admin}');
      insert into public.profiles values ('${admin}','admin');
      insert into public.seller_profiles values ('${profile}','${seller}');
      insert into public.orders(id,gig_id,buyer_id,seller_id,amount,status)
        values ('${order}','${gig}','${buyer}','${profile}',5000,'in_escrow');
      insert into public.payments(order_id,escrow_status) values ('${order}','held');
    `);
    const migration = await readFile(new URL('../supabase/migrations/20260922232250_phase_d_order_delivery_review.sql', import.meta.url), 'utf8');
    await db.exec(migration);
    await db.exec('set role authenticated');
    await assert.rejects(db.query('select public.submit_order_delivery($1,$2,$3)',[order,seller,file]),{code:'42501'});
    await assert.rejects(db.exec(`update public.orders set status='approved' where id='${order}'`),{code:'42501'});
    await db.exec('reset role; set role service_role');
    await assert.rejects(db.query('select public.submit_order_delivery($1,$2,$3)',[order,buyer,file]),{code:'42501'});
    await assert.rejects(db.query('select public.submit_order_delivery($1,$2,$3)',[order,seller,`${order}/bad`]));
    const delivery = (await db.query('select public.submit_order_delivery($1,$2,$3) id',[order,seller,file])).rows[0].id;
    await assert.rejects(db.query('select public.submit_order_delivery($1,$2,$3)',[order,seller,file]));
    await assert.rejects(db.query('select public.review_order_delivery($1,$2,$3,$4)',[delivery,buyer,true,'okay']),{code:'42501'});
    await db.query('select public.review_order_delivery($1,$2,$3,$4)',[delivery,admin,false,'Needs a clearer file']);
    assert.equal((await db.query(`select status from public.orders where id='${order}'`)).rows[0].status,'in_escrow');
    await db.query('select public.submit_order_delivery($1,$2,$3)',[order,seller,file]);
    await db.query('select public.review_order_delivery($1,$2,$3,$4)',[delivery,admin,true,'Looks good']);
    assert.equal((await db.query(`select status from public.orders where id='${order}'`)).rows[0].status,'delivered');
    await assert.rejects(db.query('select public.accept_order_delivery($1,$2)',[order,seller]),{code:'42501'});
    await db.query('select public.accept_order_delivery($1,$2)',[order,buyer]);
    assert.equal((await db.query(`select status from public.orders where id='${order}'`)).rows[0].status,'approved');
    assert.equal((await db.query('select count(*)::int n from public.admin_audit_log')).rows[0].n,2);
    assert.equal((await db.query('select count(*)::int n from public.deliveries')).rows[0].n,1);
  } finally { await db.close(); }
});
