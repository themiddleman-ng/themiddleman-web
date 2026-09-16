import Link from "next/link";
import HomeFAQ from "@/components/HomeFAQ";
import HomeFeed from "@/components/marketplace/HomeFeed";
import FadeIn from "@/components/motion/FadeIn";
import StaggerChildren from "@/components/motion/StaggerChildren";
import Logo from "@/components/Logo";

const TRUST_SCENARIOS = [
  {
    title: "Buyer protection",
    body:
      "Review the agreed delivery before payment is released. If something is wrong, raise a dispute instead of relying on informal promises.",
    marker: "01",
  },
  {
    title: "Seller credibility",
    body:
      "Verified seller profiles, clear listings, and transparent order records help legitimate creators earn trust before a transaction begins.",
    marker: "02",
  },
  {
    title: "Accountable transactions",
    body:
      "Keep the listing, conversation, payment status, delivery, review, and dispute trail connected to one order.",
    marker: "03",
  },
];

export default function Home() {
  return (
    <main className="flex-1 bg-[#f7f3ec] text-[#1c1b18]">
      {/* NAV */}
      <header className="sticky top-0 z-30 border-b border-[#e8e0d5] bg-[#f7f3ec]/90 text-[#1c1b18] backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <Logo variant="vertical" className="shrink-0" />
          <nav className="hidden sm:flex items-center gap-2 text-sm text-[#6f6a63]">
            <a href="#how-it-works" className="relative px-3 py-2 transition-colors hover:text-[#1c1b18] after:absolute after:bottom-1 after:left-3 after:h-px after:w-0 after:bg-[#f26419] after:transition-all hover:after:w-[calc(100%-1.5rem)]">
              How it works
            </a>
            <a href="#trust" className="relative px-3 py-2 transition-colors hover:text-[#1c1b18] after:absolute after:bottom-1 after:left-3 after:h-px after:w-0 after:bg-[#f26419] after:transition-all hover:after:w-[calc(100%-1.5rem)]">
              Escrow &amp; trust
            </a>
            <Link href="/marketplace" className="relative px-3 py-2 transition-colors hover:text-[#1c1b18] after:absolute after:bottom-1 after:left-3 after:h-px after:w-0 after:bg-[#f26419] after:transition-all hover:after:w-[calc(100%-1.5rem)]">
              Browse marketplace
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/signup?mode=signin" className="rounded-full px-4 py-2 text-sm text-[#1c1b18] transition-colors hover:bg-[#f26419]/10">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-[#f26419] px-5 py-2 text-sm font-semibold text-[#111111] shadow-lg shadow-[#f26419]/25 hover:-translate-y-0.5 hover:bg-[#ff7a3d] transition-all"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-[#e8e0d5] bg-[#f7f3ec] text-[#1c1b18]">
        <div aria-hidden="true" className="absolute right-0 top-16 h-72 w-72 rounded-full bg-[#8d75bd]/10 blur-[100px]" />
        <div aria-hidden="true" className="absolute right-[35%] top-56 h-44 w-44 rounded-full bg-[#f26419]/10 blur-[90px]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 sm:py-20 lg:grid-cols-[.95fr_1.05fr] lg:gap-20 lg:py-24">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-sm font-semibold tracking-[.22em] text-[#f7a57a]">
              <span className="h-px w-7 bg-[#f26419]" />
              BUY. SELL. BUILD.
            </p>

        <h1 className="mt-6 max-w-4xl font-display text-5xl font-semibold leading-[1.02] tracking-tight text-[#1c1b18] sm:text-6xl lg:text-7xl">
          Buy and sell digital work without trust problem.
        </h1>

        <p className="mt-7 max-w-xl text-lg leading-relaxed text-[#5f5a53] sm:text-xl">
          Discover digital products, software, and services from verified Nigerian creators. Your payment stays protected in escrow until the transaction is complete.
        </p>
        {/*
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#d3cabf] sm:text-xl">
          The Middleman is Nigeria&apos;s trusted marketplace for digital products, software, templates, creative assets, and legitimate digital services —
          with every payment held safely in escrow from order to delivery.
        </p>
        */}

        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/marketplace"
            className="rounded-full bg-[#f26419] px-7 py-3.5 text-center text-base font-semibold text-[#111111] shadow-[0_10px_24px_rgba(242,100,25,.18)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#e65d16] hover:shadow-[0_14px_30px_rgba(242,100,25,.25)]"
          >
            Browse marketplace
          </Link>
          <Link
            href="/gigs/new"
            className="rounded-full border border-[#d8d0c4] bg-transparent px-7 py-3.5 text-center text-base font-semibold text-[#1c1b18] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#b8ad9f] hover:bg-white/60"
          >
            Start selling
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-[#ded6ca] pt-5 text-[11px] font-semibold tracking-[.15em] text-[#6f6a63] sm:gap-x-5 sm:text-xs">
          {['VERIFIED SELLERS', 'ESCROW PROTECTED', 'PRICED IN NAIRA', 'BUILT FOR NIGERIA'].map((signal) => (
            <span key={signal} className="flex items-center gap-2 transition-colors hover:text-[#1c1b18]"><span className="h-1 w-1 rounded-full bg-[#f26419]" />{signal}</span>
          ))}
        </div>
          </div>

          <div className="group relative mx-auto w-full max-w-xl py-4 transition-transform duration-500 ease-out hover:-translate-y-1 lg:max-w-none">
            <div aria-hidden="true" className="absolute inset-x-12 top-12 h-64 rounded-full bg-[#8d75bd]/15 blur-3xl transition-opacity duration-500 group-hover:opacity-80" />
            <div className="relative overflow-hidden rounded-2xl bg-white p-4 shadow-[0_24px_60px_rgba(46,37,26,.14)] transition-shadow duration-500 group-hover:shadow-[0_30px_70px_rgba(46,37,26,.19)] sm:p-5">
              <div className="flex items-center justify-between border-b border-[#eee7de] pb-4">
                <div className="flex items-center gap-2 text-xs font-medium text-[#5f5a53]"><span className="h-2 w-2 rounded-full bg-[#f26419]" />THE MIDDLEMAN</div>
                <span className="rounded-full bg-[#fff0e7] px-2.5 py-1 text-[10px] font-semibold tracking-[.12em] text-[#b64910]">PAYMENT PROTECTED</span>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-[1.1fr_.9fr]">
                <div className="overflow-hidden rounded-xl bg-[#1c1b18] shadow-[0_12px_28px_rgba(28,27,24,.18)]">
                  <div className="relative h-40 overflow-hidden bg-[radial-gradient(circle_at_68%_20%,rgba(125,84,195,.8),transparent_28%),linear-gradient(135deg,#231b32_0%,#151519_55%,#392114_100%)] transition-transform duration-700 ease-out group-hover:scale-[1.025] sm:h-48">
                    <div className="absolute left-5 top-5 rounded-md bg-[#0e0e10]/80 px-2 py-1 font-mono text-[9px] text-[#d3cabf]">NOTION TEMPLATE</div>
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-[linear-gradient(135deg,transparent_0_46%,rgba(242,100,25,.65)_47%_49%,transparent_50%),linear-gradient(45deg,transparent_0_43%,rgba(255,255,255,.11)_44%_46%,transparent_47%)] opacity-80" />
                    <div className="absolute bottom-5 left-5 right-5 rounded-lg bg-[#17171a]/90 p-3 backdrop-blur"><div className="h-1.5 w-20 rounded-full bg-white/70" /><div className="mt-2 h-1 w-28 rounded-full bg-white/20" /></div>
                  </div>
                  <div className="p-4 text-white">
                    <p className="text-[10px] font-semibold tracking-[.16em] text-[#f7a57a]">DIGITAL PRODUCT</p>
                    <h2 className="mt-2 font-display text-lg font-bold text-white">Founder&apos;s Notion OS</h2>
                    <div className="mt-4 flex items-center justify-between"><div className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-[#7d54c3]/30 text-[9px] font-bold text-[#e4d8ff]">AO</span><span className="text-xs text-[#d3cabf]">Ada Okeke <b className="font-medium text-[#f7a57a]">✓ Verified</b></span></div><span className="font-mono text-sm font-semibold text-white">₦18,500</span></div>
                  </div>
                </div>
                <div className="flex flex-col px-1 py-2 sm:py-4">
                  <p className="text-[10px] font-semibold tracking-[.16em] text-[#6f6a63]">TRANSACTION</p>
                  <div className="mt-5 border-l-2 border-[#f26419] pl-3"><p className="text-xs font-medium text-[#1c1b18]">Order #TM-2847</p><p className="mt-1 text-[11px] leading-relaxed text-[#6f6a63]">Funds are held securely until delivery is approved.</p></div>
                  <div className="mt-auto rounded-lg border border-[#f26419]/20 bg-[#f26419]/10 p-3"><div className="flex items-center justify-between text-[10px] font-semibold tracking-[.12em] text-[#f9d7c2]"><span>ESCROW STATUS</span><span>●</span></div><p className="mt-2 text-sm font-medium text-white">Payment protected</p><p className="mt-1 font-mono text-xs text-[#d3cabf]">₦18,500 held</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <HomeFeed />

      {/* HOW IT WORKS — receipt/ticket motif */}
      <section id="how-it-works" className="relative overflow-hidden bg-[#171717]">
        <div aria-hidden="true" className="absolute right-0 top-0 h-80 w-80 rounded-full bg-[#7d54c3]/10 blur-[120px]" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 sm:py-20">
          <p className="mb-3 text-sm font-medium tracking-[0.2em] text-[#f7a57a]">
            HOW IT WORKS
          </p>
          <h2 className="max-w-2xl font-display text-5xl font-bold tracking-tight text-white sm:text-6xl">
            From discovery to delivery, The Middleman stays in between.
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#c8c1b7] sm:text-xl">
            Find digital work, pay securely, and release payment only when you&apos;re satisfied with what you receive.
          </p>

          <div className="relative mt-14 grid border-y border-white/10 lg:grid-cols-3 lg:divide-x lg:divide-white/10">
            <div aria-hidden="true" className="absolute left-[16%] right-[16%] top-0 hidden h-px bg-gradient-to-r from-[#f26419]/60 via-[#f26419]/20 to-transparent lg:block" />
            <StaggerChildren baseDelay={200} staggerDelay={120} direction="up">
              {[
              {
                step: "01",
                title: "DISCOVER",
                description: "Browse digital products, software, and services from verified sellers.",
                body: "Publish the development, design, marketing, or writing work you offer — or browse verified sellers already active on the platform.",
              },
              {
                step: "02",
                title: "PAY SAFELY",
                description: "Pay in Nigerian Naira while your money stays protected in escrow.",
                body: "Your payment is held safely by The Middleman while the seller completes the agreed work.",
              },
              {
                step: "03",
                title: "APPROVE",
                description: "Review what you receive. Approve the delivery and release the payment.",
                body: "Review the delivery. Payment releases to the seller only after you confirm everything is as promised.",
              },
              ].map((item, index) => (
              <div key={item.step} className="group relative min-h-[15rem] border-t border-white/10 px-1 py-9 transition-colors duration-300 first:border-t-0 hover:bg-white/[.025] sm:px-7 lg:border-t-0 lg:px-9">
                <span className="font-mono text-5xl leading-none text-[#f26419] transition-transform duration-300 group-hover:translate-x-1">
                  {item.step}
                </span>
                <h3 className="mt-8 font-display text-xl font-bold tracking-[.08em] text-white">
                  {item.title}
                </h3>
                <p className="mt-3 max-w-xs text-base leading-relaxed text-[#d9d0c5]">
                  {item.description}
                </p>
                <p className="hidden text-sm leading-relaxed text-[#d9d0c5]">
                  {item.body}
                </p>
                <div className="mt-7 flex h-9 items-center text-[10px] font-semibold tracking-[.15em] text-[#c8c1b7]">
                  {index === 0 && <span className="flex items-center gap-2 transition-transform duration-300 group-hover:translate-x-1"><span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-[#f7a57a]">↗</span>MARKETPLACE OPEN</span>}
                  {index === 1 && <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#f26419] shadow-[0_0_0_4px_rgba(242,100,25,.12)] transition-transform duration-300 group-hover:scale-125" />PAYMENT PROTECTED</span>}
                  {index === 2 && <span className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-full border border-white/20 text-[#f7a57a] transition-all duration-300 group-hover:border-[#f26419] group-hover:bg-[#f26419] group-hover:text-[#171717]">✓</span>READY TO RELEASE</span>}
                </div>
              </div>
              ))}
            </StaggerChildren>
          </div>
        </div>
      </section>

      {/* MARKETPLACE PREVIEW */}
      <section className="bg-[#f7f3ec] text-[#1c1b18]">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold tracking-[.2em] text-[#c65318]">THE MARKETPLACE</p>
              <h2 className="mt-3 font-display text-5xl font-bold tracking-tight sm:text-6xl">Find something worth buying.</h2>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#625c54] sm:text-xl">Explore digital products, software, and services from verified Nigerian sellers — priced clearly in Naira and protected by escrow.</p>
            </div>
            <span className="text-sm font-medium tracking-[.14em] text-[#6f6a63]">CURATED DIGITAL WORK</span>
          </div>

          <div className="-mx-6 mt-10 flex gap-2 overflow-x-auto px-6 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0">
            {['ALL', 'WEB & SOFTWARE', 'DESIGN', 'TEMPLATES', 'AI TOOLS', 'MARKETING'].map((category, index) => (
              <button key={category} type="button" className={`shrink-0 rounded-full px-4 py-2 text-[11px] font-semibold tracking-[.12em] transition-colors ${index === 0 ? 'bg-[#1c1b18] text-[#f7f3ec]' : 'text-[#6f6a63] hover:bg-white hover:text-[#1c1b18]'}`}>
                {category}
              </button>
            ))}
          </div>

          <div className="mt-8 grid gap-x-6 gap-y-12 border-t border-[#ded6ca] pt-8 sm:grid-cols-2 lg:grid-cols-4">
            <StaggerChildren baseDelay={100} staggerDelay={100} direction="up">
              {[
              { title: 'Modern SaaS Landing Page Kit', category: 'WEB & SOFTWARE', seller: 'Tomi Adeyemi', price: '₦42,000', accent: 'from-[#201b32] via-[#4c3576] to-[#f26419]' },
              { title: 'Next.js Business Dashboard', category: 'WEB & SOFTWARE', seller: 'Ifeanyi Okoro', price: '₦85,000', accent: 'from-[#172937] via-[#275b75] to-[#8ed1d0]' },
              { title: 'AI Content Workflow Template', category: 'TEMPLATES', seller: 'Zainab Bello', price: '₦18,500', accent: 'from-[#3b2635] via-[#834667] to-[#f0a25d]' },
              { title: 'Premium Brand Identity Kit', category: 'DESIGN', seller: 'Chisom Umeh', price: '₦65,000', accent: 'from-[#261f1b] via-[#8d5531] to-[#e9c69b]' },
              ].map((product, index) => (
              <Link key={product.title} href="/marketplace" className="group block min-w-0">
                <div className={`relative aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br ${product.accent} shadow-[0_10px_24px_rgba(48,38,27,.12)] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_18px_32px_rgba(48,38,27,.18)]`}>
                  {index === 0 && <><div className="absolute left-[12%] top-[16%] h-[66%] w-[76%] rounded-md bg-[#f7f3ec]/90 p-3 shadow-xl transition-transform duration-500 group-hover:scale-[1.03]"><div className="h-2 w-12 rounded-full bg-[#1c1b18]" /><div className="mt-3 grid grid-cols-3 gap-1"><span className="h-8 rounded bg-[#f26419]" /><span className="h-8 rounded bg-[#342953]" /><span className="h-8 rounded bg-[#d6ccc0]" /></div><div className="mt-2 h-1.5 w-3/4 rounded-full bg-[#b9afa2]" /></div><span className="absolute bottom-3 left-3 text-[9px] font-semibold tracking-[.14em] text-white/75">LANDING PAGE</span></>}
                  {index === 1 && <><div className="absolute inset-5 grid grid-cols-[.28fr_.72fr] overflow-hidden rounded-md bg-[#ecf5f3]/95 shadow-xl transition-transform duration-500 group-hover:scale-[1.03]"><div className="bg-[#173544] p-2"><div className="h-1.5 w-6 rounded bg-white/60" /><div className="mt-4 space-y-2"><div className="h-1 w-full rounded bg-white/25" /><div className="h-1 w-3/4 rounded bg-white/25" /></div></div><div className="p-3"><div className="h-9 rounded bg-[#9ed6d2]" /><div className="mt-2 grid grid-cols-2 gap-2"><div className="h-8 rounded bg-[#d3ebe7]" /><div className="h-8 rounded bg-[#d3ebe7]" /></div></div></div><span className="absolute bottom-3 left-3 text-[9px] font-semibold tracking-[.14em] text-white/75">DASHBOARD</span></>}
                  {index === 2 && <><div className="absolute inset-5 rounded-md bg-[#fff6eb]/95 p-3 shadow-xl transition-transform duration-500 group-hover:scale-[1.03]"><div className="flex items-center gap-2"><span className="h-5 w-5 rounded-full bg-[#834667]" /><div className="h-1.5 w-16 rounded-full bg-[#b78b9f]" /></div><div className="mt-4 space-y-2"><div className="h-7 rounded bg-[#ead0bd]" /><div className="h-7 w-4/5 rounded bg-[#f2dfd0]" /><div className="h-7 w-3/5 rounded bg-[#ead0bd]" /></div></div><span className="absolute bottom-3 left-3 text-[9px] font-semibold tracking-[.14em] text-white/75">AI WORKFLOW</span></>}
                  {index === 3 && <><div className="absolute inset-5 flex items-center justify-center rounded-md bg-[#f7e7ce]/95 shadow-xl transition-transform duration-500 group-hover:scale-[1.03]"><div className="grid h-20 w-20 place-items-center rounded-full border-[10px] border-[#34261f] text-xl font-bold text-[#34261f]">B</div></div><span className="absolute bottom-3 left-3 text-[9px] font-semibold tracking-[.14em] text-white/75">IDENTITY SYSTEM</span></>}
                </div>
                <div className="pt-5">
                  <p className="text-[10px] font-semibold tracking-[.15em] text-[#a05833]">{product.category}</p>
                  <h3 className="mt-2 font-display text-xl font-bold leading-snug text-[#1c1b18]">{product.title}</h3>
                  <div className="mt-3 flex items-center justify-between gap-3 text-sm text-[#625c54]"><span>{product.seller} <b className="font-medium text-[#a05833]">✓ Verified</b></span><span className="font-mono text-base font-semibold text-[#1c1b18]">{product.price}</span></div>
                  <div className="mt-4 flex items-center justify-between text-[10px] font-semibold tracking-[.12em] text-[#6f6a63]"><span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#f26419]" />PAYMENT PROTECTED</span><span className="translate-x-[-4px] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">VIEW PRODUCT →</span></div>
                </div>
              </Link>
              ))}
            </StaggerChildren>
          </div>

          <div className="mt-14 flex justify-center border-t border-[#ded6ca] pt-8">
            <Link href="/marketplace" className="group inline-flex items-center gap-2 text-sm font-semibold text-[#1c1b18] transition-colors hover:text-[#c65318]">Browse the marketplace <span className="transition-transform duration-300 group-hover:translate-x-1">→</span></Link>
          </div>
        </div>
      </section>

      {/* AI-ASSISTED WORK */}
      <section className="border-t border-white/10 bg-[#0d0d0d]">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-20 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <p className="mb-3 text-xs font-medium tracking-[0.2em] text-[#f7a57a]">AI-ASSISTED, CLEARLY LABELLED</p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Discover what people are building with AI.
            </h2>
            <p className="mt-5 max-w-xl leading-relaxed text-[#d4cabd]">
              AI-assisted products belong alongside every other listing on The Middleman. We simply label them clearly,
              so buyers understand how the work was produced and sellers can show the technology behind their process.
            </p>
            <Link href="/marketplace" className="mt-7 inline-flex rounded-full bg-[#f26419] px-6 py-3 font-medium text-[#111111] transition-colors hover:bg-[#ff7a3d]">
              Explore AI-assisted products
            </Link>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#171717] p-7 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-[#f26419]/15 px-3 py-1 text-xs font-semibold text-[#f7a57a]">AI-ASSISTED</span>
              <span className="text-xs text-[#d4cabd]">Product preview</span>
            </div>
            <h3 className="mt-8 font-display text-2xl font-bold text-white">AI-assisted product copy, 10 pages</h3>
            <p className="mt-3 text-sm leading-relaxed text-[#d4cabd]">
              Landing page and product copy drafted with AI assistance, then edited and finalised by a verified writer.
            </p>
            <div className="mt-6 flex justify-between border-t border-white/10 pt-5 text-sm font-mono">
              <span className="font-sans text-[#d4cabd]">Starting at</span>
              <span className="text-[#f5f1eb]">₦35,000</span>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST / ESCROW — ticket motif */}
      <FadeIn direction="up" delay={100} duration={800}>
        <section id="trust" className="border-t border-[#ded6ca] bg-[#f7f3ec] text-[#1c1b18]">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-medium tracking-[0.2em] text-[#c65318]">
              WHY MIDDLEMAN
            </p>
            <h2 className="mb-5 font-display text-5xl font-bold tracking-tight text-[#1c1b18] sm:text-6xl">
              Escrow is the trust layer, not a feature.
            </h2>
            <p className="mb-8 text-lg leading-relaxed text-[#625c54]">
              Screenshots and NDAs don&apos;t stop bad actors. A payment
              that only releases on approval does. That&apos;s the whole
              premise of The Middleman.
            </p>
            <ul className="space-y-4">
              {[
                "Every seller is verified before they can publish a product",
                "Payments held securely until you approve delivery",
                "Every marketplace price is shown clearly in Nigerian Naira",
                "Built for the Nigerian market first",
              ].map((line) => (
                <li key={line} className="flex items-start gap-3 text-base">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f26419]" />
                  <span className="text-[#1c1b18]">{line}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Receipt-style visual card */}
          <div className="relative rounded-3xl border border-[#ded6ca] bg-white p-8 font-mono text-sm shadow-[0_24px_70px_rgba(48,38,27,0.12)]">
            <div className="mb-6 flex justify-between text-[#625c54]">
              <span>ESCROW RECEIPT</span>
              <span className="text-[#f7a57a]">VERIFIED ✓</span>
            </div>
            <div className="space-y-3 text-[#1c1b18]">
              <div className="flex justify-between">
                <span className="text-[#625c54]">Product</span>
                <span>Landing page redesign</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#625c54]">Seller</span>
                <span>Verified · Lagos</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#625c54]">Amount held</span>
                <span>₦180,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#625c54]">Status</span>
                <span className="text-[#f7a57a]">In escrow</span>
              </div>
            </div>
            <div
              className="my-6 border-t border-dashed border-[#ded6ca]"
              aria-hidden="true"
            />
            <p className="text-sm leading-relaxed text-[#625c54]">
              Funds release automatically once you approve the delivery, or
              go to dispute resolution if there&apos;s a disagreement.
            </p>
          </div>
        </div>
        </section>
      </FadeIn>

      {/* TRUST SCENARIOS */}
      <section className="border-t border-white/10 bg-[#0f0f0f]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <p className="mb-3 text-xs font-medium tracking-[0.2em] text-[#f7a57a]">
            BUILT FOR BOTH SIDES
          </p>
          <h2 className="mb-14 max-w-lg font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Trust should come from the process.
          </h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {TRUST_SCENARIOS.map((scenario) => (
              <div key={scenario.title} className="flex flex-col rounded-3xl border border-white/10 bg-[#171717] p-7 shadow-[0_18px_50px_rgba(0,0,0,0.3)]">
                <p className="flex-1 text-sm leading-relaxed text-[#f5f1eb]">{scenario.body}</p>
                <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#f26419]/30 bg-[#f26419]/10 font-display text-xs font-bold text-[#f7a57a]">
                    {scenario.marker}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{scenario.title}</p>
                    <p className="text-xs text-[#d4cabd]">The Middleman trust model</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <HomeFAQ />

      {/* CTA */}
      <section className="border-t border-white/10 bg-[#090909]">
        <div className="mx-auto max-w-7xl px-6 py-20 text-center">
          <h2 className="mb-4 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Ready to buy, or start selling?
          </h2>
          <p className="mx-auto mb-8 max-w-md text-lg text-[#d4cabd]">
            Sign up in minutes. Buyers can browse and order immediately — sellers go
            through quick verification.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-full bg-[#f26419] px-6 py-3 font-medium text-[#111111] transition-colors hover:bg-[#ff7a3d]"
            >
              Create your account
            </Link>
            <Link
              href="/marketplace"
              className="rounded-full border border-white/10 bg-white/5 px-6 py-3 font-medium text-white transition-colors hover:bg-white/10"
            >
              Browse first
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="site-footer border-t border-[#ded6ca] bg-[#f7f3ec] text-[#1c1b18] backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 pt-14 pb-10">
          <div className="mb-14 grid grid-cols-2 gap-10 sm:grid-cols-4">
            <div>
              <h3 className="mb-4 font-display text-base font-bold">
                Company
              </h3>
              <p className="mb-4 text-base leading-relaxed text-[#625c54]">The trusted layer for Nigeria&apos;s growing digital products economy.</p>
              <ul className="space-y-3 text-base text-[#625c54]">
                <li>
                  <Link href="/about" className="transition-colors hover:text-[#f26419]">
                    About The Middleman
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="transition-colors hover:text-[#f26419]">
                    Careers
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:hello@themiddleman.com.ng"
                    className="transition-colors hover:text-[#f26419]"
                  >
                    Contact us
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-display text-base font-bold">
                For Buyers
              </h3>
              <p className="mb-4 text-base leading-relaxed text-[#625c54]">Find verified digital products and pay only when your order is ready.</p>
              <ul className="space-y-3 text-base text-[#625c54]">
                <li>
                  <Link href="/marketplace" className="transition-colors hover:text-[#f26419]">
                    Browse the marketplace
                  </Link>
                </li>
                <li>
                  <a href="#trust" className="transition-colors hover:text-[#f26419]">
                    How escrow works
                  </a>
                </li>
                <li>
                  <Link href="/disputes" className="transition-colors hover:text-[#f26419]">
                    Dispute resolution
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-display text-base font-bold">
                For Sellers
              </h3>
              <p className="mb-4 text-base leading-relaxed text-[#625c54]">Turn your code and digital products into trusted, sellable listings.</p>
              <ul className="space-y-3 text-base text-[#625c54]">
                <li>
                  <Link href="/signup" className="transition-colors hover:text-[#f26419]">
                    Become a seller
                  </Link>
                </li>
                <li>
                  <Link href="/onboarding/seller" className="transition-colors hover:text-[#f26419]">
                    Verification process
                  </Link>
                </li>
                <li>
                  <Link href="/seller-guidelines" className="transition-colors hover:text-[#f26419]">
                    Seller guidelines
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-display text-base font-bold">Legal</h3>
              <p className="mb-4 text-base leading-relaxed text-[#625c54]">Clear policies that protect buyers, sellers, and every transaction.</p>
              <ul className="space-y-3 text-base text-[#625c54]">
                <li>
                  <Link href="/legal/privacy" className="transition-colors hover:text-[#f26419]">
                    Privacy policy
                  </Link>
                </li>
                <li>
                  <Link href="/legal/terms" className="transition-colors hover:text-[#f26419]">
                    Terms of service
                  </Link>
                </li>
                <li>
                  <Link href="/legal/refunds" className="transition-colors hover:text-[#f26419]">
                    Refund &amp; dispute policy
                  </Link>
                </li>
                <li>
                  <Link href="/legal/disclaimer" className="transition-colors hover:text-[#f26419]">
                    Marketplace disclaimer
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Trust badges */}
          <div className="mb-10">
            <h3 className="mb-4 font-display text-base font-bold">
              Built on trust
            </h3>
            <p className="mb-4 max-w-xl text-base leading-relaxed text-[#625c54]">Every order follows a transparent review and protected-payment process.</p>
            <div className="flex flex-wrap gap-3">
              {["Escrow Protected", "ID-Verified Sellers", "NDPR Compliant"].map(
                (badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-line bg-white px-4 py-1.5 text-sm text-[#625c54]"
                  >
                    {badge}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col items-center justify-between gap-4 border-t border-line pt-8 text-sm text-[#625c54] sm:flex-row">
            <span>
              © 2022–2026 The Middleman. Built in Nigeria.
            </span>
            <div className="flex gap-6">
              <a
                href="mailto:hello@themiddleman.com.ng"
                className="transition-colors hover:text-[#f26419]"
              >
                hello@themiddleman.com.ng
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
