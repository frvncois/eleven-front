import type { MetadataRoute } from "next";
import { mixers } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

const PAGES = ["", "/archive", "/longform", "/about", "/contact", "/privacy"];

export default function sitemap(): MetadataRoute.Sitemap {
  return [...PAGES, ...mixers.map((m) => `/mixers/${m.slug}`)].map((path) => ({ url: `${SITE_URL}${path}` }));
}
