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
    <div className="receipt-loader" aria-label="Loading products">
      <div className="receipt-loader-bar" />
      <p className="text-sm text-slate flex items-center gap-2">
        Printing receipts
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </p>
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
      ? "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      : "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className="mp-shell">
      <div className="mp-blob mp-blob-1" />
      <div className="mp-blob mp-blob-2" />
      <div className="mp-blob mp-blob-3" />

      <SiteHeader />

      <div className="mp-content mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-14">
        <FadeIn direction="up" duration={600}>
          {/* Hero panel — stacks vertically on mobile, row on desktop */}
          <div className="rounded-3xl border border-line bg-white/75 p-5 shadow-[0_18px_50px_rgba(31,21,12,.08)] backdrop-blur-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <p className="max-w-md text-[13px] text-slate sm:text-sm">
                Verified digital products and code, payment-protected, Nigeria-wide
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products, code, templates, sellers"
                  className="w-full rounded-full border border-line bg-white px-4 py-2.5 text-sm text-bone placeholder-slate shadow-sm transition-colors focus:border-ember focus:outline-none sm:w-72 lg:w-80"
                />
                <Link
                  href="/gigs/new"
                  className="shrink-0 rounded-full bg-ember px-5 py-2.5 text-center text-[13px] font-semibold text-ink shadow-lg shadow-ember/20 transition-all hover:-translate-y-0.5 hover:bg-ember/90"
                >
                  List a product
                </Link>
              </div>
            </div>
          </div>
        </FadeIn>

        <FadeIn direction="up" delay={100} duration={600}>
          {/* Category tabs — hidden scrollbar on mobile */}
          <div className="no-scrollbar mb-8 mt-6 flex gap-3 overflow-x-auto pb-1">
            {CATEGORIES.map((category) => {
              const active = activeCategory === category.value;
              return (
                <button
                  key={category.value}
                  onClick={() => setActiveCategory(category.value)}
                  className={
                    "mp-tab whitespace-nowrap rounded-full border px-4 py-2 text-[13px] transition-all " +
                    (active
                      ? "border-ember bg-ember font-semibold text-ink shadow-sm"
                      : "border-line bg-white/70 text-slate hover:border-ember/30 hover:text-bone")
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
