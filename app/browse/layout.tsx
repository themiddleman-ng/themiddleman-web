import type { Metadata } from "next";

const description = "Search digital products, software, templates, design, writing, and services from verified Nigerian creators.";

export const metadata: Metadata = {
  title: "Browse digital work",
  description,
  alternates: { canonical: "/browse" },
  openGraph: {
    type: "website",
    url: "https://themiddleman.com.ng/browse",
    siteName: "The Middleman",
    title: "Browse digital work",
    description,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "The Middleman" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Browse digital work",
    description,
    images: ["/opengraph-image"],
  },
};

export default function BrowseLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
