// A preview often shares production's database. New escrow writes must be
// explicitly enabled on an isolated database, never just on a Vercel preview.
export function escrowV2Enabled(env = process.env) {
  try {
    return (
      env.MARKETPLACE_ESCROW_V2_ENABLED === "true" &&
      env.MARKETPLACE_ISOLATED_PREVIEW === "true" &&
      env.VERCEL_ENV !== "production" &&
      !!env.NEXT_PUBLIC_SUPABASE_URL &&
      new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname !==
        "uwigyojtiudefnwjezhm.supabase.co"
    );
  } catch {
    return false;
  }
}

export function gatewayTestEnabled(env = process.env) {
  return (
    escrowV2Enabled(env) &&
    env.ESCROW_GATEWAY_TEST_ENABLED === "true" &&
    /^sk_test_/.test(env.PAYSTACK_SECRET_KEY ?? "")
  );
}
