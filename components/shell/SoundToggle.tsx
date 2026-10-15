"use client";

import { useEffect, useRef, useState } from "react";
import { useSound } from "@/lib/sound";

type Frames = Record<string, string>;

// Frame map of Amélie's brush animation (scripts/build_sound_icon.py):
// 0–55 wave moving, 55–62 flattening, 62 flat, 97–119 rising back into frame 0.
const ON_LOOP = [...range(0, 55), ...range(102, 119)]; // seamless: 55 and 102 have the same amplitude
const FALL = range(56, 62);
const RISE = range(97, 119);
const FLAT = 62;
const FPS = 24;

function range(a: number, b: number) {
  return Array.from({ length: b - a + 1 }, (_, i) => a + i);
}

let framesPromise: Promise<Frames> | null = null;
const loadFrames = () =>
  (framesPromise ||= fetch("/icons/sound-brush.json")
    .then((r) => r.json())
    .then((d: { frames: Frames }) => d.frames));

/**
 * Toggle/Sound: 32 px grey chip with the brush wave. Sound on = the wave keeps moving;
 * turning it off lets the wave fall flat and hold; turning it on lifts it back up.
 * Drawn frame by frame from the exported SVG animation, so each state change starts from
 * wherever the wave currently is.
 */
export function SoundToggle({ size = 32 }: { size?: number }) {
  const s = useSound();
  const on = s.unlocked && !s.muted;
  const [frames, setFrames] = useState<Frames | null>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const state = useRef({ frame: FLAT, queue: [] as number[], loop: false });

  useEffect(() => {
    loadFrames().then(setFrames).catch(() => {});
  }, []);

  // Plan the frames to play whenever the sound state flips.
  useEffect(() => {
    const st = state.current;
    if (on) {
      const f = st.frame;
      if (f === FLAT || RISE.includes(f)) st.queue = RISE.slice(RISE.indexOf(f) + 1); // FLAT → whole rise
      else if (f > 55 && f < FLAT) st.queue = range(55, f - 1).reverse(); // caught mid-fall: climb back
      else st.queue = [];
      st.loop = true;
    } else {
      const f = st.frame;
      if (f <= 49) st.queue = [...range(50, 55), ...FALL]; // fall right away (≈0.5 s), not after the wave cycle
      else if (f <= 55) st.queue = [...range(f + 1, 55), ...FALL];
      else if (f >= 97) st.queue = range(97, f - 1).reverse().concat(FLAT); // sink back down the rise
      else st.queue = FALL.filter((x) => x > f);
      st.loop = false;
    }
  }, [on]);

  useEffect(() => {
    if (!frames) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = 0;
    const draw = () => pathRef.current?.setAttribute("d", frames[state.current.frame] ?? "");
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (t - last < 1000 / FPS) return;
      last = t;
      const st = state.current;
      if (st.queue.length) st.frame = st.queue.shift()!;
      else if (st.loop && !reduced) st.frame = ON_LOOP[(ON_LOOP.indexOf(st.frame) + 1) % ON_LOOP.length];
      else if (st.loop) st.frame = 0;
      draw();
    };
    draw();
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [frames]);

  return (
    <button
      type="button"
      aria-label={on ? "Mute sound" : "Turn sound on"}
      aria-pressed={on}
      onClick={() => s.toggle()}
      className="block cursor-pointer bg-neutral-100 transition-opacity duration-200 ease-out hover:opacity-50"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="block size-full" aria-hidden>
        <path ref={pathRef} fill="#0e1116" />
      </svg>
    </button>
  );
}
