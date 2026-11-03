import type { Metadata } from "next";
import PageClient from "./PageClient";

export const dynamic = "force-dynamic";

const description =
  "Browse digital products from independent Nigerian creators. Compare listing details and prices. Purchases are paused, so browsing does not start a payment.";

export const metadata: Metadata = {
  title: "Marketplace",
  description,
  alternates: { canonical: "/marketplace" },
  openGraph: {
    type: "website",
    url: "https://themiddleman.com.ng/marketplace",
    siteName: "The Middleman",
    title: "Marketplace | The Middleman",
    description,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "The Middleman" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Marketplace | The Middleman",
    description,
    images: ["/opengraph-image"],
  },
};

export default function Page() {
  const designPreview = process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === "preview";
  return <PageClient designPreview={designPreview} />;
}
