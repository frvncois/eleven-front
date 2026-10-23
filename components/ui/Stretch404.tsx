"use client";

import { useEffect, useRef } from "react";
import { lerpQuad, rectToQuadCss, type Quad } from "@/lib/perspective";
import { appScale } from "@/lib/device";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * The 404 (Figma 7770:7071 + its annotation, Oct 23): a giant pink "404" in Neue Haas Bold, bent in the wordmark's
 * perspective, the near side towards the pointer. The pointer at the right edge = the Figma frame (left side 414
 * tall, right side 858, on one midline); at the left edge the mirror; in between it eases through flat. Live text
 * mapped onto that quad with one matrix3d (like the mixer Warp). Proportions from the 1440 frame, so the phone gets
 * the same shape at its width; touch drags it the same way, and it rests on the Figma frame.
 */
const SHAPE = {
  midY: 508 / 1024, // the midline, share of the screen height
  near: 858 / 1392, // the near side's height, share of the span between the margins
  far: 414 / 1392, // the far side's
};
const FOLLOW = 0.08; // share of the gap closed per frame

export function Stretch404() {
  const box = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = box.current;
    const t = text.current;
    if (!el || !t) return;
    let aim = 1; // 0 = pointer at the left edge, 1 = at the right (the Figma frame)
    let at = 1;
    let raf = 0;
    const draw = () => {
      const W = el.clientWidth;
      const H = el.clientHeight;
      const m = parseFloat(getComputedStyle(el).paddingLeft) || 24;
      const span = W - 2 * m;
      const mid = H * SHAPE.midY;
      const side = (x: number, h: number): [[number, number], [number, number]] => [[x, mid - h / 2], [x, mid + h / 2]];
      // Near side on the right (the frame), and its mirror.
      const [rT, rB] = side(W - m, span * SHAPE.near);
      const [lT, lB] = side(m, span * SHAPE.far);
      const right: Quad = [lT, rT, rB, lB];
      const [rT2, rB2] = side(W - m, span * SHAPE.far);
      const [lT2, lB2] = side(m, span * SHAPE.near);
      const left: Quad = [lT2, rT2, rB2, lB2];
      t.style.transform = rectToQuadCss(t.offsetWidth, t.offsetHeight, lerpQuad(left, right, at));
    };
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (Math.abs(aim - at) < 0.0005) return;
      at += (aim - at) * FOLLOW;
      draw();
    };
    const onMove = (e: PointerEvent) => {
      if (prefersReducedMotion()) return;
      const r = el.getBoundingClientRect();
      aim = Math.max(0, Math.min(1, (e.clientX - r.left) / appScale() / el.clientWidth));
    };
    // Draw once the font is in, so the glyph box is measured in Neue Haas, then follow the pointer.
    document.fonts.ready.then(() => {
      draw();
      t.style.visibility = "visible";
    });
    raf = requestAnimationFrame(tick);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", draw);
    };
  }, []);

  return (
    <div ref={box} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden px-margin">
      <span
        ref={text}
        className="absolute top-0 left-0 origin-top-left font-sans text-[400px] leading-none font-bold whitespace-nowrap text-pink will-change-transform [text-box:trim-both_cap_alphabetic]"
        style={{ visibility: "hidden" }}
      >
        404
      </span>
    </div>
  );
}
