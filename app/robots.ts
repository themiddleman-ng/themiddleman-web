import type { MetadataRoute } from "next";

const SITE_URL = "https://themiddleman.com.ng";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/marketplace", "/about", "/careers", "/legal/"],
      disallow: [
        "/account",
        "/admin",
        "/analytics",
        "/api/",
        "/design-review",
        "/disputes",
        "/gigs/mine",
        "/gigs/new",
        "/login",
        "/messages",
        "/notifications",
        "/onboarding",
        "/orders",
        "/payments",
        "/profile",
        "/reset-password",
        "/security",
        "/seller-support",
        "/settings",
        "/signup",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
