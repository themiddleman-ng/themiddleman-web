import path from "node:path";

const ALLOWED = new Set([".png", ".jpg", ".jpeg", ".webp"]);

/** A cover inside public/. Remote URLs and paths that leave public/ are refused. */
export function localPublicImage(cover, cwd = process.cwd()) {
  if (typeof cover !== "string" || !cover.startsWith("/") || cover.startsWith("//")) return null;
  if (cover.includes("\\") || cover.includes("\0") || cover.includes("://")) return null;
  const root = path.resolve(cwd, "public");
  const file = path.resolve(root, cover.slice(1));
  const relative = path.relative(root, file);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) return null;
  if (!ALLOWED.has(path.extname(file).toLowerCase())) return null;
  return file;
}
