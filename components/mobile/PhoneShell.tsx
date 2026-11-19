"use client";

import Link from "next/link";
import { useCallback, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { usePhone } from "@/lib/device";
import { gateSeen, setGateSeen, subscribeGate } from "@/lib/gate";
import { sound } from "@/lib/sound";
import { EASE_DISSOLVE, PHONE_MOTION } from "@/lib/motion";
import { SoundToggle } from "@/components/shell/SoundToggle";
import { useDock } from "./dock";
import { MenuCard } from "./MenuCard";
import { GATE_EXIT } from "@/components/home/GateLoader";
import { FlossLogo, SLOT } from "@/components/shell/FlossLogo";
import ui from "@/data/ui.json";

// Pages whose top sits on video: the floss dims to grey there.
const ON_VIDEO = ["/", "/longform"];
// The nav logo on every page is the floss, like the desktop nav: 40 tall.
const FLOSS_H = 40;
const FLOSS_K = FLOSS_H / SLOT.h;
// The outline is drawn before the scale-down, so it is thickened to land at 0.75 px on screen: a touch heavier
// than the desktop's 0.5, so it still reads on the 40 tall logo.
const FLOSS_LINE = 0.75 / FLOSS_K;
// The phone chip (globals.css `chip`: 24 tall, 12 px bold caps).
const CHIP = "chip pointer-events-auto";

/**
 * The phone dock, mounted once for the whole visit so it
 * never jumps between pages. Top: the floss on the left (home; on the home itself it brings the sound gate back)
 * and the page's own control as a chip on the right (GRID / LIST on Mixer and Archive, the butterfly
 * on Contact). Bottom, 16 from the edges: SOUND as a chip on the left, MENU on the right, which opens
 * the menu card (components/mobile/MenuCard) and becomes CLOSE. The chips read the same on video and
 * on white, so no blur or scrim behind them. Hidden while the sound gate is up; it fades in as the gate's panel swings up, and under the player.
 */
export function PhoneShell() {
  const phone = usePhone();
  const pathname = usePathname();
  const { toggle, bare, covered } = useDock();
  const gateUp = !useSyncExternalStore(subscribeGate, () => gateSeen(), () => false) && pathname === "/";
  // Open on which page: a new page closes the menu (the sweep covers the change).
  const [menuAt, setMenuAt] = useState<string | null>(null);
  const menu = menuAt === pathname;
  const close = useCallback(() => setMenuAt(null), []);

  if (!phone) return null;

  const onVideo = ON_VIDEO.includes(pathname);
  const onMenu = () => {
    if (!menu) sound.cue("menuOpen");
    setMenuAt(menu ? null : pathname);
  };

  return (
    <>
      <MenuCard open={menu} onClose={close} />

      <AnimatePresence>
        {!gateUp && !covered && (
          <motion.div
            key="dock"
            className="pointer-events-none fixed inset-0 z-[80]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.6, delay: pathname === "/" ? GATE_EXIT : 0, ease: EASE_DISSOLVE } }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
          >
            {/* Top: the floss left, 40 tall, 16 lower than the page's chip's line; the chip right, 20.5 from the top. */}
            <div className="relative flex h-[44.5px] items-end justify-between px-margin">
              <Link
                href="/"
                aria-label={pathname === "/" ? ui.regions.homeGateAria : ui.regions.homeAria}
                // On the home it brings the sound gate back, like the desktop floss; elsewhere it just goes home.
                onClick={(e) => {
                  if (pathname !== "/") return;
                  e.preventDefault();
                  setGateSeen(false);
                }}
                className="pointer-events-auto relative top-4 mb-[2px] block transition-transform duration-400 ease-[cubic-bezier(0.34,1.4,0.64,1)] active:scale-90"
                style={{ width: SLOT.w * FLOSS_K, height: FLOSS_H }}
              >
                {/* Drawn at its desktop size (sharp), scaled down from the top-left corner. Grey on video, white on
                    white pages, outlined in black on both. */}
                <span className="block origin-top-left" style={{ transform: `scale(${FLOSS_K})` }}>
                  <FlossLogo tone={onVideo ? "light" : "dark"} line={FLOSS_LINE} outlined />
                </span>
              </Link>
              <AnimatePresence>
                {toggle && !menu && (
                  <motion.div key="toggle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={PHONE_MOTION.reveal}>
                    {bare ? <div className="pointer-events-auto">{toggle}</div> : <div className={CHIP}>{toggle}</div>}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom: SOUND left, MENU / CLOSE right. */}
            <div className="absolute inset-x-margin bottom-4 flex items-end justify-between">
              <div className={CHIP}>
                <SoundToggle />
              </div>
              <button type="button" data-sound="off" aria-expanded={menu} onClick={onMenu} className={`${CHIP} cursor-pointer`}>
                {menu ? ui.dock.close : ui.dock.menu}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
