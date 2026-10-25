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

test("enquiry migration limits daily threads to non-order conversations", async () => {
  const migration = await readFile(
    new URL("../supabase/migrations/20261025140000_pre_purchase_enquiry_limits.sql", import.meta.url),
    "utf8",
  );
  assert.match(migration, /conversation_has_paid_order/);
  assert.match(migration, /not private\.conversation_has_paid_order/);
  assert.match(migration, /messages_body_max_length.*not valid/i);
  assert.match(migration, /conversations_enquiry_one_per_buyer_gig/);
});
