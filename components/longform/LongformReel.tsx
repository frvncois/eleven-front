"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Project } from "@/lib/content";
import { Chrome } from "@/components/shell/Chrome";
import { Player, openWithSound } from "@/components/mixers/Player";
import { sound } from "@/lib/sound";
import { EASE_SWEEP } from "@/lib/motion";
import { LongformTag } from "./LongformTag";

/** `position`: object-position of the still when the phone crops it to portrait (data/longform.json). */
export type Film = Project & { label: string; color: string; position?: string };

const SLIDE_MS = 900;

/**
 * Longform. One film per screen; a scroll,
 * swipe or arrow key moves to the next one. Each film previews as its still with a
 * slow 10 s push-in (1 → 1.06) under a 25 % dim, standing in for Eleven's 10 s
 * preview loops. The legend on the left: one colour square per film, fading in one after another on
 * first load; the current one opens into its title. Click a
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

      {/* Legend: one square per film; the current one opens into a tag of client over title (LongformTag). */}
      <nav aria-label="Films" className="absolute top-1/2 left-6 z-10 flex -translate-y-1/2 flex-col items-start">
        {films.map((f, i) => (
          <motion.button
            key={f.slug}
            type="button"
            onClick={() => go(i)}
            aria-label={f.label}
            aria-current={i === index ? "true" : undefined}
            className="block text-left"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 + i * 0.04, ease: [0, 0, 0.58, 1] }}
          >
            <LongformTag film={f} open={i === index} size={25} />
          </motion.button>
        ))}
      </nav>

      <Chrome tone="light" />
      <Player films={films} index={playing} onIndex={setPlaying} onClose={() => setPlaying(null)} longform />
    </main>
  );
}
