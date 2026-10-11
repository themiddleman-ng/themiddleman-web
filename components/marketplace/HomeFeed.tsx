"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import GigCard, { type CardGig, type CardRating } from "./GigCard";

type GigRow = CardGig & { created_at: string };

const CATEGORY_DETAILS: Record<string, { label: string; mark: string }> = {
  development: { label: "Web & Software", mark: "</>" },
  design: { label: "Design", mark: "◇" },
  writing: { label: "Writing", mark: "Aa" },
  marketing: { label: "Marketing", mark: "↗" },
  ai_assisted: { label: "AI-assisted", mark: "✳" },
};

function ListingSkeleton() {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-lg bg-white">
      <div className="aspect-[16/10] animate-pulse bg-[#E8EDF0]" />
      <div className="space-y-3 p-4">
        <div className="h-2 w-20 animate-pulse rounded bg-[#E8EDF0]" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-[#E8EDF0]" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-[#EEF1F2]" />
        <div className="mt-4 flex justify-between pt-3"><div className="h-4 w-20 animate-pulse rounded bg-[#E8EDF0]" /><div className="h-3 w-16 animate-pulse rounded bg-[#EEF1F2]" /></div>
      </div>
    </div>
  );
}

function CategoryLinks({ items, duplicate = false }: { items: Array<{ key: string; label: string; mark: string }>; duplicate?: boolean }) {
  return items.map((item, index) => (
    <Link
      key={item.key + index}
      href={`/marketplace?category=${encodeURIComponent(item.key)}`}
      tabIndex={duplicate ? -1 : undefined}
      className="group inline-flex shrink-0 items-center gap-3 px-5 py-3 text-[17px] font-semibold tracking-[-.025em] text-[#263E55] transition-colors hover:text-[#0B3D91] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#0B3D91] sm:px-7 sm:text-[19px]"
    >
      <span aria-hidden="true" className="text-[15px] font-bold text-[#E57814] transition-transform group-hover:scale-110 sm:text-base">{item.mark}</span>
      <span>{item.label}</span>
      <span aria-hidden="true" className="ml-1 h-1 w-1 rounded-full bg-[#BCC7CC]" />
    </Link>
  ));
}

export default function HomeFeed() {
  const [gigs, setGigs] = useState<GigRow[]>([]);
  const [ratings, setRatings] = useState<Record<string, CardRating>>({});
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

  const categoryItems = useMemo(() => {
    const available = new Set(gigs.map((gig) => gig.category));
    return Object.entries(CATEGORY_DETAILS)
      .filter(([key]) => available.has(key))
      .map(([key, detail]) => ({ key, ...detail }));
  }, [gigs]);

  const imageGigs = useMemo(
    () => gigs.filter((gig) => Array.isArray(gig.gallery_image_paths) && gig.gallery_image_paths.length > 0),
    [gigs]
  );
  const visibleGigs = imageGigs.slice(0, 4);

  return (
    <section id="categories" className="bg-[#F8F6F1]">
      {categoryItems.length > 0 && (
        <>
          <div className="mx-auto max-w-7xl px-5 pb-2 pt-3 sm:px-8 sm:pt-5">
            <div className="flex items-center gap-3 px-1 text-[13px] font-medium tracking-[.01em] text-[#6D7B86] sm:text-[14px]">
              <span className="h-px w-5 bg-[#E57814]" />
              <span>Explore the marketplace</span>
            </div>
          </div>
          <nav aria-label="Marketplace categories" className="marketplace-marquee overflow-hidden">
            <div className="marketplace-marquee-track flex w-max items-center">
              <div className="flex items-center"><CategoryLinks items={categoryItems} /></div>
              <div className="flex items-center" aria-hidden="true"><CategoryLinks items={categoryItems} duplicate /></div>
            </div>
          </nav>
        </>
      )}

      <div className="mx-auto max-w-7xl px-5 pb-16 pt-12 sm:px-8 sm:pb-20 sm:pt-16">
        <div className="mb-7 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[13px] font-semibold tracking-[.01em] text-[#E07818] sm:text-[14px]">A small selection</p>
            <h2 className="mt-2 font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.04] tracking-[-.05em] text-[#172B45]">A few listings to explore</h2>
          </div>
          <Link href="/marketplace" className="w-fit text-[16px] font-semibold text-[#0B3D91] hover:underline">See all marketplace listings <span aria-hidden="true">↗</span></Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }, (_, index) => <ListingSkeleton key={index} />)
            : visibleGigs.map((gig) => <GigCard key={gig.id} gig={gig} rating={ratings[gig.id]} />)}
        </div>

        {!loading && loadError && (
          <div className="mt-5 px-1 py-4 text-[16px] text-[#657585]" role="status">
            Marketplace listings are unavailable right now. <Link href="/marketplace" className="font-semibold text-[#0B3D91] underline">Open the marketplace</Link>.
          </div>
        )}
        {!loading && !loadError && visibleGigs.length === 0 && (
          <div className="mt-5 flex flex-col gap-3 py-4 text-[16px] text-[#657585] sm:flex-row sm:items-center sm:justify-between">
            <p>{imageGigs.length === 0 ? "Listings with cover images will appear here." : "New pictured listings are on the way."}</p>
            <Link href="/marketplace" className="w-fit font-semibold text-[#0B3D91] underline">Browse all listings <span aria-hidden="true">↗</span></Link>
          </div>
        )}
      </div>
    </section>
  );
}
