"use client";

import { motion } from "framer-motion";
import type { Film } from "./LongformReel";

// Black legend text on the light brand colours, neutral/300 grey on the dark ones (never white: review note 3, Oct 23).
const DARK = new Set(["purple", "ink", "dark-green", "royal-blue"]);
const EASE = [0.4, 0, 0.2, 1] as const;
const MORPH = { duration: 0.5, ease: EASE };

/**
 * The client / title pair of a longform film, as the player shows it: labels read "Client · Title" and are split on
 * the "·"; a film without one takes the project's client, and a title that only repeats the client is not shown twice.
 */
export function filmCaption(f: Film) {
  const [left, ...rest] = f.label.split(" · ");
  const client = rest.length ? left : f.client;
  const name = rest.length ? rest.join(" · ") : f.label;
  return { client, name: name === client ? null : name };
}

/**
 * One square of the Longform colour strip (desktop and phone, Amélie Oct 23). The current film's square opens into
 * the mixer caption in its colour: a bar hugging the client (chip-client's type and padding) with a second bar hugging
 * the title (chip-title's) tucked 1 px under it. The square becomes the client bar and the title bar unrolls out of
 * it; leaving, the title bar rolls back up and the client bar closes into the square.
 */
export function LongformTag({ film, open, size }: { film: Film; open: boolean; size: number }) {
  const { client, name } = filmCaption(film);
  const paint = { background: `var(--color-${film.color})`, color: DARK.has(film.color) ? "var(--color-neutral-300)" : "#000" };
  const text = { initial: false, animate: { opacity: open ? 1 : 0 }, transition: { duration: open ? 0.15 : 0.2 } } as const;
  return (
    <span className="flex flex-col items-start font-sans font-bold whitespace-nowrap">
      <motion.span
        className="block overflow-hidden"
        style={paint}
        initial={false}
        animate={{ width: open ? "auto" : size, height: open ? "auto" : size }}
        transition={MORPH}
      >
        <motion.span className="block px-[6px] py-[3px] text-[12px] leading-none uppercase" {...text}>
          {client}
        </motion.span>
      </motion.span>
      {name && (
        <motion.span
          // -1 px under the client bar, like the chip pair (.chip-client + .chip-title); only while open, so a closed
          // strip keeps its squares edge to edge.
          className="block overflow-hidden"
          style={paint}
          initial={false}
          animate={{ width: open ? "auto" : size, height: open ? "auto" : 0, marginTop: open ? -1 : 0 }}
          transition={MORPH}
        >
          <motion.span className="block px-[6px] py-[2px] text-[14px] leading-[1.2]" {...text}>
            {name}
          </motion.span>
        </motion.span>
      )}
    </span>
  );
}
