import type { MetadataRoute } from "next";

const SITE_URL = "https://themiddleman.com.ng";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
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

  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    changeFrequency: route === "" || route === "/marketplace" ? "daily" : "monthly",
    priority: route === "" ? 1 : route === "/marketplace" ? 0.9 : 0.6,
  }));
}
