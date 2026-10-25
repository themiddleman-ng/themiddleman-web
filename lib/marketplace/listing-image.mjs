/** Local sample files live in public/ and start with "/". Storage paths stay in gig-media. */
export function listingImageSrc(path, storagePublicUrl = null) {
  if (!path || typeof path !== "string") return null;
  if (path.startsWith("/") || path.startsWith("https://") || path.startsWith("http://")) return path;
  return storagePublicUrl;
}
