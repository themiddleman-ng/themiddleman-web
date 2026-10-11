import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { StarRatingDisplay } from "@/components/StarRating";
import GigPreview from "./GigPreview";

export type CardGig = {
  id: string;
  title: string;
  description: string;
  category: string;
  price_ngn: number;
  is_ai_assisted: boolean;
  gallery_image_paths?: string[];
  seller_profiles: { display_name: string; verification_status: string } | null;
};

export type CardRating = { average_rating: number; review_count: number };

const LABELS: Record<string, string> = {
  development: "Web & Software",
  design: "Design",
  marketing: "Marketing",
  writing: "Writing",
  ai_assisted: "AI-assisted",
};

export default function GigCard({ gig, rating }: { gig: CardGig; rating?: CardRating }) {
  const seller = gig.seller_profiles?.display_name ?? "Unknown seller";
  const verified = gig.seller_profiles?.verification_status === "approved";
  const cover = gig.gallery_image_paths?.[0];
  const imageUrl = cover
    ? supabase.storage.from("gig-media").getPublicUrl(cover).data.publicUrl
    : null;

  return (
    <Link href={`/gigs/${gig.id}`} className="group block min-w-0">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#EAE4DB]">
        {imageUrl ? (
          <Image
            unoptimized
            src={imageUrl}
            fill
            sizes="(max-width: 640px) 100vw, 420px"
            alt={`${gig.title} preview`}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.025]"
          />
        ) : (
          <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.02]">
            <GigPreview category={gig.category} seed={gig.id} />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/35 to-transparent" />

        <div className="absolute left-3 top-3 flex gap-2">
          <span className="rounded-md bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-[#172033] backdrop-blur">
            {LABELS[gig.category] ?? gig.category}
          </span>
          {gig.is_ai_assisted && (
            <span className="rounded-md bg-[#172033]/90 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
              AI-assisted
            </span>
          )}
        </div>

        <span className="absolute bottom-3 right-3 rounded-md bg-white/90 px-2.5 py-1 font-mono text-xs font-semibold text-[#172033] backdrop-blur">
          ₦{gig.price_ngn.toLocaleString()}
        </span>
      </div>

      <div className="pt-4">
        <h3 className="line-clamp-2 font-display text-lg font-semibold leading-snug tracking-[-0.02em] text-[#172033] transition-colors group-hover:text-[#0B3D91]">
          {gig.title}
        </h3>

        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
          <span className="flex min-w-0 items-center gap-1.5 text-[#6B7280]">
            <span className="truncate">{seller}</span>
            {verified && (
              <span aria-label="Verified seller" className="font-semibold text-[#0B3D91]">
                ✓
              </span>
            )}
          </span>

          {rating && rating.review_count > 0 ? (
            <span className="shrink-0">
              <StarRatingDisplay average={rating.average_rating} count={rating.review_count} size={11} />
            </span>
          ) : (
            <span className="shrink-0 text-xs text-[#9A948D]">New</span>
          )}
        </div>
      </div>
    </Link>
  );
}
