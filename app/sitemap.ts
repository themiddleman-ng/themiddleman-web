import { createClient } from "@supabase/supabase-js";
import type { MetadataRoute } from "next";

const SITE_URL = "https://themiddleman.com.ng";
export const revalidate = 3600;

const ROUTES = [
  "",
  "/marketplace",
  "/browse",
  "/about",
  "/careers",
  "/legal/privacy",
  "/legal/terms",
  "/legal/cookies",
  "/legal/refunds",
  "/legal/disputes",
  "/legal/seller-guidelines",
  "/legal/disclaimer",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    changeFrequency: route === "" || route === "/marketplace" ? "daily" : "monthly",
    priority: route === "" ? 1 : route === "/marketplace" ? 0.9 : 0.6,
  }));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return staticPages;

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase
    .from("gigs")
    .select("id, updated_at")
    .eq("status", "active");

  if (error || !data) {
    console.error("Could not load active products for the sitemap.");
    return staticPages;
  }

  const products: MetadataRoute.Sitemap = data.map((product) => ({
    url: `${SITE_URL}/gigs/${encodeURIComponent(product.id)}`,
    ...(product.updated_at ? { lastModified: product.updated_at } : {}),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticPages, ...products];
}
