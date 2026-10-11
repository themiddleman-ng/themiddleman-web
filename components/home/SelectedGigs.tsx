"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import GigCard, { type CardGig, type CardRating } from "@/components/marketplace/GigCard";

type GigRow = CardGig & { created_at: string };

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E3DED5] bg-white">
      <div className="gm-skeleton aspect-[16/10]" />
      <div className="space-y-3 p-5">
        <div className="gm-skeleton h-2.5 w-24 rounded-full" />
        <div className="gm-skeleton h-4 w-4/5 rounded-full" />
        <div className="gm-skeleton h-3 w-2/3 rounded-full" />
        <div className="border-t border-[#ECE7DE] pt-4">
          <div className="gm-skeleton h-3 w-28 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function SelectedGigs() {
  const [gigs, setGigs] = useState<GigRow[]>([]);
  const [ratings, setRatings] = useState<Record<string, CardRating>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [{ data: gigData }, { data: ratingData }] = await Promise.all([
        supabase
          .from("gigs")
          .select(
            "id, title, description, category, price_ngn, is_ai_assisted, gallery_image_paths, created_at, seller_profiles ( display_name, verification_status )"
          )
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(12),
        supabase.rpc("get_gig_ratings"),
      ]);

      if (cancelled) return;

      const ratingMap: Record<string, CardRating> = {};
      ((ratingData as Array<{ gig_id: string } & CardRating>) ?? []).forEach((row) => {
        ratingMap[row.gig_id] = row;
      });

      setGigs((gigData as unknown as GigRow[]) ?? []);
      setRatings(ratingMap);
      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const selected = useMemo(() => {
    return [...gigs]
      .sort((a, b) => {
        const reviewDiff = (ratings[b.id]?.review_count ?? 0) - (ratings[a.id]?.review_count ?? 0);
        if (reviewDiff !== 0) return reviewDiff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .slice(0, 3);
  }, [gigs, ratings]);

  if (!loading && selected.length === 0) return null;

  return (
    <section className="bg-[#F6F1E8] text-[#172033]">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-20">
        <div className="flex items-center justify-between gap-5">
          <p className="text-sm font-medium text-[#6D706F]">Selected from the marketplace</p>
          <Link
            href="/marketplace"
            className="w-fit text-sm font-semibold text-[#0B3D91] transition-colors hover:text-[#C85A19]"
          >
            Browse everything →
          </Link>
        </div>

        <div className="mt-7 grid gap-6 md:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }).map((_, index) => <SkeletonCard key={index} />)
            : selected.map((gig) => <GigCard key={gig.id} gig={gig} rating={ratings[gig.id]} />)}
        </div>
      </div>
    </section>
  );
}
