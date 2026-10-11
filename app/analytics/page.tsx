"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

type Row = {
  id: string;
  title: string;
  status: string;
  views: number;
  downloads: number;
  sales: number;
  salesValue: number;
  conversionRate: number;
  averageRating: number | null;
  reviewCount: number;
};
type Data = {
  days: number;
  trackingEnabled: boolean;
  products: Row[];
  totals: { views: number; downloads: number; sales: number; salesValue: number };
};

function money(value: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);
}

export default function SellerAnalyticsPage() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch("/api/analytics/seller?days=" + days, { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not load analytics.");
        if (active) setData(result);
      })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load analytics."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [days]);

  return (
    <main className="min-h-screen bg-ink text-bone">
      <SiteHeader isSeller />
      <section className="mx-auto max-w-6xl px-5 py-8 sm:px-7">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
          <div>
            <p className="text-xs font-semibold tracking-[.14em] text-ember">SELLER PERFORMANCE</p>
            <h1 className="mt-2 font-display text-3xl font-bold">Product analytics</h1>
            <p className="mt-2 text-sm text-slate">Performance totals only. Buyers remain private.</p>
          </div>
          <Link href="/gigs/mine" className="rounded-full border border-line px-4 py-2 text-sm text-slate hover:text-bone">My products</Link>
        </header>

        <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Analytics time period">
          {[7, 30, 90, 0].map((period) => (
            <button key={period} onClick={() => setDays(period)} aria-pressed={days === period} className={"rounded-full px-4 py-2 text-xs " + (days === period ? "bg-ember text-ink" : "border border-line text-slate")}>
              {period ? period + " days" : "All time"}
            </button>
          ))}
        </div>

        {loading ? <p className="mt-7 text-sm text-slate">Loading performance…</p> : null}
        {error ? <p role="alert" className="mt-7 text-sm text-red-300">{error}</p> : null}
        {!loading && data ? (
          <>
            {!data.trackingEnabled ? <p className="mt-6 rounded-xl border border-line p-4 text-sm text-slate">View tracking will start when the isolated preview has an analytics secret configured. Sales still come from paid order records.</p> : null}
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl bg-paper p-5"><p className="text-xs text-slate">Daily unique-ish views</p><strong className="mt-2 block font-display text-3xl">{data.totals.views}</strong></div>
              <div className="rounded-xl bg-paper p-5"><p className="text-xs text-slate">Paid orders</p><strong className="mt-2 block font-display text-3xl">{data.totals.sales}</strong></div>
              <div className="rounded-xl bg-paper p-5"><p className="text-xs text-slate">Downloads</p><strong className="mt-2 block font-display text-3xl">{data.totals.downloads}</strong></div>
              <div className="rounded-xl bg-paper p-5"><p className="text-xs text-slate">Sales value</p><strong className="mt-2 block font-display text-3xl">{money(data.totals.salesValue)}</strong></div>
            </div>
            <p className="mt-4 text-xs leading-5 text-slate">View estimates use a daily rotating, one-way network hash. No raw IP address or visitor identity is stored or shown. Sales value is the canonical order amount; payout and fees are shown in Payments.</p>
            <div className="mt-7 overflow-x-auto rounded-xl border border-line">
              <div className="min-w-[620px]">
                <div className="grid grid-cols-[minmax(0,2fr)_repeat(5,minmax(4rem,1fr))] gap-2 bg-paper/60 px-4 py-3 text-[11px] text-slate">
                  <span>Product</span><span>Views</span><span>Downloads</span><span>Sales</span><span>Conversion</span><span>Rating</span>
                </div>
                {data.products.map((row) => (
                  <div key={row.id} className="grid grid-cols-[minmax(0,2fr)_repeat(5,minmax(4rem,1fr))] items-center gap-2 border-t border-line px-4 py-4 text-xs">
                    <span className="min-w-0 truncate font-medium">{row.title}<span className="block text-[10px] text-slate">{row.status}</span></span>
                    <span>{row.views}</span><span>{row.downloads}</span><span>{row.sales}</span><span>{row.conversionRate}%</span>
                    <span>{row.reviewCount ? (row.averageRating ?? 0).toFixed(1) + " · " + row.reviewCount : "—"}</span>
                  </div>
                ))}
              </div>
            </div>
            {!data.products.length ? <p className="mt-6 text-sm text-slate">Your product activity will show here once your products are listed.</p> : null}
          </>
        ) : null}
      </section>
    </main>
  );
}
