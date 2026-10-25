#!/usr/bin/env node
/**
 * Promote a test user to admin on localhost or the escrow preview project only.
 * Usage: SUPABASE_DB_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres node scripts/seed-test-admin.mjs <user-uuid>
 */
import { spawnSync } from "node:child_process";
import { assertIsolatedSupabaseEnv, assertIsolatedSupabaseUrl, isolatedDbReason } from "./db-isolated-guard.mjs";

const userId = process.argv[2];
if (!userId) {
  console.error("Usage: node scripts/seed-test-admin.mjs <user-uuid>");
  process.exit(1);
}

const url = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
try {
  assertIsolatedSupabaseEnv(process.env);
  if (process.env.DATABASE_URL) assertIsolatedSupabaseUrl(process.env.DATABASE_URL);
  assertIsolatedSupabaseUrl(url);
} catch (error) {
  console.error(error.message);
  console.error(isolatedDbReason());
  process.exit(2);
}

const sql = `
update public.users
set role = 'admin'
where id = '${userId}'::uuid;
`;

const result = spawnSync("psql", [url, "-v", "ON_ERROR_STOP=1", "-c", sql], { encoding: "utf8" });
process.stdout.write(result.stdout ?? "");
process.stderr.write(result.stderr ?? "");

if (result.status === 0) {
  console.log("\nAdmin role granted on isolated DB only.");
  console.log("Enable MFA in Supabase Auth for this user before exercising /admin in production-like setups.");
}
process.exit(result.status ?? 1);
