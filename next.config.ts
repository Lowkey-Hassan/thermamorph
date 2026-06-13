import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Strict mode catches unsafe lifecycle usage and double-invokes effects
  // in dev to surface side-effect bugs early.
  reactStrictMode: true,

  // Don't advertise the framework via the X-Powered-By header.
  poweredByHeader: false,

  // Gzip/Brotli compress server-rendered output and static assets.
  compress: true,

  images: {
    // Serve modern, smaller formats when the browser supports them.
    formats: ["image/avif", "image/webp"],
    // Allow building results pages to load building photos from Supabase
    // Storage via next/image once that migration happens.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  // Long-cache immutable Next.js build assets; HTML/data stay revalidated.
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
