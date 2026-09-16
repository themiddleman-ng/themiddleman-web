import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse digital work",
  description: "Search digital products, software, templates, design, writing, and services from verified Nigerian creators.",
  alternates: { canonical: "/browse" },
};

export default function BrowseLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
