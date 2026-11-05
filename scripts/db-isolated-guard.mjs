const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "0.0.0.0", "::1"]);

/** Production project. Never use for tests, db push, seeds, or inspect scripts. */
export const PRODUCTION_PROJECT_REF = "uwigyojtiudefnwjezhm";

/** the-middleman-escrow-preview. The only hosted project these scripts may use. */
export const TEST_PROJECT_REF = "vhfskuabgsudbaiqotth";

export const PRODUCTION_SUPABASE_HOST = `${PRODUCTION_PROJECT_REF}.supabase.co`;
export const TEST_SUPABASE_HOST = `${TEST_PROJECT_REF}.supabase.co`;

const TEST_HOSTS = new Set([
  TEST_SUPABASE_HOST,
  `db.${TEST_SUPABASE_HOST}`,
]);

/**
 * Allow localhost or the escrow preview project only.
 * Refuse production and every other host, including other *.supabase.co projects.
 * @param {string | undefined} rawUrl
 */
export function assertIsolatedSupabaseUrl(rawUrl) {
  const url = (rawUrl ?? "").trim();
  if (!url) {
    throw new Error(
      "Missing Supabase URL. Set NEXT_PUBLIC_SUPABASE_URL or SUPABASE_DB_URL to localhost or the escrow preview project (vhfskuabgsudbaiqotth).",
    );
  }
  if (url.includes(PRODUCTION_PROJECT_REF)) {
    throw new Error(`Refusing production Supabase project (${PRODUCTION_PROJECT_REF}).`);
  }
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid Supabase URL.");
  }
  const host = parsed.hostname.replace(/^\[|\]$/g, "");
  if (LOCAL_HOSTS.has(host)) return parsed;
  if (TEST_HOSTS.has(parsed.hostname)) return parsed;
  if (parsed.hostname.endsWith(".pooler.supabase.com")) {
    const user = decodeURIComponent(parsed.username || "");
    if (user.includes(TEST_PROJECT_REF)) return parsed;
  }
  throw new Error(
    `Refusing Supabase host ${parsed.hostname || "(empty)"}. Only localhost and project ${TEST_PROJECT_REF} (the-middleman-escrow-preview) are allowed.`,
  );
}

/**
 * Check both connection env vars. Each one that is set must pass.
 * At least one must be set. A production value in either var is a refusal
 * even when the other var points at the test project.
 * @param {NodeJS.ProcessEnv} [env]
 */
export function assertIsolatedSupabaseEnv(env = process.env) {
  const api = (env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const db = (env.SUPABASE_DB_URL || "").trim();
  if (!api && !db) {
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_DB_URL to localhost or project vhfskuabgsudbaiqotth.",
    );
  }
  if (api) assertIsolatedSupabaseUrl(api);
  if (db) assertIsolatedSupabaseUrl(db);
  return { api: api || null, db: db || null };
}

export function isolatedDbReason() {
  return "Docker daemon is not available in this VM (supabase start requires Docker). Use localhost or the escrow preview project vhfskuabgsudbaiqotth and set SUPABASE_DB_URL to its connection string. Do not use production uwigyojtiudefnwjezhm.";
}
