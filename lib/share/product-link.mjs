/** Production canonical once this Next app is what serves themiddleman.com.ng.
 *  The public host still returns a platform 404 for /gigs/*, so preview
 *  deployments must not send product links there. */
export const PRODUCTION_ORIGIN = "https://themiddleman.com.ng";
export const PRODUCT_ORIGIN = PRODUCTION_ORIGIN;

const PREVIEW_HOST = /^themiddleman-web(?:-[a-z0-9-]+)?\.vercel\.app$/;

function previewHost(value) {
  if (typeof value !== "string") return null;
  const host = value.trim().toLowerCase();
  if (!host || /[:/@\\]/.test(host) || host.includes("://") || host.includes("/") || host.includes("..")) return null;
  return PREVIEW_HOST.test(host) ? host : null;
}

/** Origin that actually serves /gigs/<id>. Preview uses Vercel's branch or
 *  deployment host. Request Host is ignored. An invalid preview host is null
 *  so the menu does not fall back to the public 404. */
export function shareOrigin(env = process.env) {
  if (env && env.VERCEL_ENV === "preview") {
    const host = previewHost(env.VERCEL_BRANCH_URL) || previewHost(env.VERCEL_URL);
    return host ? `https://${host}` : null;
  }
  return PRODUCTION_ORIGIN;
}

export function productShareUrl(id, env = process.env) {
  const origin = shareOrigin(env);
  if (!origin) return null;
  return `${origin}/gigs/${encodeURIComponent(id)}`;
}

export function productShareImageUrl(id, env = process.env) {
  const page = productShareUrl(id, env);
  return page ? `${page}/opengraph-image` : null;
}

export function whatsappShareHref(title, url) {
  return `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`;
}

export function shareDescription({ sellerName, summary, priceLabel } = {}) {
  const parts = [sellerName, summary, priceLabel]
    .map((part) => (typeof part === "string" ? part.trim().replace(/[.]+$/g, "") : ""))
    .filter(Boolean);
  return parts.length ? `${parts.join(". ")}.` : "";
}
