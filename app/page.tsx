import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { DM_Sans, Outfit } from "next/font/google";
import HomeFAQ from "@/components/HomeFAQ";
import HomeFeed from "@/components/marketplace/HomeFeed";
import Logo from "@/components/Logo";
import SiteHeader from "@/components/SiteHeader";
import ProductCover from "@/components/marketplace/ProductCover";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const homepageBody = DM_Sans({ subsets: ["latin"], variable: "--home-body", display: "swap" });
const homepageDisplay = Outfit({ subsets: ["latin"], variable: "--home-display", display: "swap" });

const featuredProducts = [
  {
    id: "ebe2fdfe-6072-4521-873f-796ba38a3ca8",
    title: "Build a lightweight spreadsheet automation plan",
    creator: "Samuel Digital Studio",
    price: 70000,
    category: "development",
    imageSrc: null as string | null,
    verified: true,
  },
  {
    id: "4c12722a-33fa-4c78-8f17-0081d2a6ce5d",
    title: "Write launch copy for your digital product",
    creator: "Samuel Digital Studio",
    price: 45000,
    category: "writing",
    imageSrc: null as string | null,
    verified: true,
  },
  {
    id: "5061455c-d3f5-4a90-8e8e-a946675fda24",
    title: "Prepare a 14-day content calendar for your offer",
    creator: "Samuel Digital Studio",
    price: 55000,
    category: "marketing",
    imageSrc: null as string | null,
    verified: true,
  },
];

const steps = [
  { number: "01", title: "Explore the marketplace", body: "Browse ready-made digital products from independent creators." },
  { number: "02", title: "Check the details", body: "Review the product description, previews, price and seller information before checkout." },
  { number: "03", title: "Purchase with Paystack", body: "Pay in naira through Paystack. Your order page shows the payment status and next steps." },
];

export default function Home() {
  return (
    <main className={["homepage-fonts", homepageBody.variable, homepageDisplay.variable, "flex-1 bg-ink text-bone"].join(" ")}>
      <SiteHeader />

      <section className="homepage-hero mx-auto grid max-w-7xl items-center gap-10 px-5 pb-12 pt-14 sm:px-8 sm:pb-16 sm:pt-20 lg:grid-cols-[1fr_.9fr] lg:gap-16 lg:pb-20">
        <div className="max-w-2xl">
          <h1 className="font-display text-[2.05rem] font-bold leading-[1.05] tracking-[-.045em] text-bone sm:text-[clamp(3.35rem,7vw,6.1rem)] sm:leading-[.98]">
            Find the tools you need. <span className="text-bone">Make them yours.</span>
          </h1>
          <p className="mt-5 max-w-xl text-[16px] leading-7 text-slate sm:mt-6 sm:text-[21px] sm:leading-9">
            Discover digital products from Nigerian creators. Preview what’s included, then pay in Naira through Paystack.
          </p>
          <div className="mt-7 grid gap-3 sm:mt-8 sm:flex sm:flex-wrap">
            <Link href="/marketplace" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-ember px-5 py-3 text-[16px] font-bold text-on-ember transition hover:opacity-90">Explore the marketplace</Link>
            <Link href="/signup" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-bone px-4 py-3 text-[16px] font-semibold text-bone transition hover:bg-elevated">Sell a digital product</Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[14px] font-semibold text-slate sm:text-[15px]">
            <span><b className="mr-2 text-ember">✓</b>Independent creators</span>
            <span><b className="mr-2 text-ember">✓</b>Paystack checkout</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[560px]">
          <div className="overflow-hidden rounded-[1.25rem] border border-line bg-paper shadow-[0_18px_60px_-32px_rgba(0,0,0,.55)]">
            <div className="flex items-center gap-2 border-b border-line px-5 py-4 sm:px-6">
              <span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-md bg-ember font-display text-[15px] text-on-ember">M</span>
              <span className="text-[14px] font-bold text-bone">Marketplace</span>
            </div>
            <div className="grid gap-4 px-5 py-5 sm:grid-cols-3 sm:gap-0 sm:px-6 sm:py-6">
              {featuredProducts.map((product, index) => (
                <Link
                  key={product.id}
                  href={`/gigs/${product.id}`}
                  className="group flex min-w-0 gap-3 border-t border-line pt-4 first:border-t-0 first:pt-0 sm:flex-col sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0 sm:first:border-l-0 sm:first:pl-0"
                >
                  <div
                    data-product-image-slot={index + 1}
                    className="relative h-20 w-24 shrink-0 overflow-hidden rounded-md bg-elevated sm:aspect-[4/3] sm:h-auto sm:w-full"
                    role={product.imageSrc ? undefined : "img"}
                    aria-label={product.imageSrc ? undefined : `Image placeholder for ${product.title}`}
                  >
                    {product.imageSrc ? (
                      <Image
                        src={product.imageSrc}
                        alt={`${product.title} preview`}
                        fill
                        sizes="(max-width: 640px) 96px, 180px"
                        className="object-cover"
                      />
                    ) : (
                      <ProductCover title={product.title} category={product.category} compact />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="line-clamp-2 text-[13px] font-semibold leading-5 text-bone transition-colors group-hover:text-ember sm:mt-3 sm:min-h-10">
                      {product.title}
                    </h2>
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-slate">
                      <span className="truncate">{product.creator}</span>
                      {product.verified && <span role="img" aria-label="Verified seller" title="Verified seller" className="shrink-0 font-bold text-ember">✓</span>}
                    </p>
                    <p className="mt-2 text-[14px] font-bold text-bone">₦{product.price.toLocaleString("en-NG")}</p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="border-t border-line px-5 py-3 text-[12px] font-semibold text-slate sm:px-6">
              Pay in Naira · Paystack checkout
            </div>
          </div>
        </div>
      </section>

      <HomeFeed />

      <section id="customization" className="bg-elevated">
        <div className="mx-auto grid max-w-7xl gap-5 px-5 py-14 sm:px-8 sm:py-20 md:grid-cols-[1fr_1fr] md:items-end md:gap-16">
          <div>
            <p className="text-[13px] font-bold uppercase tracking-[.14em] text-ember">Product first. Creator close by.</p>
            <h2 className="mt-4 max-w-xl font-display text-[1.85rem] font-semibold leading-[1.08] tracking-[-.05em] text-bone sm:text-[clamp(2.4rem,5vw,4rem)] sm:leading-[1.02]">Buy the product. Make it fit your work.</h2>
          </div>
          <div className="max-w-xl">
            <p className="text-[18px] leading-8 text-slate">The Middleman is built around ready-made digital products—not open-ended freelancer listings. We’re shaping optional customization around each product, so the scope and price stay clear.</p>
            <p className="mt-4 text-[15px] leading-7 text-slate"><span className="font-semibold text-bone">Customization add-ons are in development.</span> They will only appear as purchasable options when the product page, checkout and delivery flow are ready together.</p>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-ink">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[.72fr_1.28fr] lg:gap-16">
          <div>
            <p className="text-[13px] font-bold uppercase tracking-[.14em] text-ember">From browse to order</p>
            <h2 className="mt-4 max-w-md font-display text-[1.85rem] font-semibold leading-[1.08] tracking-[-.05em] text-bone sm:text-[clamp(2.4rem,4.5vw,3.8rem)] sm:leading-[1.04]">A clearer way to buy digital goods.</h2>
          </div>
          <div className="grid gap-0 sm:grid-cols-3">
            {steps.map((step) => (
              <article key={step.number} className="border-t border-line py-5 sm:border-l sm:border-t-0 sm:pl-5 sm:pr-4 first:sm:border-l-0 first:sm:pl-0">
                <span className="font-mono text-[15px] font-bold text-ember">{step.number}</span>
                <h3 className="mt-5 text-[18px] font-bold text-bone">{step.title}</h3>
                <p className="mt-2 text-[16px] leading-7 text-slate">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <HomeFAQ />

      <section className="bg-elevated text-bone">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-5 py-12 sm:px-8 sm:py-14 md:flex-row md:items-center">
          <div><p className="text-[12px] font-bold uppercase tracking-[.15em] text-ember">Start with what you need</p><h2 className="mt-3 max-w-2xl font-display text-[clamp(1.9rem,3.4vw,2.8rem)] font-semibold leading-tight tracking-[-.04em]">Find a ready-made digital product for your next step.</h2></div>
          <Link href="/marketplace" className="inline-flex w-fit items-center gap-2 rounded-md bg-ember px-5 py-3 text-[16px] font-bold text-on-ember transition hover:opacity-90">Explore products</Link>
        </div>
      </section>

      <footer className="bg-paper">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-7 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div><Logo variant="horizontal" /><p className="mt-2 text-[14px] text-slate">Digital products from independent Nigerian creators.</p></div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-[14px] text-slate"><Link href="/marketplace" className="hover:text-bone">Marketplace</Link><Link href="/legal/terms" className="hover:text-bone">Terms</Link><Link href="/legal/privacy" className="hover:text-bone">Privacy</Link><a href="mailto:hello@themiddleman.com.ng" className="hover:text-bone">Contact</a></div>
          <a
            href="https://www.codehype.ai/product/the-middleman?utm_source=codehype_badge"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://www.codehype.ai/badges/the-middleman.svg?variant=find-us&v=20"
              alt="Featured on CodeHype"
              width={180}
              height={65}
              loading="lazy"
              decoding="async"
              style={{ display: "inline-block", border: 0, width: "100%", maxWidth: 180, height: "auto", maxHeight: 65 }}
            />
          </a>
        </div>
      </footer>
    </main>
  );
}
