"use client";

import { useEffect, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import home from "@/data/home.json";
import { sound } from "@/lib/sound";
import { NavBar } from "@/components/shell/NavBar";
import { NavSub } from "@/components/shell/NavSub";
import { gateSeen, setGateSeen, subscribeGate } from "@/lib/gate";
import { usePhone } from "@/lib/device";
import { FlossLogo } from "@/components/shell/FlossLogo";
import { HomeReel } from "./HomeReel";
import { GATE_EXIT, GateLoader } from "./GateLoader";


// Phone: no big ELEVEN on the home; the nav's wordmark is the logo, the reel has the screen.

const enterHome = () => setGateSeen(true); // stable, so the loader never restarts on a re-render

/**
 * The gate (GateLoader) is a grey panel over the playing
 * reel on both devices: it counts "one" … "ten", one word at a time, then swings up like the Mixers wedge; sound is
 * chosen with the toggle on it. Once per visit (session), and again whenever the logo takes you home.
 */
export function Home() {
  const phone = usePhone();
  // Seen earlier in this visit (nav link back home, or a reload): no gate. The floss logo reopens it.
  const gate = !useSyncExternalStore(subscribeGate, () => gateSeen(), () => false);
  // The reel just loops: no pause control on the home, desktop or phone.

  // The gate always starts silent, even if sound was on earlier in the visit:
  // the visitor turns it on here, deliberately.
  useEffect(() => {
    if (gate) sound.setMuted(true);
  }, [gate]);

  return (
    <main className="relative h-(--vh) min-h-[700px] overflow-hidden bg-ink phone:min-h-0">
      <HomeReel src={home.reel.src} poster={home.reel.poster} />

      <AnimatePresence>
        {!gate && (
          // In as the gate's panel swings up out of the way.
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: GATE_EXIT }}
          >
            <NavBar tone="light" />
            {/* No reel pause chip: only SOUND. */}
            <NavSub wordmark={false} tone="light" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop: the floss logo, the same as on every page (Nav/Sub spot, dimmed over the reel), in with the nav
          (under the gate it would peek out below the panel's edge). Here it brings the sound gate back; on the other
          pages it just goes home. */}
      {!phone && (
        <motion.button
          type="button"
          aria-label="Eleven, back to the sound gate"
          onClick={() => setGateSeen(false)}
          disabled={gate}
          className="absolute bottom-4 left-margin z-10 block cursor-pointer transition-transform duration-400 ease-[cubic-bezier(0.34,1.4,0.64,1)] active:scale-90 disabled:pointer-events-none"
          initial={false}
          animate={{ opacity: gate ? 0 : 1 }}
          transition={{ duration: 0.4, delay: gate ? 0 : GATE_EXIT }}
        >
          <FlossLogo tone="light" />
        </motion.button>
      )}

      <AnimatePresence>
        {/* The reel blurs behind the gate like the page behind the Mixers wedge: 10 px, no
            colour; it clears as the panel swings up. */}
        {gate && (
          <motion.div
            key="gate-blur"
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[15] backdrop-blur-[10px]"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.7, ease: [0.4, 0, 0.2, 1] } }}
          />
        )}
        {gate && <GateLoader key="gate-loader" onDone={enterHome} phone={phone} />}
      </AnimatePresence>

    </main>
  );
}
