import assert from 'node:assert/strict';
import test from 'node:test';
import { settlePaystackPayment } from '../lib/server/paystack-settlement.mjs';
import { paymentSettledTemplates } from '../lib/server/payment-emails.mjs';

const payment = {
  reference: 'mm_10000000-0000-4000-8000-000000000001',
  amount: 4500000,
  currency: 'NGN',
};

test('recorded payment triggers notifications', async () => {
  let notifications = 0;
  const admin = {
    rpc: async () => ({ data: 'recorded', error: null }),
  };

  const outcome = await settlePaystackPayment({
    admin,
    payment,
    notify: async () => {
      notifications += 1;
      return { ok: true };
    },
  });

  assert.equal(outcome, 'recorded');
  assert.equal(notifications, 1);
});

test('duplicate verification retries durable notifications without changing payment state', async () => {
  let notifications = 0;
  const admin = {
    rpc: async () => ({ data: 'duplicate', error: null }),
  };

  const outcome = await settlePaystackPayment({
    admin,
    payment,
    notify: async () => {
      notifications += 1;
      return { ok: true };
    },
  });

  assert.equal(outcome, 'duplicate');
  assert.equal(notifications, 1);
});

test('email failure never rolls back a recorded payment', async () => {
  const admin = {
    rpc: async () => ({ data: 'recorded', error: null }),
  };

  const outcome = await settlePaystackPayment({
    admin,
    payment,
    notify: async () => {
      throw new Error('Resend unavailable');
    },
  });

  assert.equal(outcome, 'recorded');
});

test('payment email templates escape product markup and preserve buyer privacy', () => {
  const templates = paymentSettledTemplates({
    title: '<script>alert(1)</script>',
    amount: 45000,
  });

  assert.doesNotMatch(templates.buyer.html, /<script>/);
  assert.match(templates.buyer.html, /&lt;script&gt;/);
  assert.match(templates.seller.text, /buyer/i);
  assert.doesNotMatch(templates.seller.text, /buyer@example\.com/i);
});
