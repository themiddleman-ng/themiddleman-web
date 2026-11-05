#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { assertIsolatedSupabaseEnv, assertIsolatedSupabaseUrl, isolatedDbReason } from "./db-isolated-guard.mjs";

const url = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

try {
  assertIsolatedSupabaseEnv(process.env);
  if (process.env.DATABASE_URL) assertIsolatedSupabaseUrl(process.env.DATABASE_URL);
  if (!url) throw new Error("SUPABASE_DB_URL is required to run RLS SQL.");
  assertIsolatedSupabaseUrl(url);
} catch (error) {
  console.error(error.message);
  console.error(isolatedDbReason());
  process.exit(2);
}

const sql = readFileSync(new URL("./rls-test-suite.sql", import.meta.url), "utf8");
const result = spawnSync("psql", [url, "-v", "ON_ERROR_STOP=1", "-f", "-"], { input: sql, encoding: "utf8" });
process.stdout.write(result.stdout ?? "");
process.stderr.write(result.stderr ?? "");
process.exit(result.status ?? 1);
