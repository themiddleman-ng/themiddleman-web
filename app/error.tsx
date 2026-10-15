'use client';
import Link from 'next/link';
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="mx-auto flex min-h-[70svh] max-w-xl flex-col justify-center px-6 py-16 text-bone"><p className="text-sm font-semibold text-[#a94b18]">Something interrupted this page</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">Let’s try that again.</h1><p className="mt-4 leading-7 text-slate">Reload this section to continue. If you were paying, check your orders before making another payment.</p><div className="mt-7 flex flex-wrap gap-3"><button onClick={reset} className="rounded-lg bg-[#b64d18] px-5 py-3 font-semibold text-white">Try again</button><Link href="/orders" className="rounded-lg border border-line px-5 py-3">My orders</Link><Link href="/marketplace" className="px-5 py-3 underline">Marketplace</Link></div></main>;
}
