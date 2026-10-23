/**
 * The 9-column site grid in 1440 design px: 24 margin, 16 gutter, columns 140.44
 * wide, step 156.44. Mirrors --grid-* in app/globals.css, for layouts computed in JS.
 */
export const MARGIN = 24;
export const GUTTER = 16;
export const COLS = 9;
export const COL = (1440 - 2 * MARGIN - (COLS - 1) * GUTTER) / COLS;

/** Width of `n` columns, gutters included. */
export const span = (n: number) => n * COL + (n - 1) * GUTTER;
/** Left edge of column `n` (1-based). */
export const colStart = (n: number) => MARGIN + (n - 1) * (COL + GUTTER);

/**
 * Archive thumbnails come from the designed field in three sizes (S 332 / M 448 / L 564, data/index.json).
 * On the 9-col grid they are 2 / 3 / 4 columns wide; the image stays 16:9, the caption room under
 * it and the tile's centre are kept, so the field keeps its neighbourhoods.
 */
const ARCHIVE_COLS: Record<number, number> = { 332: 2, 448: 3, 564: 4 };
export function toGridTile<T extends { x: number; y: number; w: number; h: number }>(t: T): T {
  const n = ARCHIVE_COLS[Math.round(t.w)];
  if (!n) return t;
  const w = span(n);
  const h = t.h + ((w - t.w) * 9) / 16;
  return { ...t, x: t.x + (t.w - w) / 2, y: t.y + (t.h - h) / 2, w, h };
}
