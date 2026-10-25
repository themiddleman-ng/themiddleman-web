const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "0.0.0.0"]);

/** Hosted production project — never use for RLS tests or migration apply from agents. */
export const PRODUCTION_SUPABASE_HOST = "uwigyojtiudefnwjezhm.supabase.co";

/**
 * Refuse production Supabase. Allow local CLI and separate free-tier preview projects.
 * Matches escrow v2 host checks in lib/server/escrow-config.mjs.
 * @param {string | undefined} rawUrl
 */
export function assertIsolatedSupabaseUrl(rawUrl) {
  const url = (rawUrl ?? "").trim();
  if (!url) {
    throw new Error("Missing SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL — set a local Supabase URL (e.g. http://127.0.0.1:54321) or your isolated preview project URL.");
  }
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid Supabase URL: ${url}`);
  }
  if (parsed.hostname === PRODUCTION_SUPABASE_HOST) {
    throw new Error(`Refusing production Supabase host (${PRODUCTION_SUPABASE_HOST}).`);
  }
  if (LOCAL_HOSTS.has(parsed.hostname)) {
    return parsed;
  }
  if (/\.supabase\.co$/i.test(parsed.hostname)) {
    return parsed;
  }
  throw new Error(`Refusing non-isolated Supabase URL (${parsed.hostname}). Use local supabase start or a dedicated preview project.`);
}

export function isolatedDbReason() {
  return "Docker daemon is not available in this VM (supabase start requires Docker). Use a second free Supabase project and set SUPABASE_DB_URL to its connection string.";
}
