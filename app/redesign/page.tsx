import Link from "next/link";
import Logo from "@/components/Logo";
import HomeFeed from "@/components/marketplace/HomeFeed";
import RedesignFAQ from "@/components/home/RedesignFAQ";

const categories = [
  { label: "Web & Software", value: "development" },
  { label: "Design", value: "design" },
  { label: "Marketing", value: "marketing" },
  { label: "Writing", value: "writing" },
  { label: "AI-assisted", value: "ai_assisted" },
];

const comparison = [
  ["Payment protection", "Protected through the order", "Depends on trust"],
  ["Order record", "Kept in one place", "Often scattered"],
  ["Seller identity", "Verified seller profile", "Varies"],
  ["Delivery trail", "Connected to the order", "Usually manual"],
];

export default function RedesignPreviewPage() {
  return (
    <main className="min-h-screen bg-[#0b0b0b] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0b0b]/92 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5 sm:px-6">
          <Logo className="[&_img]:!w-20 sm:[&_img]:!w-24" />
          <nav className="hidden items-center gap-6 text-sm text-[#9b9b9b] md:flex">
            <Link href="/marketplace" className="transition-colors hover:text-white">Marketplace</Link>
            <a href="#how" className="transition-colors hover:text-white">How it works</a>
            <a href="#why" className="transition-colors hover:text-white">Why Middleman</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/signup?mode=signin" className="px-3 py-2 text-sm text-[#b8b8b8] transition-colors hover:text-white">
              Log in
            </Link>
            <Link href="/signup" className="rounded-lg bg-[#f4f2ee] px-4 py-2 text-sm font-semibold text-[#111] transition-colors hover:bg-white">
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-5 pb-14 pt-20 sm:px-6 sm:pb-20 sm:pt-28">
          <div className="max-w-5xl">
            <p className="text-sm font-medium text-[#8f8f8f]">Nigeria first. Built to grow beyond it.</p>
            <h1 className="mt-5 max-w-5xl font-display text-[clamp(3.25rem,8vw,7.6rem)] font-semibold leading-[0.92] tracking-[-0.055em]">
              Buy and sell digital work with a middleman that actually protects the deal.
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-[#9d9d9d] sm:text-lg">
              Find digital products and services from Nigerian sellers. Pay through The Middleman and keep the transaction protected until the order is completed.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/marketplace" className="rounded-lg bg-[#f26419] px-5 py-3 text-sm font-semibold text-[#111] transition-transform hover:-translate-y-0.5">
                Browse marketplace
              </Link>
              <Link href="/gigs/new" className="rounded-lg border border-white/15 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/5">
                Start selling
              </Link>
            </div>
          </div>

          <div className="mt-14 overflow-hidden rounded-2xl border border-white/10 bg-[#101010]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
              <span className="text-xs font-medium text-[#9d9d9d]">Marketplace preview</span>
              <span className="text-xs text-[#696969]">Protected transactions</span>
            </div>
            <div className="grid divide-y divide-white/10 md:grid-cols-3 md:divide-x md:divide-y-0">
              {[
                ["Web & Software", "Business dashboard setup", "₦85,000"],
                ["Design", "Brand identity system", "₦65,000"],
                ["Writing", "Product copy package", "₦35,000"],
              ].map(([category, title, price]) => (
                <div key={title} className="p-5 sm:p-6">
                  <div className="mb-10 aspect-[4/3] rounded-xl border border-white/10 bg-[linear-gradient(145deg,#171717,#101010)] p-4">
                    <div className="flex h-full flex-col justify-between rounded-lg border border-white/10 bg-[#0d0d0d] p-4">
                      <div className="flex items-center justify-between">
                        <span className="h-2 w-16 rounded-full bg-white/15" />
                        <span className="h-6 w-6 rounded-full border border-white/10" />
                      </div>
                      <div>
                        <div className="h-2 w-4/5 rounded-full bg-white/20" />
                        <div className="mt-2 h-2 w-2/3 rounded-full bg-white/10" />
                        <div className="mt-5 h-8 w-24 rounded-md bg-[#f26419]/85" />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs uppercase tracking-[0.15em] text-[#7f7f7f]">{category}</p>
                  <h2 className="mt-2 text-lg font-medium text-white">{title}</h2>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-[#8f8f8f]">Verified seller</span>
                    <span className="font-mono text-white">{price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#0b0b0b]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <h2 className="max-w-xl font-display text-4xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-5xl">
              Find the kind of work you need.
            </h2>
            <p className="max-w-2xl text-base leading-7 text-[#8f8f8f] lg:justify-self-end">
              The category strip should help people move into the marketplace instead of sitting there as decoration.
            </p>
          </div>
          <div className="mt-10 flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link
                key={category.value}
                href={`/marketplace?category=${category.value}`}
                className="rounded-lg border border-white/10 bg-[#101010] px-4 py-2.5 text-sm text-[#c8c8c8] transition-colors hover:border-white/20 hover:bg-[#151515] hover:text-white"
              >
                {category.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="bg-[#f7f3ec] text-[#1c1b18]">
        <HomeFeed />
      </div>

      <section id="how" className="border-t border-white/10 bg-[#0b0b0b]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#777]">How it works</p>
              <h2 className="mt-5 max-w-lg font-display text-4xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-5xl">
                The deal stays clear from payment to delivery.
              </h2>
            </div>
            <div className="divide-y divide-white/10 border-y border-white/10">
              {[
                ["01", "Choose what you need", "Browse the marketplace and open the gig that fits what you are looking for."],
                ["02", "Pay through The Middleman", "The order and payment stay connected instead of becoming an informal deal outside the platform."],
                ["03", "Receive and complete the order", "The seller delivers through the order flow and the transaction moves forward from there."],
              ].map(([number, title, body]) => (
                <div key={number} className="grid gap-4 py-6 sm:grid-cols-[72px_1fr]">
                  <span className="font-mono text-sm text-[#f26419]">{number}</span>
                  <div>
                    <h3 className="text-lg font-medium text-white">{title}</h3>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-[#8f8f8f] sm:text-base">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="why" className="border-t border-white/10 bg-[#0b0b0b]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-2">
            <h2 className="max-w-xl font-display text-4xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-5xl">
              Built for digital deals, not scattered DMs.
            </h2>
            <p className="max-w-xl text-base leading-7 text-[#8f8f8f] lg:justify-self-end">
              The point is not to add more steps. It is to keep the important parts of the transaction in one place.
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-2xl border border-white/10">
            <div className="grid grid-cols-[1.25fr_.9fr_.9fr] border-b border-white/10 bg-[#101010] px-4 py-4 text-xs text-[#777] sm:px-6">
              <span>Capability</span>
              <span className="text-white">The Middleman</span>
              <span>Direct deal</span>
            </div>
            {comparison.map(([capability, middleman, direct]) => (
              <div key={capability} className="grid grid-cols-[1.25fr_.9fr_.9fr] border-b border-white/10 px-4 py-4 text-sm last:border-b-0 sm:px-6 sm:py-5">
                <span className="pr-3 text-[#d7d7d7]">{capability}</span>
                <span className="pr-3 text-white">✓ <span className="hidden sm:inline">{middleman}</span></span>
                <span className="text-[#777]">{direct}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <RedesignFAQ />

      <section className="border-t border-white/10 bg-[#0b0b0b]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20">
          <div className="flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#777]">The Middleman</p>
              <h2 className="mt-4 max-w-2xl font-display text-4xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-5xl">
                Browse first. Sell when you are ready.
              </h2>
            </div>
            <Link href="/marketplace" className="w-fit rounded-lg bg-[#f4f2ee] px-5 py-3 text-sm font-semibold text-[#111]">
              Open marketplace
            </Link>
          </div>
          <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-[#666] sm:flex-row sm:items-center sm:justify-between">
            <span>© 2026 The Middleman</span>
            <div className="flex gap-5">
              <Link href="/legal/privacy" className="hover:text-white">Privacy</Link>
              <Link href="/legal/terms" className="hover:text-white">Terms</Link>
              <a href="mailto:hello@themiddleman.com.ng" className="hover:text-white">Contact</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
