"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import home from "@/data/home.json";
import { sound } from "@/lib/sound";
import { NavBar } from "@/components/shell/NavBar";
import { NavSub } from "@/components/shell/NavSub";
import { gateSeen, setGateSeen, subscribeGate } from "@/lib/gate";
import { usePhone } from "@/lib/device";
import { useDockToggle } from "@/components/mobile/dock";
import { HomeReel } from "./HomeReel";
import { ReelToggle } from "./ReelToggle";
import { GATE_EXIT, GateLoader } from "./GateLoader";


// Phone: no big ELEVEN on the home; the nav's wordmark is the logo, the reel has the screen.

// Desktop home wordmark: the ELEVEN stepping down from left to
// right, neutral/200, 320.6 × 80 on the left margin, its foot 22.9 above the screen's bottom (y 921.1 of 1024).
const HOME_MARK = { src: "/icons/eleven-home-v2.svg", width: 320.59, height: 79.998, bottom: 22.87 };
const enterHome = () => setGateSeen(true); // stable, so the loader never restarts on a re-render

/**
 * The gate (GateLoader) is a grey panel over the playing
 * reel on both devices: it counts "one" … "ten", one word at a time, then swings up like the Mixers wedge; sound is
 * chosen with the toggle on it. Once per visit (session), and again whenever the logo takes you home.
 */
export function Home() {
  const phone = usePhone();
  // Seen earlier in this visit (nav link back home, or a reload): no gate. The home wordmark reopens it.
  const gate = !useSyncExternalStore(subscribeGate, () => gateSeen(), () => false);
  // The reel loops forever: a pause control for anyone who wants it still (shown once the gate is gone).
  const [paused, setPaused] = useState(false);
  const reelToggle = <ReelToggle paused={paused} onChange={setPaused} />;
  useDockToggle(phone && !gate ? reelToggle : null);

  // The gate always starts silent, even if sound was on earlier in the visit:
  // the visitor turns it on here, deliberately.
  useEffect(() => {
    if (gate) sound.setMuted(true);
  }, [gate]);

  return (
    <main className="relative h-(--vh) min-h-[700px] overflow-hidden bg-ink phone:min-h-0">
      <HomeReel src={home.reel.src} poster={home.reel.poster} paused={paused} />

      <AnimatePresence>
        {!gate && (
          // In as the gate's panel swings up out of the way.
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: GATE_EXIT }}
          >
            <NavBar tone="light" />
            <NavSub wordmark={false} tone="light" toggles={reelToggle} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop: the home wordmark, in with the nav (under the gate it would peek out below the panel's edge).
          Clicking it brings the sound gate back, from the home only; the floss logo on the
          other pages still just goes home. */}
      {!phone && (
        <motion.button
          type="button"
          aria-label="Eleven, back to the sound gate"
          onClick={() => setGateSeen(false)}
          disabled={gate}
          className="absolute left-margin z-10 block cursor-pointer transition-opacity duration-200 ease-out hover:opacity-50 disabled:pointer-events-none"
          style={{ bottom: HOME_MARK.bottom }}
          initial={false}
          animate={{ opacity: gate ? 0 : 1 }}
          transition={{ duration: 0.4, delay: gate ? 0 : GATE_EXIT }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={HOME_MARK.src} alt="" width={HOME_MARK.width} height={HOME_MARK.height} className="block max-w-none" />
        </motion.button>
      )}

      <AnimatePresence>
        {gate && <GateLoader key="gate-loader" onDone={enterHome} phone={phone} />}
      </AnimatePresence>

    </main>
  );
}
