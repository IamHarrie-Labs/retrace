import type { NextConfig } from "next";

// Retrace is fully dynamic (wallet session + live chain reads), so no component caching / prerender.
const nextConfig: NextConfig = {
  output: "standalone",
  // Lets a verification build run beside a dev server without sharing .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  cacheComponents: false,
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        // Share and claim links carry tokens in the URL: never leak them to Suiscan/Walruscan via Referer.
        { key: "Referrer-Policy", value: "strict-origin" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ...(process.env.NODE_ENV === "production" ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : []),
      ],
    }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
      },
    },
  },
};

export default nextConfig;
