import type { MetadataRoute } from "next";

const SITE_URL = "https://themiddleman.com.ng";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/marketplace", "/about", "/careers", "/legal/"],
      disallow: [
        "/admin/",
        "/design-preview",
        "/account/",
        "/settings",
        "/notifications",
        "/analytics",
        "/disputes",
        "/seller-support",
        "/api/",
        "/gigs/mine",
        "/gigs/new",
        "/login",
        "/messages",
        "/onboarding/",
        "/orders",
        "/payments",
        "/profile",
        "/security/",
        "/signup",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
