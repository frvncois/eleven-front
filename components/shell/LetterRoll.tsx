"use client";

import { motion } from "framer-motion";

/* Letter-by-letter roll shared by the Nav/Sub word toggles (SoundToggle, ViewToggle). */

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Hover: the letter rolls up and a copy rises in under it, staggered by its index `i` within its word.
 * SOUND and ON / OFF start together, each rolling one letter at a time (Amélie, 19 Oct).
 * Pure CSS (group-hover), so it costs nothing at rest.
 */
function RollChar({ ch, i, roll = true }: { ch: string; i: number; roll?: boolean }) {
  return (
    <span
      className={`block transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${roll ? "group-hover:-translate-y-full" : ""}`}
      style={{ transitionDelay: `${i * 35}ms` }}
    >
      {ch}
      <span className="absolute top-full left-0">{ch}</span>
    </span>
  );
}

/** One word whose letters drop out and rise back in, one after the other; the shown word also rolls on hover. */
export function Flip({ text, shown }: { text: string; shown: boolean }) {
  return (
    <span aria-hidden className="col-start-1 row-start-1 flex">
      {[...text].map((ch, i) => (
        <motion.span
          key={i}
          className="relative inline-block"
          initial={false}
          animate={{ y: shown ? "0%" : "110%" }}
          transition={{ duration: 0.45, ease: EASE, delay: (shown ? 0.12 : 0) + i * 0.035 }}
        >
          <RollChar ch={ch} i={i} roll={shown} />
        </motion.span>
      ))}
    </span>
  );
}

export function Roll({ text }: { text: string }) {
  return (
    <span aria-hidden className="flex">
      {[...text].map((ch, i) => (
        <span key={i} className="relative inline-block overflow-hidden">
          <RollChar ch={ch} i={i} />
        </span>
      ))}
    </span>
  );
}
