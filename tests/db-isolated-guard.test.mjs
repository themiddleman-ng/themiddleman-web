import assert from "node:assert/strict";
import test from "node:test";
import {
  assertIsolatedSupabaseEnv,
  assertIsolatedSupabaseUrl,
  PRODUCTION_PROJECT_REF,
  TEST_PROJECT_REF,
} from "../scripts/db-isolated-guard.mjs";

test("guard allows only localhost and the escrow preview ref", () => {
  assert.equal(assertIsolatedSupabaseUrl("http://localhost:54321").hostname, "localhost");
  assert.equal(assertIsolatedSupabaseUrl("http://127.0.0.1:54322").hostname, "127.0.0.1");
  assert.equal(
    assertIsolatedSupabaseUrl(`https://${TEST_PROJECT_REF}.supabase.co`).hostname,
    `${TEST_PROJECT_REF}.supabase.co`,
  );
  assert.equal(
    assertIsolatedSupabaseUrl(`postgresql://postgres:secret@db.${TEST_PROJECT_REF}.supabase.co:5432/postgres`).hostname,
    `db.${TEST_PROJECT_REF}.supabase.co`,
  );
  const pooler = assertIsolatedSupabaseUrl(
    `postgresql://postgres.${TEST_PROJECT_REF}:secret@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`,
  );
  assert.equal(pooler.hostname, "aws-0-eu-west-1.pooler.supabase.com");
});

test("guard refuses production, other projects, and a production database url beside a test API url", () => {
  assert.throws(
    () => assertIsolatedSupabaseUrl(`https://${PRODUCTION_PROJECT_REF}.supabase.co`),
    /production/i,
  );
  assert.throws(
    () => assertIsolatedSupabaseUrl(`postgresql://postgres:secret@db.${PRODUCTION_PROJECT_REF}.supabase.co:5432/postgres`),
    /production/i,
  );
  assert.throws(() => assertIsolatedSupabaseUrl("https://other-project.supabase.co"), /Refusing Supabase host/);
  assert.throws(() => assertIsolatedSupabaseUrl("https://example.com"), /Refusing Supabase host/);
  assert.throws(
    () =>
      assertIsolatedSupabaseEnv({
        NEXT_PUBLIC_SUPABASE_URL: `https://${TEST_PROJECT_REF}.supabase.co`,
        SUPABASE_DB_URL: `postgresql://postgres:secret@db.${PRODUCTION_PROJECT_REF}.supabase.co:5432/postgres`,
      }),
    /production/i,
  );
  assert.throws(() => assertIsolatedSupabaseEnv({}), /NEXT_PUBLIC_SUPABASE_URL/);
});

test("guard checks both NEXT_PUBLIC_SUPABASE_URL and SUPABASE_DB_URL", () => {
  const ok = assertIsolatedSupabaseEnv({
    NEXT_PUBLIC_SUPABASE_URL: `https://${TEST_PROJECT_REF}.supabase.co`,
    SUPABASE_DB_URL: `postgresql://postgres:secret@db.${TEST_PROJECT_REF}.supabase.co:5432/postgres`,
  });
  assert.match(ok.api, new RegExp(TEST_PROJECT_REF));
  assert.match(ok.db, new RegExp(TEST_PROJECT_REF));
  const apiOnly = assertIsolatedSupabaseEnv({
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  });
  assert.equal(apiOnly.db, null);
});
