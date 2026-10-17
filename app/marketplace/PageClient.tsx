"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import SiteHeader from "@/components/SiteHeader";
import GigCard, { type CardGig, type CardRating } from "@/components/marketplace/GigCard";
import { DESIGN_PREVIEW_GIGS } from "@/lib/design-preview/catalog";

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
    <div role="status" aria-label="Loading products" className="mm-product-grid">
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

export default function MarketplacePage({ designPreview = false }: { designPreview?: boolean }) {
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
  const [priceRange, setPriceRange] = useState('all');
  const [sort, setSort] = useState('newest');
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setQuery(initialQuery);
    setActiveCategory(CATEGORIES.some((category) => category.value === initialCategory) ? initialCategory as GigCategory : 'all');
  }, [initialCategory, initialQuery]);

  useEffect(() => {
    let cancelled = false;

    async function loadGigs() {
      setLoading(true);
      setFetchError(null);

      if (!isSupabaseConfigured) {
        if (designPreview) {
          setGigs(DESIGN_PREVIEW_GIGS as GigRow[]);
          setFetchError(null);
        } else {
          setGigs([]);
          setFetchError({
            title: "Marketplace connection is not configured",
            message: "This deployment has not been connected to the product catalogue yet.",
            canRetry: false,
          });
        }
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
  }, [designPreview, retryCount]);

  const filteredGigs = gigs.filter((gig) => {
    const matchesCategory = activeCategory === "all" || gig.category === activeCategory;
    const haystack = `${gig.title} ${gig.seller_profiles?.display_name ?? ""}`.toLowerCase();
    const matchesQuery = query.trim() === "" || haystack.includes(query.trim().toLowerCase());
    const price = Number(gig.price_ngn);
    const matchesPrice = priceRange === 'all' || (priceRange === 'under5' && price < 5000) || (priceRange === '5to10' && price >= 5000 && price < 10000) || (priceRange === '10to25' && price >= 10000 && price <= 25000) || (priceRange === 'over25' && price > 25000);
    return matchesCategory && matchesQuery && matchesPrice;
  }).sort((a, b) => sort === 'low' ? a.price_ngn - b.price_ngn : sort === 'high' ? b.price_ngn - a.price_ngn : Date.parse(b.created_at) - Date.parse(a.created_at));

  const gridClass = "mm-product-grid";

  return (
    <div className="mp-shell">
      <SiteHeader compact />
      <main className="mp-content mx-auto max-w-7xl px-4 pb-12 pt-5 sm:px-6 sm:pb-16 sm:pt-7 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.16em] text-[#c65316]">
              <span className="h-px w-5 bg-[#de641e]" aria-hidden="true" />
              Marketplace
            </p>
            <h1 className="font-display text-[26px] font-semibold leading-tight tracking-[-.035em] text-[#172B45] sm:text-[30px]">
              Find your next useful starting point.
            </h1>
            <p className="mt-1.5 max-w-2xl text-[14px] leading-6 text-[#526273]">
              Discover ready-made digital products. Make them yours with the creator.
            </p>
          </div>
          <Link
            href="/gigs/new"
            className="inline-flex w-full shrink-0 items-center justify-center rounded-xl bg-[#fff0e5] px-4 py-2.5 text-sm font-semibold text-[#b64d18] transition-colors hover:bg-[#fbe1cf] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#de641e] sm:w-fit sm:rounded-full"
          >
            Sell a digital product
          </Link>
        </div>

        <div className="relative mt-5">
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
            className="h-12 w-full rounded-2xl border border-[#eadfd3] bg-white pl-11 pr-4 text-[15px] text-[#172B45] shadow-[0_8px_24px_rgba(39,30,20,.06)] placeholder:text-[#7C8790] transition focus:border-[#D87B36] focus:outline-none focus:ring-4 focus:ring-[#E89A5C]/15"
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

        <div className="mm-catalogue">
          <aside id="marketplace-filters" className="mm-filters" data-open={filtersOpen} aria-label="Product filters">
            <fieldset><legend>Category</legend>{CATEGORIES.map((category) => <label key={category.value}><input type="radio" name="filter-category" checked={activeCategory === category.value} onChange={() => setActiveCategory(category.value)} />{category.value === 'all' ? 'All products' : category.label}</label>)}</fieldset>
            <fieldset><legend>Price range</legend>{[['all', 'Any price'], ['under5', 'Under ₦5,000'], ['5to10', '₦5,000 – ₦10,000'], ['10to25', '₦10,000 – ₦25,000'], ['over25', 'Over ₦25,000']].map(([value, label]) => <label key={value}><input type="radio" name="price-range" checked={priceRange === value} onChange={() => setPriceRange(value)} />{label}</label>)}</fieldset>
            <button type="button" onClick={() => { setPriceRange('all'); setActiveCategory('all'); setQuery(''); }}>Clear filters</button>
          </aside>
          <div className="min-w-0">
            <div className="mm-catalogue-toolbar"><button type="button" className="mm-filter-toggle" aria-controls="marketplace-filters" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)}>Filters</button><span role="status">{loading ? 'Loading products…' : `${filteredGigs.length} products`}</span><label>Sort by<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></label></div>
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
            <>
              {designPreview && !isSupabaseConfigured && <p className="mm-preview-note" role="status">Design preview · sample listings, no live checkout. <Link href="/design-review?screen=marketplace">Open all page designs →</Link></p>}
              <div className={gridClass}>
                {filteredGigs.map((gig) => (
                  <GigCard key={gig.id} gig={gig as CardGig} rating={ratings[gig.id] as CardRating | undefined} />
                ))}
              </div>
            </>
          )}
          </div>
        </div>
      </main>
    </div>
  );
}

