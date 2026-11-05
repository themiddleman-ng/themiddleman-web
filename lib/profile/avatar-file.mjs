const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const CONVERTIBLE = ["image/heic", "image/heif", "image/heic-sequence", "image/avif"];

export function guessImageType(file) {
  const type = String(file?.type || "").toLowerCase();
  if (type.startsWith("image/")) return type;
  const name = String(file?.name || "").toLowerCase();
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".gif")) return "image/gif";
  if (name.endsWith(".heic") || name.endsWith(".heif")) return "image/heic";
  if (name.endsWith(".avif")) return "image/avif";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".jfif")) return "image/jpeg";
  return "";
}

export function avatarExtension(type) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

export function classifyAvatarFile(file, maxBytes = 3 * 1024 * 1024) {
  if (!file) {
    return { ok: false, code: "missing", message: "Choose a photo to upload." };
  }
  if (file.size > maxBytes) {
    return { ok: false, code: "too-large", message: "This photo is over 3 MB. Choose a smaller image." };
  }
  const rawType = String(file?.type || "").toLowerCase();
  const name = String(file?.name || "").toLowerCase();
  if (rawType && !rawType.startsWith("image/") && rawType !== "application/octet-stream") {
    return { ok: false, code: "type", message: "Use a JPG, PNG, WebP, or a photo from your camera roll." };
  }
  if (/\.(pdf|gif|svg|mp4|mov|webm|zip|doc|docx|txt)$/.test(name)) {
    return { ok: false, code: "type", message: "Use a JPG, PNG, WebP, or a photo from your camera roll." };
  }
  const type = guessImageType(file);
  if (type === "image/gif" || (type && !type.startsWith("image/"))) {
    return { ok: false, code: "type", message: "Use a JPG, PNG, WebP, or a photo from your camera roll." };
  }
  if (type && !ALLOWED.includes(type) && !CONVERTIBLE.includes(type)) {
    return { ok: false, code: "type", message: "Use a JPG, PNG, WebP, or a photo from your camera roll." };
  }
  return { ok: true, type, needsConvert: Boolean(type) && !ALLOWED.includes(type) };
}

export function avatarStoragePath(userId, type) {
  return `${userId}/avatar.${avatarExtension(type)}`;
}
