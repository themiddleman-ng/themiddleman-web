"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import SiteHeader from "@/components/SiteHeader";
import FadeIn from "@/components/motion/FadeIn";
import GigCard, { type CardGig, type CardRating } from "@/components/marketplace/GigCard";

type GigCategory = "development" | "design" | "marketing" | "writing" | "ai_assisted";

type GigRow = {
  id: string;
  title: string;
  description: string;
  category: GigCategory;
  price_ngn: number;
  is_ai_assisted: boolean;
  gallery_image_paths: string[];
  created_at: string;
  seller_profiles: {
    display_name: string;
    verification_status: string;
  } | null;
};

type GigRating = {
  gig_id: string;
  average_rating: number;
  review_count: number;
};

type MarketplaceError = {
  title: string;
  message: string;
  canRetry: boolean;
};

function describeMarketplaceError(error: unknown): MarketplaceError {
  const detail =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String(error.message)
        : String(error ?? "");
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "";
  const normalized = `${code} ${detail}`.toLowerCase();

  if (normalized.includes("failed to fetch") || normalized.includes("network")) {
    return {
      title: "We couldn't reach the marketplace",
      message: "Check your connection and try again. If this continues, the preview deployment's Supabase settings need to be checked.",
      canRetry: true,
    };
  }

  if (normalized.includes("does not exist") || normalized.includes("42p01")) {
    return {
      title: "The marketplace database is not ready",
      message: "The product catalogue has not been installed for this environment yet.",
      canRetry: false,
    };
  }

  return {
    title: "Products are temporarily unavailable",
    message: "Please try again in a moment.",
    canRetry: true,
  };
}

const CATEGORIES: Array<{ value: GigCategory | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "development", label: "Development" },
  { value: "design", label: "Design" },
  { value: "marketing", label: "Marketing" },
  { value: "writing", label: "Writing" },
  { value: "ai_assisted", label: "AI-assisted" },
];

function LoadingState() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading products">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-2xl bg-white/70">
          <div className="gm-skeleton aspect-[4/3]" />
          <div className="space-y-3 p-4 sm:p-5">
            <div className="gm-skeleton h-2.5 w-24 rounded-full" />
            <div className="gm-skeleton h-5 w-4/5 rounded-full" />
            <div className="gm-skeleton h-3 w-2/3 rounded-full" />
            <div className="gm-skeleton h-4 w-24 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MarketplacePage() {
  const searchParams = useSearchParams();
  const [gigs, setGigs] = useState<GigRow[]>([]);
  const [ratings, setRatings] = useState<Record<string, GigRating>>({});
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<MarketplaceError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const initialCategory = searchParams.get("category");
  const [activeCategory, setActiveCategory] = useState<GigCategory | "all">(
    CATEGORIES.some((category) => category.value === initialCategory)
      ? (initialCategory as GigCategory)
      : "all"
  );
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    let cancelled = false;

    async function loadGigs() {
      setLoading(true);
      setFetchError(null);

      if (!isSupabaseConfigured) {
        setGigs([]);
        setFetchError({
          title: "Marketplace connection is not configured",
          message: "This deployment has not been connected to the product catalogue yet.",
          canRetry: false,
        });
        setLoading(false);
        return;
      }

      try {
        const [gigsResult, ratingsResult] = await Promise.all([
          supabase
            .from("gigs")
            .select(
              "id, title, description, category, price_ngn, is_ai_assisted, gallery_image_paths, created_at, seller_profiles ( display_name, verification_status )"
            )
            .eq("status", "active")
            .order("created_at", { ascending: false }),
          supabase.rpc("get_gig_ratings"),
        ]);

        if (cancelled) return;

        if (gigsResult.error) throw gigsResult.error;
        setGigs((gigsResult.data as unknown as GigRow[]) ?? []);

        const ratingsMap: Record<string, GigRating> = {};
        if (!ratingsResult.error) {
          ((ratingsResult.data as GigRating[]) ?? []).forEach((row) => {
            ratingsMap[row.gig_id] = row;
          });
        }
        setRatings(ratingsMap);
      } catch (error) {
        if (cancelled) return;
        console.error("[marketplace] Product loading failed", error);
        setGigs([]);
        setFetchError(describeMarketplaceError(error));
      }

      setLoading(false);
    }

    loadGigs();
    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  const filteredGigs = gigs.filter((gig) => {
    const matchesCategory = activeCategory === "all" || gig.category === activeCategory;
    const haystack = `${gig.title} ${gig.seller_profiles?.display_name ?? ""}`.toLowerCase();
    const matchesQuery = query.trim() === "" || haystack.includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  // With sparse inventory, a 4-column grid leaves a dead empty slot.
  // Only open the 4th column once there is enough stock to fill it.
  const gridClass =
    filteredGigs.length > 8
      ? "grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      : "grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className="min-h-screen bg-[#F7F1E8] text-[#172033]">
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <FadeIn direction="up" duration={600}>
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-medium text-[#B85B22]">Marketplace</p>
              <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold tracking-[-0.04em] text-[#172033] sm:text-5xl">
                Find digital products worth paying for.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#657083]">
                Browse products from creators, check the listing details, then pay in Naira through The Middleman.
              </p>
            </div>

            <Link
              href="/gigs/new"
              className="w-fit rounded-lg bg-[#0B3D91] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
            >
              Sell a digital product
            </Link>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <svg aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A8390]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products, creators, templates..."
                className="w-full rounded-xl bg-white/80 py-3 pl-11 pr-4 text-sm text-[#172033] outline-none ring-1 ring-[#D9D2C7] transition focus:ring-[#0B3D91]/40"
              />
            </div>
            <p className="text-xs text-[#7A746D] sm:pl-2">Pay in Naira · Verified sellers</p>
          </div>
        </FadeIn>

        <FadeIn direction="up" delay={100} duration={600}>
          <div className="no-scrollbar mb-9 mt-5 flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((category) => {
              const active = activeCategory === category.value;
              return (
                <button
                  key={category.value}
                  onClick={() => setActiveCategory(category.value)}
                  className={
                    "whitespace-nowrap rounded-lg px-4 py-2 text-[13px] font-medium transition-all " +
                    (active
                      ? "bg-[#172033] text-white"
                      : "bg-white/60 text-[#657083] hover:bg-white hover:text-[#172033]")
                  }
                >
                  {category.label}
                </button>
              );
            })}
          </div>
        </FadeIn>

        {loading && <LoadingState />}

        {!loading && fetchError && (
          <FadeIn direction="up">
            <div className="rounded-2xl border border-line bg-white/80 p-5 text-sm text-slate shadow-sm" role="alert">
              <p className="font-semibold text-bone">{fetchError.title}</p>
              <p className="mt-1 leading-relaxed">{fetchError.message}</p>
              {fetchError.canRetry && (
                <button
                  type="button"
                  onClick={() => setRetryCount((count) => count + 1)}
                  className="mt-4 rounded-full bg-ember px-4 py-2 font-semibold text-ink transition-transform hover:-translate-y-0.5"
                >
                  Try again
                </button>
              )}
            </div>
          </FadeIn>
        )}

        {!loading && !fetchError && filteredGigs.length === 0 && (
          <FadeIn direction="up">
            <p className="text-sm text-slate">
              No products match that search yet. Try a different term or category.
            </p>
          </FadeIn>
        )}

        {!loading && !fetchError && filteredGigs.length > 0 && (
          <div className={gridClass}>
            {filteredGigs.map((gig, index) => (
              <FadeIn key={gig.id} delay={index * 75} direction="up" duration={600}>
                <GigCard gig={gig as CardGig} rating={ratings[gig.id] as CardRating | undefined} />
              </FadeIn>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
