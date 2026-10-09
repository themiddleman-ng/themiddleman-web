'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NotificationRetryButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function retry() {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/notifications/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || body.reason || 'Retry failed.');
      setMessage('Retried');
      router.refresh();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Retry failed.');
    } finally {
      setBusy(false);
    }
  }

  return <div className="flex items-center gap-2">
    <button type="button" disabled={busy} onClick={retry}
      className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ember disabled:opacity-50">
      {busy ? 'Retrying…' : 'Retry email'}
    </button>
    {message && <span className="text-xs text-slate">{message}</span>}
  </div>;
}
