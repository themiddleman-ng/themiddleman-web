"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import SiteHeader from "@/components/SiteHeader";

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
      <div className="mx-auto max-w-3xl px-5 pt-8 pb-10">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-ember">Browse</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">What are you looking for?</h1>

        <form onSubmit={submit} className="mt-6">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products, code, templates, sellers"
            className="w-full rounded-full border border-line bg-paper px-5 py-3.5 text-sm text-bone placeholder-slate outline-none transition-colors focus:border-ember"
          />
        </form>

        <p className="mt-8 mb-3 font-mono text-[10px] font-semibold uppercase tracking-[.18em] text-slate">Categories</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CATEGORIES.map((c) => (
            <Link
              key={c.value}
              href={`/marketplace?category=${c.value}`}
              className="rounded-xl border border-line bg-paper p-4 transition-colors hover:border-ember/40"
            >
              <span className="block font-display text-base font-bold">{c.label}</span>
              <span className="mt-1 block text-xs text-slate">{c.blurb}</span>
            </Link>
          ))}
        </div>

        <Link href="/marketplace" className="mt-6 inline-flex text-sm font-semibold text-ember hover:underline">
          See everything on the marketplace →
        </Link>
      </div>
    </main>
  );
}
