import type { Metadata } from "next";
import PageClient from "./PageClient";
import { gatewayTestEnabled } from "@/lib/server/escrow-config.mjs";
import { prePurchaseEnquiryEnabled } from "@/lib/server/messaging-config.mjs";
import { loadGigPackageListing } from "@/lib/server/gig-package-listing";
import { gigPageUrl, loadPublicGigCard } from "@/lib/og/public-gig";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const canonical = "/gigs/" + encodeURIComponent(id);
  const url = gigPageUrl(id);
  const gig = await loadPublicGigCard(id);

  if (!gig) {
    return {
      title: "Product unavailable",
      description: "This product is not available on The Middleman.",
      alternates: { canonical },
      robots: { index: false, follow: false },
      openGraph: {
        type: "website",
        url,
        siteName: "The Middleman",
        title: "Product unavailable",
        description: "This product is not available on The Middleman.",
      },
      twitter: { card: "summary_large_image", title: "Product unavailable" },
    };
  }

  return {
    title: gig.title,
    description: gig.description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url,
      siteName: "The Middleman",
      title: gig.title,
      description: gig.description,
    },
    twitter: {
      card: "summary_large_image",
      title: gig.title,
      description: gig.description,
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
      prePurchaseEnquiryEnabled={prePurchaseEnquiryEnabled()}
      packageListing={packageListing}
    />
  );
}
