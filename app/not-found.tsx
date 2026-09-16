import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata = { title: "Page Not Found - The Middleman" };

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 text-bone">
      <Logo variant="dark" className="mb-10" />

      <div className="relative w-full max-w-md rounded-2xl border border-line bg-paper p-8 text-center shadow-[0_24px_70px_rgba(48,38,27,0.12)]">
        <div className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-line bg-ink" />
        <div className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-line bg-ink" />

        <p className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-slate">Error - 404</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">This stub doesn&apos;t exist.</h1>
        <div className="my-6 border-t border-dashed border-line" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-slate">
          The page you&apos;re looking for was torn off, moved, or never printed.
          Let&apos;s get you back to something real.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/" className="rounded-full bg-ember px-6 py-3 text-sm font-bold text-ink transition-colors hover:bg-ember/90">
            Back to homepage
          </Link>
          <Link href="/marketplace" className="rounded-full border border-line px-6 py-3 text-sm font-semibold text-bone transition-colors hover:border-ember/40">
            Browse the marketplace
          </Link>
        </div>

        <div className="ink-stamp absolute -top-3 right-6 rounded-md border-2 border-ember bg-paper px-2.5 py-1 font-display text-[10px] font-bold tracking-wider text-ember" style={{ transform: "rotate(-8deg)" }}>
          NOT FOUND
        </div>
      </div>

      <p className="mt-8 font-mono text-[10px] uppercase tracking-wider text-slate">The Middleman - Lagos, Nigeria</p>
    </main>
  );
}
