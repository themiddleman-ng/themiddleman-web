import Link from 'next/link';
export default function PendingReviewPage() {
  return (
    <main className="auth-shell"><div className="auth-card text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-ember/15 text-xl text-ember">✓</div><p className="mt-6 text-xs font-medium tracking-[.2em] text-ember">APPLICATION RECEIVED</p>
      <h1 className="mt-2 font-display text-3xl font-bold">You&apos;re in the queue</h1>
      <p className="mt-4 leading-relaxed text-slate">
        We&apos;re reviewing your application. This usually takes up to 48 hours.
        We&apos;ll notify you by email the moment you&apos;re approved to start listing products.
      </p>
      <p className="mt-4 text-slate">In the meantime, feel free to browse the marketplace as a buyer.</p><Link href="/marketplace" className="mt-7 inline-flex rounded-full bg-ember px-5 py-2.5 text-sm font-medium text-ink">Browse marketplace</Link>
    </div></main>
  );
}
