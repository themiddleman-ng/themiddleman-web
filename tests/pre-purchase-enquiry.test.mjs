import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { prePurchaseEnquiryEnabled } from "../lib/server/messaging-config.mjs";

test("pre-purchase enquiry defaults off", () => {
  assert.equal(prePurchaseEnquiryEnabled({}), false);
  assert.equal(prePurchaseEnquiryEnabled({ MARKETPLACE_PRE_PURCHASE_ENQUIRY_ENABLED: "false" }), false);
  assert.equal(prePurchaseEnquiryEnabled({ MARKETPLACE_PRE_PURCHASE_ENQUIRY_ENABLED: "true" }), true);
});

test("conversations route gates on paid orders unless enquiry flag is enabled", async () => {
  const route = await readFile(new URL("../app/api/conversations/route.ts", import.meta.url), "utf8");
  assert.match(route, /prePurchaseEnquiryEnabled/);
  assert.match(route, /paid order for this product/);
  assert.match(route, /ENQUIRY_DAILY_THREAD_LIMIT/);
  assert.match(route, /cannot message yourself/i);
});

test("buying reuses the enquiry thread and a unique violation is not a 500", async () => {
  const route = await readFile(new URL("../app/api/conversations/route.ts", import.meta.url), "utf8");
  const orders = await readFile(new URL("../app/api/orders/route.ts", import.meta.url), "utf8");
  assert.match(route, /\.eq\('buyer_id', user\.id\)\.eq\('gig_id', gig\.id\)\.limit\(1\)/);
  assert.match(route, /seller_id: seller/);
  assert.doesNotMatch(route, /seller_id:\s*gig\.seller_id/);
  assert.match(route, /order creation does not insert a conversation/);
  assert.doesNotMatch(orders, /from\(['"]conversations['"]\)/);
  const uniqueBlock = route.slice(route.indexOf("error?.code === '23505'"));
  assert.match(uniqueBlock, /You already have a conversation about this product/);
  assert.match(uniqueBlock, /racedRows/);
  const beforeGenericFailure = uniqueBlock.split("return error")[0];
  assert.match(beforeGenericFailure, /409/);
  assert.doesNotMatch(beforeGenericFailure, /, 500/);
});

test("enquiry migration limits daily threads to non-order conversations", async () => {
  const migration = await readFile(
    new URL("../supabase/migrations/20261025140000_pre_purchase_enquiry_limits.sql", import.meta.url),
    "utf8",
  );
  assert.match(migration, /conversation_has_paid_order/);
  assert.match(migration, /not private\.conversation_has_paid_order/);
  assert.match(migration, /o\.status in \('in_escrow', 'delivered', 'approved', 'disputed'\)/);
  assert.match(migration, /pending_payment — order insert/);
  assert.match(migration, /refunded\s+— finish_escrow_operation/);
  const rollback = await readFile(
    new URL("../supabase/rollbacks/20261025140000_pre_purchase_enquiry_limits_rollback.sql", import.meta.url),
    "utf8",
  );
  assert.match(rollback, /in_escrow, delivered, approved, and disputed/);
  assert.match(rollback, /pending_payment and refunded/);
  const preflight = await readFile(
    new URL("../supabase/preflight/2026-10-25_preflight.sql", import.meta.url),
    "utf8",
  );
  assert.match(preflight, /select status, count\(\*\)/);
  assert.match(preflight, /bypass: in_escrow, delivered, approved, disputed/);
  assert.match(migration, /messages_body_max_length.*not valid/i);
  assert.match(migration, /conversations_enquiry_one_per_buyer_gig/);
});
