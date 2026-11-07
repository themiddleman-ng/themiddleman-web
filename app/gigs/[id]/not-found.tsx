import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata: Metadata = {
  title: "Product unavailable",
  description: "This product is not available on The Middleman.",
  robots: { index: false, follow: false },
};

export default function ProductUnavailable() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 text-bone">
      <Logo variant="dark" className="mb-10" />
      <div className="w-full max-w-md rounded-2xl border border-line bg-paper p-8 text-center">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-slate">Product unavailable</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">This product is not available.</h1>
        <p className="mt-4 text-sm leading-relaxed text-slate">
          The link does not match a product on The Middleman. It was not removed by this page, and it does not start a payment.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/marketplace" className="rounded-full bg-ember px-6 py-3 text-sm font-bold text-on-ember">Browse the marketplace</Link>
          <Link href="/" className="rounded-full border border-line px-6 py-3 text-sm font-semibold text-bone">Back to homepage</Link>
        </div>
      </div>
    </main>
  );
}
