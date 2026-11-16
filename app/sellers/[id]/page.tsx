import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadPublicSellerProfile } from "@/lib/server/public-seller-profile";
import SellerProfileView from "./SellerProfileView";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const profile = await loadPublicSellerProfile(id);
  if (!profile) {
    return { title: "Seller not found", robots: { index: false, follow: false } };
  }
  const title = `${profile.display_name} on The Middleman`;
  const description = profile.bio
    ? profile.bio.replace(/\s+/g, " ").trim().slice(0, 160)
    : `Browse digital products from ${profile.display_name} on The Middleman.`;
  return {
    title,
    description,
    alternates: { canonical: `/sellers/${id}` },
    robots: { index: true, follow: true },
  };
}

export default async function SellerPublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await loadPublicSellerProfile(id);
  if (!profile) notFound();
  return <SellerProfileView profile={profile} />;
}
