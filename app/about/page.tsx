import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export const metadata = {
  title: "About",
  description: "Discover ready-made digital products from Nigerian creators and pay in Naira through Paystack.",
  alternates: { canonical: "/about" },
  openGraph: { title: "About The Middleman", description: "A marketplace for ready-made digital products from independent creators.", url: "https://themiddleman.com.ng/about" },
  twitter: { card: "summary_large_image", title: "About The Middleman", description: "Discover ready-made digital products from Nigerian creators." },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-ink text-bone">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark className="h-6 w-6" />
            <span className="font-display text-lg font-bold tracking-tight">The Middleman</span>
          </Link>
          <Link href="/" className="text-sm text-slate transition-colors hover:text-bone">&larr; Back to Home</Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-ember">About us</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">A marketplace for useful digital products.</h1>

        <div className="mt-10 space-y-6 text-[15px] leading-relaxed text-slate">
          <p>The Middleman is a marketplace for ready-made digital products from independent creators, built with Nigeria first in mind. Buyers can review listing details and previews before purchasing, and pay in Naira through Paystack.</p>
          <p>We started with a simple goal: make it easier to discover useful digital products and understand what is included before buying. Clear listing details help buyers compare products and creators.</p>
          <p>The Middleman was founded by Samuel Oguntona and built at Obafemi Awolowo University, Ile-Ife. It began as a campus project and is growing into a marketplace for digital products from creators across Nigeria.</p>
        </div>

        <div className="relative mt-12 rounded-2xl border border-line bg-paper p-8">
          <div className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-line bg-ink" />
          <div className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-line bg-ink" />
          <p className="text-xs font-bold uppercase tracking-[.16em] text-ember">What we hold to</p>
          <ul className="mt-5 space-y-4">
            {[
              ["Ready-made products", "Browse digital products made by independent creators."],
              ["Clear listing details", "Review product descriptions, previews and seller information before buying."],
              ["Pay in Naira", "Checkout is in Naira through Paystack."],
              ["Seller verification labels", "A verified mark appears only for sellers whose verification is approved."],
            ].map(([title, body]) => (
              <li key={title} className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />
                <span><span className="block font-semibold text-bone">{title}</span><span className="block text-sm text-slate">{body}</span></span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/marketplace" className="rounded-full bg-ember px-6 py-3 text-sm font-bold text-ink transition-colors hover:bg-ember/90">Browse the marketplace</Link>
          <Link href="/signup" className="rounded-full border border-line px-6 py-3 text-sm font-semibold text-bone transition-colors hover:border-ember/40">Create an account</Link>
        </div>
      </div>
    </main>
  );
}
