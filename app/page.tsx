import type { Metadata } from "next";
import Link from "next/link";
import { DM_Sans, Outfit } from "next/font/google";
import HomeFAQ from "@/components/HomeFAQ";
import HomeFeed from "@/components/marketplace/HomeFeed";
import Logo from "@/components/Logo";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const homepageBody = DM_Sans({ subsets: ["latin"], variable: "--home-body", display: "swap" });
const homepageDisplay = Outfit({ subsets: ["latin"], variable: "--home-display", display: "swap" });

const steps = [
  {
    title: "Find",
    body: "Browse ready-made digital products and open a listing to see what is included.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 4.5 4.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Pay with Paystack (₦)",
    body: "Eligible checkout runs through Paystack in Nigerian Naira. Purchases are paused while payment is verified.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M3 10h18" />
      </svg>
    ),
  },
  {
    title: "Get your files from the seller",
    body: "After payment, use your order page for confirmation and any files the seller shares.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5Z" />
        <path d="M14 3.5V8h4.5" />
      </svg>
    ),
  },
];

const developerFeatures = [
  "Paystack checkout in Naira",
  "Seller identity verification",
  "AI-assisted work is labeled",
  "In-app product messaging",
  "Previews when a seller uploads them",
];

export default function Home() {
  return (
    <main className={["homepage-fonts", homepageBody.variable, homepageDisplay.variable, "flex-1 bg-ink text-bone"].join(" ")}>
      <SiteHeader />

      <section className="homepage-hero mx-auto w-full max-w-7xl px-5 pb-8 pt-8 sm:px-8 sm:pb-10 sm:pt-10">
        <div className="homepage-confetti" aria-hidden="true">
          <span /><span /><span /><span /><span /><span />
        </div>
        <div className="relative max-w-2xl">
          <h1 className="font-display text-[2.05rem] font-bold leading-[1.05] tracking-[-.045em] text-bone sm:text-[clamp(2.6rem,5vw,4.2rem)]">
            Find <span className="text-ember">digital</span> products that work.
          </h1>
          <p className="mt-4 max-w-xl text-[16px] leading-7 text-slate sm:text-[18px]">
            Browse listings from Nigerian creators and pay through Paystack.
          </p>
          <form action="/marketplace" className="mt-5 md:hidden" role="search">
            <label className="sr-only" htmlFor="hero-search">Search products</label>
            <input
              id="hero-search"
              type="search"
              name="q"
              placeholder="Search products"
              className="h-12 w-full rounded-xl border border-line bg-paper px-4 text-[16px] text-bone placeholder:text-slate focus:border-ember focus:outline-none focus:ring-4 focus:ring-ember/15"
            />
          </form>
          <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
            <Link href="/marketplace" className="btn-primary inline-flex min-h-12 items-center justify-center rounded-md px-5 text-[16px] font-bold">Browse products</Link>
            <Link href="/signup" className="inline-flex min-h-12 items-center justify-center rounded-md border border-bone px-4 text-[16px] font-semibold text-bone hover:bg-elevated">Start selling</Link>
          </div>
        </div>
      </section>

      <HomeFeed />

      <section id="how-it-works" className="bg-ink">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-16">
          <p className="text-[13px] font-bold uppercase tracking-[.14em] text-eyebrow">How it works</p>
          <h2 className="mt-3 max-w-md font-display text-[1.85rem] font-semibold leading-[1.08] tracking-[-.05em] text-bone sm:text-[2.4rem]">Find, pay, then collect your files.</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {steps.map((step) => (
              <article key={step.title} className="rounded-2xl border border-line bg-paper p-5">
                <span className="text-ember">{step.icon}</span>
                <h3 className="mt-4 text-[18px] font-bold text-bone">{step.title}</h3>
                <p className="mt-2 text-[16px] leading-7 text-slate">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="developer-strip">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
          <p className="text-[13px] font-bold uppercase tracking-[.14em] text-eyebrow">Built for developers</p>
          <h2 className="mt-3 font-display text-[1.7rem] font-semibold tracking-[-.04em] text-bone">What the marketplace already does.</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {developerFeatures.map((feature) => (
              <li key={feature} className="rounded-xl bg-paper/70 px-4 py-3 text-[16px] font-semibold text-bone">{feature}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-ink">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-14 sm:px-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[13px] font-bold uppercase tracking-[.14em] text-eyebrow">Sell on The Middleman</p>
            <h2 className="mt-3 max-w-xl font-display text-[1.85rem] font-semibold tracking-[-.04em] text-bone">List a digital product and get paid in Naira.</h2>
            <p className="mt-3 max-w-xl text-[16px] leading-7 text-slate">Create an account, finish seller verification, then publish a listing buyers can preview.</p>
          </div>
          <Link href="/signup" className="btn-primary inline-flex min-h-12 w-fit items-center justify-center rounded-md px-5 text-[16px] font-bold">Start selling</Link>
        </div>
      </section>

      <HomeFAQ />

      <section className="cta-band">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-12 sm:px-8 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="max-w-xl font-display text-[clamp(1.8rem,3vw,2.6rem)] font-semibold leading-tight">Find a product. Pay in Naira.</h2>
          <Link href="/marketplace" className="inline-flex min-h-12 w-fit items-center rounded-md bg-logo-navy px-5 text-[16px] font-bold text-white">Browse products</Link>
        </div>
      </section>

      <footer className="bg-paper">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 md:grid-cols-4">
          <div>
            <Logo variant="horizontal" />
            <p className="mt-3 text-[14px] leading-6 text-slate">Digital products from independent Nigerian creators.</p>
          </div>
          <div>
            <p className="text-[13px] font-bold text-bone">Marketplace</p>
            <div className="mt-3 grid gap-2 text-[14px] text-slate">
              <Link href="/marketplace" className="hover:text-ember">Browse products</Link>
              <Link href="/#how-it-works" className="hover:text-ember">How it works</Link>
              <Link href="/#faq" className="hover:text-ember">FAQ</Link>
            </div>
          </div>
          <div>
            <p className="text-[13px] font-bold text-bone">Legal</p>
            <div className="mt-3 grid gap-2 text-[14px] text-slate">
              <Link href="/legal/terms" className="hover:text-ember">Terms</Link>
              <Link href="/legal/privacy" className="hover:text-ember">Privacy</Link>
              <Link href="/legal/refunds" className="hover:text-ember">Refunds</Link>
            </div>
          </div>
          <div>
            <p className="text-[13px] font-bold text-bone">Contact</p>
            <div className="mt-3 grid gap-2 text-[14px] text-slate">
              <a href="mailto:hello@themiddleman.com.ng" className="hover:text-ember">hello@themiddleman.com.ng</a>
              <p className="text-[13px] font-semibold text-bone">Payments by Paystack</p>
            </div>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 text-[13px] text-slate sm:px-8">
          <p>© The Middleman</p>
          <a
            href="https://www.codehype.ai/product/the-middleman?utm_source=codehype_badge"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ember"
          >
            Listed on CodeHype
          </a>
        </div>
      </footer>
    </main>
  );
}
