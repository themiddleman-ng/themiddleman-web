"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { downloadCsv } from "@/lib/client/download-csv";

const steps: [string, string, string][] = [
  ["1", "Purchases paused", "Checkout is not open. Listed prices are in Naira, and this page does not charge a card or bank account."],
  ["2", "Track your order", "View the product and order status from My Orders when an order is recorded."],
  ["3", "Review payment activity", "Check payment references, amounts, fees and settlement status here. Some order actions may be paused while the flow is verified."],
];

const ESCROW_STATUS_LABELS: Record<string, string> = {
  held: "In escrow",
  released: "Released",
  refunded: "Refunded",
};

const PAYOUT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
};

type PaymentRow = {
  id: string;
  amount: number;
  escrow_status: string;
  payout_status: string;
  paystack_reference?: string;
  role: string;
  fees: Record<string,number> | null;
  created_at: string;
  orders: { gigs: { title: string } | null } | null;
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [paymentQuery, setPaymentQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const response = await fetch('/api/payments', { cache: 'no-store' });
      const result = await response.json();
      const data = result.payments;
      const error = response.ok ? null : { message: result.error || 'Payments unavailable.' };

      if (cancelled) return;
      if (error) setLoadError(error.message);
      else setPayments((data as unknown as PaymentRow[]) ?? []);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="min-h-screen bg-ink text-bone">
      <SiteHeader />

      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-9">
        <p className="text-xs font-bold tracking-[.2em] text-ember">PAYMENTS</p>
        <h1 className="mt-2 font-display text-[1.65rem] font-bold leading-tight tracking-tight sm:text-4xl">Payment activity</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate sm:text-base">
          Checkout is paused. This page does not start a payment. If a past test payment exists, you can review its status here. A buyer accepting delivery does not by itself send a seller payout.
        </p>

        {!loading && !loadError && <div className="mt-6 grid gap-4 sm:grid-cols-3">{[['Payments made', payments.filter((row) => row.role !== 'seller').reduce((sum, row) => sum + row.amount, 0)], ['Sales awaiting payout · gross', payments.filter((row) => row.role === 'seller' && row.payout_status === 'pending').reduce((sum, row) => sum + row.amount, 0)], ['Settled sales · gross', payments.filter((row) => row.role === 'seller' && row.payout_status === 'paid').reduce((sum, row) => sum + row.amount, 0)]].map(([label, amount]) => <section key={String(label)} className="rounded-xl border border-line bg-white p-5"><p className="text-xs text-slate">{label}</p><strong className="mt-3 block text-2xl">₦{Number(amount).toLocaleString('en-NG')}</strong></section>)}</div>}
        <div className="mt-5 grid gap-3 sm:mt-7 sm:gap-4 md:grid-cols-3">
          {steps.map(([number, title, text]) => (
            <div key={number} className="rounded-2xl border border-line bg-paper p-4 sm:p-5">
              <span className="font-mono text-sm text-ember">0{number}</span>
              <h2 className="mt-3 font-display text-lg font-bold sm:mt-4 sm:text-xl">{title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate">{text}</p>
            </div>
          ))}
        </div>

        <section className="mt-5 rounded-2xl border border-line bg-paper p-4 sm:mt-7 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"><h2 className="text-lg font-semibold">Transactions</h2><button type="button" disabled={!payments.length} onClick={() => downloadCsv('middleman-payments.csv', [['Date', 'Product', 'Role', 'Amount (NGN)', 'Escrow status', 'Payout status'], ...payments.map((row) => [row.created_at, row.orders?.gigs?.title || 'Product', row.role, row.amount, row.escrow_status, row.payout_status])])} className="min-h-11 w-full rounded-lg border border-line px-4 text-sm disabled:opacity-50 sm:w-auto">Export CSV</button></div>
          <label className="mt-4 block text-xs font-medium">Search transactions<input type="search" value={paymentQuery} onChange={(event) => setPaymentQuery(event.target.value)} placeholder="Product or reference" className="mt-2 block min-h-11 w-full border px-3 text-sm" /></label>

          {loading && <p className="mt-4 text-sm text-slate">Loading…</p>}
          {!loading && loadError && <p className="mt-4 text-sm text-slate">{loadError}</p>}

          {!loading && !loadError && payments.length === 0 && (
            <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="mt-2 font-display text-2xl font-bold">No payments yet</h2>
                <p className="mt-2 text-sm text-slate">Your payment history will appear here when a payment is recorded.</p>
              </div>
              <Link
                href="/marketplace"
                className="rounded-full bg-ember px-5 py-3 text-center text-sm font-semibold text-ink hover:bg-ember/90 transition-colors shrink-0"
              >
                Explore products
              </Link>
            </div>
          )}

          {!loading && !loadError && payments.length > 0 && (
            <div className="mt-4 divide-y divide-line">
              {payments.filter((payment) => `${payment.orders?.gigs?.title || ''} ${payment.paystack_reference || ''}`.toLowerCase().includes(paymentQuery.trim().toLowerCase())).map((payment) => (
                <div key={payment.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium text-bone">{payment.orders?.gigs?.title ?? "Product"}</p>
                    <p className="mt-0.5 break-all text-xs text-slate">{payment.role === 'seller' ? 'Seller payout · buyer details private' : payment.paystack_reference}</p>
                    {payment.fees && <dl className="mt-2 space-y-1 text-xs text-slate">{Object.entries(payment.fees).map(([label,kobo])=><div key={label}>{label.replace(/_kobo/g,'').replace(/_/g,' ')}: ₦{(kobo/100).toLocaleString('en-NG',{minimumFractionDigits:2})}</div>)}</dl>}
                  </div>
                  <div className="flex shrink-0 items-center justify-between gap-3 sm:block sm:text-right">
                    <p className="font-mono text-sm text-bone">₦{payment.amount.toLocaleString()}</p>
                    <p className="text-xs text-ember font-sans">{ESCROW_STATUS_LABELS[payment.escrow_status] ?? payment.escrow_status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

