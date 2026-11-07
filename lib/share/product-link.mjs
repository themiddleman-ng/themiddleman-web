/** Canonical product links. Apex host, matching metadataBase. Not a new URL per click. */
export const PRODUCT_ORIGIN = "https://themiddleman.com.ng";

export function productShareUrl(id) {
  return `${PRODUCT_ORIGIN}/gigs/${encodeURIComponent(id)}`;
}

export function productShareImageUrl(id) {
  return `${productShareUrl(id)}/opengraph-image`;
}

export function whatsappShareHref(title, url) {
  return `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`;
}
