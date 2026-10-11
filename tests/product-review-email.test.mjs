import test from "node:test";
import assert from "node:assert/strict";
import { paymentSettledTemplates, productReviewEmailTemplate } from "../lib/server/payment-emails.mjs";

test("product review email uses the operational Middleman style and escapes seller notes", () => {
  const result = productReviewEmailTemplate({
    title: "Portfolio template",
    decision: "request_changes",
    reasonCategory: "product_package",
    notes: "<script>alert(1)</script> Remove the private key.",
  });
  assert.equal(result.subject, "We need a few changes to your product");
  assert.match(result.text, /Remove the private key/);
  assert.doesNotMatch(result.html, /<script>/);
  assert.match(result.html, /&lt;script&gt;/);
  assert.match(result.html, /The Middleman/);
});


test("prebuilt product purchase email tells the buyer to download and the seller needs no manual handoff", () => {
  const templates = paymentSettledTemplates({
    title: "Portfolio template",
    amount: 15000,
    sellerAmount: 13500,
    orderId: "12345678-1234-4234-8234-123456789abc",
    buyerEmail: "buyer@example.com",
    sellerEmail: "seller@example.com",
    sellerName: "Creator",
    productVersionId: "98765432-1234-4234-8234-123456789abc",
  });
  assert.match(templates.buyer.subject, /Your product is ready/);
  assert.match(templates.buyer.text, /ready to download/);
  assert.match(templates.buyer.html, /Download your product/);
  assert.match(templates.seller.text, /No manual file delivery is needed/);
  assert.doesNotMatch(templates.seller.text, /Start work/);
});
