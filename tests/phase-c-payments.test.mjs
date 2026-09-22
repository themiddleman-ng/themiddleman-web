import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { createWebhookHandler } from '../lib/paystack-webhook.mjs';
import { POST as browserCallback } from '../app/api/payments/verify/route.js';

const secret = 'sk_test_unit_test_only';
const id = '10000000-0000-4000-8000-000000000001';
const reference = `mm_${id}`;
const event = { event: 'charge.success', data: { reference, amount: 500000, currency: 'NGN', status: 'success', domain: 'test' } };
function request(body = JSON.stringify(event), signature = createHmac('sha512', secret).update(body).digest('hex')) {
  return new Request('https://example.test/api/payments/webhook', { method: 'POST', body, headers: { 'x-paystack-signature': signature } });
}

test('HTTP signature, payload and callback boundaries', async () => {
  let writes = 0;
  const handler = createWebhookHandler({ secret, settle: async () => { writes++; } });
  for (const signature of ['', 'bad', 'a'.repeat(128)]) {
    assert.equal((await handler(request(undefined, signature))).status, 401);
  }
  assert.equal(writes, 0);
  const original = JSON.stringify(event);
  assert.equal((await handler(request(original + ' ', createHmac('sha512', secret).update(original).digest('hex')))).status, 401);
  assert.equal((await handler(request('x'.repeat(256 * 1024 + 1)))).status, 413);
  assert.equal((await handler(request('{'))).status, 400);
  for (const change of [{ currency: 'USD' }, { amount: -1 }, { domain: 'live' }, { status: 'failed' }, { reference: 'other' }]) {
    assert.equal((await handler(request(JSON.stringify({ ...event, data: { ...event.data, ...change } })))).status, 400);
  }
  assert.equal((await handler(request(JSON.stringify({ event: 'transfer.success' })))).status, 200);
  assert.equal(writes, 0);
  assert.equal((await browserCallback(request())).status, 202);
  assert.equal(writes, 0);
  assert.equal((await handler(request())).status, 200);
  assert.equal(writes, 1);
  const failing = createWebhookHandler({ secret, settle: async () => { throw new Error('database down'); } });
  assert.equal((await failing(request())).status, 500);
  assert.equal((await createWebhookHandler({ settle: async () => {} })(request())).status, 503);
});

test('PGlite: atomic recording, replay, rollback and direct access denial', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create table public.orders (id uuid primary key, buyer_id uuid, seller_id uuid, gig_id uuid,
        amount numeric not null, status text not null, idempotency_key uuid, updated_at timestamptz default now());
      create table public.payments (id uuid primary key default gen_random_uuid(),
        order_id uuid not null references orders(id), paystack_reference text not null unique,
        amount numeric not null, platform_fee numeric not null default 0,
        escrow_status text not null, payout_status text not null);
      grant usage on schema public to service_role, anon, authenticated;
      grant all on public.orders, public.payments to service_role, authenticated, anon;
      insert into public.orders (id, amount, status) values ('${id}', 5000, 'pending_payment');
    `);
    await db.exec(await readFile(new URL('../supabase/migrations/20260917215825_phase_c_verified_paystack.sql', import.meta.url), 'utf8'));
    await db.exec('set role authenticated');
    await assert.rejects(db.query('select public.record_paystack_payment($1,$2,$3)', [reference, 500000, 'NGN']), { code: '42501' });
    await assert.rejects(db.exec("update public.orders set status='in_escrow'"), { code: '42501' });
    await assert.rejects(db.exec('update public.orders set amount=1'), { code: '42501' });
    await assert.rejects(db.exec("insert into public.payments (order_id,paystack_reference,amount,escrow_status,payout_status) values ('" + id + "','fake',1,'held','pending')"), { code: '42501' });
    await db.exec('reset role; set role service_role');
    const settle = async (data) => db.query('select public.record_paystack_payment($1,$2,$3)', [data.reference, data.amount, data.currency]);
    await assert.rejects(settle({ ...event.data, amount: 1 }));
    await assert.rejects(settle({ ...event.data, currency: 'USD' }));
    await assert.rejects(settle({ ...event.data, reference: 'mm_10000000-0000-4000-8000-000000000002' }));
    assert.equal((await db.query('select count(*)::int as n from payments')).rows[0].n, 0);
    // Force the second write to fail and prove that the payment insert rolls back.
    await db.exec('reset role');
    await db.exec("alter table orders add constraint simulate_failure check(status <> 'in_escrow')");
    await db.exec('set role service_role');
    const handler = createWebhookHandler({ secret, settle });
    assert.equal((await handler(request())).status, 500);
    assert.equal((await db.query('select count(*)::int as n from payments')).rows[0].n, 0);
    await db.exec('reset role; alter table orders drop constraint simulate_failure; set role service_role');
    const responses = await Promise.all([handler(request()), handler(request())]);
    assert.deepEqual(responses.map(r => r.status), [200, 200]);
    assert.equal((await db.query('select count(*)::int as n from payments')).rows[0].n, 1);
    assert.equal((await db.query('select status from orders')).rows[0].status, 'in_escrow');
    assert.equal((await db.query('select payout_status from payments')).rows[0].payout_status, 'pending');
    await db.exec("update orders set status='delivered'");
    assert.equal((await handler(request())).status, 200);
    assert.equal((await db.query('select status from orders')).rows[0].status, 'delivered');
  } finally { await db.close(); }
});
