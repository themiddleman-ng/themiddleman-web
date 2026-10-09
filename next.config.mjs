/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  experimental: {
    viewTransition: true,
  },
};

export default nextConfig;
