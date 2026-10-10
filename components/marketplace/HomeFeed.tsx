"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import GigCard, { type CardGig, type CardRating } from "./GigCard";

type GigRow = CardGig & { created_at: string };
type Category = "all" | "development" | "design" | "marketing" | "writing" | "ai_assisted";

const CATEGORIES: Array<{ value: Category; label: string; note: string }> = [
  { value: "all", label: "All work", note: "Explore everything" },
  { value: "development", label: "Web & software", note: "Sites, tools, code" },
  { value: "design", label: "Design", note: "Brand and product" },
  { value: "writing", label: "Writing", note: "Words for your work" },
  { value: "marketing", label: "Marketing", note: "Reach your audience" },
  { value: "ai_assisted", label: "AI-assisted", note: "Clearly labelled" },
];

function ListingSkeleton() {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-lg border border-[#DCE2E5] bg-white">
      <div className="aspect-[16/10] animate-pulse bg-[#E8EDF0]" />
      <div className="space-y-3 p-4">
        <div className="h-2 w-20 animate-pulse rounded bg-[#E8EDF0]" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-[#E8EDF0]" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-[#EEF1F2]" />
        <div className="mt-4 flex justify-between border-t border-[#EDF0F1] pt-3"><div className="h-4 w-20 animate-pulse rounded bg-[#E8EDF0]" /><div className="h-3 w-16 animate-pulse rounded bg-[#EEF1F2]" /></div>
      </div>
    </div>
  );
}

export default function HomeFeed() {
  const [gigs, setGigs] = useState<GigRow[]>([]);
  const [ratings, setRatings] = useState<Record<string, CardRating>>({});
  const [category, setCategory] = useState<Category>("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [gigsResult, ratingsResult] = await Promise.all([
        supabase
          .from("gigs")
          .select("id, title, description, category, price_ngn, is_ai_assisted, gallery_image_paths, created_at, seller_profiles ( display_name, verification_status )")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(40),
        supabase.rpc("get_gig_ratings"),
      ]);

      if (cancelled) return;
      if (gigsResult.error) {
        setLoadError(true);
        setLoading(false);
        return;
      }

      setGigs((gigsResult.data as unknown as GigRow[]) ?? []);
      const ratingMap: Record<string, CardRating> = {};
      ((ratingsResult.data as Array<{ gig_id: string } & CardRating>) ?? []).forEach((row) => {
        ratingMap[row.gig_id] = row;
      });
      setRatings(ratingMap);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const imageGigs = useMemo(
    () => gigs.filter((gig) => Array.isArray(gig.gallery_image_paths) && gig.gallery_image_paths.length > 0),
    [gigs]
  );
  const visibleGigs = useMemo(
    () => imageGigs.filter((gig) => category === "all" || gig.category === category).slice(0, 4),
    [category, imageGigs]
  );
  const browseHref = category === "all" ? "/marketplace" : `/marketplace?category=${category}`;

  return (
    <section id="categories" className="border-b border-[#DCE2E5] bg-[#FBFAF7]">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid items-end gap-4 md:grid-cols-[1fr_.7fr] md:gap-10">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.14em] text-[#0B3D91]">Explore the marketplace</p>
            <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold leading-tight tracking-[-.04em] text-[#172B45] sm:text-4xl">Good work starts with the right category.</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-[#667787]">Browse digital products and services by what you need. These are a few live listings; the marketplace has the full selection.</p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6" role="group" aria-label="Filter selected listings by category">
          {CATEGORIES.map((item) => {
            const selected = category === item.value;
            return (
              <button key={item.value} type="button" aria-pressed={selected} onClick={() => setCategory(item.value)}
                className={`min-h-[76px] rounded-md border px-3 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3D91] ${selected ? "border-[#0B3D91] bg-[#EAF0F6]" : "border-[#DCE2E5] bg-white hover:border-[#AABBC6]"}`}>
                <span className={`block text-xs font-bold ${selected ? "text-[#0B3D91]" : "text-[#263E55]"}`}>{item.label}</span>
                <span className="mt-1 block text-[10px] leading-4 text-[#7A8792]">{item.note}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-10 flex items-end justify-between gap-4 border-b border-[#DCE2E5] pb-3">
          <div><p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#E07B18]">Selected from the marketplace</p><h3 className="mt-1 text-lg font-bold text-[#203A53]">{category === "all" ? "A few listings to start with" : CATEGORIES.find((item) => item.value === category)?.label}</h3></div>
          <Link href={browseHref} className="shrink-0 text-xs font-bold text-[#0B3D91] hover:underline">View all <span aria-hidden="true">↗</span></Link>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }, (_, index) => <ListingSkeleton key={index} />)
            : visibleGigs.map((gig) => <GigCard key={gig.id} gig={gig} rating={ratings[gig.id]} />)}
        </div>

        {!loading && loadError && (
          <div className="mt-5 rounded-md border border-[#DCE2E5] bg-white px-5 py-6 text-sm text-[#657585]">
            Marketplace listings are unavailable right now. <Link href="/marketplace" className="font-semibold text-[#0B3D91] underline">Open the marketplace</Link>.
          </div>
        )}
        {!loading && !loadError && visibleGigs.length === 0 && (
          <div className="mt-5 flex flex-col gap-3 rounded-md border border-dashed border-[#CCD7DD] bg-white px-5 py-7 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-sm font-semibold text-[#30495F]">{imageGigs.length === 0 ? "Listings with cover images will appear here." : "No pictured listings in this category yet."}</p><p className="mt-1 text-xs text-[#7A8792]">Browse the marketplace to see every available listing.</p></div>
            <Link href={browseHref} className="w-fit rounded-md border border-[#CBD5DA] px-3.5 py-2 text-xs font-semibold text-[#30495F] hover:bg-[#F3F6F7]">Browse listings <span aria-hidden="true">↗</span></Link>
          </div>
        )}
      </div>
    </section>
  );
}
