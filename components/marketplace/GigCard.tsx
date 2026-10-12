import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { StarRatingDisplay } from "@/components/StarRating";
import GigPreview from "./GigPreview";

export type CardGig = { id: string; title: string; description: string; category: string; price_ngn: number; is_ai_assisted: boolean; gallery_image_paths?: string[]; seller_profiles: { display_name: string; verification_status: string } | null };
export type CardRating = { average_rating: number; review_count: number };
const LABELS: Record<string, string> = { development: "Development", design: "Design", marketing: "Marketing", writing: "Writing", ai_assisted: "AI-assisted" };
export default function GigCard({ gig, rating }: { gig: CardGig; rating?: CardRating }) {
  const seller = gig.seller_profiles?.display_name ?? "Unknown seller";
  const verified = gig.seller_profiles?.verification_status === "approved";
  const cover = gig.gallery_image_paths?.[0];
  const imageUrl = cover ? supabase.storage.from("gig-media").getPublicUrl(cover).data.publicUrl : null;

  return (
    <Link
      href={`/gigs/${gig.id}`}
      className="gm-card group block rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0B3D91]"
    >
      <div className="gm-preview relative aspect-[4/3] overflow-hidden rounded-md bg-[#E9E0D6]">
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
            <GigPreview category={gig.category} seed={gig.id} />
          )}
        </div>
        {gig.is_ai_assisted && (
          <span className="absolute left-2.5 top-2.5 rounded bg-[#172B45]/90 px-2 py-1 text-[10px] font-medium text-white">
            AI-assisted
          </span>
        )}
      </div>

      <div className="pt-3">
        <h2 className="line-clamp-2 text-[15px] font-semibold leading-5 text-[#203A53] transition-colors group-hover:text-[#c95b1d] sm:text-[16px]">
          {gig.title}
        </h2>

        <div className="mt-1.5 flex min-w-0 items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-1.5 text-[13px] text-[#677582]">
            <span className="truncate">{seller}</span>
            {verified && (
              <span
                aria-label="Verified seller"
                title="Verified seller"
                className="shrink-0 text-[12px] font-bold text-[#2e7776]"
              >
                ✓
              </span>
            )}
          </span>
          {rating && rating.review_count > 0 && (
            <span className="shrink-0">
              <StarRatingDisplay average={rating.average_rating} count={rating.review_count} size={10} />
            </span>
          )}
        </div>

        <p className="mt-2 text-[15px] font-semibold text-[#c95b1d]">
          ₦{gig.price_ngn.toLocaleString("en-NG")}
        </p>
      </div>
    </Link>
  );
}
