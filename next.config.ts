import type { NextConfig } from "next";
import fs from "node:fs";
import path from "node:path";
import { INDEXABLE } from "./lib/site";

/**
 * Posters, reels, the gif and the service sounds are served from the Strapi media library, so its
 * origin has to be allowed by the CSP as well as by next/image. Build-time only data (scripts/pull-content.mjs
 * writes data/*.json before the build), so nothing here is fetched from the browser.
 *
 * The library is not always on the same host as the API: Strapi Cloud serves the API from
 * <project>.strapiapp.com and the uploads from <project>.media.strapiapp.com. So the origins are read
 * from the pulled content itself (prebuild runs first) rather than guessed from STRAPI_URL — whatever
 * the media URLs say is what the CSP allows, on Cloud, self-hosted or a local Strapi alike.
 */
const MEDIA_ORIGINS = (() => {
  const origins = new Set<string>();

  const raw = process.env.STRAPI_URL ?? process.env.NEXT_PUBLIC_STRAPI_URL;
  if (raw) {
    try {
      origins.add(new URL(raw).origin);
    } catch {
      throw new Error(`STRAPI_URL is not a valid URL: ${raw}`);
    }
  }

  // Every media field the pull wrote, as an absolute URL. Missing data/ is fine: the prebuild
  // writes it, and a dev run with no content yet still has to boot.
  const dir = path.resolve(__dirname, "data");
  if (fs.existsSync(dir)) {
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".json")) continue;
      const json = fs.readFileSync(path.join(dir, file), "utf8");
      for (const [, url] of json.matchAll(/"(https?:\/\/[^"]+\/uploads?\/[^"]*)"/g)) {
        try {
          origins.add(new URL(url).origin);
        } catch {
          /* not a URL we can place; the CSP simply will not list it */
        }
      }
      // Strapi Cloud's media host has no /uploads/ segment in the path.
      for (const [, url] of json.matchAll(/"(https?:\/\/[^"]*media\.strapiapp\.com[^"]*)"/g)) {
        try {
          origins.add(new URL(url).origin);
        } catch {
          /* ditto */
        }
      }
    }
  }

  return [...origins];
})();

const MEDIA_SRC = MEDIA_ORIGINS.length ? ` ${MEDIA_ORIGINS.join(" ")}` : "";

/**
 * Security headers on every response. The CSP lists exactly what the site loads: its own files, the Vimeo
 * player frames, the Strapi media origin, inline scripts and styles (the pre-paint stage script, Next's own
 * inline data, motion styles) and WebAssembly for the floss animation. Dev is left without a CSP (hot reload needs eval).
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${MEDIA_SRC}`,
  // data: = the sound kit's silent keep-alive clip
  `media-src 'self' blob: data:${MEDIA_SRC}`,
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "frame-src https://player.vimeo.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS = [
  ...(process.env.NODE_ENV === "production" ? [{ key: "Content-Security-Policy", value: CSP }] : []),
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
];

const nextConfig: NextConfig = {
  // Let `next upgrade --agent` pick up security releases on its own.
  experimental: { agentUpgrade: "security" },
  // `npm run dev` builds into .next-dev so a production build (deploy) never clobbers a running dev server.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // The studio root (../../..) has its own package.json; keep Turbopack scoped here.
  turbopack: { root: path.resolve(__dirname) },
  // Media is pre-sized WebP/MP4 in the Strapi library: no runtime image optimisation.
  // `remotePatterns` is not enforced while `unoptimized` is on, but it keeps the allowlist
  // correct if optimisation is ever switched back on.
  images: {
    unoptimized: true,
    ...(MEDIA_ORIGINS.length && { remotePatterns: MEDIA_ORIGINS.map((o) => new URL(`${o}/**`)) }),
  },
  // Keep the dev badge out of the bottom-left wordmark.
  devIndicators: false,
  // Phone review on the same Wi-Fi (http://<this Mac's IP>:3700): Next blocks dev assets for other hosts otherwise.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.20.*.*"],
  // Security headers everywhere; until launch every response, redirects included, is also noindex (lib/site.ts).
  // The page used to be /privacy.
  async redirects() {
    return [{ source: "/privacy", destination: "/legal", permanent: true }];
  },
  async headers() {
    const robots = INDEXABLE ? [] : [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }];
    return [{ source: "/:path*", headers: [...SECURITY_HEADERS, ...robots] }];
  },
};

export default nextConfig;
