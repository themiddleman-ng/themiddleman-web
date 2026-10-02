import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { requireAdminPage } from '@/lib/server/admin-page';
import NotificationRetryButton from './notification-retry-button';

export const dynamic = 'force-dynamic';

const FLOW = [
  ['pending_payment', 'Awaiting payment'],
  ['in_escrow', 'In escrow'],
  ['delivered', 'Delivered'],
  ['approved', 'Completed'],
  ['disputed', 'Disputed'],
  ['refunded', 'Refunded'],
] as const;

function StatusPill({ status }: { status: string }) {
  const tone = status === 'sent'
    ? 'border-emerald-500/30 text-emerald-300'
    : status === 'failed'
      ? 'border-red-500/30 text-red-300'
      : 'border-amber-500/30 text-amber-200';

  return <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>{status}</span>;
}

export default async function AdminPage() {
  const administrator = await requireAdminPage();
  const db = administrator.db;

  const [
    deliveries,
    disputes,
    reports,
    audit,
    orders,
    payments,
    notifications,
    adminSetting,
    users,
    gigs,
  ] = await Promise.all([
    db.from('deliveries').select('id', { count: 'exact', head: true }).eq('status', 'pending_review'),
    db.from('disputes').select('id,order_id,reason,created_at', { count: 'exact' }).eq('status', 'open').order('created_at', { ascending: false }).limit(6),
    db.from('gig_reports').select('id,gig_id,reason,created_at', { count: 'exact' }).eq('status', 'open').order('created_at', { ascending: false }).limit(6),
    db.from('admin_audit_log').select('id,action,created_at').order('created_at', { ascending: false }).limit(10),
    db.from('orders').select('id,status,amount,created_at').order('created_at', { ascending: false }).limit(200),
    db.from('payments').select('id,order_id,amount,escrow_status,payout_status,created_at').order('created_at', { ascending: false }).limit(8),
    db.from('email_notifications').select('id,order_id,recipient_role,recipient_email,status,attempts,last_error,updated_at').order('updated_at', { ascending: false }).limit(24),
    db.from('platform_settings').select('value').eq('key', 'admin_notification_email').maybeSingle(),
    db.from('profiles').select('id', { count: 'exact', head: true }),
    db.from('gigs').select('id', { count: 'exact', head: true }),
  ]);

  const orderRows = orders.data ?? [];
  const counts: Record<string, number> = {};
  for (const [key] of FLOW) counts[key] = orderRows.filter(row => row.status === key).length;

  const comms = notifications.data ?? [];
  const needsAttention = comms.filter(row => row.status === 'failed' || row.status === 'pending');

  return <main className="min-h-screen bg-ink text-bone">
    <SiteHeader />

    <div className="mx-auto max-w-7xl px-5 py-10 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-ember">Admin workspace</p>
          <h1 className="mt-3 font-display text-4xl font-bold md:text-5xl">Operations control</h1>
          <p className="mt-3 max-w-3xl text-slate">
            Payments, fulfilment, trust &amp; safety, email delivery and audit activity in one role-gated workspace.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/review" className="rounded-full bg-ember px-5 py-2.5 text-sm font-bold text-ink">
            Open delivery review
          </Link>
          <Link href="/admin/escrow" className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold">Trust &amp; payouts</Link>
          <Link href="/security" className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold">Account security</Link>
          <Link href="/marketplace" className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold">
            View marketplace
          </Link>
        </div>
      </div>

      <section className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-line bg-paper p-5">
          <p className="text-xs uppercase tracking-wider text-slate">Users</p>
          <strong className="mt-3 block font-display text-4xl">{users.count ?? 0}</strong>
          <p className="mt-2 text-xs text-slate">Registered accounts</p>
        </div>
        <div className="rounded-2xl border border-line bg-paper p-5">
          <p className="text-xs uppercase tracking-wider text-slate">Products</p>
          <strong className="mt-3 block font-display text-4xl">{gigs.count ?? 0}</strong>
          <p className="mt-2 text-xs text-slate">Marketplace listings</p>
        </div>
        <div className="rounded-2xl border border-line bg-paper p-5">
          <p className="text-xs uppercase tracking-wider text-slate">In escrow</p>
          <strong className="mt-3 block font-display text-4xl">{counts.in_escrow ?? 0}</strong>
          <p className="mt-2 text-xs text-slate">Paid, protected orders</p>
        </div>
        <Link href="/admin/review" className="rounded-2xl border border-line bg-paper p-5 hover:border-ember">
          <p className="text-xs uppercase tracking-wider text-slate">Delivery review</p>
          <strong className="mt-3 block font-display text-4xl">{deliveries.count ?? 0}</strong>
          <p className="mt-2 text-xs text-ember">Review seller submissions →</p>
        </Link>
        <div className="rounded-2xl border border-line bg-paper p-5">
          <p className="text-xs uppercase tracking-wider text-slate">Email attention</p>
          <strong className="mt-3 block font-display text-4xl">{needsAttention.length}</strong>
          <p className="mt-2 text-xs text-slate">Failed or pending notices</p>
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-line bg-paper p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-ember">Order pipeline</p>
            <h2 className="mt-2 font-display text-2xl font-semibold">Product movement</h2>
          </div>
          <span className="text-xs text-slate">Server-authoritative states</span>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {FLOW.map(([key, label], index) => <div key={key} className="rounded-xl border border-line p-4">
            <span className="text-[11px] font-bold text-slate">{String(index + 1).padStart(2, '0')}</span>
            <p className="mt-2 text-sm font-semibold">{label}</p>
            <strong className="mt-3 block font-mono text-xl text-ember">{counts[key] ?? 0}</strong>
          </div>)}
        </div>

        <p className="mt-5 text-xs leading-6 text-slate">
          Payment confirmed → escrow → seller delivery → admin review → buyer approval or dispute → completion/refund → payout processing.
        </p>
      </section>

      <div className="mt-10 grid gap-8 xl:grid-cols-[1.25fr_.75fr]">
        <section className="rounded-2xl border border-line bg-paper p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-ember">Communications</p>
              <h2 className="mt-2 font-display text-2xl font-semibold">Transactional email health</h2>
              <p className="mt-2 text-xs text-slate">Buyer, seller and operations delivery records are tracked independently.</p>
            </div>
            <div className="text-right text-xs text-slate">
              <p>Operations inbox</p>
              <p className="mt-1 font-semibold text-bone">{adminSetting.data?.value ?? 'Not configured'}</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {comms.length ? comms.map(row => <article key={row.id} className="rounded-xl border border-line p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold capitalize">{row.recipient_role} notification</p>
                  <p className="mt-1 text-xs text-slate">{row.recipient_email} · order {row.order_id.slice(0, 8)}</p>
                </div>
                <StatusPill status={row.status} />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate">
                  Attempts: {row.attempts}
                  {row.last_error ? ` · ${row.last_error}` : ''}
                </p>
                {(row.status === 'failed' || row.status === 'pending') && <NotificationRetryButton orderId={row.order_id} />}
              </div>
            </article>) : <p className="text-sm text-slate">No transactional email records yet.</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-paper p-5 md:p-6">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-ember">Payments</p>
          <h2 className="mt-2 font-display text-2xl font-semibold">Recent escrow activity</h2>
          <div className="mt-6 space-y-3">
            {(payments.data ?? []).map(row => <div key={row.id} className="rounded-xl border border-line p-4">
              <div className="flex justify-between gap-3">
                <span className="font-mono text-sm">₦{Number(row.amount).toLocaleString('en-NG')}</span>
                <span className="text-xs text-ember">{row.escrow_status}</span>
              </div>
              <p className="mt-2 text-xs text-slate">Order {row.order_id.slice(0, 8)} · payout {row.payout_status}</p>
              <time className="mt-1 block text-xs text-slate">
                {new Date(row.created_at).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}
              </time>
            </div>)}
            {!payments.data?.length && <p className="text-sm text-slate">No payment records yet.</p>}
          </div>
        </section>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-paper p-5 md:p-6">
          <h2 className="font-display text-xl font-semibold">Open disputes</h2>
          <div className="mt-4 space-y-3">
            {disputes.data?.length ? disputes.data.map(row => <article key={row.id} className="rounded-xl border border-line p-4">
              <p className="text-sm font-semibold">Order {row.order_id.slice(0, 8)}</p>
              <p className="mt-2 text-sm text-slate">{row.reason}</p>
              <time className="mt-2 block text-xs text-slate">{new Date(row.created_at).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}</time>
            </article>) : <p className="text-sm text-slate">No open disputes.</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-paper p-5 md:p-6">
          <h2 className="font-display text-xl font-semibold">Product reports</h2>
          <div className="mt-4 space-y-3">
            {reports.data?.length ? reports.data.map(row => <article key={row.id} className="rounded-xl border border-line p-4">
              <Link className="text-sm font-semibold text-ember underline" href={`/gigs/${row.gig_id}`}>Open reported product</Link>
              <p className="mt-2 text-sm text-slate">{row.reason}</p>
              <time className="mt-2 block text-xs text-slate">{new Date(row.created_at).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}</time>
            </article>) : <p className="text-sm text-slate">No pending reports.</p>}
          </div>
        </section>
      </div>

      <section className="mt-10 rounded-2xl border border-line bg-paper p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-ember">Security &amp; audit</p>
            <h2 className="mt-2 font-display text-2xl font-semibold">Operational posture</h2>
          </div>
          <span className="text-xs text-slate">Sensitive values are never rendered</span>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-line p-4">
            <p className="text-xs text-slate">Paystack server key</p>
            <p className="mt-2 text-sm font-semibold">{process.env.PAYSTACK_SECRET_KEY ? 'Configured' : 'Missing'}</p>
          </div>
          <div className="rounded-xl border border-line p-4">
            <p className="text-xs text-slate">Resend server key</p>
            <p className="mt-2 text-sm font-semibold">{process.env.RESEND_API_KEY ? 'Configured' : 'Missing'}</p>
          </div>
          <div className="rounded-xl border border-line p-4">
            <p className="text-xs text-slate">Service-role database</p>
            <p className="mt-2 text-sm font-semibold">{process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configured' : 'Missing'}</p>
          </div>
        </div>

        <h3 className="mt-8 font-display text-lg font-semibold">Recent admin activity</h3>
        <ul className="mt-4 space-y-2">
          {audit.data?.map(row => <li key={row.id} className="flex flex-wrap justify-between gap-3 rounded-xl border border-line p-3 text-sm">
            <span>{row.action.replaceAll('_', ' ')}</span>
            <time className="text-slate">{new Date(row.created_at).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}</time>
          </li>)}
        </ul>
        {!audit.data?.length && <p className="mt-3 text-sm text-slate">No decisions recorded yet.</p>}
      </section>
    </div>
  </main>;
}
