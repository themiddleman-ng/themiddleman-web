"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import ProductCover from "@/components/marketplace/ProductCover";

const CATEGORIES = [
  { value: "development", label: "Development", blurb: "Websites, apps, APIs, code" },
  { value: "design", label: "Design", blurb: "UI kits, brand systems, graphics" },
  { value: "marketing", label: "Marketing", blurb: "Campaigns, content, growth" },
  { value: "writing", label: "Writing", blurb: "Copy, documentation, scripts" },
  { value: "ai_assisted", label: "AI-assisted", blurb: "Disclosed AI workflows" },
];

export default function BrowsePage() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    router.push(q.trim() ? `/marketplace?q=${encodeURIComponent(q.trim())}` : "/marketplace");
  }

  return (
    <main className="min-h-screen bg-ink text-bone">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-5 sm:px-5 sm:pt-8">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-ember">Browse</p>
        <h1 className="mt-2 font-display text-[1.75rem] font-bold tracking-tight sm:text-3xl">Find something worth building on.</h1>

        <form onSubmit={submit} className="sticky top-16 z-20 mt-5 rounded-2xl border border-line bg-[#fffdf9]/95 p-3 shadow-[0_8px_24px_rgba(28,37,47,.06)] backdrop-blur sm:static sm:mt-6 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
          <label htmlFor="browse-search" className="mb-2 block text-sm font-medium">Search the marketplace</label>
          <input
            id="browse-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products, code, templates, sellers"
            className="w-full rounded-xl border border-line bg-paper px-4 py-3.5 text-sm text-bone placeholder-slate outline-none transition-colors focus:border-ember sm:rounded-full sm:px-5"
          />
          <button type="submit" className="mt-3 min-h-12 w-full rounded-xl bg-[#F97316] px-6 text-sm font-semibold text-[#111111] sm:w-auto sm:min-h-11 sm:rounded-lg">Search products</button>
        </form>

        <p className="mb-3 mt-7 font-mono text-[10px] font-semibold uppercase tracking-[.18em] text-slate sm:mt-8">Categories</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {CATEGORIES.map((c) => (
            <Link
              key={c.value}
              href={`/marketplace?category=${c.value}`}
              className="overflow-hidden rounded-xl border border-line bg-paper transition-colors hover:border-[#F97316]/40"
            >
              <div className="h-28">
                <ProductCover title={c.label} category={c.value} compact />
              </div>
              <div className="p-4">
                <span className="block font-display text-base font-bold">{c.label}</span>
                <span className="mt-1 block text-xs text-slate">{c.blurb}</span>
              </div>
            </Link>
          ))}
        </div>

        <Link href="/marketplace" className="mt-6 inline-flex text-sm font-semibold text-[#111111] underline decoration-[#F97316] underline-offset-2 hover:underline">
          See everything on the marketplace →
        </Link>
      </div>
    </main>
  );
}
