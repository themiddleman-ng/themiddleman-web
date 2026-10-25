import assert from "node:assert/strict";
import test from "node:test";
import { assertIsolatedTestEnvironment } from "../scripts/test-purchase-flow.mjs";

const isolated = {
  NEXT_PUBLIC_SUPABASE_URL: "https://local-test.supabase.co",
  PAYSTACK_SECRET_KEY: "sk_test_example",
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: "pk_test_example",
  VERCEL_ENV: "preview",
};

test("test purchase guard rejects production supabase host", () => {
  assert.throws(
    () =>
      assertIsolatedTestEnvironment({
        ...isolated,
        NEXT_PUBLIC_SUPABASE_URL: "https://uwigyojtiudefnwjezhm.supabase.co",
      }),
    /Refusing to run/,
  );
});

test("test purchase guard rejects live paystack keys", () => {
  assert.throws(
    () => assertIsolatedTestEnvironment({ ...isolated, PAYSTACK_SECRET_KEY: "sk_live_x" }),
    /sk_test_/,
  );
});

test("test purchase guard accepts isolated test env", () => {
  const result = assertIsolatedTestEnvironment(isolated);
  assert.equal(result.host, "local-test.supabase.co");
});
