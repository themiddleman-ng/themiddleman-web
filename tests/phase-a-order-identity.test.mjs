import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';

const migrationUrl = new URL(
  '../supabase/migrations/20260917123912_phase_a_order_identity_and_status.sql',
  import.meta.url,
);

const buyerId = '00000000-0000-0000-0000-000000000001';
const sellerUserId = '00000000-0000-0000-0000-000000000002';
const unrelatedId = '00000000-0000-0000-0000-000000000003';
const sellerProfileId = '10000000-0000-0000-0000-000000000002';
const gigId = '20000000-0000-0000-0000-000000000001';

async function setUser(db, userId) {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId]);
  await db.exec('set role authenticated');
}

test('Phase A aligns order statuses and seller identity', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon nologin nosuperuser nobypassrls;
      create role authenticated nologin nosuperuser nobypassrls;
      create schema auth;
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      create type public.order_status as enum (
        'pending_payment', 'in_escrow', 'delivered', 'approved', 'disputed', 'refunded'
      );
      create table public.seller_profiles (id uuid primary key, user_id uuid not null unique);
      create table public.orders (
        id uuid primary key,
        gig_id uuid not null,
        buyer_id uuid not null,
        seller_id uuid not null references public.seller_profiles(id),
        amount numeric not null,
        status text not null default 'pending',
        constraint orders_status_check check (
          status in ('pending', 'in_progress', 'delivered', 'completed', 'disputed', 'cancelled')
        )
      );
      alter table public.seller_profiles enable row level security;
      alter table public.orders enable row level security;
      grant usage on schema public to authenticated;
      grant select on public.seller_profiles to authenticated;
      grant select, insert, update on public.orders to authenticated;
      create policy "public can read seller profiles" on public.seller_profiles for select using (true);
      create policy "buyers and sellers view their own orders" on public.orders
        for select using (auth.uid() = buyer_id or auth.uid() = seller_id);
      create policy "buyers create orders" on public.orders
        for insert with check (auth.uid() = buyer_id);
      create policy "buyers and sellers update their own orders" on public.orders
        for update using (auth.uid() = buyer_id or auth.uid() = seller_id);
    `);

    await db.exec(await readFile(migrationUrl, 'utf8'));
    await db.query('insert into public.seller_profiles values ($1, $2)', [sellerProfileId, sellerUserId]);

    await setUser(db, buyerId);
    await db.query(
      'insert into public.orders values ($1, $2, $3, $4, $5, $6)',
      ['30000000-0000-0000-0000-000000000001', gigId, buyerId, sellerProfileId, 5000, 'pending_payment'],
    );

    await setUser(db, sellerUserId);
    assert.equal((await db.query('select count(*)::int as count from public.orders')).rows[0].count, 1);

    await setUser(db, unrelatedId);
    assert.equal((await db.query('select count(*)::int as count from public.orders')).rows[0].count, 0);

    await setUser(db, sellerUserId);
    await assert.rejects(
      db.query(
        'insert into public.orders values ($1, $2, $3, $4, $5, $6)',
        ['30000000-0000-0000-0000-000000000002', gigId, sellerUserId, sellerProfileId, 5000, 'pending_payment'],
      ),
      { code: '23514' },
    );

    await setUser(db, buyerId);
    for (const status of ['in_escrow', 'delivered', 'approved', 'disputed', 'refunded']) {
      await db.query('update public.orders set status = $1 where buyer_id = $2', [status, buyerId]);
    }
    await assert.rejects(
      db.query('update public.orders set status = $1 where buyer_id = $2', ['completed', buyerId]),
      { code: '22P02' },
    );
  } finally {
    await db.close();
  }
});
