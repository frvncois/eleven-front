import type { NextConfig } from "next";
import path from "node:path";
import { INDEXABLE } from "./lib/site";

/**
 * Security headers on every response. The CSP lists exactly what the site loads: its own files, the Vimeo
 * player frames, inline scripts and styles (the pre-paint stage script, Next's own inline data, motion
 * styles) and WebAssembly for the floss animation. Dev is left without a CSP (hot reload needs eval).
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob: data:", // data: = the sound kit's silent keep-alive clip
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
  // `npm run dev` builds into .next-dev so a production build (deploy) never clobbers a running dev server.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // The studio root (../../..) has its own package.json; keep Turbopack scoped here.
  turbopack: { root: path.resolve(__dirname) },
  // Media in public/ is pre-sized WebP/MP4: no runtime image optimisation.
  images: { unoptimized: true },
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
