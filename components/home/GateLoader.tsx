"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionTemplate, useMotionValue, usePresence } from "framer-motion";
import home from "@/data/home.json";
import ui from "@/data/ui.json";
import { sound } from "@/lib/sound";
import { SWING, prefersReducedMotion } from "@/lib/motion";
import { SoundToggle } from "@/components/shell/SoundToggle";

// The count's words. Not content: the loader counts to ten in English and the timing below is
// tuned to exactly ten steps, so there is nothing here for an editor to decide.
const WORDS = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
// The count, one word at a time over about 8 s (Eleven: 4 s was too fast to register what to do): the words wait
// 2 s so the eye reads the copy at the top first, then a word every 0.54 s, ten lands at 6.86 s, held 0.7 s, and the
// panel swings up at 7.56 s (gone at about 8.3 s).
const FIRST_MS = 2000;
const STEP_MS = 540;
const HOLD_MS = 700;
const SWING_S = 0.7;
const SWING_LAG_S = 0.14; // the right corner follows the left, like the Mixers wedge closing
/** When the home's nav (Home, PhoneShell) fades in, counted from the moment the gate starts to leave. */
export const GATE_EXIT = 0.45;

// The panel: a yellow panel over the home reel, its lower edge 65 above
// the screen's bottom at the left and 135 at the right, so a band of the playing video shows under it. Kept relative
// to the screen's bottom so the band survives any height. Phone: the same slope, scaled to 390.
const EDGE = { left: 65.15, right: 135.08 };
const EDGE_PHONE = { left: 48, right: 67 };

/**
 * Sound gate, over the playing home reel: the H3 line
 * and SOUND OFF / ON (the choice) centred at the top, the counting words "one" … "ten" in a row above the big ELEVEN.
 * The words appear one at a time (a step sound each, heard only with sound on); after "ten" the panel swings back up,
 * left corner first, like the Mixers wedge closing. Choosing OFF or ON opens it at once (no waiting for the count);
 * with no choice, it leaves on its own after "ten".
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
      aria-label={ui.gate.soundAria}
      className="absolute inset-0 z-20 flex flex-col justify-between gap-10 bg-yellow"
      style={leaving ? { clipPath: clip, WebkitClipPath: clip } : { clipPath: rest, WebkitClipPath: rest }}
    >
      {/* The title, then the choice (plain text, no chip on the gate; 16 px on desktop),
          stacked (SOUND, then OFF / ON 4 under it) and the hint in H6 24 below, all black on the yellow. Phone: the title
          wraps to three lines, the choice 38 under it. In flow above the count, never under it: on a short window the
          58 above the choice gives way first (down to 32), then the count and the ELEVEN slide down behind the panel's edge, at least 40 below the hint. */}
      <div className="flex shrink-0 flex-col items-center pt-[90px] text-neutral-1000 phone:px-margin phone:pt-[72px]">
        <p className="t-h3 text-center phone:text-[20px] phone:leading-[1.1]">
          {home.gate.line[0]}
          <br />
          {home.gate.line[1]}
        </p>
        <div className="t-h4 mt-[clamp(32px,calc(var(--vh)-750px),58px)] text-[16px] phone:mt-[38px] phone:text-[12px]">
          <SoundToggle meter={false} stacked onChoose={onDone} />
        </div>
        <p className="t-h6 mt-6 text-center">{home.gate.hint}</p>
      </div>
      {/* The count and the ELEVEN, anchored to the bottom together: the ELEVEN's foot 114 above the screen's bottom
          (phone 80), the row 68 above it (phone 20). */}
      <div className="flex shrink-0 flex-col pb-[114.08px] phone:pb-[80px]">
        {/* The row from 46 to 1416. */}
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={WORDS.length}
          aria-valuenow={shown}
          className="t-h5 mr-margin ml-[46px] flex justify-between text-neutral-1000 phone:ml-margin phone:text-[11px]"
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
        {/* The ELEVEN (the gate wordmark at 1392 × 284, black: public/icons/eleven-gate-v2.svg), 24 from the left.
            Phone: 358 wide on the 16 margins. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/eleven-gate-v2.svg"
          alt={ui.gate.wordmarkAlt}
          width={1392}
          height={284}
          className="mt-[68.32px] ml-margin h-auto max-w-none phone:mt-[19.96px]"
          style={{ width: phone ? 358 : 1392 }}
        />
      </div>
    </motion.section>
  );
}
