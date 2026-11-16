/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  experimental: {
    viewTransition: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: process.env.NODE_ENV === "development" ? "SAMEORIGIN" : "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      ...[
        "/account",
        "/admin",
        "/analytics",
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
      ].flatMap((path) => [path, `${path}/:path*`].map((source) => ({
        source,
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      }))),
    ];
  },
};

export default nextConfig;
