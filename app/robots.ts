import type { MetadataRoute } from "next";

const SITE_URL = "https://themiddleman.com.ng";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/messages",
        "/onboarding/",
        "/orders",
        "/payments",
        "/profile",
        "/gigs/mine",
        "/gigs/new",
        "/signup",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
