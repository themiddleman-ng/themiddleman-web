export function safeNextPath(value) {
  const next = String(value ?? "").trim();
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "";
  if (next.includes("://") || next.includes("\\")) return "";
  return next;
}

/** Read `next` or `returnTo` from a URLSearchParams-like object. */
export function readReturnPath(searchParams) {
  if (!searchParams) return "";
  const raw =
    typeof searchParams.get === "function"
      ? searchParams.get("next") ?? searchParams.get("returnTo")
      : searchParams.next ?? searchParams.returnTo;
  return safeNextPath(raw);
}

export function signinHref(returnPath = "") {
  const next = safeNextPath(returnPath);
  return next ? `/signup?mode=signin&next=${encodeURIComponent(next)}` : "/signup?mode=signin";
}

export function authModeHref(mode = "signin", returnPath = "") {
  const params = new URLSearchParams();
  params.set("mode", mode === "signup" ? "signup" : "signin");
  const next = safeNextPath(returnPath);
  if (next) params.set("next", next);
  return `/signup?${params.toString()}`;
}
