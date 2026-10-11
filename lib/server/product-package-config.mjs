const PRODUCTION_SUPABASE_HOST = "uwigyojtiudefnwjezhm.supabase.co";

export function productPackagesEnabled(env = process.env) {
  try {
    if (
      env.MARKETPLACE_PRODUCT_PACKAGES_ENABLED !== "true" ||
      env.NEXT_PUBLIC_MARKETPLACE_PRODUCT_PACKAGES_ENABLED !== "true" ||
      env.MARKETPLACE_ISOLATED_PREVIEW !== "true" ||
      env.VERCEL_ENV === "production"
    ) return false;

    const url = new URL(env.NEXT_PUBLIC_SUPABASE_URL || "");
    return Boolean(url.hostname) && url.hostname !== PRODUCTION_SUPABASE_HOST;
  } catch {
    return false;
  }
}
