// Cookie-authenticated mutations accept requests from the current site only.
// Payment provider webhooks use a separate signature and do not call this.
export function sameOriginMutation(request) {
  const origin = request.headers.get('origin');
  const fetchSite = request.headers.get('sec-fetch-site');
  const contentType = request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase();
  if (!origin || contentType !== 'application/json' ||
      (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'none')) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
