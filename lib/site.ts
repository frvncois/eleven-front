/**
 * Where the site lives and whether search engines may index it. Until launch the site stays noindex
 * everywhere (metadata, response header, robots.txt). Launch day: set NEXT_PUBLIC_INDEXABLE=true on
 * the host, and remove the X-Robots-Tag block in netlify.toml.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://elevensound.com";
export const INDEXABLE = process.env.NEXT_PUBLIC_INDEXABLE === "true";
