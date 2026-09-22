import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import { adminUser } from '@/lib/server/marketplace';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const administrator = await adminUser();
  if (!administrator) notFound();
  const db = administrator.db;
  const [deliveries, disputes, reports, audit] = await Promise.all([
    db.from('deliveries').select('id', { count: 'exact', head: true }).eq('status', 'pending_review'),
    db.from('disputes').select('id,order_id,reason,created_at', { count: 'exact' }).eq('status', 'open').order('created_at', { ascending: false }).limit(8),
    db.from('gig_reports').select('id,gig_id,reason,created_at', { count: 'exact' }).eq('status', 'open').order('created_at', { ascending: false }).limit(8),
    db.from('admin_audit_log').select('id,action,created_at').order('created_at', { ascending: false }).limit(8),
  ]);
  return <main className="min-h-screen bg-ink text-bone"><SiteHeader />
    <div className="mx-auto max-w-6xl px-5 py-12">
      <p className="text-xs font-bold uppercase tracking-[.2em] text-ember">Admin workspace</p>
      <h1 className="mt-3 font-display text-4xl font-bold">Operations overview</h1>
      <p className="mt-3 text-slate">Review deliveries and track issues. Payments and refunds need separate verified processing.</p>
      <div className="mt-9 grid gap-4 sm:grid-cols-3">
        <Link href="/admin/review" className="rounded-2xl border border-line bg-paper p-6 hover:border-ember">
          <span className="text-sm text-slate">Deliveries to review</span><strong className="mt-3 block font-display text-4xl">{deliveries.count ?? '—'}</strong><span className="mt-3 block text-sm text-ember">Open review queue →</span>
        </Link>
        <div className="rounded-2xl border border-line bg-paper p-6"><span className="text-sm text-slate">Open disputes</span><strong className="mt-3 block font-display text-4xl">{disputes.count ?? '—'}</strong><span className="mt-3 block text-xs text-slate">For manual investigation</span></div>
        <div className="rounded-2xl border border-line bg-paper p-6"><span className="text-sm text-slate">Product reports</span><strong className="mt-3 block font-display text-4xl">{reports.count ?? '—'}</strong><span className="mt-3 block text-xs text-slate">Awaiting moderation</span></div>
      </div>
      {[deliveries, disputes, reports, audit].some(result => result.error) && <p role="alert" className="mt-6 text-red-300">Some admin information could not be loaded. Refresh or check the server logs.</p>}
      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section><h2 className="font-display text-xl font-semibold">Open disputes</h2><div className="mt-4 space-y-3">{disputes.data?.length ? disputes.data.map(row =>
          <article key={row.id} className="rounded-xl border border-line bg-paper p-4"><p className="text-sm font-semibold">Order {row.order_id.slice(0, 8)}</p><p className="mt-2 text-sm text-slate">{row.reason}</p><time className="mt-2 block text-xs text-slate">{new Date(row.created_at).toLocaleDateString('en-NG')}</time></article>) : <p className="text-sm text-slate">No open disputes.</p>}</div></section>
        <section><h2 className="font-display text-xl font-semibold">Product reports</h2><div className="mt-4 space-y-3">{reports.data?.length ? reports.data.map(row =>
          <article key={row.id} className="rounded-xl border border-line bg-paper p-4"><Link className="text-sm font-semibold text-ember underline" href={`/gigs/${row.gig_id}`}>View product {row.gig_id.slice(0, 8)}</Link><p className="mt-2 text-sm text-slate">{row.reason}</p><time className="mt-2 block text-xs text-slate">{new Date(row.created_at).toLocaleDateString('en-NG')}</time></article>) : <p className="text-sm text-slate">No pending reports.</p>}</div></section>
      </div>
      <section className="mt-10 border-t border-line pt-8"><h2 className="font-display text-xl font-semibold">Admin activity</h2><ul className="mt-4 space-y-2">{audit.data?.map(row =>
        <li key={row.id} className="flex justify-between gap-3 rounded-xl border border-line p-3 text-sm"><span>{row.action.replaceAll('_',' ')}</span><time className="text-slate">{new Date(row.created_at).toLocaleString('en-NG')}</time></li>)}</ul>{!audit.data?.length && <p className="mt-3 text-sm text-slate">No decisions recorded yet.</p>}</section>
    </div>
  </main>;
}
