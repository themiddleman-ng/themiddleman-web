import { notFound } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import { adminUser } from '@/lib/server/marketplace';
import ReviewQueue from './review-queue';

export const dynamic = 'force-dynamic';

export default async function AdminReviewPage() {
  const administrator = await adminUser();
  if (!administrator) notFound();
  const [queue, recent] = await Promise.all([
    administrator.db.from('deliveries')
      .select('id,order_id,created_at,status,orders(amount,gigs(title))')
      .eq('status', 'pending_review').order('created_at', { ascending: true }).limit(100),
    administrator.db.from('admin_audit_log')
      .select('id,actor_id,action,created_at').order('created_at', { ascending: false }).limit(12),
  ]);
  return <main className="min-h-screen bg-ink text-bone">
    <SiteHeader />
    <section className="mx-auto max-w-5xl px-5 py-10 md:py-16">
      <p className="text-xs font-semibold tracking-[.2em] text-ember">ADMIN / FULFILMENT</p>
      <h1 className="mt-3 font-display text-3xl font-bold md:text-5xl">Delivery review</h1>
      <p className="mt-3 max-w-2xl text-slate">Inspect each seller file before it becomes available to the buyer. Every decision is recorded.</p>
      {queue.error ? <p role="alert" className="mt-8 text-red-300">Review queue unavailable: {queue.error.message}</p>
        : <ReviewQueue deliveries={(queue.data ?? []).map(row => ({
          id: row.id, order_id: row.order_id, created_at: row.created_at,
          orders: row.orders?.[0] ? { amount: row.orders[0].amount,
            gigs: row.orders[0].gigs?.[0] ?? null } : null,
        }))} />}
      <section className="mt-12 border-t border-line pt-8">
        <h2 className="font-display text-xl font-semibold">Recent decisions</h2>
        {recent.error ? <p className="mt-4 text-red-300">Audit history unavailable.</p> :
          recent.data?.length ? <ul className="mt-4 space-y-3">
            {recent.data.map(entry => <li key={entry.id} className="flex flex-wrap justify-between gap-2 rounded-xl border border-line p-4 text-sm">
              <span>{entry.action.replaceAll('_', ' ')}</span>
              <span className="text-slate">{new Date(entry.created_at).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}</span>
            </li>)}
          </ul> : <p className="mt-4 text-slate">No reviews recorded yet.</p>}
      </section>
    </section>
  </main>;
}
