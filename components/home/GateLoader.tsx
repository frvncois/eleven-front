"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionTemplate, useMotionValue, usePresence } from "framer-motion";
import home from "@/data/home.json";
import { sound } from "@/lib/sound";
import { prefersReducedMotion } from "@/lib/motion";
import { SoundToggle } from "@/components/shell/SoundToggle";

const WORDS = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
// The count (Amélie, Oct 23: "one at a time", 7 s, was 5): a word every 0.64 s from 0.4 s, ten lands at 6.16 s,
// held 0.84 s, then the panel swings up at 7 s.
const FIRST_MS = 400;
const STEP_MS = 640;
const HOLD_MS = 840;
const SWING = [0.62, 0.05, 0.01, 0.99] as const; // the Mixers wedge's curve (MixersBanner)
const SWING_S = 0.7;
const SWING_LAG_S = 0.14; // the right corner follows the left, like the Mixers wedge closing
/** When the home's nav (Home, PhoneShell) fades in, counted from the moment the gate starts to leave. */
export const GATE_EXIT = 0.45;

// Figma "Subtract" (V2 · 01 · Gate · 9-col 7684:1491): a light-grey panel over the home reel, its lower edge 65 above
// the screen's bottom at the left and 135 at the right, so a band of the playing video shows under it. Kept relative
// to the screen's bottom so the band survives any height. Phone: the same slope, scaled to 390.
const EDGE = { left: 65.15, right: 135.08 };
const EDGE_PHONE = { left: 48, right: 67 };

/**
 * Sound gate, new version (Figma V2 · 01 · Gate · 9-col 7684:1491, Oct 23), over the playing home reel: the H3 line
 * and SOUND OFF / ON (the choice) centred at the top, the counting words "one" … "ten" in a row above the big ELEVEN.
 * The words appear one at a time (a step sound each, heard only with sound on); after "ten" the panel swings back up,
 * left corner first, like the Mixers wedge closing. Nobody is stuck here (Jordan, Oct 15): the gate leaves on its own.
 * `onDone` fires when the swing starts (the home marks the gate seen); AnimatePresence keeps this mounted until the
 * swing has finished (usePresence).
 */
export function GateLoader({ onDone, phone = false }: { onDone: () => void; phone?: boolean }) {
  const [shown, setShown] = useState(0);
  const [isPresent, safeToRemove] = usePresence();
  const edge = phone ? EDGE_PHONE : EDGE;
  // At rest the edge is CSS (relative to the panel's own height, the same on the server and the client); the swing
  // switches to numbers read from the panel when it starts.
  const rest = `polygon(0 0, 100% 0, 100% calc(100% - ${edge.right}px), 0 calc(100% - ${edge.left}px))`;
  const panel = useRef<HTMLElement>(null);
  const leaving = !isPresent;
  const left = useMotionValue(0);
  const right = useMotionValue(0);
  const clip = useMotionTemplate`polygon(0 0, 100% 0, 100% ${right}px, 0 ${left}px)`;

  // Keep the numeric edge in step with the panel's height, ready for the swing.
  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    const sync = () => {
      left.set(el.offsetHeight - edge.left);
      right.set(el.offsetHeight - edge.right);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [left, right, edge.left, edge.right]);

  // The count, then hand over to the home.
  useEffect(() => {
    let n = 0;
    let done: ReturnType<typeof setTimeout> | undefined;
    let tick: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      const next = () => {
        n += 1;
        setShown(n);
        sound.cue("step");
        if (n === WORDS.length) {
          clearInterval(tick);
          done = setTimeout(onDone, HOLD_MS);
        }
      };
      next();
      tick = setInterval(next, STEP_MS);
    }, FIRST_MS);
    return () => {
      clearTimeout(start);
      clearInterval(tick);
      clearTimeout(done);
    };
  }, [onDone]);

  // Leaving: swing the lower edge up to the top, left corner first, then let AnimatePresence remove us.
  useEffect(() => {
    if (isPresent) return;
    const still = prefersReducedMotion();
    const t = (delay: number) => (still ? { duration: 0 } : { duration: SWING_S, delay, ease: SWING });
    const ctl = [animate(left, 0, t(0)), animate(right, 0, t(SWING_LAG_S))];
    Promise.all(ctl).then(() => safeToRemove?.());
    return () => ctl.forEach((c) => c.stop());
  }, [isPresent, safeToRemove, left, right]);

  return (
    <motion.section
      ref={panel}
      aria-label="Sound"
      className="absolute inset-0 z-20 bg-light-grey"
      style={leaving ? { clipPath: clip, WebkitClipPath: clip } : { clipPath: rest, WebkitClipPath: rest }}
    >
      {/* The title, then the choice (plain H4 text like the Figma, no chip on the gate) at its Figma spot, 226 from the
          top, and the aqua hint just below it (Amélie, Oct 23). Phone: the title wraps to three lines, the choice at 176. */}
      <div className="absolute inset-x-0 top-[90px] flex flex-col items-center text-neutral-1000 phone:top-[72px] phone:px-margin">
        <p className="t-h3 text-center phone:text-[20px] phone:leading-[1.1]">
          {home.gate.line[0]}
          <br />
          {home.gate.line[1]}
        </p>
        <div className="t-h4 mt-[80px] phone:mt-[38px]">
          <SoundToggle />
        </div>
        <p className="mt-2 font-sans text-[12px] leading-none font-medium text-aqua">{home.gate.hint}</p>
      </div>
      {/* Figma: the row from 46 to 1416, 68 above the ELEVEN; anchored to the bottom with it. */}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={WORDS.length}
        aria-valuenow={shown}
        className="t-h5 absolute right-margin left-[46px] flex justify-between text-neutral-1000 phone:left-margin phone:text-[11px]"
        style={{ bottom: phone ? 173 : 466.4 }}
      >
        {/* Each word fades up as it is counted (a CSS transition: no animation frames needed). */}
        {WORDS.map((w, i) => (
          <span
            key={w}
            className={`transition-[opacity,translate] duration-300 ease-out ${i < shown ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0"}`}
          >
            {w}
          </span>
        ))}
      </div>
      {/* The ELEVEN (Figma "shape", the gate wordmark at 1392 × 284, black: public/icons/eleven-gate-v2.svg): 24 from the left, its foot 114 above the screen's
          bottom. Phone: 358 wide on the 16 margins. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icons/eleven-gate-v2.svg"
        alt="Eleven"
        width={1392}
        height={284}
        className="absolute left-margin h-auto max-w-none phone:w-[358px]"
        style={{ bottom: phone ? 80 : 114.08, width: phone ? 358 : 1392 }}
      />
    </motion.section>
  );
}
