import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';

const phaseBMigration = new URL(
  '../supabase/migrations/20260917124827_phase_b_server_authoritative_orders.sql',
  import.meta.url,
);

test('Phase B removes direct inserts and enforces idempotent server writes', async () => {
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
      create table public.orders (
        id uuid primary key,
        gig_id uuid not null,
        buyer_id uuid not null,
        seller_id uuid not null,
        amount numeric not null,
        status public.order_status not null default 'pending_payment'
      );
      alter table public.orders enable row level security;
      grant usage on schema public to anon, authenticated;
      grant select, insert, update on public.orders to anon, authenticated;
      create policy "buyers create orders" on public.orders
        for insert with check (auth.uid() = buyer_id);
    `);

    await db.exec(await readFile(phaseBMigration, 'utf8'));
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [
      '00000000-0000-0000-0000-000000000001',
    ]);
    await db.exec('set role authenticated');
    await assert.rejects(
      db.exec(`
        insert into public.orders
          (id, gig_id, buyer_id, seller_id, amount, idempotency_key)
        values
          ('10000000-0000-0000-0000-000000000001',
           '20000000-0000-0000-0000-000000000001',
           '00000000-0000-0000-0000-000000000001',
           '30000000-0000-0000-0000-000000000001',
           1,
           '40000000-0000-4000-8000-000000000001')
      `),
      { code: '42501' },
    );

    await db.exec('reset role');
    await db.exec(`
      insert into public.orders
        (id, gig_id, buyer_id, seller_id, amount, idempotency_key)
      values
        ('10000000-0000-0000-0000-000000000001',
         '20000000-0000-0000-0000-000000000001',
         '00000000-0000-0000-0000-000000000001',
         '30000000-0000-0000-0000-000000000001',
         5000,
         '40000000-0000-4000-8000-000000000001')
    `);
    assert.equal((await db.query('select amount::int as amount from public.orders')).rows[0].amount, 5000);

    await assert.rejects(
      db.exec(`
        insert into public.orders
          (id, gig_id, buyer_id, seller_id, amount, idempotency_key)
        values
          ('10000000-0000-0000-0000-000000000002',
           '20000000-0000-0000-0000-000000000001',
           '00000000-0000-0000-0000-000000000001',
           '30000000-0000-0000-0000-000000000001',
           999,
           '40000000-0000-4000-8000-000000000001')
      `),
      { code: '23505' },
    );
  } finally {
    await db.close();
  }
});
