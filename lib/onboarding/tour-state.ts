export type TourState = { version: 2; optedIn: boolean; seen: Record<string, boolean> };
export function tourKey(pathname: string): string {
  pathname = pathname.replace(/\/$/, '') || '/';
  if (/^\/gigs\/[^/]+$/.test(pathname) && !['/gigs/new', '/gigs/mine'].includes(pathname)) return '/gigs/detail';
  return pathname.replace(/\/$/, '') || '/';
}
export function readTourState(value: unknown): TourState | null {
  if (!value || typeof value !== 'object') return null;
  const state = value as Partial<TourState>;
  if (state.version !== 2 || typeof state.optedIn !== 'boolean' || !state.seen || typeof state.seen !== 'object') return null;
  return { version: 2, optedIn: state.optedIn, seen: Object.fromEntries(Object.entries(state.seen).filter(([, seen]) => seen === true)) };
}
export function mergeTourStates(remote: TourState | null, local: TourState | null): TourState | null {
  if (!remote) return local;
  if (!local) return remote;
  // A completed/dismissed page is terminal, even when a slower device write arrives.
  return { version: 2, optedIn: local.optedIn, seen: { ...remote.seen, ...local.seen } };
}
export function markTourSeen(state: TourState, pathname: string): TourState {
  return { ...state, seen: { ...state.seen, [tourKey(pathname)]: true } };
}
