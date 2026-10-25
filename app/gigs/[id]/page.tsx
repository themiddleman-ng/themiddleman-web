import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import PageClient from "./PageClient";
import { gatewayTestEnabled } from "@/lib/server/escrow-config.mjs";
import { loadGigPackageListing } from "@/lib/server/gig-package-listing";

export const dynamic = "force-dynamic";

const SITE_URL = "https://themiddleman.com.ng";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const canonical = "/gigs/" + encodeURIComponent(id);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return {
      title: "Product listing",
      alternates: { canonical },
      robots: { index: false, follow: true },
    };
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase
    .from("gigs")
    .select("title, description, gallery_image_paths")
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    console.error("Could not load product metadata.");
    return {
      title: "Digital product",
      alternates: { canonical },
      robots: { index: false, follow: true },
    };
  }

  if (!data) {
    return {
      title: "Product unavailable",
      alternates: { canonical },
      robots: { index: false, follow: false },
    };
  }

  const title = (data.title || "Digital product").trim().slice(0, 100);
  const description = (data.description || "Explore this digital product on The Middleman.")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
  const imagePath = Array.isArray(data.gallery_image_paths) ? data.gallery_image_paths[0] : null;
  const image = imagePath
    ? supabase.storage.from("gig-media").getPublicUrl(imagePath).data.publicUrl
    : SITE_URL + "/opengraph-image";
  const url = SITE_URL + canonical;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url,
      siteName: "The Middleman",
      title,
      description,
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const packageListing = await loadGigPackageListing(id);
  return (
    <PageClient
      gigId={id}
      purchasesEnabled={gatewayTestEnabled()}
      packageListing={packageListing}
    />
  );
}
