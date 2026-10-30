"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Film } from "@/components/longform/LongformReel";
import { openWithSound } from "@/components/mixers/Player";
import { sound } from "@/lib/sound";
import { STEPPER, landing } from "@/lib/stepper";
import { PlayerMobile } from "./PlayerMobile";
import { LongformTag } from "@/components/longform/LongformTag";
import { appScale } from "@/lib/device";

/**
 * Longform on a phone. One film per screen, cropped to cover the portrait (until
 * Eleven sends 9:16 cuts), with the slow push-in and 25 % dim of desktop. The films follow the finger and land
 * on one when it lets go, the same feel as the Archive list (lib/stepper). The colour strip stays vertical like desktop (across the screen the titles
 * don't fit): 24 squares down the left margin, centred, the current one opening into a tag of client over
 * title (LongformTag, shared with desktop). No "turn the phone" prompt. Tap = the player.
 */
export function LongformMobile({ films }: { films: Film[] }) {
  const [index, setIndex] = useState(0);
  // Reduced motion: no endless push-in, the still sits at rest.
  const pushIn = !useReducedMotion();
  const [playing, setPlaying] = useState<number | null>(null);
  const track = useRef<HTMLDivElement>(null);
  // Position in films (fractional) and where it is landing; the loop below draws it.
  const pos = useRef(0);
  const target = useRef<number | null>(null);
  const dragged = useRef(false);
  const playingRef = useRef(playing);
  useEffect(() => {
    playingRef.current = playing;
  });

  // The strip: jump to a film.
  const go = (i: number) => (target.current = Math.max(0, Math.min(films.length - 1, i)));

  // The same feel as the Archive list (lib/stepper): the films follow the finger, and on release land on one
  // (a swipe or a gentle flick moves one, a hard flick up to three), easing in.
  useEffect(() => {
    window.__lenis?.stop();
    const n = films.length;
    const vhOf = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--vh")) || 844;
    let drag: { y: number; t: number; start: number; moved: number } | null = null;
    let v = 0; // px per frame, positive towards later films
    let last = 0;
    let raf = 0;
    let wheelEnd: ReturnType<typeof setTimeout> | undefined;
    const clamp = (p: number) => Math.max(-0.15, Math.min(n - 0.85, p));
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!drag && target.current !== null) {
        pos.current += (target.current - pos.current) * STEPPER.ease;
        if (Math.abs(target.current - pos.current) < 0.001) {
          pos.current = target.current;
          target.current = null;
        }
      }
      if (track.current) track.current.style.transform = `translate3d(0, ${(-pos.current * vhOf()).toFixed(1)}px, 0)`;
      const i = Math.max(0, Math.min(n - 1, Math.round(pos.current)));
      if (i !== last) {
        last = i;
        sound.cue("longformStep");
        setIndex(i);
      }
    };
    raf = requestAnimationFrame(tick);
    const start = (e: TouchEvent) => {
      if (playingRef.current !== null) return;
      drag = { y: e.touches[0].clientY, t: performance.now(), start: Math.round(pos.current), moved: 0 };
      target.current = null;
      v = 0;
      dragged.current = false;
    };
    const move = (e: TouchEvent) => {
      if (!drag) return;
      e.preventDefault();
      const dy = (e.touches[0].clientY - drag.y) / appScale();
      const now = performance.now();
      pos.current = clamp(pos.current - dy / vhOf());
      v = v * 0.6 + (-dy / Math.max(1, now - drag.t)) * 16.7 * 0.4;
      drag.moved += Math.abs(dy);
      if (drag.moved > 8) dragged.current = true;
      drag.y = e.touches[0].clientY;
      drag.t = now;
    };
    const end = () => {
      if (!drag) return;
      if (performance.now() - drag.t > 80) v = 0;
      target.current = Math.max(0, Math.min(n - 1, landing(drag.start, pos.current, v, vhOf(), 30)));
      drag = null;
    };
    const wheel = (e: WheelEvent) => {
      if (playingRef.current !== null) return;
      e.preventDefault();
      target.current = null;
      pos.current = clamp(pos.current + e.deltaY / appScale() / vhOf());
      clearTimeout(wheelEnd);
      wheelEnd = setTimeout(() => (target.current = Math.max(0, Math.min(n - 1, Math.round(pos.current)))), 140);
    };
    window.addEventListener("touchstart", start, { passive: true });
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", end);
    window.addEventListener("touchcancel", end);
    window.addEventListener("wheel", wheel, { passive: false });
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(wheelEnd);
      window.removeEventListener("touchstart", start);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", end);
      window.removeEventListener("touchcancel", end);
      window.removeEventListener("wheel", wheel);
    };
  }, [films.length]);
  useEffect(() => () => window.__lenis?.start(), []);

  return (
    <main className="relative h-(--vh) touch-none overflow-hidden bg-neutral-1000 select-none">
      <div ref={track} className="absolute inset-x-0 top-0 will-change-transform">
        {films.map((f, i) => (
          <button
            key={f.slug}
            type="button"
            // A drag is not a tap.
            onClick={() => !dragged.current && openWithSound(() => setPlaying(i))}
            aria-label={`Play ${f.label}`}
            className="relative block h-(--vh) w-[390px] overflow-hidden"
          >
            <motion.div
              key={i === index ? `on-${f.slug}` : f.slug}
              className="absolute inset-0"
              initial={{ scale: 1 }}
              animate={i === index && pushIn ? { scale: [1, 1.06] } : { scale: 1 }}
              transition={i === index && pushIn ? { duration: 10, ease: "linear", repeat: Infinity, repeatType: "loop" } : { duration: 0 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.poster ?? ""}
                alt=""
                className="absolute inset-0 size-full object-cover"
                style={{ objectPosition: f.position ?? "50% 50%" }}
                loading={i < 2 ? "eager" : "lazy"}
              />
            </motion.div>
            <div className="absolute inset-0 bg-neutral-1000/25" />
          </button>
        ))}
      </div>

      {/* Colour strip, vertical on the 16 margin, centred on the screen like desktop. */}
      <nav aria-label="Films" className="absolute top-1/2 left-margin z-10 flex -translate-y-1/2 flex-col items-start">
        {films.map((f, i) => (
          <motion.button
            key={f.slug}
            type="button"
            onClick={() => go(i)}
            aria-label={f.label}
            aria-current={i === index ? "true" : undefined}
            className="block text-left"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 + i * 0.04, ease: [0, 0, 0.58, 1] }}
          >
            <LongformTag film={f} open={i === index} size={24} />
          </motion.button>
        ))}
      </nav>

      <PlayerMobile films={films} index={playing} onIndex={setPlaying} onClose={() => setPlaying(null)} longform />
    </main>
  );
}
