import type { Metadata } from "next";
import PageClient from "./PageClient";

export const dynamic = "force-dynamic";

const description =
  "Browse digital products from independent Nigerian creators. Compare listing details and prices, then pay in Naira through Paystack.";

export const metadata: Metadata = {
  title: "Marketplace",
  description,
  alternates: { canonical: "/marketplace" },
  openGraph: {
    type: "website",
    url: "https://themiddleman.com.ng/marketplace",
    title: "Marketplace | The Middleman",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Marketplace | The Middleman",
    description,
  },
};

export default function Page() {
  const designPreview = process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === "preview";
  return <PageClient designPreview={designPreview} />;
}
