#!/usr/bin/env node
/**
 * Guarded test-purchase orchestrator for isolated Supabase + Paystack TEST keys only.
 * Does not mutate production. Use --dry-run to validate environment without writes.
 */
import { pathToFileURL } from "node:url";
import { assertIsolatedSupabaseUrl } from "./db-isolated-guard.mjs";

function parseArgs(argv) {
  return { dryRun: argv.includes("--dry-run") };
}

export function assertIsolatedTestEnvironment(env = process.env) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL || "";
  let host = "";
  try {
    host = assertIsolatedSupabaseUrl(url).hostname;
  } catch (error) {
    throw new Error(`Refusing to run: ${error instanceof Error ? error.message : "NEXT_PUBLIC_SUPABASE_URL is missing or invalid."}`);
  }
  if (env.SUPABASE_DB_URL) {
    try {
      assertIsolatedSupabaseUrl(env.SUPABASE_DB_URL);
    } catch (error) {
      throw new Error(`Refusing to run: ${error instanceof Error ? error.message : "SUPABASE_DB_URL is not the escrow preview."}`);
    }
  }
  const secret = env.PAYSTACK_SECRET_KEY || "";
  if (!/^sk_test_/.test(secret)) {
    throw new Error("Refusing to run: PAYSTACK_SECRET_KEY must start with sk_test_.");
  }
  const publicKey = env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";
  if (!/^pk_test_/.test(publicKey)) {
    throw new Error("Refusing to run: NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY must start with pk_test_.");
  }
  if (env.VERCEL_ENV === "production") {
    throw new Error("Refusing to run: VERCEL_ENV is production.");
  }
  return { host, dryRunSafe: true };
}

async function main() {
  const { dryRun } = parseArgs(process.argv.slice(2));
  const guard = assertIsolatedTestEnvironment();
  console.log(`Environment OK for isolated test purchase (host=${guard.host}).`);
  if (dryRun) {
    console.log("Dry run only — no database or Paystack calls were made.");
    return;
  }
  console.log(
    "Full orchestration requires a running Next.js app and seeded isolated DB. " +
      "Follow docs/test-purchase-checklist.md for manual steps; extend this script when fixtures exist.",
  );
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}
