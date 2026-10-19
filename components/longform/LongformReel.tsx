"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Project } from "@/lib/content";
import { Chrome } from "@/components/shell/Chrome";
import { Player, openWithSound } from "@/components/mixers/Player";
import { sound } from "@/lib/sound";
import { EASE_SWEEP } from "@/lib/motion";

export type Film = Project & { label: string; color: string };

// Black legend text on the light brand colours, white on the dark ones (Figma strip-title).
const DARK = new Set(["purple", "ink", "dark-green", "royal-blue"]);
const SLIDE_MS = 900;

/**
 * V1 · 07 · Longform (Figma 7345:1493, Longform/Reel 7356:3991). One film per screen; a scroll,
 * swipe or arrow key moves to the next one (fela.tv logic). Each film previews as its still with a
 * slow 10 s push-in (1 → 1.06, the Figma timeline) under a 25 % dim, standing in for Eleven's 10 s
 * preview loops. The legend on the left: one colour square per film, fading in one after another on
 * first load (annotation: "smooth, something clean"); the current one opens into its title. Click a
 * square to jump, click the film ("play" tag) to watch it in the player.
 */
export function LongformReel({ films }: { films: Film[] }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState<number | null>(null);
  const lock = useRef(false);

  const go = (i: number) => {
    const next = Math.max(0, Math.min(films.length - 1, i));
    if (next === index || lock.current) return;
    lock.current = true;
    setIndex(next);
    sound.cue("step");
    window.setTimeout(() => (lock.current = false), SLIDE_MS);
  };

  // The page itself never scrolls: wheel / touch / keys step through the films.
  useEffect(() => {
    window.__lenis?.stop();
    let touchY = 0;
    const onWheel = (e: WheelEvent) => {
      if (playing !== null) return;
      e.preventDefault();
      if (Math.abs(e.deltaY) > 8) go(index + (e.deltaY > 0 ? 1 : -1));
    };
    const onKey = (e: KeyboardEvent) => {
      if (playing !== null) return;
      if (e.key === "ArrowDown" || e.key === "PageDown") go(index + 1);
      if (e.key === "ArrowUp" || e.key === "PageUp") go(index - 1);
    };
    const onTouchStart = (e: TouchEvent) => (touchY = e.touches[0].clientY);
    const onTouchEnd = (e: TouchEvent) => {
      const dy = touchY - e.changedTouches[0].clientY;
      if (Math.abs(dy) > 40) go(index + (dy > 0 ? 1 : -1));
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  });

  useEffect(() => () => window.__lenis?.start(), []);

  return (
    <main className="relative h-(--vh) overflow-hidden bg-neutral-1000 select-none">
      <div
        className="absolute inset-x-0 top-0"
        style={{ transform: `translateY(calc(${-index} * var(--vh)))`, transition: `transform ${SLIDE_MS}ms ${EASE_SWEEP}` }}
      >
        {films.map((f, i) => (
          <button
            key={f.slug}
            type="button"
            data-cursor="play"
            onClick={() => openWithSound(() => setPlaying(i))}
            aria-label={`Play ${f.label}`}
            className="relative block h-(--vh) w-[1440px] cursor-pointer overflow-hidden"
          >
            {/* The 10 s preview stand-in: a slow push-in, restarted each time the film comes on screen. */}
            <motion.div
              key={i === index ? `on-${f.slug}` : f.slug}
              className="absolute inset-0"
              initial={{ scale: 1 }}
              animate={i === index ? { scale: [1, 1.06] } : { scale: 1 }}
              transition={i === index ? { duration: 10, ease: "linear", repeat: Infinity, repeatType: "loop" } : { duration: 0 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.poster ?? ""} alt="" className="absolute inset-0 size-full object-cover" loading={i < 2 ? "eager" : "lazy"} />
            </motion.div>
            <div className="absolute inset-0 bg-neutral-1000/25" />
          </button>
        ))}
      </div>

      {/* Legend: one square per film; the current one holds its title and hugs it (revisions). */}
      <nav aria-label="Films" className="absolute top-1/2 left-6 z-10 flex -translate-y-1/2 flex-col items-start">
        {films.map((f, i) => (
          <motion.button
            key={f.slug}
            type="button"
            onClick={() => go(i)}
            aria-label={f.label}
            aria-current={i === index ? "true" : undefined}
            className="flex h-[25px] items-center overflow-hidden"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 + i * 0.04, ease: [0, 0, 0.58, 1] }}
          >
            <motion.span
              className="flex h-[25px] items-center overflow-hidden whitespace-nowrap"
              style={{ background: `var(--color-${f.color})`, color: DARK.has(f.color) ? "#fff" : "#000" }}
              initial={false}
              animate={{ width: i === index ? "auto" : 25 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* The title is in the square from the start (8 px in) and the square opens to hug it, so
                  it reads as one box revealing its title, not a square plus a colour strip. */}
              <motion.span
                className="t-h6 px-2"
                initial={false}
                animate={{ opacity: i === index ? 1 : 0 }}
                transition={{ duration: i === index ? 0.15 : 0.2 }}
              >
                {f.label}
              </motion.span>
            </motion.span>
          </motion.button>
        ))}
      </nav>

      <Chrome tone="light" />
      <Player films={films} index={playing} onIndex={setPlaying} onClose={() => setPlaying(null)} longform />
    </main>
  );
}
