import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { StarRatingDisplay } from "@/components/StarRating";
import ProductCover from "./ProductCover";
import { categoryTheme } from "@/lib/marketplace/categories";

export type CardGig = { id: string; title: string; description: string; category: string; price_ngn: number; is_ai_assisted: boolean; gallery_image_paths?: string[]; seller_profiles: { display_name: string; verification_status: string } | null };
export type CardRating = { average_rating: number; review_count: number };
export default function GigCard({ gig, rating }: { gig: CardGig; rating?: CardRating }) {
  const seller = gig.seller_profiles?.display_name ?? "Unknown seller";
  const verified = gig.seller_profiles?.verification_status === "approved";
  const cover = gig.gallery_image_paths?.[0];
  const imageUrl = cover ? supabase.storage.from("gig-media").getPublicUrl(cover).data.publicUrl : null;
  const theme = categoryTheme(gig.category);
  const coverLabel = gig.is_ai_assisted ? "AI-assisted" : theme.label;

  return (
    <Link
      href={`/gigs/${gig.id}`}
      className="gm-card group block rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
    >
      <div className="gm-preview relative aspect-[4/3] overflow-hidden rounded-md bg-elevated">
        <div className="gm-preview-inner absolute inset-0">
          {imageUrl ? (
            <Image
              unoptimized
              src={imageUrl}
              fill
              sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
              alt={`${gig.title} preview`}
              className="object-cover"
            />
          ) : (
            <ProductCover title={gig.title} category={gig.category} compact label={coverLabel} />
          )}
        </div>
      </div>

      <div className="pt-3">
        <h2 className="line-clamp-2 text-[15px] font-semibold leading-5 text-bone transition-colors group-hover:text-ember sm:text-[16px]">
          {gig.title}
        </h2>

        <div className="mt-2 flex flex-wrap gap-1.5">
          <span
            className="tag-pill inline-flex min-h-7 items-center rounded-full px-2.5 text-[13px] font-semibold"
            style={{ ["--tile-accent" as string]: `var(--accent-${theme.accent})` }}
          >
            {theme.label}
          </span>
        </div>

        <div className="mt-1.5 flex min-w-0 items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-1.5 text-[13px] text-slate">
            <span className="truncate">{seller}</span>
            {verified && (
              <span
                role="img"
                aria-label="Verified seller"
                title="Verified seller"
                className="shrink-0 text-[13px] font-bold text-ember"
              >
                ✓
              </span>
            )}
          </span>
          {rating && rating.review_count > 0 && (
            <span className="shrink-0">
              <StarRatingDisplay average={rating.average_rating} count={rating.review_count} size={13} />
            </span>
          )}
        </div>

        <p className="mt-2 text-[16px] font-bold text-bone">
          ₦{gig.price_ngn.toLocaleString("en-NG")}
        </p>
      </div>
    </Link>
  );
}
