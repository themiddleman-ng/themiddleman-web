import test from "node:test";
import assert from "node:assert/strict";
import { escrowV2Enabled, gatewayTestEnabled } from "../lib/server/escrow-config.mjs";

const isolatedTestEnvironment = {
  VERCEL_ENV: "preview",
  MARKETPLACE_ESCROW_V2_ENABLED: "true",
  MARKETPLACE_ISOLATED_PREVIEW: "true",
  ESCROW_GATEWAY_TEST_ENABLED: "true",
  NEXT_PUBLIC_SUPABASE_URL: "https://isolated-preview.supabase.co",
  PAYSTACK_SECRET_KEY: "sk_test_example",
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: "pk_test_example",
};

test("checkout stays disabled unless isolated preview and both Paystack test keys are configured", () => {
  assert.equal(gatewayTestEnabled({}), false);
  assert.equal(gatewayTestEnabled({ ...isolatedTestEnvironment, NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: "" }), false);
  assert.equal(gatewayTestEnabled({ ...isolatedTestEnvironment, PAYSTACK_SECRET_KEY: "sk_live_example" }), false);
  assert.equal(gatewayTestEnabled({ ...isolatedTestEnvironment, MARKETPLACE_ISOLATED_PREVIEW: "false" }), false);
  assert.equal(gatewayTestEnabled({ ...isolatedTestEnvironment, NEXT_PUBLIC_SUPABASE_URL: "https://uwigyojtiudefnwjezhm.supabase.co" }), false);
  assert.equal(gatewayTestEnabled({ ...isolatedTestEnvironment, VERCEL_ENV: "production" }), false);
  assert.equal(escrowV2Enabled(isolatedTestEnvironment), true);
  assert.equal(gatewayTestEnabled(isolatedTestEnvironment), true);
});
