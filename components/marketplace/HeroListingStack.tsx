"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import ProductCover from "./ProductCover";
import { DESIGN_PREVIEW_GIGS } from "@/lib/design-preview/catalog";
import { listingImageSrc } from "@/lib/marketplace/listing-image.mjs";

type HeroGig = {
  id: string;
  title: string;
  category: string;
  price_ngn: number;
  is_ai_assisted?: boolean;
  gallery_image_paths?: string[];
};

export default function HeroListingStack() {
  const [gigs, setGigs] = useState<HeroGig[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!isSupabaseConfigured) {
        setGigs(DESIGN_PREVIEW_GIGS.slice(0, 3));
        return;
      }

      const { data, error } = await supabase
        .from("gigs")
        .select("id, title, category, price_ngn, is_ai_assisted, gallery_image_paths")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(3);

      if (cancelled) return;
      if (error || !data?.length) {
        setGigs([]);
        return;
      }
      setGigs(data as HeroGig[]);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (gigs.length === 0) return null;

  return (
    <div className="hero-listing-stack" aria-label="Featured listings">
      {gigs.slice(0, 3).map((gig, index) => {
        const cover = gig.gallery_image_paths?.[0];
        const src = listingImageSrc(
          cover,
          cover && !cover.startsWith("/") && !cover.startsWith("http")
            ? supabase.storage.from("gig-media").getPublicUrl(cover).data.publicUrl
            : null,
        );
        return (
        <Link
          key={gig.id}
          href={`/gigs/${gig.id}`}
          className={`hero-listing-card hero-listing-card-${index + 1}`}
        >
          <div className="hero-listing-cover">
            {src ? (
              <Image src={src} alt="" fill sizes="260px" className="object-cover" />
            ) : (
              <ProductCover title={gig.title} category={gig.category} compact />
            )}
          </div>
          <div className="hero-listing-body">
            <p className="line-clamp-2 text-[15px] font-semibold leading-5 text-bone">{gig.title}</p>
            <p className="mt-2 text-[16px] font-bold text-bone">₦{gig.price_ngn.toLocaleString("en-NG")}</p>
          </div>
        </Link>
        );
      })}
    </div>
  );
}
