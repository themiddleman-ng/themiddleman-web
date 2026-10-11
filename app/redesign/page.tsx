import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import SelectedGigs from "@/components/home/SelectedGigs";
import CategoryMarquee from "@/components/home/CategoryMarquee";
import RedesignFAQ from "@/components/home/RedesignFAQ";

const comparison = [
  ["Payment protection", "Protected through the order", "Depends on trust"],
  ["Order record", "Kept in one place", "Often scattered"],
  ["Seller identity", "Verified seller profile", "Varies"],
  ["Delivery trail", "Connected to the order", "Usually manual"],
];

export default function RedesignPreviewPage() {
  return (
    <main className="min-h-screen bg-[#F6F1E8] text-[#172033]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0E1828]/95 text-white backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5 sm:px-6">
          <Link href="/" aria-label="The Middleman homepage" className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-lg bg-white p-1 shadow-sm ring-1 ring-black/5">
              <LogoMark className="h-6 w-6" />
            </span>
            <span className="font-display text-sm font-semibold tracking-[-0.01em] text-white sm:text-[15px]">
              The Middleman
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-white/65 md:flex">
            <Link href="/marketplace" className="transition-colors hover:text-white">Marketplace</Link>
            <a href="#how" className="transition-colors hover:text-white">How it works</a>
            <a href="#why" className="transition-colors hover:text-white">Why Middleman</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/signup?mode=signin" className="px-3 py-2 text-sm text-white/70 transition-colors hover:text-white">
              Log in
            </Link>
            <Link href="/signup" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#111827] shadow-sm transition-colors hover:bg-[#F6F1E8]">
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <section className="overflow-hidden border-b border-[#24324A] bg-[#0E1828] text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-24 lg:grid-cols-[1.02fr_.98fr] lg:items-center lg:gap-16">
          <div>
            <p className="text-sm font-medium text-[#F2A26C]">Nigeria first. Built to grow beyond it.</p>
            <h1 className="mt-5 max-w-4xl font-display text-[clamp(3rem,6.4vw,6.5rem)] font-semibold leading-[0.94] tracking-[-0.052em]">
              Buy and sell digital work with the deal protected in between.
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">
              Find digital products and services from Nigerian sellers. Pay through The Middleman and keep the transaction protected until the order is completed.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/marketplace" className="rounded-lg bg-[#FF8A00] px-5 py-3 text-sm font-semibold text-[#111827] shadow-[0_10px_30px_rgba(255,138,0,.16)] transition-transform hover:-translate-y-0.5">
                Browse marketplace
              </Link>
              <Link href="/gigs/new" className="rounded-lg border border-white/15 bg-white/[0.03] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/[0.07]">
                Start selling
              </Link>
            </div>
          </div>

          <div className="relative">
            <div aria-hidden="true" className="absolute -inset-10 bg-[radial-gradient(circle_at_50%_40%,rgba(255,138,0,.14),transparent_56%)]" />
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#111D30] shadow-[0_32px_80px_rgba(0,0,0,.28)]">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2 text-xs text-white/65">
                  <span className="h-2 w-2 rounded-full bg-[#FF8A00]" />
                  Order protected
                </div>
                <span className="text-[11px] text-white/40">The Middleman</span>
              </div>

              <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-[1.1fr_.9fr]">
                <div className="rounded-xl border border-white/10 bg-[#F6F1E8] p-4 text-[#172033]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-[.14em] text-[#C85A19]">Order</span>
                    <span className="rounded-full bg-[#E7EDF7] px-2.5 py-1 text-[10px] font-medium text-[#0B3D91]">In escrow</span>
                  </div>
                  <h2 className="mt-8 max-w-xs font-display text-2xl font-semibold tracking-[-.03em]">One clear place for the work, payment, and delivery.</h2>
                  <div className="mt-8 space-y-3">
                    {[
                      ["Payment received", true],
                      ["Seller working", true],
                      ["Delivery", false],
                      ["Approval", false],
                    ].map(([label, done]) => (
                      <div key={String(label)} className="flex items-center gap-3 text-sm">
                        <span className={`grid h-5 w-5 place-items-center rounded-full border text-[10px] ${done ? "border-[#FF8A00] bg-[#FF8A00] text-[#111827]" : "border-[#CFC8BD] text-[#8A8178]"}`}>
                          {done ? "✓" : ""}
                        </span>
                        <span className={done ? "text-[#172033]" : "text-[#77716A]"}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col rounded-xl border border-white/10 bg-[#0A1422] p-4">
                  <p className="text-[11px] uppercase tracking-[.14em] text-white/40">Payment</p>
                  <p className="mt-3 font-mono text-2xl font-semibold text-white">₦85,000</p>
                  <p className="mt-2 text-sm leading-6 text-white/55">Held until the order moves through the agreed delivery flow.</p>
                  <div className="mt-auto pt-8">
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full w-[58%] rounded-full bg-[#FF8A00]" />
                    </div>
                    <div className="mt-3 flex justify-between text-[10px] uppercase tracking-[.12em] text-white/40">
                      <span>Paid</span>
                      <span>Release</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 bg-[#0B1625]">
          <div className="mx-auto flex max-w-7xl flex-wrap gap-x-8 gap-y-3 px-5 py-4 text-[11px] font-medium uppercase tracking-[.13em] text-white/50 sm:px-6">
            {["Verified sellers", "Escrow protected", "Priced in Naira", "Nigeria first"].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-[#FF8A00]" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <CategoryMarquee />

      <SelectedGigs />

      <section id="how" className="border-t border-[#DDE3EB] bg-[#EEF2F7]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0B3D91]">How it works</p>
              <h2 className="mt-5 max-w-lg font-display text-4xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-5xl">
                The deal stays clear from payment to delivery.
              </h2>
            </div>

            <div className="divide-y divide-[#CCD5E1] border-y border-[#CCD5E1]">
              {[
                ["01", "Choose what you need", "Browse the marketplace and open the gig that fits what you are looking for."],
                ["02", "Pay through The Middleman", "The order and payment stay connected instead of becoming an informal deal outside the platform."],
                ["03", "Receive and complete the order", "The seller delivers through the order flow and the transaction moves forward from there."],
              ].map(([number, title, body]) => (
                <div key={number} className="grid gap-4 py-6 sm:grid-cols-[72px_1fr]">
                  <span className="font-mono text-sm text-[#C85A19]">{number}</span>
                  <div>
                    <h3 className="text-lg font-medium text-[#172033]">{title}</h3>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-[#667085] sm:text-base">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="why" className="border-t border-[#24324A] bg-[#10213A] text-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-2">
            <h2 className="max-w-xl font-display text-4xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-5xl">
              Built for digital deals, not scattered DMs.
            </h2>
            <p className="max-w-xl text-base leading-7 text-white/60 lg:justify-self-end">
              The point is not to add more steps. It is to keep the important parts of the transaction in one place.
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-[#0C192C]">
            <div className="grid grid-cols-[1.25fr_.9fr_.9fr] border-b border-white/10 px-4 py-4 text-xs text-white/40 sm:px-6">
              <span>Capability</span>
              <span className="text-white">The Middleman</span>
              <span>Direct deal</span>
            </div>
            {comparison.map(([capability, middleman, direct]) => (
              <div key={capability} className="grid grid-cols-[1.25fr_.9fr_.9fr] border-b border-white/10 px-4 py-4 text-sm last:border-b-0 sm:px-6 sm:py-5">
                <span className="pr-3 text-white/80">{capability}</span>
                <span className="pr-3 text-white">✓ <span className="hidden sm:inline">{middleman}</span></span>
                <span className="text-white/45">{direct}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <RedesignFAQ />

      <section className="border-t border-[#D9D2C7] bg-[#FFF9F1]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20">
          <div className="flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C85A19]">The Middleman</p>
              <h2 className="mt-4 max-w-2xl font-display text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-[#172033] sm:text-5xl">
                Browse first. Sell when you are ready.
              </h2>
            </div>
            <Link href="/marketplace" className="w-fit rounded-lg bg-[#0B3D91] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5">
              Open marketplace
            </Link>
          </div>

          <div className="mt-14 flex flex-col gap-4 border-t border-[#DDD6CA] pt-6 text-sm text-[#77716A] sm:flex-row sm:items-center sm:justify-between">
            <span>© 2026 The Middleman</span>
            <div className="flex gap-5">
              <Link href="/legal/privacy" className="hover:text-[#0B3D91]">Privacy</Link>
              <Link href="/legal/terms" className="hover:text-[#0B3D91]">Terms</Link>
              <a href="mailto:hello@themiddleman.com.ng" className="hover:text-[#0B3D91]">Contact</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
