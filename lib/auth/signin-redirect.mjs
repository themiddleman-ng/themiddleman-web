export function safeNextPath(value) {
  const next = String(value ?? "").trim();
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "";
  if (next.includes("://") || next.includes("\\")) return "";
  return next;
}

export function signinHref(returnPath = "") {
  const next = safeNextPath(returnPath);
  return next ? `/signup?mode=signin&next=${encodeURIComponent(next)}` : "/signup?mode=signin";
}
