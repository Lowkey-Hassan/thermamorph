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
  // Also apply a baseline set of security headers to every response.
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          // Prevent this app from being framed by other sites (clickjacking).
          { key: "X-Frame-Options", value: "DENY" },
          // Stop browsers from MIME-sniffing responses away from declared Content-Type.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Don't leak full referrer URLs to third parties.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // This app doesn't use camera/mic/geolocation browser APIs — deny by default.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Baseline CSP: same-origin by default, with Supabase (auth/storage)
          // and the Hugging Face inference API allowed for data/XHR, and
          // framing disallowed entirely.
          // 'unsafe-eval' is only added in development — Next.js dev/HMR
          // (webpack eval-based source maps, React Refresh) requires it,
          // but production builds don't, so prod keeps the stricter policy.
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.supabase.co"