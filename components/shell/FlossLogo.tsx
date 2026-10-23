"use client";

import { useEffect, useRef } from "react";
import type { DotLottie } from "@lottiefiles/dotlottie-web";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * The floss logo, animated: hover scrubs the hand-drawn Lottie
 * (28 frames, the floss pulls out) forward over 600 ms with an ease-in-out cubic, leaving scrubs it
 * back from wherever it is. Off for reduced motion and touch. It is the Lottie drawing (solid
 * box, "SINCE 1999").
 *
 * The Lottie is one white fill with the details (ELEVEN, the swoosh, the text, the drawn lines) cut
 * out as holes. The player renders into a hidden canvas; each frame is copied to the visible one with
 * the holes inside the box filled black, so the box reads white with black details on any page. Holes
 * outside the box (the loops the spilled floss makes) stay open. On light pages a thin black outline
 * is traced around the silhouette (stacked drop-shadows) so the white box sits on white; on dark pages
 * it is dimmed to the nav's grey.
 *
 * Canvas sizing: in the 500×500 Lottie the floss box at frame 0 spans x 60–368, y 86–436, so the
 * canvas is scaled and offset to land that box in its slot: the webp's 106.651×113.346, 20 % smaller,
 * so 85.32×90.68.
 */
const DURATION = 600;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export const SLOT = { w: 106.651 * 0.64, h: 113.346 * 0.64 }; // the logo's slot, at 64 %
const SCALE = SLOT.h / 350; // slot height / floss height in the Lottie
const CANVAS = 500 * SCALE;
const OFFSET_X = 60 * SCALE;
const OFFSET_BOTTOM = (500 - 436) * SCALE;

/**
 * A hole is filled only if it sits entirely in the box (Lottie units), lid open or shut. Measured:
 * the box's details stay within x 71–357, y 40–427; the spilled floss loops sit right of x 345 or
 * below y 395, so the bottom-right corner (CORNER) is left open too.
 */
const BOX = { x0: 55, x1: 360, y0: 20, y1: 432 };
const CORNER = { x: 300, y: 380 };

const LINE = "0.5px";
const OUTLINE = [`${LINE} 0`, `-${LINE} 0`, `0 ${LINE}`, `0 -${LINE}`]
  .map((o) => `drop-shadow(${o} 0 var(--color-neutral-1000))`)
  .join(" ");

/** Fill the enclosed transparent regions that lie entirely inside BOX with black. */
function fillHoles(img: ImageData) {
  const { width: w, height: h, data } = img;
  const n = w * h;
  const open = (i: number) => data[i * 4 + 3] < 250;
  // 0 = unvisited, 1 = outside (reached from the edge), 2 = visited hole
  const mark = new Uint8Array(n);
  const stack = new Int32Array(n);

  let top = 0;
  const seed = (i: number) => {
    if (!mark[i] && open(i)) {
      mark[i] = 1;
      stack[top++] = i;
    }
  };
  for (let x = 0; x < w; x++) {
    seed(x);
    seed((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    seed(y * w);
    seed(y * w + w - 1);
  }
  const flood = (m: number, collect?: number[]) => {
    while (top) {
      const i = stack[--top];
      collect?.push(i);
      const x = i % w;
      const nb = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w];
      for (const j of nb) {
        if (j >= 0 && j < n && !mark[j] && open(j)) {
          mark[j] = m;
          stack[top++] = j;
        }
      }
    }
  };
  flood(1);

  const sx = 500 / w;
  const sy = 500 / h;
  for (let i = 0; i < n; i++) {
    if (mark[i] || !open(i)) continue;
    mark[i] = 2;
    stack[top++] = i;
    const region: number[] = [];
    flood(2, region);
    let x0 = w;
    let x1 = 0;
    let y0 = h;
    let y1 = 0;
    for (const j of region) {
      const x = j % w;
      const y = (j / w) | 0;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
    if (x0 * sx < BOX.x0 || x1 * sx > BOX.x1 || y0 * sy < BOX.y0 || y1 * sy > BOX.y1) continue;
    if (x0 * sx > CORNER.x && y0 * sy > CORNER.y) continue;
    for (const j of region) {
      const k = j * 4;
      const a = data[k + 3] / 255; // white over black, so anti-aliased edges stay smooth
      data[k] = data[k + 1] = data[k + 2] = Math.round(255 * a);
      data[k + 3] = 255;
    }
  }
}

/** On dark pages (Longform) the white box dims to neutral/300 #bdbdbd, the grey of Nav/Bar and the sound toggle. */
const GREY = `brightness(${0xbd / 0xff})`;

export function FlossLogo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const sourceRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const player = useRef<DotLottie | null>(null);
  const loaded = useRef(false);
  const progress = useRef(0);
  const raf = useRef<number | undefined>(undefined);
  const disabled = useRef(false);

  useEffect(() => {
    disabled.current =
      prefersReducedMotion() || window.matchMedia("(hover: none)").matches;
    let cancelled = false;

    const paint = () => {
      const src = sourceRef.current;
      const dst = canvasRef.current;
      if (!src || !dst || !src.width || !src.height) return;
      if (dst.width !== src.width || dst.height !== src.height) {
        dst.width = src.width;
        dst.height = src.height;
      }
      const ctx = dst.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.clearRect(0, 0, dst.width, dst.height);
      ctx.drawImage(src, 0, 0);
      const img = ctx.getImageData(0, 0, dst.width, dst.height);
      fillHoles(img);
      ctx.putImageData(img, 0, 0);
    };

    import("@lottiefiles/dotlottie-web").then(({ DotLottie }) => {
      if (cancelled || !sourceRef.current) return;
      DotLottie.setWasmUrl("/icons/dotlottie-player.wasm");
      const p = new DotLottie({
        canvas: sourceRef.current,
        src: "/icons/logo-floss.lottie",
        autoplay: false,
        loop: false,
        renderConfig: { autoResize: true, devicePixelRatio: window.devicePixelRatio || 1 },
      });
      p.addEventListener("render", paint);
      p.addEventListener("load", () => {
        loaded.current = true;
        p.setFrame(0);
        // the first frame can land before the canvas is sized; copy again once layout settles
        requestAnimationFrame(() => requestAnimationFrame(paint));
      });
      player.current = p;
    });
    return () => {
      cancelled = true;
      if (raf.current) cancelAnimationFrame(raf.current);
      player.current?.destroy();
      player.current = null;
    };
  }, []);

  const scrubTo = (target: number) => {
    const p = player.current;
    if (!p || !loaded.current || disabled.current) return;
    const last = Math.max(p.totalFrames - 1, 1);
    const from = progress.current;
    const start = performance.now();
    if (raf.current) cancelAnimationFrame(raf.current);
    const step = (now: number) => {
      const t = Math.min((now - start) / DURATION, 1);
      progress.current = from + (target - from) * ease(t);
      p.setFrame(progress.current * last);
      if (t < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };

  const box = { width: CANVAS, height: CANVAS, left: -OFFSET_X, bottom: -OFFSET_BOTTOM };

  return (
    <span
      className="relative block"
      style={{ width: SLOT.w, height: SLOT.h }}
      onMouseEnter={() => scrubTo(1)}
      onMouseLeave={() => scrubTo(0)}
      onFocus={() => scrubTo(1)}
      onBlur={() => scrubTo(0)}
    >
      {/* the player draws here; it stays in the layout (autoResize measures it) but is never seen */}
      <canvas ref={sourceRef} aria-hidden className="pointer-events-none absolute opacity-0" style={box} />
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none absolute"
        style={{ ...box, filter: tone === "dark" ? OUTLINE : GREY }}
      />
    </span>
  );
}
