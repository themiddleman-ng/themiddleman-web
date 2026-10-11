"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import GigCard, { type CardGig, type CardRating } from "./GigCard";

type GigRow = CardGig & { created_at: string };

const CATEGORIES = [
  { label: "Web & Software", mark: "</>", href: "/marketplace?category=development" },
  { label: "Design", mark: "◇", href: "/marketplace?category=design" },
  { label: "Writing", mark: "Aa", href: "/marketplace?category=writing" },
  { label: "Marketing", mark: "↗", href: "/marketplace?category=marketing" },
  { label: "AI-assisted", mark: "✳", href: "/marketplace?category=ai_assisted" },
  { label: "Templates", mark: "▤", href: "/marketplace?q=template" },
  { label: "Digital Products", mark: "▧", href: "/marketplace" },
  { label: "Business", mark: "＋", href: "/marketplace?q=business" },
];

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

function CategoryLinks({ duplicate = false }: { duplicate?: boolean }) {
  return CATEGORIES.map((item, index) => (
    <Link
      key={item.label + index}
      href={item.href}
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

  const imageGigs = useMemo(
    () => gigs.filter((gig) => Array.isArray(gig.gallery_image_paths) && gig.gallery_image_paths.length > 0),
    [gigs]
  );
  const visibleGigs = imageGigs.slice(0, 4);

  return (
    <section id="categories" className="bg-[#F8F6F1]">
      <div className="mx-auto max-w-7xl px-5 pb-12 pt-7 sm:px-8 sm:pb-16 sm:pt-9">
        <div className="mb-2 flex items-center gap-3 px-1 text-[12px] font-medium tracking-[.01em] text-[#6D7B86] sm:text-[13px]">
          <span className="h-px w-5 bg-[#E57814]" />
          <span>Explore what people are selling</span>
        </div>
      </div>
      <div className="marketplace-marquee overflow-hidden" aria-label="Marketplace categories">
        <div className="marketplace-marquee-track flex w-max items-center" role="list">
          <div className="flex items-center" role="listitem"><CategoryLinks /></div>
          <div className="flex items-center" aria-hidden="true"><CategoryLinks duplicate /></div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 pb-16 pt-12 sm:px-8 sm:pb-20 sm:pt-16">
        <div className="mb-7 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[12px] font-semibold tracking-[.01em] text-[#E07818] sm:text-[13px]">A small selection</p>
            <h2 className="mt-2 font-display text-[32px] font-bold leading-[1.08] tracking-[-.045em] text-[#172B45] sm:text-[40px]">Featured marketplace listings</h2>
          </div>
          <Link href="/marketplace" className="w-fit text-[15px] font-semibold text-[#0B3D91] hover:underline">See everything in the marketplace <span aria-hidden="true">↗</span></Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }, (_, index) => <ListingSkeleton key={index} />)
            : visibleGigs.map((gig) => <GigCard key={gig.id} gig={gig} rating={ratings[gig.id]} />)}
        </div>

        {!loading && loadError && (
          <div className="mt-5 px-1 py-4 text-[15px] text-[#657585]" role="status">
            Marketplace listings are unavailable right now. <Link href="/marketplace" className="font-semibold text-[#0B3D91] underline">Open the marketplace</Link>.
          </div>
        )}
        {!loading && !loadError && visibleGigs.length === 0 && (
          <div className="mt-5 flex flex-col gap-3 py-4 text-[15px] text-[#657585] sm:flex-row sm:items-center sm:justify-between">
            <p>{imageGigs.length === 0 ? "Listings with cover images will appear here." : "New pictured listings are on the way."}</p>
            <Link href="/marketplace" className="w-fit font-semibold text-[#0B3D91] underline">Browse all listings <span aria-hidden="true">↗</span></Link>
          </div>
        )}
      </div>
    </section>
  );
}
