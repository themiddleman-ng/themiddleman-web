const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "0.0.0.0"]);

/**
 * Refuse hosted or production Supabase URLs. Only local/isolated endpoints are allowed.
 * @param {string | undefined} rawUrl
 */
export function assertIsolatedSupabaseUrl(rawUrl) {
  const url = (rawUrl ?? "").trim();
  if (!url) {
    throw new Error("Missing SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL — set a local Supabase URL (e.g. http://127.0.0.1:54321).");
  }
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid Supabase URL: ${url}`);
  }
  if (!LOCAL_HOSTS.has(parsed.hostname)) {
    throw new Error(`Refusing non-isolated Supabase URL (${parsed.hostname}). Use local \`supabase start\` only.`);
  }
  if (/supabase\.co/i.test(url)) {
    throw new Error("Refusing hosted supabase.co project URL.");
  }
  return parsed;
}

export function isolatedDbReason() {
  return "Docker daemon is not available in this VM (supabase start requires Docker).";
}
