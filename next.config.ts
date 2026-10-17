import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // `npm run dev` builds into .next-dev so a production build (deploy) never clobbers a running dev server.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // The studio root (../../..) has its own package.json; keep Turbopack scoped here.
  turbopack: { root: path.resolve(__dirname) },
  // Media is pre-sized WebP/MP4 (scripts/optimise-media.mjs): no runtime image optimisation.
  images: { unoptimized: true },
  // Screenshots are compared against Figma: keep the dev badge out of the bottom-left wordmark.
  devIndicators: false,
  // Client review prototype: every response, the password page and redirects included, is noindex.
  // One site now (inline nav only, Oct 17): old versioned links land on the same page.
  async redirects() {
    return [
      { source: "/v1", destination: "/", permanent: false },
      { source: "/v2", destination: "/", permanent: false },
      { source: "/v1/:path*", destination: "/:path*", permanent: false },
      { source: "/v2/:path*", destination: "/:path*", permanent: false },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] }];
  },
};

export default nextConfig;
