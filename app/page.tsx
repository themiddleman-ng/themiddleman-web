import Link from "next/link";
import HomeFAQ from "@/components/HomeFAQ";
import HomeFeed from "@/components/marketplace/HomeFeed";
import Logo from "@/components/Logo";

const steps = [
  { number: "01", title: "Find the right work", body: "Explore digital products and services from Nigerian creators." },
  { number: "02", title: "Place a protected order", body: "Pay through the platform. Your payment stays protected while work is underway." },
  { number: "03", title: "Review the delivery", body: "Check what you receive and approve the order before payment is released." },
];

const comparison = [
  ["Payment", "Sent directly between people", "Held in protected checkout"],
  ["Order details", "Spread across messages", "Kept with the order"],
  ["Delivery", "Agreed and tracked separately", "Submitted for buyer review"],
  ["When work is complete", "Follow up to settle", "Approve delivery to release payment"],
];

export default function Home() {
  return (
    <main className="flex-1 bg-[#F8F6F1] text-[#172B45]">
      <header className="sticky top-0 z-30 border-b border-[#DCE2E5] bg-[#F8F6F1]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Logo variant="horizontal" className="shrink-0" />
          <nav className="hidden items-center gap-7 text-[13px] text-[#59697A] md:flex">
            <a href="#how-it-works" className="transition-colors hover:text-[#0B3D91]">How it works</a>
            <a href="#why-middleman" className="transition-colors hover:text-[#0B3D91]">Why The Middleman</a>
            <a href="#faq" className="transition-colors hover:text-[#0B3D91]">FAQ</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/signup?mode=signin" className="rounded-md px-3 py-2 text-xs font-semibold text-[#334960] hover:bg-[#EAF0F3] sm:text-sm">Log in</Link>
            <Link href="/marketplace" className="rounded-md bg-[#0B3D91] px-3.5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#12336C] sm:px-4 sm:text-sm">Explore marketplace <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </header>

      <section className="border-b border-[#DCE2E5]">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[.94fr_1.06fr] lg:gap-16 lg:py-24">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.15em] text-[#0B3D91]"><span className="h-[2px] w-6 bg-[#FF8A00]" />Made for digital work</p>
            <h1 className="mt-5 font-display text-[clamp(2.7rem,5.5vw,4.5rem)] font-bold leading-[1.04] tracking-[-.055em] text-[#172B45]">
              Find useful digital work. <span className="text-[#0B3D91]">Pay with confidence.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-7 text-[#5E6E7F] sm:text-[17px]">
              Discover digital products and services from Nigerian creators. Your payment stays protected while an order moves from agreement to delivery.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/marketplace" className="inline-flex items-center gap-2 rounded-md bg-[#FF8A00] px-5 py-3 text-sm font-bold text-[#182B40] transition hover:bg-[#F47C00]">Browse the marketplace <span aria-hidden="true">↗</span></Link>
              <Link href="/signup" className="inline-flex items-center gap-2 rounded-md border border-[#CCD5DA] bg-white/70 px-5 py-3 text-sm font-semibold text-[#172B45] transition hover:border-[#9DABB4] hover:bg-white">Start selling <span aria-hidden="true">→</span></Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#DCE2E5] pt-4 text-[10px] font-bold uppercase tracking-[.1em] text-[#657587] sm:text-[11px]">
              <span><b className="mr-2 text-[#FF8A00]">✓</b>Naira pricing</span>
              <span><b className="mr-2 text-[#FF8A00]">✓</b>Verified sellers</span>
              <span><b className="mr-2 text-[#FF8A00]">✓</b>Protected orders</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[590px]">
            <div aria-hidden="true" className="absolute -right-3 -top-3 h-24 w-24 border-r border-t border-[#E0A46D]" />
            <div className="relative rounded-xl border border-[#D7E0E4] bg-white p-4 shadow-[0_18px_48px_rgba(23,43,69,.10)] sm:p-6">
              <div className="flex items-start justify-between gap-3 border-b border-[#E7ECEE] pb-4">
                <div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#718091]">Order flow preview</p><h2 className="mt-1 text-sm font-bold text-[#172B45] sm:text-base">One order, clear next steps</h2></div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F2EC] px-2.5 py-1.5 text-[9px] font-bold text-[#397353] sm:text-[10px]"><span className="h-1.5 w-1.5 rounded-full bg-[#4D8A65]" />PAYMENT PROTECTED</span>
              </div>
              <div className="mt-6">
                <div className="relative grid grid-cols-4 gap-1">
                  <div aria-hidden="true" className="absolute left-[12%] right-[12%] top-[11px] h-px bg-[#D6E0E3]" />
                  {[
                    ["✓", "Order placed", true],
                    ["✓", "Payment secured", true],
                    ["3", "Work in progress", false],
                    ["4", "Review delivery", false],
                  ].map(([mark, label, done], index) => (
                    <div key={label as string} className="relative flex flex-col items-center text-center">
                      <span className={`grid h-[22px] w-[22px] place-items-center rounded-full border-2 border-white text-[9px] font-bold shadow-[0_0_0_1px_#D4DEE2] ${done ? "bg-[#DDECE2] text-[#397353]" : index === 2 ? "bg-[#FF8A00] text-white" : "bg-[#E9EEF0] text-[#7D8C98]"}`}>{mark as string}</span>
                      <span className={`mt-2 max-w-[72px] text-[9px] leading-4 sm:max-w-[94px] sm:text-[10px] ${index === 2 ? "font-bold text-[#243E57]" : "text-[#788795]"}`}>{label as string}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 flex items-center gap-3 rounded-lg bg-[#F2F5F6] p-3 sm:p-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#E1EAF4] text-[#0B3D91]" aria-hidden="true">↗</span>
                <div><p className="text-xs font-bold text-[#233B54]">Your order stays in view</p><p className="mt-1 text-[10px] leading-4 text-[#6E7D8A] sm:text-[11px]">Follow payment, seller progress and delivery from one place.</p></div>
              </div>
              <p className="mt-4 flex items-center gap-2 text-[10px] text-[#73818D]"><span className="text-[#43805A]">✓</span> Payment releases after the buyer approves delivery.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="border-b border-[#DCE2E5] bg-[#F0F3F3]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4 text-[11px] text-[#5F6F7E] sm:px-8">
          <span className="font-semibold text-[#354D63]">The details matter.</span>
          <span>Useful digital products</span><span className="hidden text-[#B2BDC3] sm:inline">/</span>
          <span>Nigerian creators</span><span className="hidden text-[#B2BDC3] sm:inline">/</span>
          <span>Clear order and delivery steps</span><span className="hidden text-[#B2BDC3] sm:inline">/</span>
          <span>Protected checkout</span>
        </div>
      </div>

      <HomeFeed />

      <section id="how-it-works" className="border-y border-[#DCE2E5] bg-[#EAF0F3]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[.75fr_1.25fr] lg:gap-16">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.14em] text-[#0B3D91]">From discovery to delivery</p>
            <h2 className="mt-4 max-w-md font-display text-3xl font-bold leading-tight tracking-[-.04em] text-[#172B45] sm:text-4xl">The work and the payment move together.</h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-[#617181]">The order keeps the agreement, payment, progress and delivery connected, so both sides can see what happens next.</p>
          </div>
          <div className="grid gap-0 sm:grid-cols-3">
            {steps.map((step) => (
              <article key={step.number} className="border-t border-[#C9D4DA] py-5 sm:border-l sm:border-t-0 sm:pl-5 sm:pr-4 first:sm:border-l-0 first:sm:pl-0">
                <span className="font-mono text-xs font-bold text-[#E57814]">{step.number}</span>
                <h3 className="mt-5 text-base font-bold text-[#203A53]">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#687886]">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="why-middleman" className="bg-[#F8F6F1]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="grid items-end gap-5 md:grid-cols-[1.1fr_.9fr] md:gap-14">
            <div><p className="text-[11px] font-bold uppercase tracking-[.14em] text-[#0B3D91]">A clearer way to work</p><h2 className="mt-4 max-w-2xl font-display text-3xl font-bold leading-[1.08] tracking-[-.045em] text-[#172B45] sm:text-5xl">A listing is the start. A clear order is what gets the work done.</h2></div>
            <p className="max-w-lg text-sm leading-7 text-[#637384]">When you arrange work directly, the payment, agreement and delivery can end up in separate places. The Middleman keeps the order together and protects payment through the review step.</p>
          </div>
          <div className="mt-9 overflow-hidden rounded-lg border border-[#D8E0E4] bg-white">
            <div className="grid grid-cols-[1.08fr_1fr_1fr] bg-[#EDF2F4] text-[9px] font-bold uppercase tracking-[.08em] text-[#71808C] sm:text-[10px]">
              <div className="p-3 sm:p-4">The process</div><div className="p-3 sm:p-4">Direct arrangement</div><div className="bg-[#E6EDF4] p-3 text-[#0B3D91] sm:p-4">The Middleman</div>
            </div>
            {comparison.map(([label, direct, middleman]) => (
              <div key={label} className="grid grid-cols-[1.08fr_1fr_1fr] border-t border-[#E6EBED] text-[10px] sm:text-xs">
                <div className="p-3 font-semibold text-[#354C61] sm:p-4">{label}</div><div className="p-3 leading-5 text-[#788591] sm:p-4">{direct}</div><div className="bg-[#F5F8FA] p-3 leading-5 font-semibold text-[#244766] sm:p-4">{middleman}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10px] text-[#81909A]">A comparison of the order process, not a claim about every marketplace or seller.</p>
        </div>
      </section>

      <HomeFAQ />

      <section className="bg-[#0B2F62] text-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-5 py-12 sm:px-8 sm:py-14 md:flex-row md:items-center">
          <div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#FFC17B]">Start with what you need</p><h2 className="mt-3 font-display text-2xl font-bold tracking-[-.03em] sm:text-3xl">Find the right digital work for your next step.</h2></div>
          <Link href="/marketplace" className="inline-flex w-fit items-center gap-2 rounded-md bg-[#FF8A00] px-5 py-3 text-sm font-bold text-[#172B45] transition hover:bg-[#F47C00]">Explore the marketplace <span aria-hidden="true">↗</span></Link>
        </div>
      </section>

      <footer className="border-t border-[#DCE2E5] bg-[#F1F0EB]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-7 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div><Logo variant="horizontal" /><p className="mt-2 text-[10px] text-[#74818D]">Digital work, with a clearer path from order to delivery.</p></div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-[#647485]"><Link href="/marketplace" className="hover:text-[#0B3D91]">Marketplace</Link><Link href="/terms" className="hover:text-[#0B3D91]">Terms</Link><Link href="/privacy" className="hover:text-[#0B3D91]">Privacy</Link><a href="mailto:hello@themiddleman.com.ng" className="hover:text-[#0B3D91]">Contact</a></div>
        </div>
      </footer>
    </main>
  );
}
