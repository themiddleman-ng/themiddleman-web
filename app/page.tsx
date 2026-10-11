import Link from "next/link";
import { DM_Sans, Outfit } from "next/font/google";
import HomeFAQ from "@/components/HomeFAQ";
import HomeFeed from "@/components/marketplace/HomeFeed";
import Logo from "@/components/Logo";

const homepageBody = DM_Sans({ subsets: ["latin"], variable: "--home-body", display: "swap" });
const homepageDisplay = Outfit({ subsets: ["latin"], variable: "--home-display", display: "swap" });

const steps = [
  { number: "01", title: "Explore the marketplace", body: "Browse ready-made digital products from independent creators." },
  { number: "02", title: "Check the details", body: "Review the product description, previews, price and seller information before checkout." },
  { number: "03", title: "Purchase with Paystack", body: "Pay in naira through Paystack. Your order page shows the payment status and next steps." },
];

export default function Home() {
  return (
    <main className={["homepage-fonts", homepageBody.variable, homepageDisplay.variable, "flex-1 bg-[#F8F6F1] text-[#172B45]"].join(" ")}>
      <header className="sticky top-0 z-30 bg-[#F8F6F1]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Logo variant="horizontal" className="shrink-0" />
          <nav aria-label="Main navigation" className="hidden items-center gap-7 text-[15px] font-medium text-[#59697A] md:flex">
            <Link href="/marketplace" className="transition-colors hover:text-[#0B3D91]">Marketplace</Link>
            <a href="#how-it-works" className="transition-colors hover:text-[#0B3D91]">How it works</a>
            <a href="#faq" className="transition-colors hover:text-[#0B3D91]">FAQ</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/signup?mode=signin" className="rounded-md px-3 py-2 text-[15px] font-semibold text-[#334960] hover:bg-[#EAF0F3]">Log in</Link>
            <Link href="/marketplace" className="rounded-md bg-[#0B3D91] px-3.5 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#12336C] sm:px-4">Browse products <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-12 pt-14 sm:px-8 sm:pb-16 sm:pt-20 lg:grid-cols-[1fr_.9fr] lg:gap-16 lg:pb-20">
        <div className="max-w-2xl">
          <p className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[.16em] text-[#0B3D91]"><span className="h-[2px] w-6 bg-[#FF8A00]" />A marketplace for digital products</p>
          <h1 className="mt-5 font-display text-[clamp(3.35rem,7vw,6.1rem)] font-bold leading-[.98] tracking-[-.065em] text-[#172B45]">
            Find the tools you need. <span className="text-[#0B3D91]">Make them yours.</span>
          </h1>
          <p className="mt-6 max-w-xl text-[19px] leading-8 text-[#5E6E7F] sm:text-[21px] sm:leading-9">
            Discover ready-made digital products from Nigerian creators. Check what each product includes, then purchase in naira through Paystack.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/marketplace" className="inline-flex items-center gap-2 rounded-md bg-[#FF8A00] px-5 py-3 text-[16px] font-bold text-[#182B40] transition hover:bg-[#F47C00]">Explore the marketplace <span aria-hidden="true">↗</span></Link>
            <Link href="/signup" className="inline-flex items-center gap-2 rounded-md px-4 py-3 text-[16px] font-semibold text-[#172B45] transition hover:bg-[#EAF0F3]">Sell a digital product <span aria-hidden="true">→</span></Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[14px] font-semibold text-[#657587] sm:text-[15px]">
            <span><b className="mr-2 text-[#E57814]">✓</b>Prices in naira</span>
            <span><b className="mr-2 text-[#E57814]">✓</b>Independent creators</span>
            <span><b className="mr-2 text-[#E57814]">✓</b>Paystack checkout</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[560px]">
          <div className="relative overflow-hidden rounded-[1.5rem] bg-[#0B2F62] px-7 py-8 text-white sm:px-10 sm:py-10">
            <p className="text-[12px] font-bold uppercase tracking-[.16em] text-[#FFC17B]">Made for real work</p>
            <p className="mt-8 max-w-sm font-display text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-[.98] tracking-[-.055em]">Ready-made.<br /><span className="text-[#FFB052]">Ready for you.</span></p>
            <p className="mt-7 max-w-sm text-[17px] leading-7 text-[#D8E3EF]">Find useful digital goods, creative resources and tools built by people who know their craft.</p>
            <div className="mt-10 flex items-center justify-between border-t border-white/20 pt-4 text-[13px] font-medium text-[#D8E3EF]">
              <span>The Middleman</span><span>Nigeria · NGN</span>
            </div>
          </div>
          <span aria-hidden="true" className="absolute -bottom-3 -left-3 h-16 w-16 rounded-br-[1.5rem] border-b-2 border-l-2 border-[#E57814]" />
        </div>
      </section>

      <HomeFeed />

      <section id="customization" className="bg-[#EAF0F3]">
        <div className="mx-auto grid max-w-7xl gap-5 px-5 py-14 sm:px-8 sm:py-20 md:grid-cols-[1fr_1fr] md:items-end md:gap-16">
          <div>
            <p className="text-[13px] font-bold uppercase tracking-[.14em] text-[#0B3D91]">Product first. Creator close by.</p>
            <h2 className="mt-4 max-w-xl font-display text-[clamp(2.4rem,5vw,4rem)] font-semibold leading-[1.02] tracking-[-.05em] text-[#172B45]">Buy the product. Make it fit your work.</h2>
          </div>
          <div className="max-w-xl">
            <p className="text-[18px] leading-8 text-[#526577]">The Middleman is built around ready-made digital products—not open-ended freelancer listings. We’re shaping optional customization around each product, so the scope and price stay clear.</p>
            <p className="mt-4 text-[15px] leading-7 text-[#687886]"><span className="font-semibold text-[#263E55]">Customization add-ons are in development.</span> They will only appear as purchasable options when the product page, checkout and delivery flow are ready together.</p>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-[#F8F6F1]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[.72fr_1.28fr] lg:gap-16">
          <div>
            <p className="text-[13px] font-bold uppercase tracking-[.14em] text-[#0B3D91]">From browse to order</p>
            <h2 className="mt-4 max-w-md font-display text-[clamp(2.4rem,4.5vw,3.8rem)] font-semibold leading-[1.04] tracking-[-.05em] text-[#172B45]">A clearer way to buy digital goods.</h2>
          </div>
          <div className="grid gap-0 sm:grid-cols-3">
            {steps.map((step) => (
              <article key={step.number} className="border-t border-[#C9D4DA] py-5 sm:border-l sm:border-t-0 sm:pl-5 sm:pr-4 first:sm:border-l-0 first:sm:pl-0">
                <span className="font-mono text-[15px] font-bold text-[#E57814]">{step.number}</span>
                <h3 className="mt-5 text-[18px] font-bold text-[#203A53]">{step.title}</h3>
                <p className="mt-2 text-[16px] leading-7 text-[#687886]">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <HomeFAQ />

      <section className="bg-[#0B2F62] text-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-5 py-12 sm:px-8 sm:py-14 md:flex-row md:items-center">
          <div><p className="text-[12px] font-bold uppercase tracking-[.15em] text-[#FFC17B]">Start with what you need</p><h2 className="mt-3 max-w-2xl font-display text-[clamp(1.9rem,3.4vw,2.8rem)] font-semibold leading-tight tracking-[-.04em]">Find a ready-made digital product for your next step.</h2></div>
          <Link href="/marketplace" className="inline-flex w-fit items-center gap-2 rounded-md bg-[#FF8A00] px-5 py-3 text-[16px] font-bold text-[#172B45] transition hover:bg-[#F47C00]">Explore products <span aria-hidden="true">↗</span></Link>
        </div>
      </section>

      <footer className="bg-[#F1F0EB]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-7 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div><Logo variant="horizontal" /><p className="mt-2 text-[14px] text-[#74818D]">Digital products from independent Nigerian creators.</p></div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-[14px] text-[#647485]"><Link href="/marketplace" className="hover:text-[#0B3D91]">Marketplace</Link><Link href="/terms" className="hover:text-[#0B3D91]">Terms</Link><Link href="/privacy" className="hover:text-[#0B3D91]">Privacy</Link><a href="mailto:hello@themiddleman.com.ng" className="hover:text-[#0B3D91]">Contact</a></div>
        </div>
      </footer>
    </main>
  );
}
