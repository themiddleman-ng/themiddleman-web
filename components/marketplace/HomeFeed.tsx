"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import GigCard, { type CardGig, type CardRating } from "./GigCard";
import { DESIGN_PREVIEW_GIGS } from "@/lib/design-preview/catalog";
import { MARKETPLACE_CATEGORIES } from "@/lib/marketplace/categories";

type GigRow = CardGig & { created_at: string };

function ListingSkeleton() {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-lg bg-paper">
      <div className="aspect-[4/3] animate-pulse bg-elevated" />
      <div className="space-y-3 p-4">
        <div className="h-2 w-20 animate-pulse rounded bg-elevated" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-elevated" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-line" />
      </div>
    </div>
  );
}

function CategoryIcon({ category }: { category: string }) {
  if (category === "design") return <svg viewBox="0 0 24 24" className="h-14 w-14 sm:h-16 sm:w-16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 3.5 20.5 12 12 20.5 3.5 12 12 3.5Z" /></svg>;
  if (category === "marketing") return <svg viewBox="0 0 24 24" className="h-14 w-14 sm:h-16 sm:w-16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 16V8l10-3v14L4 16Z" /><path d="M14 9.5h4.5L20 7v10l-1.5-2.5H14" /></svg>;
  if (category === "writing") return <svg viewBox="0 0 24 24" className="h-14 w-14 sm:h-16 sm:w-16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M6 20h12M8 4h5.5a3.5 3.5 0 0 1 0 7H8v9" strokeLinecap="round" /></svg>;
  return <svg viewBox="0 0 24 24" className="h-14 w-14 sm:h-16 sm:w-16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M8 8.5h3.8L8.6 16H6.4L9.2 8.5H8V7h6v1.5h-2.2L8.8 16H7" strokeLinecap="round" /><path d="M14.2 16V8.5L18.4 16V8.5" strokeLinecap="round" /></svg>;
}

export default function HomeFeed() {
  const [gigs, setGigs] = useState<GigRow[]>([]);
  const [ratings, setRatings] = useState<Record<string, CardRating>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [tab, setTab] = useState<"trending" | "new">("new");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!isSupabaseConfigured) {
        setGigs(DESIGN_PREVIEW_GIGS as GigRow[]);
        setLoading(false);
        return;
      }
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

  const visibleGigs = useMemo(() => {
    const sorted = [...gigs];
    if (tab === "trending") {
      sorted.sort((a, b) => {
        const aScore = ratings[a.id]?.review_count ?? 0;
        const bScore = ratings[b.id]?.review_count ?? 0;
        if (bScore !== aScore) return bScore - aScore;
        return Date.parse(b.created_at) - Date.parse(a.created_at);
      });
    } else {
      sorted.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
    }
    return sorted.slice(0, 8);
  }, [gigs, ratings, tab]);

  return (
    <>
      <section id="categories" className="bg-ink">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          {MARKETPLACE_CATEGORIES.length >= 4 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {MARKETPLACE_CATEGORIES.map((item) => (
                <Link
                  key={item.key}
                  href={`/marketplace?category=${encodeURIComponent(item.key)}`}
                  className="category-tile flex min-h-11 flex-col items-start justify-between gap-4 rounded-2xl px-4 py-4"
                  style={{ ["--tile-accent" as string]: `var(--accent-${item.accent})` }}
                >
                  <CategoryIcon category={item.key} />
                  <span className="text-[15px] font-semibold">{item.label}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {MARKETPLACE_CATEGORIES.map((item) => (
                <Link
                  key={item.key}
                  href={`/marketplace?category=${encodeURIComponent(item.key)}`}
                  className="category-chip inline-flex min-h-11 items-center rounded-full px-4 text-[15px] font-semibold"
                  style={{ ["--tile-accent" as string]: `var(--accent-${item.accent})` }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="listings" className="bg-ink">
        <div className="mx-auto max-w-7xl px-5 pb-14 pt-2 sm:px-8 sm:pb-16">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex gap-2" role="tablist" aria-label="Listing sort">
                {(["new", "trending"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={tab === value}
                    onClick={() => setTab(value)}
                    className={`inline-flex min-h-11 items-center rounded-full px-4 text-[15px] font-semibold ${tab === value ? "bg-ember-cta text-on-ember" : "border border-line text-bone"}`}
                  >
                    {value === "new" ? "New" : "Trending"}
                  </button>
                ))}
              </div>
            </div>
            <Link href="/marketplace" className="inline-flex min-h-11 items-center text-[16px] font-semibold text-eyebrow">View all</Link>
          </div>

          <div className="homepage-listings grid grid-cols-1 gap-3 md:gap-5">
            {loading
              ? Array.from({ length: 8 }, (_, index) => <ListingSkeleton key={index} />)
              : visibleGigs.map((gig) => <GigCard key={gig.id} gig={gig} rating={ratings[gig.id]} />)}
          </div>

          {!loading && loadError && (
            <div className="mt-5 px-1 py-4 text-[16px] text-slate" role="status">
              Marketplace listings are unavailable right now. <Link href="/marketplace" className="font-semibold text-eyebrow underline">Open the marketplace</Link>.
            </div>
          )}
          {!loading && !loadError && visibleGigs.length === 0 && (
            <div className="mt-5 flex flex-col gap-3 py-4 text-[16px] text-slate sm:flex-row sm:items-center sm:justify-between">
              <p>No listings to show yet.</p>
              <Link href="/marketplace" className="inline-flex min-h-11 w-fit items-center font-semibold text-eyebrow underline">Browse all listings</Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
