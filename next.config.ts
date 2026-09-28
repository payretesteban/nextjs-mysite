import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Put the site's small stylesheet (about 16 KB) straight into the HTML, so phones don't wait for a
    // separate CSS download before showing anything (Lighthouse's "render-blocking requests")
    inlineCss: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
