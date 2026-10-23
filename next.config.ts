import type { NextConfig } from "next";
import path from "node:path";
import { INDEXABLE } from "./lib/site";

const nextConfig: NextConfig = {
  // `npm run dev` builds into .next-dev so a production build (deploy) never clobbers a running dev server.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // The studio root (../../..) has its own package.json; keep Turbopack scoped here.
  turbopack: { root: path.resolve(__dirname) },
  // Media is pre-sized WebP/MP4 (scripts/build_data.py): no runtime image optimisation.
  images: { unoptimized: true },
  // Keep the dev badge out of the bottom-left wordmark.
  devIndicators: false,
  // Phone review on the same Wi-Fi (http://<this Mac's IP>:3700): Next blocks dev assets for other hosts otherwise.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  // Until launch every response, redirects included, is noindex (lib/site.ts).
  async headers() {
    return INDEXABLE ? [] : [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] }];
  },
};

export default nextConfig;
