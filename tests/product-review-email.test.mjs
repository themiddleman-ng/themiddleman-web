import test from "node:test";
import assert from "node:assert/strict";
import { productReviewEmailTemplate } from "../lib/server/payment-emails.mjs";

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
