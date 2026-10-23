"use client";

import Link from "next/link";
import { useCallback, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { usePhone } from "@/lib/device";
import { gateSeen, subscribeGate } from "@/lib/gate";
import { sound } from "@/lib/sound";
import { EASE_DISSOLVE, PHONE_MOTION } from "@/lib/motion";
import { SoundToggle } from "@/components/shell/SoundToggle";
import { useDock } from "./dock";
import { MenuCard } from "./MenuCard";
import { GATE_EXIT } from "@/components/home/GateLoader";

// Pages whose top sits on video: the logo is dimmed to grey there.
const ON_VIDEO = ["/", "/longform"];
// The phone ELEVEN is the nav logo: the original ELEVEN, the same drawing as the desktop home wordmark (review note 25,
// carried to the phone Oct 23; was the stepped eleven-home-v2.svg). 4.9:1, so 107.8 wide at the nav's 22 tall.
const WORDMARK = "/icons/eleven-home-original.svg";
// The phone chip (globals.css `chip`: 24 tall, 12 px bold caps).
const CHIP = "chip pointer-events-auto";

/**
 * The phone dock, mounted once for the whole visit so it
 * never jumps between pages. Top: the ELEVEN wordmark on the left (straight to the home, never back to the sound gate)
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
            {/* Top: the ELEVEN wordmark left, 52.4 × 22,
                its bottom 2 above the page's chip's bottom; the chip right, 20.5 from the top. */}
            <div className="relative flex h-[44.5px] items-end justify-between px-margin">
              <Link
                href="/"
                aria-label="Eleven, home"
                className={`pointer-events-auto mb-[2px] block h-[22px] w-[107.8px] transition-transform duration-400 ease-[cubic-bezier(0.34,1.4,0.64,1)] active:scale-90 ${onVideo ? "text-neutral-300" : "text-neutral-1000"}`}
              >
                {/* The phone wordmark drawing as a mask, so it takes the nav's colour (black, grey on video). */}
                <span
                  aria-hidden
                  className="block size-full bg-current"
                  style={{ maskImage: `url(${WORDMARK})`, WebkitMaskImage: `url(${WORDMARK})`, maskSize: "100% 100%", WebkitMaskSize: "100% 100%" }}
                />
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
                {menu ? "Close" : "Menu"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
