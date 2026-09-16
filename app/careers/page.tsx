import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export const metadata = { title: "Careers - The Middleman" };

export default function CareersPage() {
  return (
    <main className="min-h-screen bg-ink text-bone">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-2.5"><LogoMark className="h-6 w-6" /><span className="font-display text-lg font-bold tracking-tight">The Middleman</span></Link>
          <Link href="/" className="text-sm text-slate transition-colors hover:text-bone">&larr; Back to Home</Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-ember">Careers</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">Help build the trust layer.</h1>
        <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-slate">We are a small founding team building the infrastructure Nigeria&apos;s digital commerce runs on. Right now we are not hiring for open roles - but we are always meeting people who care about commerce, trust, and craft.</p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {[
            ["Ownership", "You ship things end to end and stand behind them."],
            ["Craft", "Details matter. We would rather ship one excellent thing than three average ones."],
            ["Clarity", "Plain language, honest timelines, no theatre."],
            ["User obsession", "Every decision starts with a buyer or creator in Nigeria trying to get something done."],
          ].map(([title, body]) => <div key={title} className="rounded-xl border border-line bg-paper p-6"><h2 className="font-display text-lg font-bold text-bone">{title}</h2><p className="mt-2 text-sm leading-relaxed text-slate">{body}</p></div>)}
        </div>

        <div className="relative mt-12 rounded-2xl border border-line bg-paper p-8">
          <div className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-line bg-ink" />
          <div className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-line bg-ink" />
          <p className="text-xs font-bold uppercase tracking-[.16em] text-ember">Introduce yourself</p>
          <p className="mt-4 text-sm leading-relaxed text-slate">When roles open, they will be listed on this page first. Until then, send us a note - what you build, what you&apos;ve shipped, and why this problem interests you.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="mailto:hello@themiddleman.com.ng?subject=Introduction" className="rounded-full bg-ember px-6 py-3 text-sm font-bold text-ink transition-colors hover:bg-ember/90">hello@themiddleman.com.ng</a>
          </div>
        </div>
      </div>
    </main>
  );
}
