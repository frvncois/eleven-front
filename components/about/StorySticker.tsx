"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

type Props = { src: string; width: number; height: number; top: number; left: number; end: number };

/**
 * The ointment sticker (About story). It starts just above the first paragraph, then holds
 * on screen while the story scrolls past, wobbling with the scroll speed (a lagging slide and a tilt,
 * after ascension.pegassi.be/about), and fades out as the text ends, before the snow globe comes in.
 * `top`/`left`: resting slot in the section; `end`: section y where it must be gone.
 */
export function StorySticker({ src, width, height, top, left, end }: Props) {
  const slot = useRef<HTMLDivElement>(null);
  const sticker = useRef<HTMLDivElement>(null);
  const velocity = useMotionValue(0);
  const fade = useMotionValue(1);
  const v = useSpring(velocity, { stiffness: 120, damping: 14, mass: 0.6 });
  const x = useTransform(v, [-25, 0, 25], [48, 0, -48]);
  const rotate = useTransform(v, [-25, 0, 25], [-12, 0, 12]);
  const y = useTransform(v, [-25, 0, 25], [-18, 0, 18]);

  useEffect(() => {
    let last = window.scrollY;
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const now = window.scrollY;
      const scale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--app-scale")) || 1;
      velocity.set((now - last) / scale);
      last = now;
      // Fade over the last 160 design px of the run (sticker bottom → end of the story).
      const run = slot.current?.getBoundingClientRect();
      const own = sticker.current?.getBoundingClientRect();
      if (run && own) fade.set(Math.max(0, Math.min(1, (run.bottom - own.bottom) / (160 * scale))));
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [velocity, fade]);

  return (
    // The run: from the resting slot to the end of the story. The sticker holds at 42 % of the screen inside it.
    <div ref={slot} aria-hidden className="pointer-events-none absolute z-10" style={{ top, left, height: end - top, width }}>
      <motion.div ref={sticker} className="sticky top-[42%]" style={{ x, y, rotate, opacity: fade }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" width={width} height={height} className="block" />
      </motion.div>
    </div>
  );
}
