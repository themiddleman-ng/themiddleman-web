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
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      ...[
        "/admin/:path*",
        "/account/:path*",
        "/settings/:path*",
        "/notifications/:path*",
        "/analytics/:path*",
        "/disputes/:path*",
        "/seller-support/:path*",
        "/gigs/mine/:path*",
        "/gigs/new",
        "/login",
        "/messages/:path*",
        "/onboarding/:path*",
        "/orders/:path*",
        "/payments/:path*",
        "/profile/:path*",
        "/security/:path*",
        "/signup",
      ].map((source) => ({
        source,
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      })),
    ];
  },
};

export default nextConfig;
