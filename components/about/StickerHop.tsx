"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useMotionValue } from "framer-motion";

type Props = { src: string; width: number; height: number };

type Point = { x: number; y: number };

/** The word the sticker lands on. */
const WORD = /\bEleven\b/g;
/** Screen line (share of the viewport) where a word is "reached" while scrolling. */
const LINE = 0.42;
/** How high the sticker hops between two words, in design px. */
const HOP = 90;

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Centres of every "Eleven" in the story's paragraphs, in the coordinates of `origin` (design px). */
function findWords(section: HTMLElement, origin: HTMLElement, scale: number): Point[] {
  const o = origin.getBoundingClientRect();
  const points: Point[] = [];
  section.querySelectorAll("p").forEach((p) => {
    const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      for (const m of n.textContent?.matchAll(WORD) ?? []) {
        const range = document.createRange();
        range.setStart(n, m.index!);
        range.setEnd(n, m.index! + m[0].length);
        const r = range.getBoundingClientRect();
        points.push({ x: (r.left + r.width / 2 - o.left) / scale, y: (r.top + r.height / 2 - o.top) / scale });
      }
    }
  });
  return points;
}

/**
 * V2 About story (annotation on the ointment, Figma 7451:2167): the sticker flies in from the top of
 * the screen and lands on the first "Eleven" of the story; as you scroll, it hops along a little arc to
 * cover the next "Eleven", and so on. Each word is reached when it crosses 42 % of the screen; the
 * sticker rests on a word for a moment before taking off (eased, with a short plateau each side).
 * After the last word it simply stays on it and scrolls away with the text.
 */
export function StickerHop({ src, width, height }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(-2000);
  const rotate = useMotionValue(0);
  const enter = useMotionValue(0);

  useEffect(() => {
    const origin = box.current;
    const section = origin?.parentElement;
    if (!origin || !section) return;
    let words: Point[] = [];
    let raf = 0;
    const scaleOf = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--app-scale")) || 1;
    const measure = () => (words = findWords(section, origin, scaleOf()));
    measure();
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure);

    // Fly in from above the screen once, on arrival.
    const intro = animate(enter, 1, { duration: 1.3, delay: 0.4, ease: [0.22, 1, 0.36, 1] });

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!words.length) return;
      const scale = scaleOf();
      const o = origin.getBoundingClientRect();
      // The reading line, in the same coordinates as the words.
      const line = (window.innerHeight * LINE - o.top) / scale;

      // Which hop are we on: from word i to word i + 1.
      let i = 0;
      while (i < words.length - 1 && line > words[i + 1].y) i++;
      const a = words[i];
      const b = words[Math.min(i + 1, words.length - 1)];
      const raw = b === a ? 0 : clamp((line - a.y) / (b.y - a.y));
      const t = smooth(clamp((raw - 0.2) / 0.6));
      const lift = Math.sin(Math.PI * t) * HOP;
      const onPath = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t - lift };

      // Before the intro ends, blend from a point above the screen down to the path.
      const e = enter.get();
      const sky = { x: onPath.x + 160, y: (-o.top) / scale - height * 2 };
      const px = sky.x + (onPath.x - sky.x) * e;
      const py = sky.y + (onPath.y - sky.y) * e;

      x.set(px - width / 2);
      y.set(py - height / 2);
      // Tilt into the hop (nose up taking off, down landing) plus a little swing on the way in.
      rotate.set(Math.sin(2 * Math.PI * t) * -10 + (1 - e) * 14);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      intro.stop();
      window.removeEventListener("resize", measure);
    };
  }, [x, y, rotate, enter, width, height]);

  return (
    // Zero-size origin at the section's top-left; the sticker is placed in section coordinates.
    <div ref={box} aria-hidden className="pointer-events-none absolute top-0 left-0 z-10 size-0">
      <motion.div className="absolute top-0 left-0" style={{ x, y, rotate }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" width={width} height={height} className="block max-w-none" />
      </motion.div>
    </div>
  );
}
