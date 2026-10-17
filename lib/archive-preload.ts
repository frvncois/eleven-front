"use client";

/**
 * Archive thumbnails, fetched and decoded before the page opens (Amélie, Oct 17: the ball must be
 * there the moment Archive opens). Starts when the pointer reaches the Archive link (the sweep then
 * gives it about a second more). Each poster becomes an ImageBitmap, decoded off the main thread,
 * so handing it to the GPU later costs almost nothing. The data is a separate chunk so other pages
 * stay light.
 */
const bitmaps = new Map<string, Promise<ImageBitmap | HTMLImageElement>>();
let started = false;

export function posterBitmap(src: string) {
  let p = bitmaps.get(src);
  if (!p) {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
    p = img
      .decode()
      .then((): Promise<ImageBitmap | HTMLImageElement> | HTMLImageElement => (typeof createImageBitmap === "function" ? createImageBitmap(img) : img))
      .catch(() => img);
    bitmaps.set(src, p);
  }
  return p;
}

export function preloadArchive() {
  if (started || typeof window === "undefined") return;
  started = true;
  Promise.all([import("@/data/index.json"), import("@/data/projects.json")]).then(([index, projects]) => {
    const bySlug = new Map(projects.default.map((p) => [p.slug, p.poster]));
    for (const t of index.default.tiles) {
      const src = bySlug.get(t.slug);
      if (src) posterBitmap(src);
    }
  });
}
