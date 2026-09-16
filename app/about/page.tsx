import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export const metadata = { title: "About - The Middleman" };

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
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">The trust layer for Nigeria&apos;s digital economy.</h1>

        <div className="mt-10 space-y-6 text-[15px] leading-relaxed text-slate">
          <p>The Middleman is a marketplace for digital products and services - software, design, marketing, writing, and AI-assisted work - built for Nigeria first. Buyers find verified creators. Creators find serious buyers. Every payment is held securely and released only when the buyer approves the delivery.</p>
          <p>We started because of a simple trust gap. Buyers are afraid to pay strangers online. Creators are afraid to work before payment. Both fears are rational, and together they suppress thousands of transactions that should happen every day in Nigeria&apos;s digital economy. Screenshots and promises don&apos;t close that gap. A payment that only releases on approval does.</p>
          <p>The Middleman was founded by Samuel Oguntona and built at Obafemi Awolowo University, Ile-Ife. It began as a campus project, outgrew it, and became what it is now: a Nigeria-wide platform where every listing is verified, every price is clear in Naira, and every transaction has a human-readable paper trail.</p>
        </div>

        <div className="relative mt-12 rounded-2xl border border-line bg-paper p-8">
          <div className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-line bg-ink" />
          <div className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-line bg-ink" />
          <p className="text-xs font-bold uppercase tracking-[.16em] text-ember">What we hold to</p>
          <ul className="mt-5 space-y-4">
            {[
              ["Protection by default", "Payments are held until the buyer approves the delivery. No exceptions, no fine print."],
              ["Verification before listing", "Sellers complete identity verification before anything goes live."],
              ["Clear pricing in Naira", "Every price on the platform is shown in NGN. No hidden conversion games."],
              ["Humans in disputes", "When something goes wrong, a mediation team reviews the evidence and decides fairly."],
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
