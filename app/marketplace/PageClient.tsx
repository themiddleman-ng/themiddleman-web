"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import SiteHeader from "@/components/SiteHeader";
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
  { value: "development", label: "Web & Software" },
  { value: "design", label: "Design" },
  { value: "marketing", label: "Marketing" },
  { value: "writing", label: "Writing" },
  { value: "ai_assisted", label: "AI-assisted" },
];

function LoadingState() {
  return (
    <div role="status" aria-label="Loading products" className="grid grid-cols-1 gap-x-7 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
      <span className="sr-only">Loading products</span>
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} aria-hidden="true" className="marketplace-skeleton">
          <div className="mp-skeleton-image" />
          <div className="pt-3">
            <div className="mp-skeleton-line h-4 w-4/5" />
            <div className="mp-skeleton-line mt-2 h-3 w-2/5" />
            <div className="mp-skeleton-line mt-3 h-4 w-1/4" />
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
        if (ratingsResult.error) {
          console.warn("[marketplace] Ratings could not be loaded", ratingsResult.error);
        } else {
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
    const matchesQuery = query.trim() === "" || haystack.includes(query.trim().toLowerCase());
    return matchesCategory && matchesQuery;
  });

  // With sparse inventory, a 4-column grid leaves a dead empty slot.
  // Only open the 4th column once there is enough stock to fill it.
  const gridClass =
    filteredGigs.length >= 12
      ? "grid grid-cols-1 gap-x-7 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      : "grid grid-cols-1 gap-x-7 gap-y-9 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className="mp-shell">
      <SiteHeader compact />
      <main className="mp-content mx-auto max-w-7xl px-4 pb-12 pt-5 sm:px-6 sm:pb-16 sm:pt-7 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-[26px] font-semibold leading-tight tracking-[-.035em] text-[#172B45] sm:text-[30px]">
              Find digital products <span className="text-[#c95b1d]">worth paying for.</span>
            </h1>
            <p className="mt-1.5 max-w-2xl text-[14px] leading-6 text-[#526273]">
              Browse creator-made products, preview what’s included, and pay in Naira through Paystack.
            </p>
          </div>
          <Link
            href="/gigs/new"
            className="inline-flex w-fit shrink-0 items-center justify-center rounded-full bg-[#fff0e5] px-4 py-2.5 text-sm font-semibold text-[#b64d18] transition-colors hover:bg-[#fbe1cf] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#de641e]"
          >
            Sell a digital product
          </Link>
        </div>

        <div className="relative mt-4">
          <svg className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#71808B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="10.8" cy="10.8" r="6.8" />
            <path d="m16 16 4.5 4.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products, creators, templates..."
            aria-label="Search products, creators, and templates"
            className="h-12 w-full rounded-lg border border-[#dce6e5] bg-[#fffefd] pl-11 pr-4 text-[15px] text-[#172B45] shadow-[0_2px_10px_rgba(39,30,20,.035)] placeholder:text-[#7C8790] focus:border-[#D87B36] focus:outline-none focus:ring-2 focus:ring-[#E89A5C]/20"
          />
        </div>

        <nav aria-label="Product categories" className="no-scrollbar mt-3 flex gap-1 overflow-x-auto border-b border-[#dce6e5] pb-1">
          {CATEGORIES.map((category) => {
            const active = activeCategory === category.value;
            return (
              <button
                key={category.value}
                type="button"
                aria-pressed={active}
                onClick={() => setActiveCategory(category.value)}
                className={
                  "mp-tab shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-[13px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0B3D91] " +
                  (active
                    ? "bg-[#de641e] text-white shadow-[0_2px_8px_rgba(190,81,25,.18)]"
                    : "text-[#526777] hover:bg-[#e8f2ef] hover:text-[#244f57]")
                }
              >
                {category.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-5">
          {loading && <LoadingState />}

          {!loading && fetchError && (
            <div className="text-sm text-[#596B7A]" role="alert">
              <p className="font-semibold text-[#172B45]">{fetchError.title}</p>
              <p className="mt-1 leading-relaxed">{fetchError.message}</p>
              {fetchError.canRetry && (
                <button
                  type="button"
                  onClick={() => setRetryCount((count) => count + 1)}
                  className="mt-3 rounded-md bg-[#172B45] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#24466B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D87B36]"
                >
                  Try again
                </button>
              )}
            </div>
          )}

          {!loading && !fetchError && filteredGigs.length === 0 && (
            <p className="py-2 text-sm text-[#596B7A]" role="status">
              No products match that search yet. Try another term or category.
            </p>
          )}

          {!loading && !fetchError && filteredGigs.length > 0 && (
            <div className={gridClass}>
              {filteredGigs.map((gig) => (
                <GigCard key={gig.id} gig={gig as CardGig} rating={ratings[gig.id] as CardRating | undefined} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

