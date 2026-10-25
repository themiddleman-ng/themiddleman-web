import assert from "node:assert/strict";
import test from "node:test";
import { assertIsolatedTestEnvironment } from "../scripts/test-purchase-flow.mjs";

const isolated = {
  NEXT_PUBLIC_SUPABASE_URL: "https://vhfskuabgsudbaiqotth.supabase.co",
  SUPABASE_DB_URL: "postgresql://postgres:secret@db.vhfskuabgsudbaiqotth.supabase.co:5432/postgres",
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

test("test purchase guard accepts the escrow preview and localhost", () => {
  const result = assertIsolatedTestEnvironment(isolated);
  assert.equal(result.host, "vhfskuabgsudbaiqotth.supabase.co");
  const local = assertIsolatedTestEnvironment({
    ...isolated,
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    SUPABASE_DB_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  });
  assert.equal(local.host, "127.0.0.1");
});

test("test purchase guard rejects other supabase projects and a production database url", () => {
  assert.throws(
    () =>
      assertIsolatedTestEnvironment({
        ...isolated,
        NEXT_PUBLIC_SUPABASE_URL: "https://other-project.supabase.co",
      }),
    /Refusing to run/,
  );
  assert.throws(
    () =>
      assertIsolatedTestEnvironment({
        ...isolated,
        SUPABASE_DB_URL: "postgresql://postgres:secret@db.uwigyojtiudefnwjezhm.supabase.co:5432/postgres",
      }),
    /production/i,
  );
});
