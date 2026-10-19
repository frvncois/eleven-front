"use client";

import { useEffect, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import home from "@/data/home.json";
import { sound } from "@/lib/sound";
import { NavBar } from "@/components/shell/NavBar";
import { NavSub } from "@/components/shell/NavSub";
import { gateSeen, setGateSeen, subscribeGate } from "@/lib/gate";
import { HomeReel } from "./HomeReel";
import { GateCursor } from "./GateCursor";

const EASE = [0.42, 0, 0.58, 1] as const; // Figma "ease in and out", the gate → home smart animate
const DURATION = 1.2;

// The ELEVEN shape: big on the gate (Figma 7449:6447), bottom-left on the home (7427:6782).
const SHAPE = {
  gate: { x: 16, y: 621, width: 1400.008, rotate: 0 },
  home: { x: 32, y: 814, width: 915, rotate: 0 },
};

/**
 * Gate (V1 · 01 · Gate, 7449:6439) → Home (V1 · 02 · Home, 7345:1333).
 * The gate asks for sound once per visit (session), and again whenever the logo takes you home. Since 19 Oct it works like
 * gehry.getty.edu: no buttons, a cursor tag "Click anywhere to enable sound" and a click anywhere on the panel turns sound on
 * (that click is the gesture the browser needs to unlock audio). "Continue without sound" at the foot enters muted.
 * Either way the aqua panel lifts away while the ELEVEN shape shrinks into its home position, 1.2 s ease-in-out.
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

  // Keyboard: Enter or Space while the gate is up = sound on (Tab reaches the skip link).
  useEffect(() => {
    if (!gate) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "Enter" || e.key === " ") && !(e.target as Element | null)?.closest?.("[data-gate-skip]")) {
        e.preventDefault();
        choose(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const pos = gate ? SHAPE.gate : SHAPE.home;

  return (
    // While the gate is up the whole screen is the "sound on" button, the reel strip under the panel included.
    <main
      className={`relative h-(--vh) min-h-[700px] overflow-hidden bg-ink ${gate ? "cursor-pointer" : ""}`}
      onClick={gate ? () => choose(true) : undefined}
    >
      <HomeReel src={home.reel.src} poster={home.reel.poster} />

      <AnimatePresence>
        {!gate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: DURATION * 0.6 }}>
            <NavBar tone="light" />
            <NavSub wordmark={false} tone="light" />
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
            {/* 9-col grid: the copy block is centred over cols 3 to 7 (766). */}
            <div className="absolute top-[calc(50%-227px)] left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-8">
              <p className="t-h4 w-span-5 text-center text-neutral-200 [text-box:trim-both_cap_alphabetic]">
                {home.gate.line[0]}
                <br />
                {home.gate.line[1]}
              </p>
              {/* The way in without sound, quiet under the line. The cursor tag steps aside over it. */}
              <button
                type="button"
                data-gate-skip
                onClick={(e) => {
                  e.stopPropagation();
                  choose(false);
                }}
                className="t-accent cursor-pointer text-neutral-1000 transition-opacity duration-200 ease-out hover:opacity-50"
              >
                {home.gate.skip}
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <AnimatePresence>{gate && <GateCursor key="gate-cursor" label={home.gate.cursor} />}</AnimatePresence>
    </main>
  );
}
