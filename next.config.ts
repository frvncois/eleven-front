import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // The studio root (../../..) has its own package.json; keep Turbopack scoped here.
  turbopack: { root: path.resolve(__dirname) },
  // Media is pre-sized WebP/MP4 (scripts/optimise-media.mjs): no runtime image optimisation.
  images: { unoptimized: true },
  // Screenshots are compared against Figma: keep the dev badge out of the bottom-left wordmark.
  devIndicators: false,
  // Client review prototype: every response, the password page and redirects included, is noindex.
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] }];
  },
};

export default nextConfig;
