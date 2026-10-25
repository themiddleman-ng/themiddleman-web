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
});
