export const AVATAR_BUCKET = "profile-avatars";
export const OWNER_AVATAR_EVENT = "middleman:avatar-updated";
export const OWNER_AVATAR_CACHE_KEY = "middleman.owner-avatar.v1";

export function metadataAvatarPath(metadata) {
  const path = metadata?.profile_avatar_path;
  if (typeof path !== "string") return null;
  const trimmed = path.trim();
  if (!trimmed || trimmed.includes("..") || trimmed.startsWith("/")) return null;
  return trimmed;
}

export function isAvatarObjectName(name) {
  return /^avatar\.(jpe?g|png|webp)$/i.test(String(name || ""));
}

export function folderAvatarPath(userId, name) {
  if (!userId || !isAvatarObjectName(name)) return null;
  return `${userId}/${name}`;
}

export function candidateAvatarPaths(userId, knownPath) {
  const paths = [];
  if (typeof knownPath === "string" && knownPath) paths.push(knownPath);
  if (!userId) return paths;
  for (const ext of ["jpg", "jpeg", "png", "webp"]) {
    const next = `${userId}/avatar.${ext}`;
    if (!paths.includes(next)) paths.push(next);
  }
  return paths;
}

export function readCachedOwnerAvatar(storage, userId) {
  if (!storage || !userId) return null;
  try {
    const parsed = JSON.parse(storage.getItem(OWNER_AVATAR_CACHE_KEY) || "null");
    if (parsed?.userId === userId && typeof parsed.url === "string") {
      return { userId, path: parsed.path ?? null, url: parsed.url };
    }
  } catch {
    return null;
  }
  return null;
}

export function writeCachedOwnerAvatar(storage, record) {
  if (!storage) return;
  try {
    if (record) storage.setItem(OWNER_AVATAR_CACHE_KEY, JSON.stringify(record));
    else storage.removeItem(OWNER_AVATAR_CACHE_KEY);
  } catch {
    /* Private mode or quota should not block the live photo. */
  }
}
