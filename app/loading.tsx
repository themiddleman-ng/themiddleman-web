export default function Loading() {
  return <div role="status" aria-label="Loading page" className="mx-auto w-full max-w-6xl px-6 py-12"><span className="sr-only">Loading page…</span><div aria-hidden="true" className="motion-safe:animate-pulse"><div className="h-8 w-2/3 max-w-md rounded bg-line"/><div className="mt-4 h-4 w-1/2 rounded bg-line"/><div className="mt-8 grid gap-5 sm:grid-cols-3">{[1,2,3].map(i=><div key={i} className="aspect-[4/3] rounded-xl bg-line"/>)}</div></div></div>;
}
