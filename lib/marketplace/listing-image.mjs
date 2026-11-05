/** Local sample files live in public/ and start with "/". Storage paths stay in gig-media.
 * @param {string | null | undefined} path
 * @param {string | null | undefined} [storagePublicUrl]
 * @returns {string | null}
 */
export function listingImageSrc(path, storagePublicUrl = null) {
  if (!path || typeof path !== "string") return null;
  if (path.startsWith("/") || path.startsWith("https://") || path.startsWith("http://")) return path;
  return storagePublicUrl;
}
