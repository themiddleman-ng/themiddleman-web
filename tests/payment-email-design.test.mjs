import assert from 'node:assert/strict';
import test from 'node:test';
import { paymentSettledTemplates } from '../lib/server/payment-emails.mjs';

test('buyer, seller and admin receive distinct branded payment summaries', () => {
  const templates = paymentSettledTemplates({
    title: 'Write launch copy',
    amount: 45000,
    orderId: '8860fcba-2693-488f-bb66-696a4b44a1f4',
    buyerEmail: 'buyer@example.com',
    sellerEmail: 'seller@example.com',
    sellerName: 'Samuel Digital Studio',
  });

  assert.match(templates.buyer.subject, /Payment secured/);
  assert.match(templates.seller.subject, /New paid order/);
  assert.match(templates.admin.subject, /Escrow order secured/);
  assert.match(templates.buyer.html, /cid:middleman-logo/);
  assert.match(templates.seller.html, /support@themiddleman\.com\.ng/);
  assert.match(templates.admin.html, /buyer@example\.com/);
  assert.doesNotMatch(templates.seller.html, /buyer@example\.com/);
  assert.equal(templates.admin.attachments[0].content_id, 'middleman-logo');
});

test('email templates escape product markup', () => {
  const templates = paymentSettledTemplates({
    title: '<script>alert(1)</script>',
    amount: 45000,
    orderId: '8860fcba-2693-488f-bb66-696a4b44a1f4',
    buyerEmail: 'buyer@example.com',
    sellerEmail: 'seller@example.com',
    sellerName: 'Seller',
  });

  assert.doesNotMatch(templates.buyer.html, /<script>/);
  assert.match(templates.buyer.html, /&lt;script&gt;/);
});
