"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import SiteHeader from "@/components/SiteHeader";

const steps: [string, string, string][] = [
  ["1", "Pay into escrow", "Confirm your order in ₦. The exact amount is visible before you proceed, and held securely until delivery."],
  ["2", "Seller delivers", "The seller provides the product, files, access, or finished deliverable included in the listing."],
  ["3", "You approve", "Review the delivery, then approve release. Raise a dispute if it isn't as promised."],
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
  paystack_reference: string;
  created_at: string;
  orders: { gigs: { title: string } | null } | null;
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      // RLS on public.payments already scopes this to orders where the
      // current user is the buyer or seller — no manual filter needed.
      const { data, error } = await supabase
        .from("payments")
        .select("id, amount, escrow_status, payout_status, paystack_reference, created_at, orders ( gigs ( title ) )")
        .order("created_at", { ascending: false });

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

      <div className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-xs font-bold tracking-[.2em] text-ember">PAYMENTS</p>
        <h1 className="mt-3 font-display text-4xl font-bold">Escrow-protected payments, in Naira.</h1>
        <p className="mt-4 max-w-2xl text-slate">
          Every price on The Middleman is shown in Nigerian Naira (₦). Payment is held in escrow until the work you ordered is delivered and approved.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {steps.map(([number, title, text]) => (
            <div key={number} className="rounded-2xl border border-line bg-paper p-6">
              <span className="font-mono text-sm text-ember">0{number}</span>
              <h2 className="mt-5 font-display text-xl font-bold">{title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate">{text}</p>
            </div>
          ))}
        </div>

        <section className="mt-8 rounded-2xl border border-line bg-paper p-7">
          <p className="text-xs font-bold tracking-[.16em] text-ember">PAYMENT ACTIVITY</p>

          {loading && <p className="mt-4 text-sm text-slate">Loading…</p>}
          {!loading && loadError && <p className="mt-4 text-sm text-slate">{loadError}</p>}

          {!loading && !loadError && payments.length === 0 && (
            <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="mt-2 font-display text-2xl font-bold">No payments yet</h2>
                <p className="mt-2 text-sm text-slate">Your protected payment history will appear here after your first order.</p>
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
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between py-4 font-mono text-sm">
                  <div className="font-sans">
                    <p className="text-bone font-medium">{payment.orders?.gigs?.title ?? "Product"}</p>
                    <p className="text-xs text-slate mt-0.5">{payment.paystack_reference}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-bone">₦{payment.amount.toLocaleString()}</p>
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
