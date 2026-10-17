"use client";

import { useEffect, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import home from "@/data/home.json";
import { sound } from "@/lib/sound";
import { NavBar } from "@/components/shell/NavBar";
import { NavSub } from "@/components/shell/NavSub";
import { gateSeen, setGateSeen, subscribeGate } from "@/lib/gate";
import { HomeReel } from "./HomeReel";

const EASE = [0.42, 0, 0.58, 1] as const; // Figma "ease in and out", the gate → home smart animate
const DURATION = 1.2;

// The ELEVEN shape: big on the gate (Figma 7449:6447), bottom-left on the home (7427:6782).
const SHAPE = {
  gate: { x: 16, y: 621, width: 1400.008, rotate: 0 },
  home: { x: 32, y: 814, width: 915, rotate: 0 },
};

/**
 * Gate (V1 · 01 · Gate, 7449:6439) → Home (V1 · 02 · Home, 7345:1333).
 * The gate asks for sound once per visit (session), and again whenever the logo takes you home. Choosing lifts the aqua panel away while the
 * ELEVEN shape shrinks into its home position over the reel, 1.2 s ease-in-out, as in the prototype.
 * "Sound on" also unlocks audio (the browser needs that click).
 */
export function Home() {
  // Seen earlier in this visit (nav link back home, or a reload): no gate. The logo reopens it.
  const gate = !useSyncExternalStore(subscribeGate, () => gateSeen(), () => false);

  // The gate always starts silent, even if sound was on earlier in the visit (Amélie, 15 Oct):
  // the visitor turns it on here, deliberately.
  useEffect(() => {
    if (gate) sound.setMuted(true);
  }, [gate]);

  const choose = (on: boolean) => {
    if (on) {
      sound.setMuted(false);
      sound.unlock();
    } else sound.setMuted(true);
    setGateSeen(true);
  };

  const pos = gate ? SHAPE.gate : SHAPE.home;

  return (
    <main className="relative h-(--vh) min-h-[700px] overflow-hidden bg-ink">
      <HomeReel src={home.reel.src} poster={home.reel.poster} />

      <AnimatePresence>
        {!gate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: DURATION * 0.6 }}>
            <NavBar tone="light" />
            <NavSub wordmark={false} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* The shape sits on the bottom edge: anchor it to the bottom so it holds on any screen height. */}
      <motion.img
        src="/icons/eleven-shape.svg"
        alt="Eleven"
        className="pointer-events-none absolute left-0 z-10 max-w-none"
        style={{ bottom: 0, transformOrigin: "0 100%" }}
        initial={false}
        animate={{
          x: pos.x,
          y: -(1024 - pos.y - (285.806 * pos.width) / 1400.008),
          width: pos.width,
          rotate: pos.rotate,
        }}
        transition={{ duration: DURATION, ease: EASE }}
      />

      <AnimatePresence>
        {gate && (
          <motion.section
            key="gate"
            aria-label="Sound"
            className={`absolute inset-x-0 top-0 z-[5] h-[calc(100%-92px)] bg-aqua`}
            exit={{ y: "-101%" }}
            transition={{ duration: DURATION, ease: EASE }}
          >
            <div className="absolute top-[calc(50%-227px)] left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-8">
              <p className="t-h4 w-[564px] text-center text-neutral-200 [text-box:trim-both_cap_alphabetic]">
                {home.gate.line[0]}
                <br />
                {home.gate.line[1]}
              </p>
              <div className="flex gap-3">
                {[true, false].map((on) => (
                  <button
                    key={String(on)}
                    type="button"
                    onClick={() => choose(on)}
                    className="t-accent bg-neutral-200 px-2 py-1 text-neutral-1000 transition-opacity duration-200 ease-out hover:opacity-50"
                  >
                    {on ? home.gate.on : home.gate.off}
                  </button>
                ))}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}
