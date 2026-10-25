#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { assertIsolatedSupabaseUrl, isolatedDbReason } from "./db-isolated-guard.mjs";

const url = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

try {
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
