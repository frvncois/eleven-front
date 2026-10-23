/**
 * The ELEVEN wordmark's perspective, as geometry the carousels can reuse.
 *
 * The logo (Figma 7661:3343, public/icons/eleven-shape.svg, 1400 × 286) is a one-point
 * perspective: the letters keep roughly the same width but lose height to the right, the top
 * line drops (0,0 → 1400,110), the bottom line rises (286 → 218), so the vanishing point sits
 * to the right and a little below the middle. The left edges lean (the E's top is 23 px right of
 * its foot), the N stands upright. Everything here is in stage units (1440 wide).
 */

export type Pt = [number, number];
export type Quad = [Pt, Pt, Pt, Pt]; // top-left, top-right, bottom-right, bottom-left

/** Logo → stage: the wordmark drawn edge to edge at 1440. */
const LOGO_K = 1440 / 1400;

/** Logo heights: 285.8 at the left, 108 at the right (ratio 0.378). Midline drops 21 px. */
const LOGO_H_LEFT = 285.8;
const LOGO_RATIO = 108 / 285.8;
const LOGO_MID_DROP = 21.2;
const LOGO_LEAN = 23.16 / 285.8;

/**
 * A taper field, the logo's lines extended across the screen.
 * depth 1 = the logo exactly, 0 = flat, > 1.6 = the vanishing point comes on screen.
 */
export function taperField({ midY, hLeft = LOGO_H_LEFT * LOGO_K, depth = 1, width = 1440, mirror = false }: { midY: number; hLeft?: number; depth?: number; width?: number; mirror?: boolean }) {
  const ratio = 1 - (1 - LOGO_RATIO) * depth;
  const drop = LOGO_MID_DROP * LOGO_K * depth * (hLeft / (LOGO_H_LEFT * LOGO_K));
  /** Field coordinate x (0 = left edge, `width` = right edge), v 0 = top, 1 = bottom → stage point. */
  const at = (xIn: number, v: number): Pt => {
    const x = mirror ? width - xIn : xIn;
    const t = x / width;
    const h = Math.max(0, hLeft * (1 + (ratio - 1) * t));
    const mid = midY + drop * t;
    const lean = LOGO_LEAN * depth * h * Math.max(0, 1 - t);
    const X = x + lean * (1 - v);
    return [mirror ? width - X : X, mid - h / 2 + v * h];
  };
  /** Where the top and bottom lines meet (field x), Infinity when they never do. */
  const vanishX = ratio < 1 ? width / (1 - ratio) : Infinity;
  const quad = (x0: number, x1: number): Quad => [at(x0, 0), at(x1, 0), at(x1, 1), at(x0, 1)];
  return { at, quad, vanishX };
}

export const lerpPt = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const lerpQuad = (a: Quad, b: Quad, t: number): Quad => [lerpPt(a[0], b[0], t), lerpPt(a[1], b[1], t), lerpPt(a[2], b[2], t), lerpPt(a[3], b[3], t)];

/** Projective map of the unit square onto a quad (0,0→q0, 1,0→q1, 1,1→q2, 0,1→q3). */
export function squareToQuad(q: Quad) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  let g = 0, h = 0;
  if (Math.abs(dx3) > 1e-9 || Math.abs(dy3) > 1e-9) {
    const det = dx1 * dy2 - dx2 * dy1;
    g = (dx3 * dy2 - dx2 * dy3) / det;
    h = (dx1 * dy3 - dx3 * dy1) / det;
  }
  const a = x1 - x0 + g * x1, b = x3 - x0 + h * x3, c = x0;
  const d = y1 - y0 + g * y1, e = y3 - y0 + h * y3, f = y0;
  const project = (u: number, v: number): Pt => {
    const w = g * u + h * v + 1;
    return [(a * u + b * v + c) / w, (d * u + e * v + f) / w];
  };
  /** Positive while (u, v) is in front of the camera. */
  const depthAt = (u: number, v: number) => g * u + h * v + 1;
  return { a, b, c, d, e, f, g, h, project, depthAt };
}

/** CSS matrix3d that maps a w × h element (transform-origin 0 0) onto the quad. */
export function rectToQuadCss(w: number, hgt: number, q: Quad) {
  const { a, b, c, d, e, f, g, h } = squareToQuad(q);
  const m = [a / w, d / w, 0, g / w, b / hgt, e / hgt, 0, h / hgt, 0, 0, 1, 0, c, f, 0, 1];
  return `matrix3d(${m.map((n) => +n.toFixed(6)).join(",")})`;
}

/** A quad is worth drawing when it has some area and no corner flipped behind the eye. */
export function quadVisible(q: Quad, minX = -600, maxX = 2040) {
  const xs = q.map((p) => p[0]);
  const hgt = Math.max(q[3][1] - q[0][1], q[2][1] - q[1][1]);
  return hgt > 0.6 && Math.max(...xs) > minX && Math.min(...xs) < maxX && xs.every(Number.isFinite);
}
