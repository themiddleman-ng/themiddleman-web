'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Delivery = { id: string; order_id: string; created_at: string;
  orders: { amount: number; gigs: { title: string } | null } | null };

export default function ReviewQueue({ deliveries }: { deliveries: Delivery[] }) {
  const router = useRouter();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function viewFile(orderId: string) {
    setError(null);
    const response = await fetch(`/api/orders/${orderId}/delivery`, { cache: 'no-store' });
    const body = await response.json();
    if (!response.ok) { setError(body.error || 'File unavailable.'); return; }
    window.open(body.url, '_blank', 'noopener,noreferrer');
  }
  async function decide(deliveryId: string, decision: 'approve' | 'reject') {
    setBusy(deliveryId); setError(null);
    try {
      const response = await fetch('/api/admin/review', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryId, decision, notes: notes[deliveryId] || '' }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Review failed.');
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Review failed.'); }
    finally { setBusy(null); }
  }
  return <section className="mt-9">
    <div className="flex items-center justify-between"><h2 className="font-display text-xl font-semibold">Waiting for review</h2>
      <span className="rounded-full border border-line px-3 py-1 text-sm text-ember">{deliveries.length}</span></div>
    {error && <p role="alert" className="mt-4 text-red-300">{error}</p>}
    {deliveries.length === 0 && <p className="mt-5 rounded-2xl border border-line bg-paper p-6 text-slate">Your review queue is empty.</p>}
    <div className="mt-5 grid gap-4">
      {deliveries.map(delivery => <article key={delivery.id} className="rounded-2xl border border-line bg-paper p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h3 className="font-display text-lg font-semibold">{delivery.orders?.gigs?.title ?? 'Digital product'}</h3>
            <p className="mt-1 text-xs text-slate">Order {delivery.order_id.slice(0, 8)} · Submitted {new Date(delivery.created_at).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}</p></div>
          <p className="text-sm">₦{Number(delivery.orders?.amount ?? 0).toLocaleString('en-NG')}</p>
        </div>
        <button type="button" className="mt-5 text-sm font-semibold text-ember underline" onClick={() => viewFile(delivery.order_id)}>Open seller file</button>
        <label className="mt-5 block text-sm text-slate" htmlFor={`notes-${delivery.id}`}>Review note</label>
        <textarea id={`notes-${delivery.id}`} className="auth-input mt-2 w-full min-h-24" maxLength={2000}
          value={notes[delivery.id] || ''} onChange={event => setNotes({ ...notes, [delivery.id]: event.target.value })}
          placeholder="Explain what the seller should fix if rejecting" />
        <div className="mt-4 flex flex-wrap gap-3">
          <button disabled={busy === delivery.id} onClick={() => decide(delivery.id, 'approve')}
            className="rounded-full bg-ember px-5 py-2 text-sm font-semibold text-ink disabled:opacity-50">Approve delivery</button>
          <button disabled={busy === delivery.id} onClick={() => decide(delivery.id, 'reject')}
            className="rounded-full border border-line px-5 py-2 text-sm font-semibold disabled:opacity-50">Request changes</button>
        </div>
      </article>)}
    </div>
  </section>;
}
